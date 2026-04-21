// KIUMA Subtitle Worker
// Cloudflare Worker orchestrating AI-powered Luganda -> English subtitles
// Features:
//   - POST /api/subtitles/generate : enqueue subtitle generation for a media item
//   - GET  /api/subtitles/:mediaId : fetch current subtitle status/URLs
//   - Queue consumer: pulls jobs, runs transcription + translation, uploads SRT/VTT files to R2
//
// Required bindings (set via wrangler.toml):
//   - SUBTITLE_JOBS (KV) : stores job metadata/status
//   - SUBTITLE_QUEUE (Queue) : job queue for heavy processing
//   - MEDIA_BUCKET (R2) : stores generated subtitle artifacts in kiuma-files bucket
//
// Required secrets:
//   - ADMIN_TOKEN : simple auth for admin-triggered endpoints
//   - OPENAI_API_KEY : used for Whisper + GPT translation (fallback when Workers AI unavailable)
// Optional vars:
//   - PUBLIC_STORAGE_BASE : base URL pointing to existing storage worker (e.g. https://kiuma-storage.workers.dev/file)
//   - WHISPER_MODEL : overrides default whisper-1
//   - TRANSLATE_MODEL : overrides default gpt-4o-mini
//   - MAX_VIDEO_BYTES : guardrail for download size (defaults to 250MB)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
};

const DEFAULT_WHISPER_MODEL = 'whisper-1';
const DEFAULT_TRANSLATE_MODEL = 'gpt-4o-mini';
const DEFAULT_MAX_VIDEO_BYTES = 250 * 1024 * 1024; // 250 MB

function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json', ...headers }
  });
}

function unauthorized() {
  return jsonResponse({ success: false, message: 'Unauthorized' }, 401);
}

function notFound(message = 'Not found') {
  return jsonResponse({ success: false, message }, 404);
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/health') {
      return jsonResponse({ status: 'ok', service: 'kiuma-subtitles' });
    }

    try {
      if (request.method === 'POST' && path === '/api/subtitles/generate') {
        return await handleGenerate(request, env);
      }

      if (request.method === 'GET' && path.startsWith('/api/subtitles/')) {
        const mediaId = decodeURIComponent(path.split('/').pop());
        return await handleStatus(mediaId, env);
      }

      return notFound();
    } catch (err) {
      console.error('[SubtitleWorker] fetch error', err);
      return jsonResponse({ success: false, message: err.message || 'Internal error' }, 500);
    }
  },

  async queue(batch, env, ctx) {
    for (const message of batch.messages) {
      try {
        await processSubtitleJob(message.body, env);
        message.ack();
      } catch (err) {
        console.error('[SubtitleWorker] queue error', err);
        // Keep message in queue for retry (visible again after retry delay)
      }
    }
  }
};

async function handleGenerate(request, env) {
  if (!isAuthorized(request, env)) return unauthorized();

  const payload = await safeJson(request);
  if (!payload) {
    return jsonResponse({ success: false, message: 'Invalid JSON payload' }, 400);
  }

  const { media_id, video_url, title = '', language_hint = 'lg', force = false } = payload;
  if (!media_id || !video_url) {
    return jsonResponse({ success: false, message: 'media_id and video_url are required' }, 400);
  }

  const existing = await getJob(env, media_id);
  if (existing && !force && existing.status === 'ready') {
    return jsonResponse({ success: true, job: existing, message: 'Subtitles already ready' });
  }

  const job = {
    mediaId: media_id,
    videoUrl: video_url,
    title,
    languageHint: language_hint || 'lg',
    status: force ? 'queued' : (existing?.status || 'queued'),
    submittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    attempts: existing?.attempts ? existing.attempts + 1 : 1
  };

  await putJob(env, media_id, job);

  if (!env.SUBTITLE_QUEUE) {
    console.warn('[SubtitleWorker] SUBTITLE_QUEUE binding missing; job stays queued');
  } else {
    await env.SUBTITLE_QUEUE.send(job);
  }

  return jsonResponse({ success: true, job });
}

async function handleStatus(mediaId, env) {
  if (!mediaId) {
    return jsonResponse({ success: false, message: 'mediaId required' }, 400);
  }
  const job = await getJob(env, mediaId);
  if (!job) return notFound('Subtitle job not found');
  return jsonResponse({ success: true, job });
}

function isAuthorized(request, env) {
  const token = request.headers.get('X-Admin-Token');
  return token && env.ADMIN_TOKEN && token === env.ADMIN_TOKEN;
}

