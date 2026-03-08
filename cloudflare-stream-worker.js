// Cloudflare Worker for KIUMA Live Streaming
// Handles WebRTC streaming and stream management

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;
        
        // Handle CORS
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                }
            });
        }
        
        try {
            if (path === '/stream/create') {
                return await createStream(request);
            } else if (path === '/stream/webrtc') {
                return await handleWebRTC(request);
            } else if (path === '/stream/list') {
                return await listStreams(request);
            } else {
                return new Response('Not found', { status: 404 });
            }
        } catch (error) {
            console.error('Worker error:', error);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
};

// Create a new stream
async function createStream(request) {
    const data = await request.json();
    const streamId = data.streamId || 'stream_' + Date.now();
    
    console.log('Creating stream:', streamId);
    
    // Store stream metadata (you can use KV, R2, or D1)
    const streamData = {
        id: streamId,
        name: data.name,
        accountId: data.accountId,
        createdAt: new Date().toISOString(),
        status: 'created'
    };
    
    // For now, simulate stream creation
    // In production, you'd integrate with actual Cloudflare Stream API
    const webrtcUrl = `wss://webrtc.cloudflare.com/stream/${streamId}`;
    
    return new Response(JSON.stringify({
        success: true,
        streamId: streamId,
        webrtcUrl: webrtcUrl,
        streamData: streamData
    }), {
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
}

// Handle WebRTC signaling
async function handleWebRTC(request) {
    const data = await request.json();
    const { sdp, streamId } = data;
    
    console.log('WebRTC signaling for stream:', streamId);
    
    // In a real implementation, you would:
    // 1. Store the offer
    // 2. Create an answer
    // 3. Handle ICE candidates
    // 4. Connect to Cloudflare Stream
    
    // For now, simulate a WebRTC answer
    const answer = {
        type: 'answer',
        sdp: generateMockSDP()
    };
    
    return new Response(JSON.stringify(answer), {
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
}

// List active streams
async function listStreams(request) {
    // In production, query your storage for active streams
    const streams = [
        {
            id: 'demo_stream_1',
            name: 'Demo Stream 1',
            status: 'live',
            viewers: 42,
            startedAt: new Date().toISOString()
        }
    ];
    
    return new Response(JSON.stringify({
        success: true,
        streams: streams
    }), {
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
}

// Generate mock SDP for demonstration
function generateMockSDP() {
    return `v=0
o=- 0 0 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE 0 1
a=msid-semantic: WMS
m=video 9 UDP/TLS/RTP/SAVPF 96
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:abc
a=ice-pwd:def
a=ice-options:trickle
a=fingerprint:sha-256 AB:CD:EF:GH:IJ:KL:MN:OP:QR:ST:UV:WX:YZ:12:34:56:78:90
a=setup:actpass
a=mid:0
a=sendrecv
a=rtcp-mux
a=rtpmap:96 VP8/90000
a=ssrc:1 cname:stream
m=audio 9 UDP/TLS/RTP/SAVPF 111
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:abc
a=ice-pwd:def
a=ice-options:trickle
a=fingerprint:sha-256 AB:CD:EF:GH:IJ:KL:MN:OP:QR:ST:UV:WX:YZ:12:34:56:78:90
a=setup:actpass
a=mid:1
a=sendrecv
a=rtcp-mux
a=rtpmap:111 opus/48000/2
a=ssrc:2 cname:stream`;
}
