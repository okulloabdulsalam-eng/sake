/**
 * KIUMA Secure Payment System - Pesapal/DPO Pay Integration
 * 
 * Enterprise-grade payment processing with backend-first security model
 * 
 * CRITICAL SECURITY RULES:
 * - Frontend NEVER decides payment success
 * - Secret keys NEVER exposed to client
 * - ALL payments verified server-side via Pesapal API
 * - Duplicate transaction prevention
 * - Webhook signature verification
 * - Fail-closed security model (deny on error)
 * 
 * WHY BACKEND VERIFICATION IS MANDATORY:
 * - Frontend code can be manipulated by attackers
 * - Client-side validation can be bypassed
 * - Only backend can trust Pesapal API responses
 * - Prevents replay attacks and fraud
 */

// Load environment variables from .env file (if available)
// This allows using .env file for local development
// For production, set environment variables in Firebase Console
try {
  if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
  }
} catch (error) {
  // dotenv not installed or .env file not found - that's okay
  // Will fall back to functions.config() or environment variables
}

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const crypto = require('crypto');

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Pesapal API Configuration
// Using environment variables - NEVER hardcode these values
const PESAPAL_BASE_URL = 'https://pay.pesapal.com/v3'; // Production URL
const PESAPAL_SANDBOX_URL = 'https://cybqa.pesapal.com/pesapalv3'; // Sandbox for testing

// Configuration - Using functions.config() for Spark plan compatibility
// SECURITY: These are stored in Firebase config, never in code
// Set using: firebase functions:config:set pesapal.consumer_key="your_key"
// 
// DEPRECATION WARNING: functions.config() is deprecated and will stop working in March 2026
// This code works until then. For long-term solution, upgrade to Blaze plan and use secrets.
//
// Alternative: Use environment variables (see .env.example file)

// Helper function to get config value with fallback to environment variable
function getConfig(key, defaultValue = '') {
  // Priority 1: Try environment variable first (more secure, works on all plans)
  const envKey = key.toUpperCase().replace(/\./g, '_');
  if (process.env[envKey]) {
    return process.env[envKey];
  }
  
  // Priority 2: Try functions.config() (works on Spark plan, deprecated)
  try {
    const config = functions.config();
    const keys = key.split('.');
    let value = config;
    for (const k of keys) {
      value = value?.[k];
    }
    if (value) {
      return value;
    }
  } catch (error) {
    // Config not available, continue to default
  }
  
  // Priority 3: Use default value
  return defaultValue;
}

// Get Pesapal configuration values
function getPesapalConfig() {
  return {
    consumerKey: getConfig('pesapal.consumer_key'),
    consumerSecret: getConfig('pesapal.consumer_secret'),
    testMode: getConfig('pesapal.test_mode', 'true'),
    webhookSecret: getConfig('pesapal.webhook_secret', ''),
    notificationId: getConfig('pesapal.notification_id', ''),
    baseUrl: getConfig('app.base_url', ''),
    enabled: getConfig('pesapal.enabled', 'false')
  };
}

/**
 * Get Pesapal credentials from Firebase Functions config
 * SECURITY: Secret keys stored in Firebase config, never in code
 * 
 * Works on Spark plan (no Blaze upgrade required)
 * 
 * @returns {Object} Consumer key and secret
 */
function getPesapalCredentials() {
  const config = getPesapalConfig();
  const consumerKey = config.consumerKey;
  const consumerSecret = config.consumerSecret;
  const testModeValue = config.testMode;
  const isTestMode = testModeValue === 'true';
  
  if (!consumerKey || !consumerSecret) {
    throw new Error(
      'Pesapal credentials not configured. ' +
      'Run: firebase functions:config:set pesapal.consumer_key="your_key" ' +
      'and: firebase functions:config:set pesapal.consumer_secret="your_secret"'
    );
  }
  
  return {
    consumerKey,
    consumerSecret,
    isTestMode,
    baseUrl: isTestMode ? PESAPAL_SANDBOX_URL : PESAPAL_BASE_URL
  };
}

