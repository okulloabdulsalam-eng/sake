/**
 * KIUMA Live Stream Relay Worker
 * YouTube Live Streaming API proxy + OAuth 2.0 handler.
 * 
 * Required secrets (set via wrangler secret):
 *   GOOGLE_CLIENT_ID     - Google OAuth 2.0 Client ID
 *   GOOGLE_CLIENT_SECRET - Google OAuth 2.0 Client Secret
 * 
 * KV Namespace:
 *   YOUTUBE_TOKENS - Stores OAuth refresh/access tokens
 * 
 * Endpoints:
 *   GET  /health                  - Health check + config status
 *   GET  /oauth/login             - Redirect to Google consent screen
 *   GET  /oauth/callback          - Handle OAuth callback, store tokens
 *   GET  /oauth/status            - Check if YouTube is connected
 *   POST /oauth/disconnect        - Remove stored tokens
 *   POST /api/create-broadcast    - Create broadcast + stream + bind
 *   POST /api/go-live             - Transition broadcast to live
 *   POST /api/end-stream          - End broadcast
 *   GET  /api/stream-status/:id   - Get broadcast status
 *   GET  /api/active-broadcasts   - List active/upcoming broadcasts
 */

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const YT_API = 'https://www.googleapis.com/youtube/v3';
const SCOPES = 'https://www.googleapis.com/auth/youtube.force-ssl';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function errorResponse(message, status = 500) {
  return jsonResponse({ success: false, error: message }, status);
}

function redirectResponse(url) {
  return new Response(null, { status: 302, headers: { ...CORS_HEADERS, 'Location': url } });
}

// ---- Token Management ----

async function getStoredTokens(env) {
  const raw = await env.YOUTUBE_TOKENS.get('oauth_tokens');
  return raw ? JSON.parse(raw) : null;
}

async function storeTokens(env, tokens) {
  const existing = await getStoredTokens(env) || {};
  const merged = {
    access_token: tokens.access_token || existing.access_token,
    refresh_token: tokens.refresh_token || existing.refresh_token,
    expires_at: tokens.expires_at || existing.expires_at,
    channel_title: tokens.channel_title || existing.channel_title,
  };
  await env.YOUTUBE_TOKENS.put('oauth_tokens', JSON.stringify(merged));
  return merged;
}

async function getValidAccessToken(env) {
  const tokens = await getStoredTokens(env);
  if (!tokens || !tokens.refresh_token) {
    throw new Error('YouTube not connected. Please connect via Admin > Settings.');
  }

  // If access token is still valid (with 60s buffer), return it
  if (tokens.access_token && tokens.expires_at && Date.now() < tokens.expires_at - 60000) {
    return tokens.access_token;
  }

  // Refresh the access token
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: tokens.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    console.error('Token refresh failed:', JSON.stringify(data));
    throw new Error('Failed to refresh YouTube access token. Please reconnect.');
  }

  await storeTokens(env, {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in * 1000),
  });

  return data.access_token;
}

// ---- YouTube API Helpers ----

async function ytAPI(env, path, method = 'GET', body = null) {
  const token = await getValidAccessToken(env);
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const url = path.startsWith('http') ? path : `${YT_API}${path}`;
  const res = await fetch(url, opts);
  const data = await res.json();

  if (!res.ok) {
    const errMsg = data.error?.message || data.error?.errors?.[0]?.message || `YouTube API error ${res.status}`;
    console.error('YouTube API error:', res.status, JSON.stringify(data));
    throw new Error(errMsg);
  }
  return data;
}

// ---- Route Handlers ----

async function handleOAuthLogin(env, request) {
  const url = new URL(request.url);
  const redirectUri = `${url.origin}/oauth/callback`;
  const returnUrl = url.searchParams.get('return') || '';

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state: returnUrl,
  });

  return redirectResponse(`${GOOGLE_AUTH_URL}?${params}`);
}

