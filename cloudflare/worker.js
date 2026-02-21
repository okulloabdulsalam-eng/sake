/**
 * KIUMA Cloudflare Worker - R2 Storage API
 * Handles file uploads, downloads, listing, and deletion for media & library files.
 * Supports HTTP Range requests for video/audio streaming.
 *
 * R2 Binding: BUCKET (configured in wrangler.toml)
 * Environment Variable: ADMIN_TOKEN (set via wrangler secret)
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Range, X-Admin-Token, X-File-Name, Content-Length',
  'Access-Control-Expose-Headers': 'Content-Type, Content-Length, Content-Range, Accept-Ranges, Content-Disposition',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function isAdmin(request, env) {
  const token = request.headers.get('X-Admin-Token');
  return token && token === env.ADMIN_TOKEN;
}

const MIME_TYPES = {
  mp4: 'video/mp4', webm: 'video/webm', ogg: 'video/ogg', mov: 'video/quicktime', avi: 'video/x-msvideo',
  mp3: 'audio/mpeg', wav: 'audio/wav', flac: 'audio/flac', aac: 'audio/aac', m4a: 'audio/mp4',
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', bmp: 'image/bmp',
  pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  epub: 'application/epub+zip', txt: 'text/plain',
};

function getMimeType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // ── List files ──
      if (request.method === 'GET' && path === '/list') {
        const prefix = url.searchParams.get('prefix') || '';
        const listed = await env.BUCKET.list({ prefix, limit: 1000 });
        const files = listed.objects
          .filter(obj => !obj.key.endsWith('/'))   // skip folder markers
          .map(obj => ({
            key: obj.key,
            size: obj.size,
            uploaded: obj.uploaded,
            name: obj.key.split('/').pop(),
            folder: obj.key.substring(0, obj.key.lastIndexOf('/')),
          }));
        return json({ success: true, files, truncated: listed.truncated });
      }

      // ── Serve file (supports Range for streaming) ──
      if ((request.method === 'GET' || request.method === 'HEAD') && path.startsWith('/file/')) {
        const key = decodeURIComponent(path.substring(6));
        const rangeHeader = request.headers.get('Range');
        const contentType = getMimeType(key);

        // HEAD request — just return metadata
        if (request.method === 'HEAD') {
          const head = await env.BUCKET.head(key);
          if (!head) return json({ error: 'File not found' }, 404);
          const h = new Headers(CORS_HEADERS);
          h.set('Content-Type', head.httpMetadata?.contentType || contentType);
          h.set('Content-Length', head.size);
          h.set('Accept-Ranges', 'bytes');
          return new Response(null, { status: 200, headers: h });
        }

        // Range request — partial content for video/audio seeking
        if (rangeHeader) {
          const head = await env.BUCKET.head(key);
          if (!head) return json({ error: 'File not found' }, 404);
          const totalSize = head.size;

          const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
          if (!match) return json({ error: 'Invalid Range' }, 416);

          const start = parseInt(match[1]);
          const end = match[2] ? parseInt(match[2]) : totalSize - 1;

          if (start >= totalSize || end >= totalSize) {
            const h = new Headers(CORS_HEADERS);
            h.set('Content-Range', 'bytes */' + totalSize);
            return new Response(null, { status: 416, headers: h });
          }

          const object = await env.BUCKET.get(key, { range: { offset: start, length: end - start + 1 } });
          const h = new Headers(CORS_HEADERS);
          h.set('Content-Type', head.httpMetadata?.contentType || contentType);
          h.set('Content-Length', end - start + 1);
          h.set('Content-Range', 'bytes ' + start + '-' + end + '/' + totalSize);
          h.set('Accept-Ranges', 'bytes');
          h.set('Cache-Control', 'public, max-age=86400');
          return new Response(object.body, { status: 206, headers: h });
        }

        // Full file request
        const object = await env.BUCKET.get(key);
        if (!object) return json({ error: 'File not found' }, 404);
        const h = new Headers(CORS_HEADERS);
        h.set('Content-Type', object.httpMetadata?.contentType || contentType);
        h.set('Content-Length', object.size);
        h.set('Accept-Ranges', 'bytes');
        h.set('Cache-Control', 'public, max-age=86400');
        h.set('Content-Disposition', 'inline; filename="' + key.split('/').pop() + '"');
        return new Response(object.body, { status: 200, headers: h });
      }

      // ── Upload file (admin only) ──
      if (request.method === 'PUT' && path === '/upload') {
        if (!isAdmin(request, env)) return json({ error: 'Unauthorized' }, 401);
        const fileName = request.headers.get('X-File-Name');
        if (!fileName) return json({ error: 'X-File-Name header required' }, 400);
        const ct = request.headers.get('Content-Type') || getMimeType(fileName);
        await env.BUCKET.put(fileName, request.body, { httpMetadata: { contentType: ct } });
        return json({
          success: true, key: fileName,
          url: url.origin + '/file/' + encodeURIComponent(fileName),
          size: parseInt(request.headers.get('Content-Length') || '0'),
        });
      }

      // ── Delete file (admin only) ──
      if (request.method === 'DELETE' && path.startsWith('/file/')) {
        if (!isAdmin(request, env)) return json({ error: 'Unauthorized' }, 401);
        const key = decodeURIComponent(path.substring(6));
        await env.BUCKET.delete(key);
        return json({ success: true, deleted: key });
      }

      // ── Storage usage ──
      if (request.method === 'GET' && path === '/storage') {
        let totalSize = 0;
        let fileCount = 0;
        let cursor = undefined;
        do {
          const listed = await env.BUCKET.list({ limit: 1000, cursor });
          for (const obj of listed.objects) {
            totalSize += obj.size;
            fileCount++;
          }
          cursor = listed.truncated ? listed.cursor : undefined;
        } while (cursor);
        return json({
          success: true,
          totalBytes: totalSize,
          totalMB: Math.round(totalSize / 1048576 * 100) / 100,
          totalGB: Math.round(totalSize / 1073741824 * 1000) / 1000,
          fileCount,
          maxBytes: 10737418240,
          maxGB: 10,
          usagePercent: Math.round(totalSize / 10737418240 * 10000) / 100
        });
      }

      // ── Health ──
      if (request.method === 'GET' && (path === '/' || path === '/health')) {
        return json({ status: 'ok', service: 'KIUMA R2 Storage' });
      }

      return json({ error: 'Not found' }, 404);
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  },
};
