// ══════════════════════════════════════════
// KIUMA Push Notifications Worker
// Uses Firebase Cloud Messaging (FCM) v1 API
// Stores device tokens in Cloudflare KV
// ══════════════════════════════════════════

export default {
  // ── Cron Trigger: Prayer reminders (5 min before) + Hijri white days ──
  async scheduled(event, env, ctx) {
    ctx.waitUntil(handleScheduled(env));
  },

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
  let lastError = null;
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
            title: String(title),
            body: String(message || ''),
            notification_id: String(data?.notification_id || ''),
            category: String(data?.category || 'general'),
            url: String(data?.url || '/notifications.html')
          }
        }
      };

      const projectId = env.FCM_PROJECT_ID || 'kiuma-mob-app';
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
        const errMsg = errData?.error?.message || resp.status;
        console.error('FCM send error:', JSON.stringify(errData));
        if (!lastError) lastError = errMsg;

        // Remove invalid tokens (NOT_FOUND, UNREGISTERED, or INVALID_ARGUMENT)
        const errCode = errData?.error?.code;
        const errStatus = errData?.error?.status;
        if (resp.status === 404 || resp.status === 410 ||
            errStatus === 'NOT_FOUND' || errStatus === 'INVALID_ARGUMENT' ||
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
    success: sent > 0 || tokens.length === 0,
    message: sent > 0 ? `Notification sent to ${sent} device(s)` : (lastError ? `Failed: ${lastError}` : 'No devices received the push'),
    sent,
    failed,
    cleaned: failedTokenIds.length,
    total_registered: tokens.length,
    ...(lastError ? { error_detail: lastError } : {})
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

// ══════════════════════════════════════
// Scheduled Notifications (Cron Triggers)
// Prayer reminders 5 min before adhan
// Hijri white days fasting reminders
// ══════════════════════════════════════

const EAT_OFFSET_HOURS = 3; // East Africa Time = UTC+3
const FIRESTORE_PROJECT = 'kiuma-mob-app';
const PRAYER_TIMES_URL = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT}/databases/(default)/documents/appData/prayerTimes`;
const PRAYER_NAMES = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

async function handleScheduled(env) {
  try {
    const prayerTimes = await fetchPrayerTimes(env);
    if (prayerTimes) {
      await checkPrayerReminders(prayerTimes, env);
    }
    await checkHijriReminders(env);
  } catch (err) {
    console.error('[Scheduled] Error:', err.message);
  }
}

// ── Fetch prayer times from Firestore REST API (public read) ──
async function fetchPrayerTimes(env) {
  // Check KV cache first (1 hour TTL)
  const cached = await env.FCM_TOKENS.get('cached_prayer_times');
  if (cached) {
    try {
      const { data, expires_at } = JSON.parse(cached);
      if (Date.now() < expires_at) return data;
    } catch {}
  }

  try {
    const resp = await fetch(PRAYER_TIMES_URL);
    if (!resp.ok) {
      console.error('[Prayer] Firestore API error:', resp.status);
      // Fall back to expired cache if available
      if (cached) {
        try { return JSON.parse(cached).data; } catch {}
      }
      return null;
    }

    const doc = await resp.json();
    const fields = doc.fields;
    if (!fields) return null;

    // Parse Firestore REST API response format
    // Each prayer is a mapValue: { fields: { adhan: {stringValue}, iqaama: {stringValue} } }
    const prayerTimes = {};
    for (const name of PRAYER_NAMES) {
      const prayerField = fields[name];
      if (prayerField?.mapValue?.fields) {
        const f = prayerField.mapValue.fields;
        prayerTimes[name] = {
          adhan: f.adhan?.stringValue || '',
          iqaama: f.iqaama?.stringValue || ''
        };
      }
    }

    // Cache for 1 hour
    await env.FCM_TOKENS.put('cached_prayer_times', JSON.stringify({
      data: prayerTimes,
      expires_at: Date.now() + 3600000
    }));

    return prayerTimes;
  } catch (err) {
    console.error('[Prayer] Fetch error:', err.message);
    return null;
  }
}

// ── Check if any prayer is 5 minutes away ──
async function checkPrayerReminders(prayerTimes, env) {
  const now = new Date();
  // Current time in EAT
  const eatHour = (now.getUTCHours() + EAT_OFFSET_HOURS) % 24;
  const eatMinute = now.getUTCMinutes();
  // Time 5 minutes from now in EAT
  let targetMinute = eatMinute + 5;
  let targetHour = eatHour;
  if (targetMinute >= 60) {
    targetMinute -= 60;
    targetHour = (targetHour + 1) % 24;
  }
  const targetTimeStr = String(targetHour).padStart(2, '0') + ':' + String(targetMinute).padStart(2, '0');

  const today = getEATDateString(now);

  for (const name of PRAYER_NAMES) {
    const prayer = prayerTimes[name];
    if (!prayer?.adhan) continue;

    // Compare adhan time (HH:MM) with target time
    const adhanTime = prayer.adhan.substring(0, 5); // ensure HH:MM
    if (adhanTime === targetTimeStr) {
      // Check deduplication
      const dedupeKey = `sent:prayer:${name}:${today}`;
      const alreadySent = await env.FCM_TOKENS.get(dedupeKey);
      if (alreadySent) continue;

      const displayName = name.charAt(0).toUpperCase() + name.slice(1);
      const title = `${displayName} Prayer Reminder`;
      const body = `${displayName} adhan is in 5 minutes (${adhanTime}). Prepare for prayer.`;

      console.log(`[Prayer] Sending ${name} reminder for ${adhanTime}`);
      await sendScheduledPush(title, body, 'prayer', env);

      // Mark as sent (24h TTL)
      await env.FCM_TOKENS.put(dedupeKey, '1', { expirationTtl: 86400 });
    }
  }
}

// ── Hijri white days check ──
async function checkHijriReminders(env) {
  const now = new Date();
  const eatHour = (now.getUTCHours() + EAT_OFFSET_HOURS) % 24;
  const eatMinute = now.getUTCMinutes();

  // Only send at 8 AM, 12 PM, 10 PM EAT (± 0 minutes)
  const scheduledHours = [8, 12, 22];
  if (!scheduledHours.includes(eatHour) || eatMinute !== 0) return;

  const hijri = getHijriDate();
  // White days are 13th, 14th, 15th of each Hijri month
  if (hijri.day < 13 || hijri.day > 15) return;

  const today = getEATDateString(now);
  const dedupeKey = `sent:hijri:${today}:${eatHour}`;
  const alreadySent = await env.FCM_TOKENS.get(dedupeKey);
  if (alreadySent) return;

  const title = 'Fasting Reminder — White Days';
  const body = `Today is the ${hijri.day}th of the Hijri month — one of the blessed white days. Fast and seek reward!`;

  console.log(`[Hijri] Sending white days reminder (day ${hijri.day}, ${eatHour}:00 EAT)`);
  await sendScheduledPush(title, body, 'hijri', env);

  await env.FCM_TOKENS.put(dedupeKey, '1', { expirationTtl: 86400 });
}

// ── Approximate Hijri date calculation ──
function getHijriDate() {
  const today = new Date();
  // Approximate Hijri conversion
  const hijriYear = Math.floor((today.getFullYear() - 622) * 1.0307);
  const hijriMonth = Math.floor((today.getMonth() + 1) * 0.97);
  const hijriDay = Math.floor(today.getDate() * 0.97);
  return { day: hijriDay, month: hijriMonth, year: hijriYear };
}

// ── Get EAT date string (YYYY-MM-DD) ──
function getEATDateString(now) {
  const eat = new Date(now.getTime() + EAT_OFFSET_HOURS * 3600000);
  return eat.toISOString().substring(0, 10);
}

// ── Send push to all registered devices (reuses existing FCM infrastructure) ──
async function sendScheduledPush(title, body, category, env) {
  const tokens = await getAllTokens(env);
  if (tokens.length === 0) {
    console.log('[Scheduled] No registered devices');
    return;
  }

  const accessToken = await getFCMAccessToken(env);
  const projectId = env.FCM_PROJECT_ID || FIRESTORE_PROJECT;
  let sent = 0;
  let failed = 0;
  const failedTokenIds = [];

  for (const entry of tokens) {
    try {
      const fcmPayload = {
        message: {
          token: entry.token,
          notification: { title, body },
          webpush: {
            notification: {
              title, body,
              icon: '/logo.png',
              badge: '/logo.png',
              tag: `kiuma-${category}-${Date.now()}`,
              requireInteraction: true
            },
            fcm_options: { link: '/notifications.html' }
          },
          data: {
            title: String(title),
            body: String(body),
            category: String(category),
            notification_id: `${category}_${Date.now()}`,
            url: '/notifications.html'
          }
        }
      };

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
      } else {
        const errData = await resp.json().catch(() => ({}));
        const errStatus = errData?.error?.status;
        if (resp.status === 404 || resp.status === 410 ||
            errStatus === 'NOT_FOUND' || errStatus === 'INVALID_ARGUMENT') {
          failedTokenIds.push(entry.device_id);
        }
        failed++;
      }
    } catch (err) {
      console.error('[Scheduled] Send error:', err.message);
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

  console.log(`[Scheduled] ${title}: sent=${sent}, failed=${failed}, cleaned=${failedTokenIds.length}`);
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
