/**
 * KIUMA Cloudflare Worker - R2 Storage API
 * Handles file uploads, downloads, listing, and deletion for media & library files.
 * Supports HTTP Range requests for video/audio streaming.
 * Optional: presigned URLs for direct R2 upload (set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME).
 *
 * R2 Binding: BUCKET (configured in wrangler.toml)
 * Environment Variable: ADMIN_TOKEN (set via wrangler secret)
 */

const MAX_BUCKET_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB hard cap per bucket

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, PUT, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Range, X-Admin-Token, X-File-Name, Content-Length, X-Upload-Id, X-Part-Number, X-File-Size',
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

async function requireAdmin(request, env) {
  if (!isAdmin(request, env)) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
}

async function getBucketTotalBytes(env) {
  let totalSize = 0;
  let cursor = undefined;
  do {
    const listed = await env.BUCKET.list({ limit: 1000, cursor });
    for (const obj of listed.objects) totalSize += obj.size;
    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);
  return totalSize;
}

function storageFull(totalBytes) {
  return json({
    error: 'Storage full',
    totalBytes,
    maxBytes: MAX_BUCKET_BYTES,
    usagePercent: Math.round(totalBytes / MAX_BUCKET_BYTES * 10000) / 100,
  }, 507);
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

function safeDecodeURI(str) {
  if (!str) return str;
  try { return decodeURIComponent(str); } catch(e) { return str; }
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // ── Presigned URL for direct R2 upload (Option 2: no 100MB proxy limit) ──
      if (request.method === 'GET' && path === '/upload/presign') {
        await requireAdmin(request, env);
        const key = url.searchParams.get('key');
        if (!key) return json({ error: 'Missing key' }, 400);
        const accountId = env.R2_ACCOUNT_ID;
        const accessKeyId = env.R2_ACCESS_KEY_ID;
        const secretAccessKey = env.R2_SECRET_ACCESS_KEY;
        const bucketName = env.R2_BUCKET_NAME || 'kiuma-files';
        if (!accountId || !accessKeyId || !secretAccessKey) {
          return json({
            error: 'Presigned uploads not configured',
            hint: 'Set R2_ACCOUNT_ID (var), R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY (secrets), and optionally R2_BUCKET_NAME (var). Create R2 API token in Cloudflare Dashboard → R2 → Manage R2 API Tokens.',
          }, 501);
        }
        const expiresIn = Math.min(3600, Math.max(60, parseInt(url.searchParams.get('expires') || '900', 10)));
        try {
          const { AwsClient } = await import('aws4fetch');
          const r2Url = `https://${accountId}.r2.cloudflarestorage.com`;
          const client = new AwsClient({
            accessKeyId,
            secretAccessKey,
            service: 's3',
            region: 'auto',
          });
          const signedRequest = await client.sign(
            new Request(`${r2Url}/${bucketName}/${key}?X-Amz-Expires=${expiresIn}`, { method: 'PUT' }),
            { aws: { signQuery: true } }
          );
          return json({ url: signedRequest.url.toString(), expiresIn, key });
        } catch (presignErr) {
          return json({ error: 'Failed to generate presigned URL', detail: String(presignErr.message) }, 500);
        }
      }

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
            name: safeDecodeURI(obj.key.split('/').pop()),
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
        const fname = safeDecodeURI(key.split('/').pop());
        const forceDownload = url.searchParams.has('dl') || url.searchParams.has('download');
        const disposition = forceDownload ? 'attachment' : 'inline';
        h.set('Content-Disposition', disposition + "; filename*=UTF-8''" + encodeURIComponent(fname));
        return new Response(object.body, { status: 200, headers: h });
      }

      // ── Upload file (simple, admin only) ──
      if (request.method === 'PUT' && path === '/upload') {
        if (!isAdmin(request, env)) return json({ error: 'Unauthorized' }, 401);
        const rawName = request.headers.get('X-File-Name');
        if (!rawName) return json({ error: 'X-File-Name header required' }, 400);
        const fileName = safeDecodeURI(rawName);
        const fileSize = parseInt(request.headers.get('Content-Length') || request.headers.get('X-File-Size') || '0');
        if (fileSize > 0) {
          const totalBytes = await getBucketTotalBytes(env);
          if (totalBytes + fileSize > MAX_BUCKET_BYTES) return storageFull(totalBytes);
        }
        const ct = request.headers.get('Content-Type') || getMimeType(fileName);
        await env.BUCKET.put(fileName, request.body, { httpMetadata: { contentType: ct } });
        return json({
          success: true, key: fileName,
          url: url.origin + '/file/' + encodeURIComponent(fileName),
          size: fileSize,
        });
      }

      // ── Multipart upload init ──
      if (request.method === 'POST' && path === '/upload/init') {
        await requireAdmin(request, env);
        const body = await request.json();
        const { key, contentType } = body;
        if (!key) return json({ error: 'Missing key' }, 400);
        const ct = contentType || getMimeType(key);
        const upload = await env.BUCKET.createMultipartUpload(key, {
          httpMetadata: { contentType: ct },
        });
        return json({ success: true, key, uploadId: upload.uploadId });
      }

      // ── Multipart chunk upload ──
      if (request.method === 'PUT' && path === '/upload/chunk') {
        await requireAdmin(request, env);
        const key = safeDecodeURI(request.headers.get('X-File-Name') || url.searchParams.get('key'));
        const uploadId = request.headers.get('X-Upload-Id') || url.searchParams.get('uploadId');
        const partNumberHeader = request.headers.get('X-Part-Number') || url.searchParams.get('partNumber');
        if (!key || !uploadId || !partNumberHeader) {
          return json({ error: 'Missing key, uploadId, or part number' }, 400);
        }
        const partNumber = parseInt(partNumberHeader, 10);
        if (Number.isNaN(partNumber) || partNumber < 1) {
          return json({ error: 'Invalid part number' }, 400);
        }
        const uploadResult = await env.BUCKET.uploadPart(key, uploadId, partNumber, request.body);
        return json({ success: true, partNumber, etag: uploadResult.etag });
      }

      // ── Complete multipart upload ──
      if (request.method === 'POST' && path === '/upload/complete') {
        await requireAdmin(request, env);
        const { key, uploadId, parts } = await request.json();
        if (!key || !uploadId || !Array.isArray(parts) || parts.length === 0) {
          return json({ error: 'Missing key, uploadId or parts' }, 400);
        }
        const normalizedParts = parts.map(p => ({
          partNumber: Number(p.partNumber),
          etag: p.etag,
        })).filter(p => p.partNumber && p.etag);
        if (normalizedParts.length === 0) {
          return json({ error: 'No valid parts provided' }, 400);
        }
        const complete = await env.BUCKET.completeMultipartUpload(key, uploadId, normalizedParts);
        return json({ success: true, key, location: complete.key });
      }

      // ── Multipart status (list uploaded parts) ──
      if (request.method === 'GET' && path === '/upload/status') {
        await requireAdmin(request, env);
        const key = url.searchParams.get('key');
        const uploadId = url.searchParams.get('uploadId');
        if (!key || !uploadId) return json({ error: 'Missing key or uploadId' }, 400);
        const parts = await env.BUCKET.listParts(key, uploadId);
        return json({ success: true, key, uploadId, parts: parts || [] });
      }

      // ── Abort multipart upload ──
      if (request.method === 'POST' && path === '/upload/abort') {
        await requireAdmin(request, env);
        const { key, uploadId } = await request.json();
        if (!key || !uploadId) return json({ error: 'Missing key or uploadId' }, 400);
        await env.BUCKET.abortMultipartUpload(key, uploadId);
        return json({ success: true, key, uploadId, aborted: true });
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
          maxBytes: MAX_BUCKET_BYTES,
          maxGB: MAX_BUCKET_BYTES / 1073741824,
          usagePercent: Math.round(totalSize / MAX_BUCKET_BYTES * 10000) / 100
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
