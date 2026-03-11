/**
 * KIUMA Live Stream Relay Worker
 * Uses Cloudflare Calls API to relay live video from admin to viewers.
 * 
 * Required env vars (set via wrangler secret):
 *   CALLS_APP_ID    - Your Cloudflare Calls App ID
 *   CALLS_APP_TOKEN - Your Cloudflare Calls App Token
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

async function callsAPI(env, path, method = 'POST', body = null) {
  const url = `https://rtc.live.cloudflare.com/v1/apps/${env.CALLS_APP_ID}${path}`;
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${env.CALLS_APP_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  return res.json();
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Health check
      if (path === '/' || path === '/health') {
        return json({ status: 'ok', service: 'kiuma-stream-relay' });
      }

      // Create a new Cloudflare Calls session
      if (path === '/session/new' && request.method === 'POST') {
        const data = await callsAPI(env, '/sessions/new');
        return json(data);
      }

      // Push or pull tracks in a session
      const tracksMatch = path.match(/^\/session\/([^/]+)\/tracks\/new$/);
      if (tracksMatch && request.method === 'POST') {
        const sessionId = tracksMatch[1];
        const body = await request.json();
        const data = await callsAPI(env, `/sessions/${sessionId}/tracks/new`, 'POST', body);
        return json(data);
      }

      // Renegotiate session (for ICE restart, etc.)
      const renego = path.match(/^\/session\/([^/]+)\/renegotiate$/);
      if (renego && request.method === 'PUT') {
        const sessionId = renego[1];
        const body = await request.json();
        const data = await callsAPI(env, `/sessions/${sessionId}/renegotiate`, 'PUT', body);
        return json(data);
      }

      // Close tracks
      const closeMatch = path.match(/^\/session\/([^/]+)\/tracks\/close$/);
      if (closeMatch && request.method === 'PUT') {
        const sessionId = closeMatch[1];
        const body = await request.json();
        const data = await callsAPI(env, `/sessions/${sessionId}/tracks/close`, 'PUT', body);
        return json(data);
      }

      return json({ error: 'Not found' }, 404);
    } catch (error) {
      return json({ error: error.message }, 500);
    }
  },
};
