// ══════════════════════════════════════════
// KIUMA Push Notifications Worker
// Uses Firebase Cloud Messaging (FCM) v1 API
// Stores device tokens in Cloudflare KV
// ══════════════════════════════════════════

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      let response;

      if (path === '/health') {
        response = json({ status: 'ok', service: 'KIUMA Push Notifications' });
      } else if (path === '/api/register-token' && request.method === 'POST') {
        response = await registerToken(await request.json(), env);
      } else if (path === '/api/unregister-token' && request.method === 'POST') {
        response = await unregisterToken(await request.json(), env);
      } else if (path === '/api/send' && request.method === 'POST') {
        response = await sendNotification(await request.json(), env);
      } else if (path === '/api/tokens/count' && request.method === 'GET') {
        response = await getTokenCount(env);
      } else {
        response = json({ error: 'Not found' }, 404);
      }

      // Add CORS headers to response
      const newHeaders = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([k, v]) => newHeaders.set(k, v));
      return new Response(response.body, { status: response.status, headers: newHeaders });

    } catch (err) {
      return json({ error: err.message || 'Internal server error' }, 500, corsHeaders);
    }
  }
};

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders }
  });
}

// ── Token Registration ──
async function registerToken(body, env) {
  const { token, device_id } = body;
  if (!token) {
    return json({ success: false, message: 'FCM token is required' }, 400);
  }

  const id = device_id || hashToken(token);
  const entry = {
    token,
    device_id: id,
    registered_at: new Date().toISOString(),
    last_seen: new Date().toISOString()
  };

  await env.FCM_TOKENS.put(`token:${id}`, JSON.stringify(entry));

  // Also add to the token index for easy listing
  const index = await getTokenIndex(env);
  if (!index.includes(id)) {
    index.push(id);
    await env.FCM_TOKENS.put('token_index', JSON.stringify(index));
  }

  return json({ success: true, message: 'Token registered', device_id: id });
}

async function unregisterToken(body, env) {
  const { token, device_id } = body;
  const id = device_id || hashToken(token);

  await env.FCM_TOKENS.delete(`token:${id}`);

  const index = await getTokenIndex(env);
  const newIndex = index.filter(i => i !== id);
  await env.FCM_TOKENS.put('token_index', JSON.stringify(newIndex));

  return json({ success: true, message: 'Token unregistered' });
}

async function getTokenCount(env) {
  const index = await getTokenIndex(env);
  return json({ success: true, count: index.length });
}