async function handleOAuthCallback(env, request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const returnUrl = url.searchParams.get('state') || '';

  if (error) {
    return new Response(callbackHTML('error', `Authorization denied: ${error}`, returnUrl), {
      headers: { 'Content-Type': 'text/html', ...CORS_HEADERS },
    });
  }

  if (!code) {
    return new Response(callbackHTML('error', 'No authorization code received', returnUrl), {
      headers: { 'Content-Type': 'text/html', ...CORS_HEADERS },
    });
  }

  // Exchange code for tokens
  const redirectUri = `${url.origin}/oauth/callback`;
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    console.error('Token exchange failed:', JSON.stringify(tokenData));
    return new Response(callbackHTML('error', 'Token exchange failed. Please try again.', returnUrl), {
      headers: { 'Content-Type': 'text/html', ...CORS_HEADERS },
    });
  }

  // Get channel info
  let channelTitle = 'Unknown';
  try {
    const channelRes = await fetch(`${YT_API}/channels?part=snippet&mine=true`, {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
    });
    const channelData = await channelRes.json();
    if (channelData.items && channelData.items.length > 0) {
      channelTitle = channelData.items[0].snippet.title;
    }
  } catch (e) {
    console.error('Failed to get channel info:', e);
  }

  // Store tokens
  await storeTokens(env, {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_at: Date.now() + (tokenData.expires_in * 1000),
    channel_title: channelTitle,
  });

  return new Response(callbackHTML('success', `Connected to YouTube channel: ${channelTitle}`, returnUrl), {
    headers: { 'Content-Type': 'text/html', ...CORS_HEADERS },
  });
}