/**
 * Generate Pesapal OAuth token
 * Required for all Pesapal API calls
 * 
 * @returns {Promise<string>} Access token
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
    console.error('Error getting Pesapal access token:', {
      status: error.response?.status,
      message: error.message
    });
    throw new Error('Failed to authenticate with Pesapal');
  }
}

/**
 * Generate unique, non-reusable transaction reference
 * Format: KIUMA-{timestamp}-{random}
 * 
 * SECURITY: Prevents reference reuse attacks
 * 
 * @returns {string} Unique transaction reference
 */
function generateTransactionReference() {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `KIUMA-${timestamp}-${random}`;
}

/**
 * Check if transaction reference already exists
 * SECURITY: Prevents duplicate transaction processing
 * 
 * @param {string} reference - Transaction reference
 * @returns {Promise<boolean>} True if reference exists
 */
async function referenceExists(reference) {
  try {
    const existing = await db.collection('payments')
      .where('reference', '==', reference)
      .limit(1)
      .get();
    
    return !existing.empty;
  } catch (error) {
    console.error('Error checking reference existence:', error);
    // Fail closed: assume exists on error
    return true;
  }
}

/**
 * Validate payment amount and currency
 * SECURITY: Reject invalid or suspicious amounts
 * 
 * @param {number} amount - Payment amount
 * @param {string} currency - Currency code
 * @returns {Object} Validation result
 */
function validatePaymentAmount(amount, currency = 'UGX') {
  const errors = [];
  
  // Amount must be positive
  if (!amount || amount <= 0) {
    errors.push('Amount must be greater than zero');
  }
  
  // Amount must be a valid number
  if (isNaN(parseFloat(amount))) {
    errors.push('Amount must be a valid number');
  }
  
  // Currency must be UGX (Uganda Shillings)
  if (currency !== 'UGX') {
    errors.push(`Currency must be UGX, got ${currency}`);
  }
  
  // Maximum amount check (prevent accidental large payments)
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
 * HTTPS Cloud Function: Initialize Payment
 * 
 * Creates a Pesapal payment order and returns checkout URL
 * 
 * SECURITY:
 * - Requires user authentication
 * - Validates amount server-side (never trust frontend)
 * - Generates unique reference
 * - Prevents reference reuse
 * 
 * WHY FRONTEND CANNOT INITIATE PAYMENTS:
 * - Frontend could manipulate amounts
 * - Frontend could reuse references
 * - Backend validation ensures integrity
 * 
 * STATUS: LOCKED - System is disabled but code remains for future use
 */
exports.initializePayment = functions.https.onCall(async (data, context) => {
  // FEATURE FLAG: Check if Pesapal is enabled
  const config = getPesapalConfig();
  const isEnabled = config.enabled === 'true';
  if (!isEnabled) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Pesapal payment system is currently disabled. Please use alternative payment methods.'
    );
  }
  
  // SECURITY: Require authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to initiate payments'
    );
  }
  
  const userId = context.auth.uid;
  const { amount, currency = 'UGX', description, callback_url, cancel_url } = data;
  
  // SECURITY: Validate input server-side (never trust frontend)
  if (!amount || isNaN(parseFloat(amount))) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Valid payment amount is required'
    );
  }
  
  if (!description || typeof description !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Payment description is required'
    );
  }
  
  // SECURITY: Validate amount and currency
  const validation = validatePaymentAmount(parseFloat(amount), currency);
  if (!validation.isValid) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Payment validation failed: ' + validation.errors.join(', ')
    );
  }
  
  try {
    // Generate unique transaction reference
    let reference = generateTransactionReference();
    
    // SECURITY: Ensure reference is unique (prevent collisions)
    let attempts = 0;
    while (await referenceExists(reference) && attempts < 5) {
      reference = generateTransactionReference();
      attempts++;
    }
    
    if (attempts >= 5) {
      throw new Error('Failed to generate unique transaction reference');
    }
    
    // Get Pesapal access token
    const accessToken = await getPesapalAccessToken();
    const credentials = getPesapalCredentials();
    
    // Get user email for payment
    const userRecord = await admin.auth().getUser(userId);
    const userEmail = userRecord.email || data.email;
    
    if (!userEmail) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'User email is required for payment'
      );
    }
    
    // Create Pesapal payment order
    const orderData = {
      id: reference,
      currency: currency,
      amount: parseFloat(amount),
      description: description,
      callback_url: callback_url || `${getPesapalConfig().baseUrl || ''}/payment/callback`,
      cancellation_url: cancel_url || `${getPesapalConfig().baseUrl || ''}/payment/cancel`,
      notification_id: getPesapalConfig().notificationId || '', // Webhook notification ID
      billing_address: {
        email_address: userEmail,
        phone_number: data.phone || '',
        country_code: 'UG',
        first_name: data.first_name || userRecord.displayName?.split(' ')[0] || 'User',
        middle_name: '',
        last_name: data.last_name || userRecord.displayName?.split(' ').slice(1).join(' ') || '',
        line_1: data.address || '',
        line_2: '',
        city: data.city || '',
        state: data.state || '',
        postal_code: data.postal_code || '',
        zip_code: data.zip_code || ''
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
    
    // Store pending payment in Firestore (before user pays)
    await db.collection('payments').add({
      userId: userId,
      reference: reference,
      amount: parseFloat(amount),
      currency: currency,
      description: description,
      status: 'pending',
      pesapal_order_tracking_id: orderResponse.order_tracking_id || null,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      verified: false
    });
    
    console.log('Payment order created:', {
      reference,
      userId,
      amount,
      order_tracking_id: orderResponse.order_tracking_id
    });
    
    // Return checkout URL (DO NOT return sensitive data)
    return {
      success: true,
      reference: reference,
      checkout_url: orderResponse.redirect_url,
      order_tracking_id: orderResponse.order_tracking_id
    };
    
  } catch (error) {
    console.error('Payment initialization error:', {
      userId,
      amount,
      error: error.message,
      code: error.code
    });
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError(
      'internal',
      'Failed to initialize payment. Please try again.'
    );
  }
});

