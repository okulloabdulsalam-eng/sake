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
  const { amount, currency, description, email, phone, first_name, last_name, callback_url, cancellation_url } = body;

  // Validate
  if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    return json({ success: false, message: 'Valid payment amount is required' }, 400);
  }
  if (!description) {
    return json({ success: false, message: 'Payment description is required' }, 400);
  }
  const safeEmail = email || '';

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
  const finalCallback = (callback_url && typeof callback_url === 'string' && callback_url.startsWith('http')) ? callback_url : `${appBaseUrl}/payment-callback.html`;
  const finalCancel = (cancellation_url && typeof cancellation_url === 'string' && cancellation_url.startsWith('http')) ? cancellation_url : `${appBaseUrl}/pay.html?payment=cancelled`;

  const orderData = {
    id: reference,
    currency: cur,
    amount: parseFloat(amount),
    description: description,
    callback_url: finalCallback,
    cancellation_url: finalCancel,
    notification_id: notificationId,
    billing_address: {
      email_address: safeEmail,
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

  if (!orderResp.redirect_url) {
    const errMsg = (orderResp.error && orderResp.error.message) || 'Pesapal did not return a checkout URL';
    throw new Error(errMsg);
  }

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

const FUNDRAISING_KV_KEY = 'fundraising:transactions';
const MAX_TRANSACTIONS = 100;
const RECENT_COUNT = 10;

// ── IPN Webhook from Pesapal ──
async function handleIPN(body, env) {
  const orderTrackingId = body.OrderTrackingId || body.order_tracking_id ||
    (body.OrderNotification && body.OrderNotification.OrderTrackingId);

  if (!orderTrackingId) {
    console.error('IPN missing order tracking ID:', JSON.stringify(body));
    return json({ received: true, status: 'missing_id' });
  }

  // Re-verify with Pesapal API (never trust webhook data alone)
  let verifiedAmount = null;
  let verifiedReference = null;
  let isCompleted = false;

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
      const status = (data.payment_status_description || data.status || '').toLowerCase();
      isCompleted = status === 'completed' || status === 'success';
      verifiedAmount = parseFloat(data.amount || data.payment_amount || 0);
      verifiedReference = data.merchant_reference || orderTrackingId;
      console.log('IPN verified:', JSON.stringify({
        orderTrackingId,
        status: data.payment_status_description,
        amount: verifiedAmount,
        reference: verifiedReference,
      }));
    }
  } catch (e) {
    console.error('IPN verification error:', e.message);
  }

  // On completed payment: append to fundraising transactions in KV
  if (isCompleted && verifiedAmount > 0 && env.FUNDRAISING_KV) {
    try {
      const raw = await env.FUNDRAISING_KV.get(FUNDRAISING_KV_KEY);
      const list = raw ? JSON.parse(raw) : [];
      list.push({
        amount: verifiedAmount,
        currency: 'UGX',
        reference: verifiedReference,
        orderTrackingId,
        date: new Date().toISOString(),
      });
      const trimmed = list.slice(-MAX_TRANSACTIONS);
      await env.FUNDRAISING_KV.put(FUNDRAISING_KV_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.error('KV update error:', e.message);
    }
  }

  // Always return 200 to Pesapal to prevent retries
  return json({ received: true, status: 'processed' });
}

// ── Seed one test transaction (optional: ?secret=FUNDRAISING_SEED_SECRET) ──
async function seedFundraisingTest(env) {
  const secret = env.FUNDRAISING_SEED_SECRET;
  if (!secret || !env.FUNDRAISING_KV) {
    return json({ success: false, message: 'Not configured' }, 400);
  }
  const url = new URL(env.REQUEST_URL || '');
  if (url.searchParams.get('secret') !== secret) {
    return json({ success: false, message: 'Invalid secret' }, 401);
  }
  try {
    const raw = await env.FUNDRAISING_KV.get(FUNDRAISING_KV_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.push({
      amount: 1000,
      currency: 'UGX',
      reference: 'SEED-TEST-' + Date.now(),
      orderTrackingId: 'seed',
      date: new Date().toISOString(),
    });
    const trimmed = list.slice(-MAX_TRANSACTIONS);
    await env.FUNDRAISING_KV.put(FUNDRAISING_KV_KEY, JSON.stringify(trimmed));
    return json({ success: true, message: 'Test donation (1000 UGX) added. Total will update on next poll.' });
  } catch (e) {
    console.error('Seed error:', e.message);
    return json({ success: false, message: e.message }, 500);
  }
}

// ── Get fundraising total (for live total page) ──
async function getFundraisingTotal(env) {
  if (!env.FUNDRAISING_KV) {
    return json({
      total: 0,
      currency: 'UGX',
      lastUpdated: null,
      recentTransactions: [],
    });
  }
  try {
    const raw = await env.FUNDRAISING_KV.get(FUNDRAISING_KV_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const total = list.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const last = list.length ? list[list.length - 1] : null;
    const recent = list.slice(-RECENT_COUNT).reverse();
    return json({
      total: Math.round(total * 100) / 100,
      currency: 'UGX',
      lastUpdated: last ? last.date : null,
      recentTransactions: recent,
    });
  } catch (e) {
    console.error('Fundraising total read error:', e.message);
    return json({
      total: 0,
      currency: 'UGX',
      lastUpdated: null,
      recentTransactions: [],
    });
  }
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

      // Live fundraising total (for balance page)
      if (request.method === 'GET' && path === '/api/fundraising-total') {
        return await getFundraisingTotal(env);
      }

      // One-time seed test transaction (optional; requires FUNDRAISING_SEED_SECRET)
      if (request.method === 'GET' && path === '/api/fundraising-seed') {
        const envWithUrl = { ...env, REQUEST_URL: request.url };
        return await seedFundraisingTest(envWithUrl);
      }

      return json({ error: 'Not found' }, 404);
    } catch (err) {
      console.error('Worker error:', err.message, err.stack);
      return json({ success: false, message: err.message || 'Internal server error' }, 500);
    }
  },
};
