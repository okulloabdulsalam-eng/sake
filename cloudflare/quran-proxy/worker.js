/**
 * KIUMA Quran API proxy — Quran.Foundation Content API v4 (OAuth2 client_credentials).
 * Set secrets: QF_CLIENT_ID, QF_CLIENT_SECRET
 * Optional: QF_ENV = production | prelive (default production)
 * Optional KV binding QURAN_KV for token cache (recommended)
 *
 * Deploy: wrangler deploy (from this folder) with route kiuma-quran.kiuma4.workers.dev
 */
export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }
    if (request.method !== 'GET') {
      return json({ error: 'Method not allowed' }, 405, cors);
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '');

    if (path === '/health') {
      return json({ ok: true, service: 'kiuma-quran-proxy' }, 200, cors);
    }

    const prelive = env.QF_ENV === 'prelive';
    const authBase = prelive ? 'https://prelive-oauth2.quran.foundation' : 'https://oauth2.quran.foundation';
    const apiBase = prelive ? 'https://apis-prelive.quran.foundation' : 'https://apis.quran.foundation';

    const clientId = env.QF_CLIENT_ID;
    const clientSecret = env.QF_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return json({
        error: 'Quran word API not configured',
        hint: 'Set QF_CLIENT_ID and QF_CLIENT_SECRET (Quran.Foundation app credentials).'
      }, 503, cors);
    }

    let match = path.match(/^\/verses\/by_page\/(\d{1,3})$/);
    if (match) {
      const page = match[1];
      const qs = new URLSearchParams(url.search);
      if (!qs.has('words')) qs.set('words', 'true');
      if (!qs.has('per_page')) qs.set('per_page', '50');
      if (!qs.has('word_translation_language')) qs.set('word_translation_language', 'en');
      if (!qs.has('word_fields')) qs.set('word_fields', 'text_uthmani');
      const upstream = `${apiBase}/v4/verses/by_page/${page}?${qs.toString()}`;
      return proxyApi(upstream, clientId, clientSecret, authBase, apiBase, env, cors);
    }

    match = path.match(/^\/verses\/by_chapter\/(\d{1,3})$/);
    if (match) {
      const ch = match[1];
      const qs = new URLSearchParams(url.search);
      if (!qs.has('words')) qs.set('words', 'true');
      if (!qs.has('per_page')) qs.set('per_page', '50');
      if (!qs.has('word_translation_language')) qs.set('word_translation_language', 'en');
      if (!qs.has('word_fields')) qs.set('word_fields', 'text_uthmani');
      const upstream = `${apiBase}/v4/verses/by_chapter/${ch}?${qs.toString()}`;
      return proxyApi(upstream, clientId, clientSecret, authBase, apiBase, env, cors);
    }

    return json({ error: 'Not found', paths: ['/health', '/verses/by_page/:n', '/verses/by_chapter/:n'] }, 404, cors);
  }
};

function json(body, status, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders }
  });
}

async function getAccessToken(clientId, clientSecret, authBase, env) {
  const now = Date.now();
  const cacheKey = 'qf_content_access_token';

  if (env.QURAN_KV) {
    try {
      const raw = await env.QURAN_KV.get(cacheKey);
      if (raw) {
        const { token, exp } = JSON.parse(raw);
        if (exp > now + 60_000) return token;
      }
    } catch (_) {}
  }

  const basic = btoa(`${clientId}:${clientSecret}`);
  const resp = await fetch(`${authBase}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basic}`
    },
    body: 'grant_type=client_credentials&scope=content'
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Token exchange failed: ${resp.status} ${t.slice(0, 200)}`);
  }

  const data = await resp.json();
  const token = data.access_token;
  const expiresIn = (data.expires_in || 3600) * 1000;
  const exp = now + expiresIn;

  if (env.QURAN_KV) {
    try {
      await env.QURAN_KV.put(cacheKey, JSON.stringify({ token, exp }), { expirationTtl: Math.min(3500, Math.floor(expiresIn / 1000)) });
    } catch (_) {}
  }

  return token;
}

async function proxyApi(upstreamUrl, clientId, clientSecret, authBase, apiBase, env, cors) {
  try {
    const token = await getAccessToken(clientId, clientSecret, authBase, env);
    const resp = await fetch(upstreamUrl, {
      headers: {
        'x-auth-token': token,
        'x-client-id': clientId,
        Accept: 'application/json'
      }
    });

    const text = await resp.text();
    const headers = {
      ...cors,
      'Content-Type': resp.headers.get('Content-Type') || 'application/json',
      'Cache-Control': 'public, max-age=86400'
    };

    return new Response(text, { status: resp.status, headers });
  } catch (e) {
    return json({ error: String(e.message || e) }, 502, cors);
  }
}
