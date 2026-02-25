/**
 * KIUMA Pesapal Payment Worker - Cloudflare Workers
 * 
 * Handles Pesapal payment processing:
 * - POST /api/initialize-payment  → Create payment order, return checkout URL
 * - POST /api/verify-payment      → Verify payment status with Pesapal API
 * - POST /api/ipn                 → Pesapal IPN webhook callback
 * - GET  /api/register-ipn        → Register IPN URL with Pesapal (run once)
 * - GET  /health                  → Health check
 *
 * Environment Secrets (set via wrangler secret put):
 *   PESAPAL_CONSUMER_KEY
 *   PESAPAL_CONSUMER_SECRET
 *   PESAPAL_TEST_MODE        ("true" or "false")
 *   APP_BASE_URL             (e.g. https://okulloabdulsalam-eng.github.io/sake)
 */

const PESAPAL_LIVE_URL = 'https://pay.pesapal.com/v3';
const PESAPAL_SANDBOX_URL = 'https://cybqa.pesapal.com/pesapalv3';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function getPesapalBaseUrl(env) {
  return env.PESAPAL_TEST_MODE === 'true' ? PESAPAL_SANDBOX_URL : PESAPAL_LIVE_URL;
}

// ── Get Pesapal OAuth Token ──
async function getPesapalToken(env) {
  const baseUrl = getPesapalBaseUrl(env);
  const resp = await fetch(`${baseUrl}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      consumer_key: env.PESAPAL_CONSUMER_KEY,
      consumer_secret: env.PESAPAL_CONSUMER_SECRET,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Pesapal auth failed (${resp.status}): ${errText}`);
  }

  const data = await resp.json();
  if (!data.token) throw new Error('No token in Pesapal auth response');
  return data.token;
}

// ── Generate unique reference ──
function generateReference() {
  const ts = Date.now();
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  return `KIUMA-${ts}-${rand}`;
}

// ── Register IPN URL (run once to get notification_id) ──
async function registerIPN(env) {
  const token = await getPesapalToken(env);
  const baseUrl = getPesapalBaseUrl(env);
  const workerUrl = env.WORKER_URL || '';

  const resp = await fetch(`${baseUrl}/api/URLSetup/RegisterIPN`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      url: `${workerUrl}/api/ipn`,
      ipn_notification_type: 'POST',
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`IPN registration failed (${resp.status}): ${errText}`);
  }

  const data = await resp.json();
  return data;
}

// ── Initialize Payment ──
async function initializePayment(body, env) {
  const { amount, currency, description, email, phone, first_name, last_name } = body;

  // Validate
  if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    return json({ success: false, message: 'Valid payment amount is required' }, 400);
  }
  if (!description) {
    return json({ success: false, message: 'Payment description is required' }, 400);
  }
  if (!email) {
    return json({ success: false, message: 'Email is required' }, 400);
  }

  const cur = currency || 'UGX';
  if (cur !== 'UGX') {
    return json({ success: false, message: 'Only UGX currency is supported' }, 400);
  }
  if (parseFloat(amount) > 100000000) {
    return json({ success: false, message: 'Amount exceeds maximum allowed' }, 400);
  }

  const token = await getPesapalToken(env);
  const baseUrl = getPesapalBaseUrl(env);
  const reference = generateReference();
  const appBaseUrl = env.APP_BASE_URL || 'https://okulloabdulsalam-eng.github.io/sake';
  const notificationId = env.PESAPAL_NOTIFICATION_ID || '';

  const orderData = {
    id: reference,
    currency: cur,
    amount: parseFloat(amount),
    description: description,
    callback_url: `${appBaseUrl}/payment-callback.html`,
    cancellation_url: `${appBaseUrl}/pay.html?payment=cancelled`,
    notification_id: notificationId,
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
      zip_code: '',
    },
  };

  const resp = await fetch(`${baseUrl}/api/Transactions/SubmitOrderRequest`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(orderData),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error('Pesapal order failed:', errText);
    throw new Error(`Failed to create payment order (${resp.status})`);
  }

  const orderResp = await resp.json();

  return json({
    success: true,
    reference: reference,
    checkout_url: orderResp.redirect_url,
    order_tracking_id: orderResp.order_tracking_id,
  });
}

// ── Verify Payment ──
async function verifyPayment(body, env) {
  const { order_tracking_id } = body;

  if (!order_tracking_id) {
    return json({ success: false, message: 'order_tracking_id is required' }, 400);
  }

  const token = await getPesapalToken(env);
  const baseUrl = getPesapalBaseUrl(env);

  const resp = await fetch(
    `${baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${order_tracking_id}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    }
  );

  if (!resp.ok) {
    const errText = await resp.text();
    console.error('Pesapal verify failed:', errText);
    throw new Error(`Failed to verify payment (${resp.status})`);
  }

  const data = await resp.json();
  const status = (data.payment_status_description || data.status || '').toLowerCase();
  const isCompleted = status === 'completed' || status === 'success';

  return json({
    success: true,
    completed: isCompleted,
    status: data.payment_status_description || data.status || 'unknown',
    amount: data.amount || data.payment_amount || null,
    currency: data.currency || data.currency_code || 'UGX',
    payment_method: data.payment_method || null,
    reference: data.merchant_reference || null,
    order_tracking_id: order_tracking_id,
  });
}

// ── IPN Webhook from Pesapal ──
async function handleIPN(body, env) {
  const orderTrackingId = body.OrderTrackingId || body.order_tracking_id ||
    (body.OrderNotification && body.OrderNotification.OrderTrackingId);

  if (!orderTrackingId) {
    console.error('IPN missing order tracking ID:', JSON.stringify(body));
    return json({ received: true, status: 'missing_id' });
  }

  // Re-verify with Pesapal API (never trust webhook data alone)
  try {
    const token = await getPesapalToken(env);
    const baseUrl = getPesapalBaseUrl(env);

    const resp = await fetch(
      `${baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      }
    );

    if (resp.ok) {
      const data = await resp.json();
      console.log('IPN verified:', JSON.stringify({
        orderTrackingId,
        status: data.payment_status_description,
        amount: data.amount,
        reference: data.merchant_reference,
      }));
    }
  } catch (e) {
    console.error('IPN verification error:', e.message);
  }

  // Always return 200 to Pesapal to prevent retries
  return json({ received: true, status: 'processed' });
}

// ── Main Router ──
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Health check
      if (request.method === 'GET' && (path === '/' || path === '/health')) {
        return json({ status: 'ok', service: 'KIUMA Pesapal Payment' });
      }

      // Register IPN (admin - run once)
      if (request.method === 'GET' && path === '/api/register-ipn') {
        const data = await registerIPN(env);
        return json({
          success: true,
          message: 'IPN registered. Save the notification_id as PESAPAL_NOTIFICATION_ID secret.',
          data,
        });
      }

      // Initialize payment
      if (request.method === 'POST' && path === '/api/initialize-payment') {
        const body = await request.json();
        return await initializePayment(body, env);
      }

      // Verify payment
      if (request.method === 'POST' && path === '/api/verify-payment') {
        const body = await request.json();
        return await verifyPayment(body, env);
      }

      // IPN webhook
      if (request.method === 'POST' && path === '/api/ipn') {
        let body;
        try { body = await request.json(); } catch { body = {}; }
        return await handleIPN(body, env);
      }

      return json({ error: 'Not found' }, 404);
    } catch (err) {
      console.error('Worker error:', err.message, err.stack);
      return json({ success: false, message: err.message || 'Internal server error' }, 500);
    }
  },
};
