/**
 * KIUMA Quran Recitation Worker
 *
 * Real-time speech-to-text for Quran recitation using OpenAI Whisper.
 * Accepts WebSocket connections, receives audio segments from the browser,
 * transcribes them via Whisper, and returns word-level results.
 *
 * Bindings (wrangler.toml):
 *   RECITATION_SESSION  – Durable Object class
 *   RECITATION_BUCKET   – R2 bucket for session recordings (optional)
 *
 * Secrets (wrangler secret put ...):
 *   OPENAI_API_KEY      – OpenAI API key for Whisper
 *   ADMIN_TOKEN         – Admin access token
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Token, Upgrade, Connection',
  'Access-Control-Max-Age': '86400',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// ── Main Worker ─────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/' || url.pathname === '/health') {
      return json({ status: 'ok', service: 'kiuma-recitation', version: '1.0.0' });
    }

    // WebSocket upgrade → Durable Object
    if (url.pathname === '/ws') {
      const upgrade = request.headers.get('Upgrade');
      if (upgrade !== 'websocket') {
        return json({ error: 'Expected WebSocket upgrade' }, 426);
      }
      const sessionId = url.searchParams.get('session') || crypto.randomUUID();
      const id = env.RECITATION_SESSION.idFromName(sessionId);
      const stub = env.RECITATION_SESSION.get(id);
      return stub.fetch(request);
    }

    // REST: Save user progress
    if (url.pathname === '/api/progress' && request.method === 'POST') {
      return handleSaveProgress(request, env);
    }

    // REST: Load user progress
    if (url.pathname === '/api/progress' && request.method === 'GET') {
      return handleLoadProgress(request, env);
    }

    // REST: One-shot transcription (no WebSocket)
    if (url.pathname === '/api/transcribe' && request.method === 'POST') {
      return handleTranscribe(request, env);
    }

    return json({ error: 'Not found' }, 404);
  },
};

// ── One-shot transcription endpoint ─────────────────────────────

async function handleTranscribe(request, env) {
  if (!env.OPENAI_API_KEY) {
    return json({ error: 'Speech service not configured' }, 503);
  }

  const contentType = request.headers.get('Content-Type') || '';

  let audioBuffer;
  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const file = formData.get('audio');
    if (!file) return json({ error: 'Missing audio field' }, 400);
    audioBuffer = await file.arrayBuffer();
  } else {
    audioBuffer = await request.arrayBuffer();
  }

  if (!audioBuffer || audioBuffer.byteLength < 100) {
    return json({ error: 'Audio too short' }, 400);
  }

  try {
    const result = await transcribeWithWhisper(audioBuffer, env);
    return json({ text: result.text || '', words: result.words || [], language: result.language });
  } catch (err) {
    return json({ error: 'Transcription failed', detail: err.message }, 500);
  }
}

// ── Progress persistence (R2-backed) ────────────────────────────

async function handleSaveProgress(request, env) {
  try {
    const body = await request.json();
    const userId = body.userId;
    if (!userId) return json({ error: 'Missing userId' }, 400);

    const key = `progress/${userId}.json`;
    const data = {
      lastSurah: body.lastSurah || 0,
      lastAyah: body.lastAyah || 0,
      lastPage: body.lastPage || 1,
      stats: body.stats || null,
      streak: body.streak || null,
      updatedAt: new Date().toISOString(),
    };

    if (env.RECITATION_BUCKET) {
      await env.RECITATION_BUCKET.put(key, JSON.stringify(data), {
        httpMetadata: { contentType: 'application/json' },
      });
    }

    return json({ ok: true });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

async function handleLoadProgress(request, env) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  if (!userId) return json({ error: 'Missing userId' }, 400);

  if (!env.RECITATION_BUCKET) {
    return json({ error: 'Storage not configured' }, 503);
  }

  const key = `progress/${userId}.json`;
  const obj = await env.RECITATION_BUCKET.get(key);
  if (!obj) return json({ progress: null });

  const data = await obj.json();
  return json({ progress: data });
}

// ── Whisper API ─────────────────────────────────────────────────

async function transcribeWithWhisper(audioBuffer, env) {
  const blob = new Blob([audioBuffer], { type: 'audio/webm;codecs=opus' });

  const form = new FormData();
  form.append('file', blob, 'recitation.webm');
  form.append('model', env.WHISPER_MODEL || 'whisper-1');
  form.append('language', 'ar');
  form.append('response_format', 'verbose_json');
  form.append('timestamp_granularities[]', 'word');
  form.append('prompt', 'بسم الله الرحمن الرحيم');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.OPENAI_API_KEY}` },
    body: form,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Whisper ${res.status}: ${errText.slice(0, 200)}`);
  }

  return res.json();
}

// ── Durable Object: RecitationSession ───────────────────────────

export class RecitationSession {
  constructor(state, env) {
    this.state = state;
    this.env = env;

    // Per-connection state (keyed by WebSocket reference)
    this.connections = new Map();
    this.fullTranscript = '';
    this.segmentCount = 0;
    this.sessionStart = null;
    this.lastActivity = null;
  }

  async fetch(request) {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    server.accept();

    const connId = crypto.randomUUID();

    this.connections.set(connId, {
      ws: server,
      userId: null,
      surahNumber: 0,
      ayahIndex: 0,
      expectedText: '',
      fullTranscript: '',
      segmentCount: 0,
      sessionStart: Date.now(),
      processing: false,
    });

    server.addEventListener('message', (event) => {
      this.onMessage(connId, event).catch((err) => {
        console.error('WS message error:', err);
        this.sendTo(connId, { type: 'error', message: err.message });
      });
    });

    server.addEventListener('close', () => this.onClose(connId));
    server.addEventListener('error', () => this.onClose(connId));

    this.sendTo(connId, {
      type: 'ready',
      sessionId: this.state.id.toString(),
      capabilities: {
        whisper: !!this.env.OPENAI_API_KEY,
        storage: !!this.env.RECITATION_BUCKET,
      },
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  async onMessage(connId, event) {
    const conn = this.connections.get(connId);
    if (!conn) return;

    this.lastActivity = Date.now();

    if (typeof event.data === 'string') {
      const msg = JSON.parse(event.data);

      switch (msg.type) {
        case 'init':
          conn.userId = msg.userId || null;
          conn.surahNumber = msg.surahNumber || 0;
          conn.ayahIndex = msg.ayahIndex || 0;
          conn.expectedText = msg.expectedText || '';
          conn.fullTranscript = '';
          conn.segmentCount = 0;
          this.sendTo(connId, { type: 'initialized', surah: conn.surahNumber, ayah: conn.ayahIndex });
          break;

        case 'update_ayah':
          conn.ayahIndex = msg.ayahIndex || 0;
          conn.expectedText = msg.expectedText || '';
          this.sendTo(connId, { type: 'ayah_updated', ayah: conn.ayahIndex });
          break;

        case 'reset_transcript':
          conn.fullTranscript = '';
          conn.segmentCount = 0;
          this.sendTo(connId, { type: 'transcript_reset' });
          break;

        case 'ping':
          this.sendTo(connId, { type: 'pong', time: Date.now() });
          break;

        case 'stop':
          await this.saveSessionIfNeeded(conn);
          this.sendTo(connId, { type: 'stopped', totalSegments: conn.segmentCount });
          break;

        default:
          this.sendTo(connId, { type: 'error', message: `Unknown message type: ${msg.type}` });
      }
    } else {
      // Binary data = audio segment
      await this.processAudioSegment(connId, event.data);
    }
  }

  async processAudioSegment(connId, audioData) {
    const conn = this.connections.get(connId);
    if (!conn) return;

    if (conn.processing) {
      // Already processing a segment, queue indication
      this.sendTo(connId, { type: 'busy' });
      return;
    }

    if (!this.env.OPENAI_API_KEY) {
      this.sendTo(connId, { type: 'error', message: 'Whisper API key not configured' });
      return;
    }

    const audioBuffer = audioData instanceof ArrayBuffer ? audioData : audioData.buffer || audioData;
    if (audioBuffer.byteLength < 500) {
      return; // Too short, likely silence
    }

    conn.processing = true;
    conn.segmentCount++;

    try {
      const result = await transcribeWithWhisper(audioBuffer, this.env);

      const segmentText = (result.text || '').trim();
      if (segmentText) {
        conn.fullTranscript = (conn.fullTranscript + ' ' + segmentText).trim();
      }

      this.sendTo(connId, {
        type: 'transcription',
        segmentText: segmentText,
        fullTranscript: conn.fullTranscript,
        words: result.words || [],
        segmentNumber: conn.segmentCount,
      });
    } catch (err) {
      this.sendTo(connId, {
        type: 'transcription_error',
        message: err.message,
        segmentNumber: conn.segmentCount,
      });
    } finally {
      conn.processing = false;
    }
  }

  async saveSessionIfNeeded(conn) {
    if (!conn.fullTranscript || !this.env.RECITATION_BUCKET) return;

    const sessionData = {
      userId: conn.userId,
      surahNumber: conn.surahNumber,
      ayahIndex: conn.ayahIndex,
      transcript: conn.fullTranscript,
      segments: conn.segmentCount,
      duration: Date.now() - conn.sessionStart,
      completedAt: new Date().toISOString(),
    };

    const key = `sessions/${conn.userId || 'anon'}/${Date.now()}.json`;
    try {
      await this.env.RECITATION_BUCKET.put(key, JSON.stringify(sessionData), {
        httpMetadata: { contentType: 'application/json' },
      });
    } catch (e) {
      console.error('Session save error:', e);
    }
  }

  onClose(connId) {
    const conn = this.connections.get(connId);
    if (conn) {
      this.saveSessionIfNeeded(conn).catch(() => {});
      this.connections.delete(connId);
    }
  }

  sendTo(connId, data) {
    const conn = this.connections.get(connId);
    if (!conn?.ws) return;
    try {
      conn.ws.send(JSON.stringify(data));
    } catch (e) {
      this.connections.delete(connId);
    }
  }
}