async function safeJson(request) {
  try {
    return await request.json();
  } catch (err) {
    return null;
  }
}

async function getJob(env, mediaId) {
  const raw = await env.SUBTITLE_JOBS.get(mediaId);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[SubtitleWorker] Failed parsing job', mediaId, err);
    return null;
  }
}

async function putJob(env, mediaId, job) {
  return env.SUBTITLE_JOBS.put(mediaId, JSON.stringify(job));
}

async function updateJob(env, mediaId, update) {
  const existing = (await getJob(env, mediaId)) || {};
  const merged = { ...existing, ...update, updatedAt: new Date().toISOString() };
  await putJob(env, mediaId, merged);
  return merged;
}

async function processSubtitleJob(job, env) {
  if (!job || !job.mediaId || !job.videoUrl) {
    console.warn('[SubtitleWorker] Invalid job payload', job);
    return;
  }

  await updateJob(env, job.mediaId, { status: 'processing', error: null });

  try {
    const maxBytes = Number(env.MAX_VIDEO_BYTES || DEFAULT_MAX_VIDEO_BYTES);
    const videoArrayBuffer = await fetchVideo(job.videoUrl, maxBytes);

    const whisperModel = env.WHISPER_MODEL || DEFAULT_WHISPER_MODEL;
    const transcript = await transcribeWithWhisper(videoArrayBuffer, job, env, whisperModel);
    if (!transcript?.segments || transcript.segments.length === 0) {
      throw new Error('No speech detected in video');
    }

    let enrichedSegments = transcript.segments.map(seg => ({
      index: seg.id ?? seg.segment_id ?? seg.index ?? 0,
      start: seg.start ?? seg.start_time ?? 0,
      end: seg.end ?? seg.end_time ?? 0,
      luganda: (seg.text || '').trim(),
      english: null
    }));

    try {
      enrichedSegments = await translateSegments(enrichedSegments, env);
    } catch (translationErr) {
      console.warn('[SubtitleWorker] Translation failed, continuing with Luganda only', translationErr);
    }

    const subtitlePayload = buildSubtitleFiles(enrichedSegments);
    const uploadResult = await uploadSubtitleArtifacts(env, job.mediaId, subtitlePayload);

    await updateJob(env, job.mediaId, {
      status: 'ready',
      tracks: uploadResult.tracks,
      warning: subtitlePayload.translationAvailable ? null : 'translation_unavailable'
    });
  } catch (err) {
    console.error('[SubtitleWorker] Job failed', job.mediaId, err);
    await updateJob(env, job.mediaId, {
      status: 'failed',
      error: err.message || 'Subtitle generation failed'
    });
    throw err;
  }
}

async function fetchVideo(videoUrl, maxBytes) {
  const response = await fetch(videoUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch video: ${response.status}`);
  }
  const contentLength = Number(response.headers.get('content-length') || '0');
  if (contentLength && contentLength > maxBytes) {
    throw new Error(`Video too large (${contentLength} bytes)`);
  }
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > maxBytes) {
    throw new Error(`Video exceeds max size (${buffer.byteLength} bytes)`);
  }
  return buffer;
}

async function transcribeWithWhisper(arrayBuffer, job, env, model) {
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const fileName = `${job.mediaId}.mp4`;
  const blob = new Blob([arrayBuffer], { type: 'video/mp4' });
  const file = new File([blob], fileName, { type: 'video/mp4' });

  const formData = new FormData();
  formData.append('file', file);
  formData.append('model', model);
  formData.append('response_format', 'verbose_json');
  formData.append('temperature', '0');
  formData.append('language', job.languageHint || 'lg');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: formData
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Whisper API error: ${response.status} ${errText}`);
  }

  return response.json();
}

async function translateSegments(segments, env) {
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY required for translation');
  }

  const model = env.TRANSLATE_MODEL || DEFAULT_TRANSLATE_MODEL;
  const chunkSize = 20;
  const translated = [];

  for (let i = 0; i < segments.length; i += chunkSize) {
    const chunk = segments.slice(i, i + chunkSize).map(seg => ({ index: seg.index, text: seg.luganda }));
    const prompt = `Translate the following Luganda subtitles into natural English. Preserve context and avoid literal word-for-word translations. ` +
      `Respond with valid JSON array matching the input order, where each element is {"index": number, "english": "translated text"}. Input: ${JSON.stringify(chunk)}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: 'You are a bilingual Luganda-English assistant specializing in Quran classes.' },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Translation API error: ${response.status} ${errText}`);
    }

    const completion = await response.json();
    const content = completion.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('Translation API produced empty response');
    }

    let parsed;
    try {
      parsed = JSON.parse(content.replace(/^```json\n?|```$/g, ''));
    } catch (err) {
      console.warn('[SubtitleWorker] Translation parse fallback', content);
      throw new Error('Failed to parse translation JSON');
    }

    parsed.forEach(item => {
      const segment = segments.find(seg => seg.index === item.index);
      if (segment) {
        segment.english = (item.english || '').trim();
      }
    });
  }

  return segments;
}