async function getTokenIndex(env) {
  const raw = await env.FCM_TOKENS.get('token_index');
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function hashToken(token) {
  // Simple hash for device ID from token
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    const chr = token.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return 'dev_' + Math.abs(hash).toString(36);
}

// ── Get All Tokens ──
async function getAllTokens(env) {
  const index = await getTokenIndex(env);
  const tokens = [];
  const staleIds = [];

  for (const id of index) {
    const raw = await env.FCM_TOKENS.get(`token:${id}`);
    if (raw) {
      try {
        const entry = JSON.parse(raw);
        tokens.push(entry);
      } catch { staleIds.push(id); }
    } else {
      staleIds.push(id);
    }
  }

  // Clean up stale entries
  if (staleIds.length > 0) {
    const cleanIndex = index.filter(id => !staleIds.includes(id));
    await env.FCM_TOKENS.put('token_index', JSON.stringify(cleanIndex));
  }

  return tokens;
}

// ── Send Notification via FCM v1 ──
async function sendNotification(body, env) {
  const { title, message, data, admin_key } = body;

  // Simple admin auth
  if (admin_key !== env.ADMIN_KEY) {
    return json({ success: false, message: 'Unauthorized' }, 401);
  }

  if (!title) {
    return json({ success: false, message: 'Notification title is required' }, 400);
  }

  const tokens = await getAllTokens(env);
  if (tokens.length === 0) {
    return json({ success: true, message: 'No registered devices', sent: 0, failed: 0 });
  }

  // Get FCM access token
  const accessToken = await getFCMAccessToken(env);

  let sent = 0;
  let failed = 0;
  const failedTokenIds = [];

  // Send to each device
  for (const entry of tokens) {
    try {
      const fcmPayload = {
        message: {
          token: entry.token,
          notification: {
            title: title,
            body: message || ''
          },
          webpush: {
            notification: {
              title: title,
              body: message || '',
              icon: '/logo.png',
              badge: '/logo.png',
              tag: data?.notification_id || 'kiuma-' + Date.now(),
              requireInteraction: true
            },
            fcm_options: {
              link: data?.url || '/notifications.html'
            }
          },
          data: {
            title: title,
            body: message || '',
            notification_id: data?.notification_id || '',
            category: data?.category || 'general',
            url: data?.url || '/notifications.html',
            ...(data || {})
          }
        }
      };

      const projectId = env.FCM_PROJECT_ID || 'kiuma-2026';
      const resp = await fetch(
        `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(fcmPayload)
        }
      );

      if (resp.ok) {
        sent++;
        // Update last_seen
        entry.last_seen = new Date().toISOString();
        await env.FCM_TOKENS.put(`token:${entry.device_id}`, JSON.stringify(entry));
      } else {
        const errData = await resp.json().catch(() => ({}));
        console.error('FCM send error:', JSON.stringify(errData));

        // Remove invalid tokens
        if (resp.status === 404 || resp.status === 410 ||
            errData?.error?.details?.some(d => d['@type']?.includes('BadRequest'))) {
          failedTokenIds.push(entry.device_id);
        }
        failed++;
      }
    } catch (err) {
      console.error('Send error:', err.message);
      failed++;
    }
  }

  // Clean up invalid tokens
  if (failedTokenIds.length > 0) {
    const index = await getTokenIndex(env);
    const cleanIndex = index.filter(id => !failedTokenIds.includes(id));
    await env.FCM_TOKENS.put('token_index', JSON.stringify(cleanIndex));
    for (const id of failedTokenIds) {
      await env.FCM_TOKENS.delete(`token:${id}`);
    }
  }

  return json({
    success: true,
    message: `Notification sent to ${sent} device(s)`,
    sent,
    failed,
    cleaned: failedTokenIds.length,
    total_registered: tokens.length
  });
}

// ══════════════════════════════════════
// FCM v1 OAuth2 Authentication
// Uses Firebase service account JWT
// ══════════════════════════════════════

async function getFCMAccessToken(env) {
  // Check cache first
  const cached = await env.FCM_TOKENS.get('fcm_access_token');
  if (cached) {
    try {
      const { token, expires_at } = JSON.parse(cached);
      if (Date.now() < expires_at - 60000) { // 1 min buffer
        return token;
      }
    } catch {}
  }

  const clientEmail = env.FCM_CLIENT_EMAIL;
  const privateKeyPem = env.FCM_PRIVATE_KEY;

  if (!clientEmail || !privateKeyPem) {
    throw new Error('Firebase service account not configured. Set FCM_CLIENT_EMAIL and FCM_PRIVATE_KEY secrets.');
  }

  const now = Math.floor(Date.now() / 1000);
  const jwtHeader = { alg: 'RS256', typ: 'JWT' };
  const jwtClaim = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  };

  const headerB64 = base64url(JSON.stringify(jwtHeader));
  const claimB64 = base64url(JSON.stringify(jwtClaim));
  const unsignedJwt = `${headerB64}.${claimB64}`;

  // Import private key and sign
  const key = await importPrivateKey(privateKeyPem);
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    encoder.encode(unsignedJwt)
  );
  const signatureB64 = base64url(signature);
  const jwt = `${unsignedJwt}.${signatureB64}`;

  // Exchange JWT for access token
  const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });

  if (!tokenResp.ok) {
    const errText = await tokenResp.text();
    throw new Error('Failed to get FCM access token: ' + errText);
  }

  const tokenData = await tokenResp.json();

  // Cache the token
  await env.FCM_TOKENS.put('fcm_access_token', JSON.stringify({
    token: tokenData.access_token,
    expires_at: Date.now() + (tokenData.expires_in * 1000)
  }));

  return tokenData.access_token;
}

function base64url(input) {
  let str;
  if (typeof input === 'string') {
    str = btoa(input);
  } else {
    // ArrayBuffer
    const bytes = new Uint8Array(input);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    str = btoa(binary);
  }
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function importPrivateKey(pem) {
  // Clean PEM - handle escaped newlines and extract key content
  const cleaned = pem
    .replace(/\\n/g, '\n')
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');

  const binaryStr = atob(cleaned);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  return crypto.subtle.importKey(
    'pkcs8',
    bytes.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
}