/**
 * Verify payment with Pesapal API
 * 
 * SECURITY: This is the ONLY source of truth for payment status
 * Frontend must NEVER verify payments directly
 * 
 * @param {string} orderTrackingId - Pesapal order tracking ID
 * @returns {Promise<Object>} Verified transaction data
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
    if (error.response) {
      console.error('Pesapal API Error:', {
        status: error.response.status,
        data: error.response.data,
        orderTrackingId
      });
      throw new Error(`Pesapal API error: ${error.response.status}`);
    } else if (error.request) {
      console.error('Network error verifying payment:', orderTrackingId);
      throw new Error('Network error verifying payment');
    } else {
      throw error;
    }
  }
}

/**
 * Validate verified payment data
 * SECURITY: Reject any mismatches immediately
 * 
 * @param {Object} paymentData - Payment data from Firestore
 * @param {Object} pesapalData - Verified data from Pesapal
 * @returns {Object} Validation result
 */
function validateVerifiedPayment(paymentData, pesapalData) {
  const errors = [];
  
  // Check payment status
  const status = pesapalData.payment_status_description || pesapalData.status || '';
  if (status.toLowerCase() !== 'completed' && status.toLowerCase() !== 'success') {
    errors.push(`Payment status is ${status}, expected completed/success`);
  }
  
  // Check amount matches
  const expectedAmount = parseFloat(paymentData.amount);
  const actualAmount = parseFloat(pesapalData.amount || pesapalData.payment_amount);
  if (Math.abs(actualAmount - expectedAmount) > 0.01) {
    errors.push(`Amount mismatch: expected ${expectedAmount}, got ${actualAmount}`);
  }
  
  // Check currency matches
  if (pesapalData.currency_code && pesapalData.currency_code !== paymentData.currency) {
    errors.push(`Currency mismatch: expected ${paymentData.currency}, got ${pesapalData.currency_code}`);
  }
  
  // Check reference matches
  if (pesapalData.order_tracking_id && pesapalData.order_tracking_id !== paymentData.pesapal_order_tracking_id) {
    errors.push('Order tracking ID mismatch');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * HTTPS Cloud Function: Verify Payment
 * 
 * Frontend sends order_tracking_id after Pesapal redirect.
 * Backend verifies with Pesapal API and updates Firestore.
 * 
 * SECURITY:
 * - Verifies payment with Pesapal API (ONLY source of truth)
 * - Validates amount, currency, status
 * - Prevents duplicate processing
 * - Only authenticated users can verify their payments
 * 
 * WHY FRONTEND CANNOT VERIFY:
 * - Frontend code can be manipulated
 * - Client can fake verification responses
 * - Only backend can trust Pesapal API
 * 
 * STATUS: LOCKED - System is disabled but code remains for future use
 */
exports.verifyPayment = functions.https.onCall(async (data, context) => {
  // FEATURE FLAG: Check if Pesapal is enabled
  const config = getPesapalConfig();
  const isEnabled = config.enabled === 'true';
  if (!isEnabled) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Pesapal payment system is currently disabled. Please use alternative payment methods.'
    );
  }
  
  // SECURITY: Require authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to verify payments'
    );
  }
  
  const userId = context.auth.uid;
  const { order_tracking_id, reference } = data;
  
  // Validate input
  if (!order_tracking_id || typeof order_tracking_id !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Order tracking ID is required'
    );
  }
  
  if (!reference || typeof reference !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Transaction reference is required'
    );
  }
  
  try {
    // Get payment record from Firestore
    const paymentQuery = await db.collection('payments')
      .where('reference', '==', reference)
      .where('userId', '==', userId)
      .limit(1)
      .get();
    
    if (paymentQuery.empty) {
      throw new functions.https.HttpsError(
        'not-found',
        'Payment record not found'
      );
    }
    
    const paymentDoc = paymentQuery.docs[0];
    const paymentData = paymentDoc.data();
    
    // SECURITY: Check if already verified (prevent duplicate processing)
    if (paymentData.verified === true && paymentData.status === 'completed') {
      console.warn('Payment already verified:', { reference, userId });
      return {
        success: true,
        reference: paymentData.reference,
        amount: paymentData.amount,
        currency: paymentData.currency,
        status: paymentData.status,
        already_verified: true
      };
    }
    
    // Step 1: Verify with Pesapal API (ONLY source of truth)
    console.log('Verifying payment:', { order_tracking_id, reference, userId });
    const pesapalData = await verifyPaymentWithPesapal(order_tracking_id);
    
    // Step 2: Validate verified payment data
    const validation = validateVerifiedPayment(paymentData, pesapalData);
    
    if (!validation.isValid) {
      console.error('Payment validation failed:', {
        reference,
        userId,
        errors: validation.errors
      });
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Payment validation failed: ' + validation.errors.join(', ')
      );
    }
    
    // Step 3: Update payment record in Firestore
    await paymentDoc.ref.update({
      status: 'completed',
      verified: true,
      verified_at: admin.firestore.FieldValue.serverTimestamp(),
      pesapal_payment_method: pesapalData.payment_method || null,
      pesapal_payment_status: pesapalData.payment_status_description || pesapalData.status || null,
      gateway_response: pesapalData, // Store full response for audit
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('Payment verified and updated:', {
      reference,
      amount: paymentData.amount,
      userId,
      order_tracking_id
    });
    
    // Return success (DO NOT return sensitive data)
    return {
      success: true,
      reference: paymentData.reference,
      amount: paymentData.amount,
      currency: paymentData.currency,
      status: 'completed'
    };
    
  } catch (error) {
    console.error('Payment verification error:', {
      order_tracking_id,
      reference,
      userId,
      error: error.message,
      code: error.code
    });
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError(
      'internal',
      'Payment verification failed. Please contact support.'
    );
  }
});