async function handleOAuthStatus(env) {
  const tokens = await getStoredTokens(env);
  if (!tokens || !tokens.refresh_token) {
    return jsonResponse({ connected: false });
  }

  // Try to verify the token still works
  try {
    const accessToken = await getValidAccessToken(env);
    const channelRes = await fetch(`${YT_API}/channels?part=snippet&mine=true`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const channelData = await channelRes.json();
    const channel = channelData.items?.[0];

    return jsonResponse({
      connected: true,
      channel: channel ? {
        title: channel.snippet.title,
        id: channel.id,
        thumbnail: channel.snippet.thumbnails?.default?.url,
      } : { title: tokens.channel_title },
    });
  } catch (e) {
    return jsonResponse({ connected: false, error: e.message });
  }
}

async function handleDisconnect(env) {
  await env.YOUTUBE_TOKENS.delete('oauth_tokens');
  return jsonResponse({ success: true, message: 'YouTube disconnected' });
}

async function handleCreateBroadcast(env, request) {
  try {
  const body = await request.json();
  const title = body.title || 'KIUMA Live Stream';
  const description = body.description || 'Live stream from KIUMA';
  const privacy = body.privacy || 'unlisted';

  // 1. Create the live broadcast
  const broadcast = await ytAPI(env, '/liveBroadcasts?part=snippet,contentDetails,status', 'POST', {
    snippet: {
      title,
      description,
      scheduledStartTime: new Date().toISOString(),
    },
    contentDetails: {
      enableAutoStart: true,
      enableAutoStop: true,
      latencyPreference: 'ultraLow',
      enableLowLatency: true,
    },
    status: {
      privacyStatus: privacy,
      selfDeclaredMadeForKids: false,
    },
  });

  // 2. Create the live stream (ingestion endpoint)
  const stream = await ytAPI(env, '/liveStreams?part=snippet,cdn,status', 'POST', {
    snippet: {
      title: `${title} - Stream`,
    },
    cdn: {
      frameRate: '30fps',
      resolution: '720p',
      ingestionType: 'rtmp',
    },
  });

  // 3. Bind the stream to the broadcast
  await ytAPI(env, `/liveBroadcasts/bind?id=${broadcast.id}&part=id,contentDetails&streamId=${stream.id}`, 'POST');

  // Extract RTMP info
  const ingestion = stream.cdn.ingestionInfo;

  return jsonResponse({
    success: true,
    broadcastId: broadcast.id,
    streamId: stream.id,
    videoId: broadcast.id,
    rtmpUrl: ingestion.ingestionAddress,
    streamKey: ingestion.streamName,
    rtmpFullUrl: `${ingestion.ingestionAddress}/${ingestion.streamName}`,
    youtubeUrl: `https://www.youtube.com/watch?v=${broadcast.id}`,
    embedUrl: `https://www.youtube.com/embed/${broadcast.id}`,
    privacy,
  });
  } catch (e) {
    return errorResponse('Create broadcast failed: ' + e.message, 500);
  }
}

async function handleGoLive(env, request) {
  const body = await request.json();
  const { broadcastId } = body;
  if (!broadcastId) return errorResponse('broadcastId required', 400);

  // Check stream health first
  const broadcast = await ytAPI(env, `/liveBroadcasts?part=status,contentDetails&id=${broadcastId}`);
  if (!broadcast.items || broadcast.items.length === 0) {
    return errorResponse('Broadcast not found', 404);
  }

  const status = broadcast.items[0].status.lifeCycleStatus;

  // If enableAutoStart is true, YouTube transitions automatically when stream is received
  // But we can also manually transition if needed
  if (status === 'ready' || status === 'testStarting' || status === 'testing') {
    try {
      await ytAPI(env, `/liveBroadcasts/transition?broadcastStatus=live&id=${broadcastId}&part=id,status`, 'POST');
    } catch (e) {
      // Auto-start might handle this - return current status
      return jsonResponse({ success: true, status, message: 'Auto-start enabled, stream will go live when YouTube receives video' });
    }
  }

  return jsonResponse({ success: true, status, broadcastId });
}

async function handleEndStream(env, request) {
  const body = await request.json();
  const { broadcastId } = body;
  if (!broadcastId) return errorResponse('broadcastId required', 400);

  try {
    await ytAPI(env, `/liveBroadcasts/transition?broadcastStatus=complete&id=${broadcastId}&part=id,status`, 'POST');
    return jsonResponse({ success: true, message: 'Broadcast ended', broadcastId });
  } catch (e) {
    // Might already be ended
    return jsonResponse({ success: true, message: e.message, broadcastId });
  }
}

async function handleStreamStatus(env, broadcastId) {
  const broadcast = await ytAPI(env, `/liveBroadcasts?part=snippet,status,contentDetails,statistics&id=${broadcastId}`);
  if (!broadcast.items || broadcast.items.length === 0) {
    return errorResponse('Broadcast not found', 404);
  }

  const item = broadcast.items[0];

  // Also get the bound stream status
  let streamStatus = null;
  if (item.contentDetails?.boundStreamId) {
    try {
      const streamData = await ytAPI(env, `/liveStreams?part=status&id=${item.contentDetails.boundStreamId}`);
      if (streamData.items && streamData.items.length > 0) {
        streamStatus = streamData.items[0].status;
      }
    } catch (e) { /* ignore */ }
  }

  return jsonResponse({
    success: true,
    broadcastId: item.id,
    title: item.snippet.title,
    lifeCycleStatus: item.status.lifeCycleStatus,
    recordingStatus: item.status.recordingStatus,
    privacyStatus: item.status.privacyStatus,
    streamStatus: streamStatus?.streamStatus || null,
    healthStatus: streamStatus?.healthStatus || null,
    concurrentViewers: item.statistics?.concurrentViewers || '0',
  });
}

async function handleActiveBroadcasts(env) {
  // Get active and upcoming broadcasts
  const [activeRes, upcomingRes] = await Promise.all([
    ytAPI(env, '/liveBroadcasts?part=snippet,status&broadcastStatus=active&maxResults=5').catch(() => ({ items: [] })),
    ytAPI(env, '/liveBroadcasts?part=snippet,status&broadcastStatus=upcoming&maxResults=5').catch(() => ({ items: [] })),
  ]);

  const broadcasts = [
    ...(activeRes.items || []).map(b => ({ ...b, isActive: true })),
    ...(upcomingRes.items || []).map(b => ({ ...b, isActive: false })),
  ];

  return jsonResponse({
    success: true,
    broadcasts: broadcasts.map(b => ({
      id: b.id,
      title: b.snippet.title,
      status: b.status.lifeCycleStatus,
      isActive: b.isActive,
      videoUrl: `https://www.youtube.com/watch?v=${b.id}`,
    })),
  });
}

// ---- OAuth Callback HTML ----

function callbackHTML(status, message, returnUrl) {
  const isSuccess = status === 'success';
  const safeMsg = message.replace(/'/g, "\\'").replace(/"/g, '&quot;');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>YouTube ${isSuccess ? 'Connected' : 'Error'} - KIUMA</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#111;color:#fff}
.card{text-align:center;padding:40px;max-width:400px}.icon{font-size:64px;margin-bottom:16px}
.msg{font-size:16px;margin-bottom:24px;color:rgba(255,255,255,.8)}
.btn{display:inline-block;padding:12px 24px;background:${isSuccess ? '#4CAF50' : '#e53935'};color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;text-decoration:none}
</style></head><body><div class="card">
<div class="icon">${isSuccess ? '✅' : '❌'}</div>
<p class="msg">${message}</p>
<p id="closeMsg" style="margin-bottom:16px;font-size:13px;color:rgba(255,255,255,.5)">You can close this window.</p>
${returnUrl ? `<a class="btn" href="${returnUrl}" id="returnBtn" style="display:none;">Return to Admin</a>` : ''}
<script>
if(window.opener){
  window.opener.postMessage({type:'youtube-oauth-${status}',message:'${safeMsg}'},'*');
  setTimeout(()=>window.close(),2000);
} else {
  document.getElementById('closeMsg').textContent='Redirecting back...';
  ${returnUrl ? `document.getElementById('returnBtn').style.display='inline-block';setTimeout(()=>{window.location.href='${returnUrl}';},2000);` : ''}
}
</script></div></body></html>`;
}

// ---- R2 Chunk-Based Live Streaming ----
// Broadcaster POSTs MediaRecorder chunks to R2 via Worker.
// Viewers poll for new chunks and play via Media Source Extensions (MSE).

function generateStreamId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 12; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

async function handleStreamStart(env, request) {
  const body = await request.json().catch(() => ({}));
  const streamId = generateStreamId();
  const meta = {
    streamId,
    status: 'live',
    chunkCount: 0,
    mimeType: body.mimeType || 'video/webm;codecs=vp8,opus',
    startedAt: new Date().toISOString(),
    title: body.title || 'Live Stream',
  };
  await env.STREAMS.put(`${streamId}/meta.json`, JSON.stringify(meta));
  return jsonResponse({ success: true, ...meta });
}

async function handleChunkUpload(env, streamId, request) {
  // Get current meta
  const metaObj = await env.STREAMS.get(`${streamId}/meta.json`);
  if (!metaObj) return errorResponse('Stream not found', 404);
  const meta = JSON.parse(await metaObj.text());
  if (meta.status !== 'live') return errorResponse('Stream is not live', 400);

  // Store chunk
  const chunkNum = meta.chunkCount;
  const chunkKey = `${streamId}/chunk_${String(chunkNum).padStart(6, '0')}`;
  const data = await request.arrayBuffer();
  await env.STREAMS.put(chunkKey, data, {
    httpMetadata: { contentType: meta.mimeType },
  });

  // Update meta
  meta.chunkCount = chunkNum + 1;
  meta.lastChunkAt = new Date().toISOString();
  await env.STREAMS.put(`${streamId}/meta.json`, JSON.stringify(meta));

  return jsonResponse({ success: true, chunkNum, totalChunks: meta.chunkCount });
}

async function handleGetPlaylist(env, streamId) {
  const metaObj = await env.STREAMS.get(`${streamId}/meta.json`);
  if (!metaObj) return errorResponse('Stream not found', 404);
  const meta = JSON.parse(await metaObj.text());
  return jsonResponse({
    success: true,
    streamId: meta.streamId,
    status: meta.status,
    chunkCount: meta.chunkCount,
    mimeType: meta.mimeType,
    startedAt: meta.startedAt,
    lastChunkAt: meta.lastChunkAt,
    title: meta.title,
  });
}

async function handleGetChunk(env, streamId, chunkNum) {
  const chunkKey = `${streamId}/chunk_${String(chunkNum).padStart(6, '0')}`;
  const obj = await env.STREAMS.get(chunkKey);
  if (!obj) return errorResponse('Chunk not found', 404);

  return new Response(obj.body, {
    headers: {
      ...CORS_HEADERS,
      'Content-Type': obj.httpMetadata?.contentType || 'video/webm',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

async function handleStreamStop(env, streamId) {
  const metaObj = await env.STREAMS.get(`${streamId}/meta.json`);
  if (!metaObj) return errorResponse('Stream not found', 404);
  const meta = JSON.parse(await metaObj.text());
  meta.status = 'ended';
  meta.endedAt = new Date().toISOString();
  await env.STREAMS.put(`${streamId}/meta.json`, JSON.stringify(meta));

  // Schedule cleanup: delete chunks after 1 hour (done lazily on next /cleanup call)
  return jsonResponse({ success: true, message: 'Stream ended', streamId });
}

async function handleStreamCleanup(env, streamId) {
  // Delete all chunks and meta for a stream
  const list = await env.STREAMS.list({ prefix: `${streamId}/` });
  for (const obj of list.objects) {
    await env.STREAMS.delete(obj.key);
  }
  return jsonResponse({ success: true, message: 'Stream data cleaned up', deleted: list.objects.length });
}

// ---- Main Router ----

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Health check
      if (path === '/' || path === '/health') {
        const configured = !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
        const tokens = await getStoredTokens(env);
        return jsonResponse({
          status: 'ok',
          service: 'kiuma-stream-relay',
          configured,
          youtubeConnected: !!(tokens && tokens.refresh_token),
          r2Available: !!env.STREAMS,
          message: configured
            ? (tokens?.refresh_token ? 'YouTube connected' : 'Credentials set, YouTube not yet connected')
            : 'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET secrets',
        });
      }

      // ---- R2 Live Streaming routes ----
      if (path === '/stream/start' && request.method === 'POST') {
        return handleStreamStart(env, request);
      }

      const chunkUploadMatch = path.match(/^\/stream\/([^/]+)\/chunk$/);
      if (chunkUploadMatch && request.method === 'POST') {
        return handleChunkUpload(env, chunkUploadMatch[1], request);
      }

      const playlistMatch = path.match(/^\/stream\/([^/]+)\/playlist$/);
      if (playlistMatch && request.method === 'GET') {
        return handleGetPlaylist(env, playlistMatch[1]);
      }

      const chunkGetMatch = path.match(/^\/stream\/([^/]+)\/chunk\/(\d+)$/);
      if (chunkGetMatch && request.method === 'GET') {
        return handleGetChunk(env, chunkGetMatch[1], parseInt(chunkGetMatch[2]));
      }

      const stopMatch = path.match(/^\/stream\/([^/]+)\/stop$/);
      if (stopMatch && request.method === 'POST') {
        return handleStreamStop(env, stopMatch[1]);
      }

      const cleanupMatch = path.match(/^\/stream\/([^/]+)\/cleanup$/);
      if (cleanupMatch && request.method === 'POST') {
        return handleStreamCleanup(env, cleanupMatch[1]);
      }

      // ---- OAuth routes ----
      if (path === '/oauth/login' && request.method === 'GET') {
        return handleOAuthLogin(env, request);
      }
      if (path === '/oauth/callback' && request.method === 'GET') {
        return handleOAuthCallback(env, request);
      }
      if (path === '/oauth/status' && request.method === 'GET') {
        return handleOAuthStatus(env);
      }
      if (path === '/oauth/disconnect' && request.method === 'POST') {
        return handleDisconnect(env);
      }

      // ---- YouTube API routes ----
      if (path === '/api/create-broadcast' && request.method === 'POST') {
        return handleCreateBroadcast(env, request);
      }
      if (path === '/api/go-live' && request.method === 'POST') {
        return handleGoLive(env, request);
      }
      if (path === '/api/end-stream' && request.method === 'POST') {
        return handleEndStream(env, request);
      }

      const statusMatch = path.match(/^\/api\/stream-status\/(.+)$/);
      if (statusMatch && request.method === 'GET') {
        return handleStreamStatus(env, statusMatch[1]);
      }

      if (path === '/api/active-broadcasts' && request.method === 'GET') {
        return handleActiveBroadcasts(env);
      }

      return errorResponse('Not found', 404);

    } catch (error) {
      console.error('Worker error:', error);
      return errorResponse(error.message || 'Internal server error', 500);
    }
  },
};
