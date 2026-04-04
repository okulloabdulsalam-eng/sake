/**
 * KIUMA Server - Railway Deployment
 * 
 * Express.js server for:
 *   1. Pesapal payment processing
 *   2. YouTube Live RTMP relay (WebSocket → FFmpeg → RTMP)
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');
const { spawn } = require('child_process');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Pesapal API Configuration
const PESAPAL_BASE_URL = 'https://pay.pesapal.com/v3';
const PESAPAL_SANDBOX_URL = 'https://cybqa.pesapal.com/pesapalv3';

// Get Pesapal credentials from environment variables
function getPesapalCredentials() {
  const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
  const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;
  const testMode = process.env.PESAPAL_TEST_MODE === 'true';
  
  if (!consumerKey || !consumerSecret) {
    throw new Error('Pesapal credentials not configured. Set PESAPAL_CONSUMER_KEY and PESAPAL_CONSUMER_SECRET environment variables.');
  }
  
  return {
    consumerKey,
    consumerSecret,
    isTestMode: testMode,
    baseUrl: testMode ? PESAPAL_SANDBOX_URL : PESAPAL_BASE_URL
  };
}

/**
 * Generate Pesapal OAuth token
 */
async function getPesapalAccessToken() {
  const credentials = getPesapalCredentials();
  
  try {
    const response = await axios.post(
      `${credentials.baseUrl}/api/Auth/RequestToken`,
      {
        consumer_key: credentials.consumerKey,
        consumer_secret: credentials.consumerSecret
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );
    
    if (response.status !== 200 || !response.data || !response.data.token) {
      throw new Error('Failed to obtain Pesapal access token');
    }
    
    return response.data.token;
  } catch (error) {
    console.error('Error getting Pesapal access token:', error.message);
    throw new Error('Failed to authenticate with Pesapal');
  }
}

/**
 * Generate unique transaction reference
 */
function generateTransactionReference() {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `KIUMA-${timestamp}-${random}`;
}

/**
 * Validate payment amount
 */
function validatePaymentAmount(amount, currency = 'UGX') {
  const errors = [];
  
  if (!amount || amount <= 0) {
    errors.push('Amount must be greater than zero');
  }
  
  if (isNaN(parseFloat(amount))) {
    errors.push('Amount must be a valid number');
  }
  
  if (currency !== 'UGX') {
    errors.push(`Currency must be UGX, got ${currency}`);
  }
  
  const maxAmount = 100000000; // 100 million UGX
  if (parseFloat(amount) > maxAmount) {
    errors.push(`Amount exceeds maximum allowed: ${maxAmount} UGX`);
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * POST /api/initialize-payment
 * Initialize Pesapal payment
 */
app.post('/api/initialize-payment', async (req, res) => {
  try {
    // Check if Pesapal is enabled
    if (process.env.PESAPAL_ENABLED !== 'true') {
      return res.status(503).json({
        success: false,
        message: 'Pesapal payment system is currently disabled'
      });
    }
    
    const { amount, currency = 'UGX', description, email, phone, first_name, last_name, callback_url, cancel_url } = req.body;
    
    // Validate input
    if (!amount || isNaN(parseFloat(amount))) {
      return res.status(400).json({
        success: false,
        message: 'Valid payment amount is required'
      });
    }
    
    if (!description || typeof description !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Payment description is required'
      });
    }
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Validate amount and currency
    const validation = validatePaymentAmount(parseFloat(amount), currency);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Payment validation failed: ' + validation.errors.join(', ')
      });
    }
    
    // Generate unique transaction reference
    const reference = generateTransactionReference();
    
    // Get Pesapal access token
    const accessToken = await getPesapalAccessToken();
    const credentials = getPesapalCredentials();
    
    // Create Pesapal payment order
    const orderData = {
      id: reference,
      currency: currency,
      amount: parseFloat(amount),
      description: description,
      callback_url: callback_url || `${process.env.APP_BASE_URL || ''}/payment/callback.html`,
      cancellation_url: cancel_url || `${process.env.APP_BASE_URL || ''}/payment/cancel.html`,
      notification_id: process.env.PESAPAL_NOTIFICATION_ID || '',
      billing_address: {
        email_address: email,
        phone_number: phone || '',
        country_code: 'UG',
        first_name: first_name || 'User',
        middle_name: '',
        last_name: last_name || '',
        line_1: '',
        line_2: '',
        city: '',
        state: '',
        postal_code: '',
        zip_code: ''
      }
    };
    
    // Call Pesapal API to create order
    const response = await axios.post(
      `${credentials.baseUrl}/api/Transactions/SubmitOrderRequest`,
      orderData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000
      }
    );
    
    if (response.status !== 200 || !response.data) {
      throw new Error('Failed to create Pesapal payment order');
    }
    
    const orderResponse = response.data;
    
    console.log('Payment order created:', {
      reference,
      amount,
      order_tracking_id: orderResponse.order_tracking_id
    });
    
    // Return checkout URL
    return res.json({
      success: true,
      reference: reference,
      checkout_url: orderResponse.redirect_url,
      order_tracking_id: orderResponse.order_tracking_id
    });
    
  } catch (error) {
    console.error('Payment initialization error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to initialize payment. Please try again.'
    });
  }
});

