/**
 * KIUMA Media Storage Worker
 * Cloudflare Worker + R2 for serving media files
 * 
 * Deploy: wrangler deploy
 * Upload files: wrangler r2 object put kiuma-storage/media/video/lecture.mp4 --file=./lecture.mp4
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range',
      'Access-Control-Expose-Headers': 'Content-Length, Content-Range',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // GET /list?prefix=media/video/  — list files in R2 bucket
    if (path === '/list') {
      const prefix = url.searchParams.get('prefix') || '';
      const listed = await env.BUCKET.list({ prefix, limit: 1000 });
      const files = listed.objects.map(obj => ({
        key: obj.key,
        name: obj.key.split('/').pop(),
        size: obj.size,
        uploaded: obj.uploaded,
      }));
      return new Response(JSON.stringify({ files }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /file/<key>  — serve a file from R2
    if (path.startsWith('/file/')) {
      const key = decodeURIComponent(path.slice(6));
      const object = await env.BUCKET.get(key, {
        range: request.headers.get('Range') || undefined,
      });

      if (!object) {
        return new Response('Not Found', { status: 404, headers: corsHeaders });
      }

      const headers = {
        ...corsHeaders,
        'Content-Type': getContentType(key),
        'Content-Length': object.size,
        'Cache-Control': 'public, max-age=86400',
        'ETag': object.httpEtag,
      };

      // Support range requests (for video seeking)
      if (object.range) {
        headers['Content-Range'] = `bytes ${object.range.offset}-${object.range.offset + object.range.length - 1}/${object.size}`;
        return new Response(object.body, { status: 206, headers });
      }

      return new Response(object.body, { headers });
    }

    // GET /upload-url  — (optional) generate signed upload URL
    // Only enable if you want browser-based uploads
    // Requires AUTH_SECRET env var for security
    if (path === '/upload' && request.method === 'PUT') {
      const authHeader = request.headers.get('X-Auth-Secret');
      if (!env.AUTH_SECRET || authHeader !== env.AUTH_SECRET) {
        return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      }
      const key = url.searchParams.get('key');
      if (!key) {
        return new Response('Missing key parameter', { status: 400, headers: corsHeaders });
      }
      await env.BUCKET.put(key, request.body, {
        httpMetadata: { contentType: request.headers.get('Content-Type') || 'application/octet-stream' },
      });
      return new Response(JSON.stringify({ success: true, key }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('KIUMA Media Storage API', { headers: corsHeaders });
  },
};

function getContentType(key) {
  const ext = key.split('.').pop().toLowerCase();
  const types = {
    mp4: 'video/mp4', webm: 'video/webm', mkv: 'video/x-matroska',
    mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', m4a: 'audio/mp4',
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
    pdf: 'application/pdf', json: 'application/json',
  };
  return types[ext] || 'application/octet-stream';
}