function buildSubtitleFiles(segments) {
  const hasEnglish = segments.some(seg => seg.english);
  const lugandaSrt = segments.map((seg, idx) => formatSrtBlock(idx + 1, seg.start, seg.end, seg.luganda)).join('\n\n');
  const lugandaVtt = convertSrtToVtt(lugandaSrt);

  let englishSrt = null;
  let englishVtt = null;
  if (hasEnglish) {
    englishSrt = segments.map((seg, idx) => formatSrtBlock(idx + 1, seg.start, seg.end, seg.english || seg.luganda)).join('\n\n');
    englishVtt = convertSrtToVtt(englishSrt);
  }

  return {
    lugandaSrt,
    lugandaVtt,
    englishSrt,
    englishVtt,
    translationAvailable: hasEnglish
  };
}

function formatSrtBlock(sequence, startSeconds, endSeconds, text) {
  return `${sequence}\n${formatTimestamp(startSeconds)} --> ${formatTimestamp(endSeconds)}\n${text || ''}`.trim();
}

function formatTimestamp(secondsFloat) {
  const clamped = Math.max(0, Number(secondsFloat || 0));
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = Math.floor(clamped % 60);
  const millis = Math.floor((clamped - Math.floor(clamped)) * 1000);
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${padMillis(millis)}`;
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function padMillis(value) {
  return String(value).padStart(3, '0');
}

function convertSrtToVtt(srtText) {
  return 'WEBVTT\n\n' + srtText.replace(/,/g, '.');
}

async function uploadSubtitleArtifacts(env, mediaId, payload) {
  if (!env.MEDIA_BUCKET) {
    throw new Error('MEDIA_BUCKET binding missing');
  }

  const baseKey = `subtitles/${mediaId}/`;
  const uploads = [];

  const uploadFile = async (key, body) => {
    if (!body) return null;
    await env.MEDIA_BUCKET.put(key, body, {
      httpMetadata: { contentType: 'text/vtt' }
    });
    return key;
  };

  const lugandaVttKey = `${baseKey}video_${mediaId}_lg.vtt`;
  const lugandaSrtKey = `${baseKey}video_${mediaId}_lg.srt`;
  const englishVttKey = payload.englishVtt ? `${baseKey}video_${mediaId}_en.vtt` : null;
  const englishSrtKey = payload.englishSrt ? `${baseKey}video_${mediaId}_en.srt` : null;

  uploads.push(env.MEDIA_BUCKET.put(lugandaVttKey, payload.lugandaVtt, { httpMetadata: { contentType: 'text/vtt' } }));
  uploads.push(env.MEDIA_BUCKET.put(lugandaSrtKey, payload.lugandaSrt, { httpMetadata: { contentType: 'text/plain' } }));
  if (payload.englishVtt) uploads.push(env.MEDIA_BUCKET.put(englishVttKey, payload.englishVtt, { httpMetadata: { contentType: 'text/vtt' } }));
  if (payload.englishSrt) uploads.push(env.MEDIA_BUCKET.put(englishSrtKey, payload.englishSrt, { httpMetadata: { contentType: 'text/plain' } }));

  await Promise.all(uploads);

  const baseUrl = (env.PUBLIC_STORAGE_BASE || '').replace(/\/$/, '');

  const tracks = {
    luganda: {
      vtt: baseUrl ? `${baseUrl}/${encodeURIComponent(lugandaVttKey)}` : null,
      srt: baseUrl ? `${baseUrl}/${encodeURIComponent(lugandaSrtKey)}` : null,
      keyVtt: lugandaVttKey,
      keySrt: lugandaSrtKey
    }
  };

  if (payload.translationAvailable) {
    tracks.english = {
      vtt: baseUrl ? `${baseUrl}/${encodeURIComponent(englishVttKey)}` : null,
      srt: baseUrl ? `${baseUrl}/${encodeURIComponent(englishSrtKey)}` : null,
      keyVtt: englishVttKey,
      keySrt: englishSrtKey
    };
  }

  return { tracks };
}