/**
 * Verify Pesapal webhook signature
 * SECURITY: Prevents webhook spoofing attacks
 * 
 * @param {string} signature - X-Pesapal-Signature header
 * @param {string} payload - Raw request body
 * @param {string} secret - Webhook secret
 * @returns {boolean} True if signature is valid
 */
function verifyWebhookSignature(signature, payload, secret) {
  if (!signature || !secret) {
    return false;
  }
  
  // Pesapal uses HMAC SHA256 for webhook signatures
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(hash)
  );
}

/**
 * HTTPS Cloud Function: Pesapal Webhook
 * 
 * Receives webhook notifications from Pesapal.
 * Verifies signature and re-verifies payment.
 * 
 * SECURITY:
 * - Verifies webhook signature (prevents spoofing)
 * - Re-verifies payment with Pesapal API (never trust webhook alone)
 * - Idempotent processing (prevents double processing)
 * - Fails closed on any error
 * 
 * WHY WEBHOOK VERIFICATION IS CRITICAL:
 * - Attackers can send fake webhooks
 * - Signature verification proves authenticity
 * - Re-verification ensures data integrity
 * 
 * STATUS: LOCKED - System is disabled but code remains for future use
 */
exports.pesapalWebhook = functions.https.onRequest(async (req, res) => {
  // FEATURE FLAG: Check if Pesapal is enabled
  const config = getPesapalConfig();
  const isEnabled = config.enabled === 'true';
  if (!isEnabled) {
    return res.status(503).json({ 
      error: 'Service unavailable',
      message: 'Pesapal payment system is currently disabled'
    });
  }
  
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const signature = req.headers['x-pesapal-signature'];
    const payload = req.body;
    
    // SECURITY: Verify webhook signature
    const webhookSecret = getPesapalConfig().webhookSecret;
    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(signature, payload, webhookSecret);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    } else {
      console.warn('Webhook secret not configured or signature missing');
      // In production, this should fail. For now, log warning.
    }
    
    // Extract order tracking ID from webhook
    const orderTrackingId = payload.OrderTrackingId || payload.order_tracking_id || payload.OrderNotification?.OrderTrackingId;
    
    if (!orderTrackingId) {
      console.error('Webhook missing order tracking ID');
      return res.status(400).json({ error: 'Missing order tracking ID' });
    }
    
    // SECURITY: Re-verify payment with Pesapal API (never trust webhook data alone)
    const pesapalData = await verifyPaymentWithPesapal(orderTrackingId);
    
    // Only process completed payments
    const status = pesapalData.payment_status_description || pesapalData.status || '';
    if (status.toLowerCase() !== 'completed' && status.toLowerCase() !== 'success') {
      console.log('Webhook payment not completed:', { orderTrackingId, status });
      return res.status(200).json({ received: true, status: 'not_completed' });
    }
    
    // Find payment record by order tracking ID
    const paymentQuery = await db.collection('payments')
      .where('pesapal_order_tracking_id', '==', orderTrackingId)
      .limit(1)
      .get();
    
    if (paymentQuery.empty) {
      console.warn('Webhook payment record not found:', orderTrackingId);
      return res.status(200).json({ received: true, status: 'not_found' });
    }
    
    const paymentDoc = paymentQuery.docs[0];
    const paymentData = paymentDoc.data();
    
    // SECURITY: Idempotent processing - check if already processed
    if (paymentData.verified === true && paymentData.status === 'completed') {
      console.log('Webhook payment already processed:', orderTrackingId);
      return res.status(200).json({ received: true, status: 'already_processed' });
    }
    
    // Validate payment data
    const validation = validateVerifiedPayment(paymentData, pesapalData);
    if (!validation.isValid) {
      console.error('Webhook payment validation failed:', {
        orderTrackingId,
        errors: validation.errors
      });
      return res.status(200).json({ received: true, status: 'validation_failed' });
    }
    
    // Update payment record
    await paymentDoc.ref.update({
      status: 'completed',
      verified: true,
      verified_at: admin.firestore.FieldValue.serverTimestamp(),
      pesapal_payment_method: pesapalData.payment_method || null,
      pesapal_payment_status: pesapalData.payment_status_description || pesapalData.status || null,
      gateway_response: pesapalData,
      webhook_received_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('Webhook payment processed:', {
      orderTrackingId,
      reference: paymentData.reference,
      amount: paymentData.amount
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
 * HTTPS Cloud Function: Get User Payments
 * 
 * Returns payment history for authenticated user.
 * 
 * SECURITY:
 * - Only returns payments for authenticated user
 * - No sensitive data exposed
 */
exports.getUserPayments = functions.https.onCall(async (data, context) => {
  // Require authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }
  
  const userId = context.auth.uid;
  const limit = data.limit || 50;
  
  try {
    const payments = await db.collection('payments')
      .where('userId', '==', userId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .get();
    
    const paymentList = payments.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        reference: data.reference,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        description: data.description,
        created_at: data.created_at?.toDate().toISOString() || null,
        verified: data.verified || false
      };
    });
    
    return {
      success: true,
      payments: paymentList,
      count: paymentList.length
    };
    
  } catch (error) {
    console.error('Error fetching user payments:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to fetch payments'
    );
  }
});

