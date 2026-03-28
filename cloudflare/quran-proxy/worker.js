/**
 * KIUMA Quran API proxy — Quran.Foundation Content API v4 (OAuth2 client_credentials).
 * Secrets: QF_CLIENT_ID, QF_CLIENT_SECRET
 * QF_ENV: prelive | production | auto (default auto = try prelive then production)
 * Optional KV QURAN_KV for token cache
 */
const QF = {
  prelive: {
    authBase: 'https://prelive-oauth2.quran.foundation',
    apiBase: 'https://apis-prelive.quran.foundation'
  },
  production: {
    authBase: 'https://oauth2.quran.foundation',
    apiBase: 'https://apis.quran.foundation'
  }
};

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
      const apiPath = `/v4/verses/by_page/${page}?${qs.toString()}`;
      return proxyApiPath(apiPath, clientId, clientSecret, env, cors);
    }

    match = path.match(/^\/verses\/by_chapter\/(\d{1,3})$/);
    if (match) {
      const ch = match[1];
      const qs = new URLSearchParams(url.search);
      if (!qs.has('words')) qs.set('words', 'true');
      if (!qs.has('per_page')) qs.set('per_page', '50');
      if (!qs.has('word_translation_language')) qs.set('word_translation_language', 'en');
      if (!qs.has('word_fields')) qs.set('word_fields', 'text_uthmani');
      const apiPath = `/v4/verses/by_chapter/${ch}?${qs.toString()}`;
      return proxyApiPath(apiPath, clientId, clientSecret, env, cors);
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

function envTryOrder(qfEnv) {
  if (qfEnv === 'production') return ['production', 'prelive'];
  if (qfEnv === 'prelive') return ['prelive', 'production'];
  return ['prelive', 'production'];
}

async function fetchOAuthToken(clientId, clientSecret, authBase, env, cacheTag) {
  const now = Date.now();
  const cacheKey = `qf_content_token_${cacheTag}`;

  if (env.QURAN_KV) {
    try {
      const raw = await env.QURAN_KV.get(cacheKey);
      if (raw) {
        const { token, exp } = JSON.parse(raw);
        if (exp > now + 60_000) return token;
      }
    } catch (_) {}
  }

  const tokenUrl = `${authBase}/oauth2/token`;
  const formBase = { grant_type: 'client_credentials', scope: 'content' };

  let resp = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`
    },
    body: new URLSearchParams(formBase).toString()
  });

  if (!resp.ok) {
    const body2 = new URLSearchParams({
      ...formBase,
      client_id: clientId,
      client_secret: clientSecret
    });
    resp = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body2.toString()
    });
  }

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Token ${cacheTag}: ${resp.status} ${t.slice(0, 180)}`);
  }

  const data = await resp.json();
  const token = data.access_token;
  const expiresIn = (data.expires_in || 3600) * 1000;
  const exp = now + expiresIn;

  if (env.QURAN_KV) {
    try {
      await env.QURAN_KV.put(cacheKey, JSON.stringify({ token, exp }), {
        expirationTtl: Math.min(3500, Math.floor(expiresIn / 1000))
      });
    } catch (_) {}
  }

  return token;
}

async function proxyApiPath(apiPathWithQuery, clientId, clientSecret, env, cors) {
  const order = envTryOrder(env.QF_ENV);
  let lastErr = '';

  for (const tag of order) {
    const { authBase, apiBase } = QF[tag];
    const upstream = `${apiBase}${apiPathWithQuery}`;
    try {
      const token = await fetchOAuthToken(clientId, clientSecret, authBase, env, tag);
      const resp = await fetch(upstream, {
        headers: {
          'x-auth-token': token,
          'x-client-id': clientId,
          Accept: 'application/json'
        }
      });

      if (resp.status === 401) {
        lastErr = `${tag} API 401`;
        continue;
      }

      const text = await resp.text();
      const headers = {
        ...cors,
        'Content-Type': resp.headers.get('Content-Type') || 'application/json',
        'Cache-Control': 'public, max-age=86400',
        'x-qf-env': tag
      };

      return new Response(text, { status: resp.status, headers });
    } catch (e) {
      lastErr = String(e.message || e);
    }
  }

  return json(
    {
      error: lastErr || 'OAuth failed for all environments',
      hint: 'Confirm client is approved for Content API and client_credentials; check Quran.Foundation dashboard environment.'
    },
    502,
    cors
  );
}