/**
 * Verify payment with Pesapal API
 */
async function verifyPaymentWithPesapal(orderTrackingId) {
  const credentials = getPesapalCredentials();
  const accessToken = await getPesapalAccessToken();
  
  try {
    const response = await axios.get(
      `${credentials.baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );
    
    if (response.status !== 200 || !response.data) {
      throw new Error('Invalid response from Pesapal API');
    }
    
    return response.data;
  } catch (error) {
    console.error('Pesapal API Error:', error.message);
    throw new Error('Failed to verify payment with Pesapal');
  }
}

/**
 * POST /api/verify-payment
 * Verify Pesapal payment
 */
app.post('/api/verify-payment', async (req, res) => {
  try {
    // Check if Pesapal is enabled
    if (process.env.PESAPAL_ENABLED !== 'true') {
      return res.status(503).json({
        success: false,
        message: 'Pesapal payment system is currently disabled'
      });
    }
    
    const { order_tracking_id, reference } = req.body;
    
    // Validate input
    if (!order_tracking_id || typeof order_tracking_id !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Order tracking ID is required'
      });
    }
    
    if (!reference || typeof reference !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Transaction reference is required'
      });
    }
    
    // Verify with Pesapal API
    console.log('Verifying payment:', { order_tracking_id, reference });
    const pesapalData = await verifyPaymentWithPesapal(order_tracking_id);
    
    // Check payment status
    const status = pesapalData.payment_status_description || pesapalData.status || '';
    if (status.toLowerCase() !== 'completed' && status.toLowerCase() !== 'success') {
      return res.status(400).json({
        success: false,
        message: `Payment status is ${status}, expected completed/success`
      });
    }
    
    console.log('Payment verified:', {
      reference,
      order_tracking_id,
      status: pesapalData.payment_status_description
    });
    
    // Return success
    return res.json({
      success: true,
      reference: reference,
      amount: pesapalData.amount || pesapalData.payment_amount,
      currency: pesapalData.currency_code || 'UGX',
      status: 'completed'
    });
    
  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Payment verification failed. Please contact support.'
    });
  }
});

/**
 * POST /api/pesapal-webhook
 * Handle Pesapal webhook notifications
 */
app.post('/api/pesapal-webhook', async (req, res) => {
  try {
    // Check if Pesapal is enabled
    if (process.env.PESAPAL_ENABLED !== 'true') {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Pesapal payment system is currently disabled'
      });
    }
    
    // Only accept POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const payload = req.body;
    const orderTrackingId = payload.OrderTrackingId || payload.order_tracking_id || payload.OrderNotification?.OrderTrackingId;
    
    if (!orderTrackingId) {
      console.error('Webhook missing order tracking ID');
      return res.status(400).json({ error: 'Missing order tracking ID' });
    }
    
    // Re-verify payment with Pesapal API
    const pesapalData = await verifyPaymentWithPesapal(orderTrackingId);
    
    // Only process completed payments
    const status = pesapalData.payment_status_description || pesapalData.status || '';
    if (status.toLowerCase() !== 'completed' && status.toLowerCase() !== 'success') {
      console.log('Webhook payment not completed:', { orderTrackingId, status });
      return res.status(200).json({ received: true, status: 'not_completed' });
    }
    
    console.log('Webhook payment processed:', {
      orderTrackingId,
      status: pesapalData.payment_status_description
    });
    
    // Always return 200 to Pesapal (prevent retries)
    return res.status(200).json({ received: true, status: 'processed' });
    
  } catch (error) {
    console.error('Webhook error:', error);
    // Return 200 to prevent Pesapal from retrying
    return res.status(200).json({ received: true, error: 'Processing failed' });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'KIUMA Pesapal Payment Server is running',
    timestamp: new Date().toISOString(),
    pesapalEnabled: process.env.PESAPAL_ENABLED === 'true'
  });
});

/**
 * GET /
 * Root endpoint
 */
app.get('/', (req, res) => {
  res.json({
    message: 'KIUMA Pesapal Payment Server',
    version: '1.0.0',
    endpoints: [
      'POST /api/initialize-payment',
      'POST /api/verify-payment',
      'POST /api/pesapal-webhook',
      'GET /api/health'
    ]
  });
});

// ============================================================
// YouTube Live RTMP Relay (WebSocket → FFmpeg → RTMP)
// ============================================================

const activeStreams = new Map();

app.get('/api/relay-health', (req, res) => {
  const ffmpegCheck = spawn('ffmpeg', ['-version']);
  let found = false;
  ffmpegCheck.on('close', (code) => {
    if (!found) { found = true; res.json({ success: true, ffmpegAvailable: code === 0, activeStreams: activeStreams.size, service: 'kiuma-rtmp-relay' }); }
  });
  ffmpegCheck.on('error', () => {
    if (!found) { found = true; res.json({ success: true, ffmpegAvailable: false, activeStreams: activeStreams.size, service: 'kiuma-rtmp-relay' }); }
  });
  setTimeout(() => { if (!found) { found = true; res.json({ success: true, ffmpegAvailable: false, activeStreams: activeStreams.size }); } }, 3000);
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/rtmp-relay' });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const streamKey = url.searchParams.get('key');
  const rtmpUrl = url.searchParams.get('rtmpUrl') || 'rtmp://a.rtmp.youtube.com/live2';

  if (!streamKey) {
    ws.send(JSON.stringify({ type: 'error', message: 'Stream key required' }));
    ws.close(1008, 'Stream key required');
    return;
  }

  console.log(`[RTMP Relay] New connection, streaming to ${rtmpUrl}/****${streamKey.slice(-4)}`);

  const ffmpeg = spawn('ffmpeg', [
    '-loglevel', 'warning',
    '-fflags', '+genpts+discardcorrupt+igndts',
    '-err_detect', 'ignore_err',
    '-f', 'webm',
    '-probesize', '5000000',
    '-analyzeduration', '5000000',
    '-i', 'pipe:0',
    '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency',
    '-g', '60', '-keyint_min', '30',
    '-b:v', '2500k', '-maxrate', '2500k', '-bufsize', '5000k',
    '-pix_fmt', 'yuv420p',
    '-threads', '2',
    '-c:a', 'aac', '-ar', '44100', '-b:a', '128k', '-ac', '2',
    '-f', 'flv', '-flvflags', 'no_duration_filesize',
    `${rtmpUrl}/${streamKey}`,
  ], { stdio: ['pipe', 'pipe', 'pipe'] });

  activeStreams.set(streamKey, { ffmpeg, ws, startTime: Date.now() });
  ws.send(JSON.stringify({ type: 'connected', message: 'RTMP relay connected' }));

  let ffmpegReady = false;
  let lastErrorSent = 0;
  ffmpeg.stderr.on('data', (data) => {
    const msg = data.toString();
    if (!ffmpegReady && (msg.includes('Output #0') || msg.includes('Stream mapping') || msg.includes('frame='))) {
      ffmpegReady = true;
      ws.send(JSON.stringify({ type: 'streaming', message: 'FFmpeg is streaming to YouTube' }));
    }
    // Only forward errors at most once per 10s to avoid flooding the client
    if (msg.toLowerCase().includes('fatal')) {
      ws.send(JSON.stringify({ type: 'ffmpeg-error', message: msg.trim() }));
    } else if (msg.toLowerCase().includes('error')) {
      const now = Date.now();
      if (now - lastErrorSent > 10000) {
        lastErrorSent = now;
        ws.send(JSON.stringify({ type: 'ffmpeg-error', message: msg.trim().substring(0, 200) }));
      }
    }
  });

  ffmpeg.on('close', (code) => {
    activeStreams.delete(streamKey);
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'closed', message: `FFmpeg exited (code: ${code})` }));
      ws.close(1000);
    }
  });

  ffmpeg.on('error', (err) => {
    activeStreams.delete(streamKey);
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'error', message: `FFmpeg error: ${err.message}` }));
      ws.close(1011);
    }
  });

  ws.on('message', (msg) => {
    if (Buffer.isBuffer(msg) || msg instanceof ArrayBuffer) {
      const buffer = Buffer.isBuffer(msg) ? msg : Buffer.from(msg);
      if (ffmpeg.stdin.writable) ffmpeg.stdin.write(buffer);
    } else {
      try {
        const ctrl = JSON.parse(msg);
        if (ctrl.type === 'stop' && ffmpeg.stdin.writable) ffmpeg.stdin.end();
        if (ctrl.type === 'ping') ws.send(JSON.stringify({ type: 'pong' }));
      } catch(e) {}
    }
  });

  ws.on('close', () => {
    activeStreams.delete(streamKey);
    if (ffmpeg.stdin.writable) ffmpeg.stdin.end();
    setTimeout(() => { try { ffmpeg.kill('SIGTERM'); } catch(e) {} }, 2000);
  });

  ws.on('error', () => {
    activeStreams.delete(streamKey);
    try { ffmpeg.kill('SIGTERM'); } catch(e) {}
  });
});

server.listen(PORT, () => {
  console.log(`KIUMA Server running on port ${PORT}`);
  console.log(`  Pesapal enabled: ${process.env.PESAPAL_ENABLED === 'true'}`);
  console.log(`  RTMP Relay: ws://localhost:${PORT}/rtmp-relay`);
});

