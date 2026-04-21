const STREAM_CONFIG = {
    // Placeholder API endpoint that should return a signed HLS URL
    // Example response: { playlistUrl: "https://cdn.example.com/videos/123/master.m3u8" }
    streamEndpoint: '/api/video/featured/stream',
    seekStep: 10,
    bufferOptions: {
        maxBufferLength: 30,
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
    }
};

async function fetchSignedStream() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
        const res = await fetch(STREAM_CONFIG.streamEndpoint, {
            credentials: 'include',
            headers: { 'Accept': 'application/json' },
            signal: controller.signal
        });
        clearTimeout(timeout);
        if (!res.ok) throw new Error('Stream request failed');
        const data = await res.json();
        if (!data?.playlistUrl) throw new Error('Malformed stream payload');
        return data.playlistUrl;
    } catch (err) {
        clearTimeout(timeout);
        console.error('[Stream] URL fetch failed:', err.message);
        throw err;
    }
}

function setupGestureHint(video, hintEl) {
    if (!hintEl) return;
    let timeoutId;
    const showHint = () => {
        hintEl.classList.add('visible');
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => hintEl.classList.remove('visible'), 2000);
    };
    video.addEventListener('dblclick', showHint, { passive: true });
}

function setupDoubleTapSeek(video) {
    let lastTap = 0;
    video.addEventListener('touchend', (event) => {
        const currentTime = Date.now();
        if (currentTime - lastTap < 350) {
            const touchX = event.changedTouches[0].clientX;
            const midpoint = window.innerWidth / 2;
            const direction = touchX < midpoint ? -1 : 1;
            const newTime = Math.max(video.currentTime + direction * STREAM_CONFIG.seekStep, 0);
            video.currentTime = newTime;
        }
        lastTap = currentTime;
    });
}

function bindBufferIndicator(hls, video, indicator) {
    if (!indicator) return;
    const toggle = (active) => indicator.classList.toggle('active', !!active);
    hls.on(Hls.Events.BUFFER_STALLED, () => toggle(true));
    hls.on(Hls.Events.BUFFER_APPENDED, () => toggle(false));
    video.addEventListener('waiting', () => toggle(true));
    video.addEventListener('playing', () => toggle(false));
}

async function initPlayer() {
    const video = document.getElementById('player');
    const bufferIndicator = document.getElementById('bufferIndicator');
    const gestureHint = document.getElementById('gestureHint');
    const shareBtn = document.getElementById('shareBtn');
    const reportBtn = document.getElementById('reportBtn');

    if (!video) return;

    let streamUrl;
    try {
        streamUrl = await fetchSignedStream();
    } catch (error) {
        bufferIndicator?.classList.add('active');
        bufferIndicator.innerHTML = '<p style="color:#fff;font-weight:600;">Stream unavailable</p>';
        return;
    }

    if (Hls.isSupported()) {
        const hls = new Hls(STREAM_CONFIG.bufferOptions);
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        bindBufferIndicator(hls, video, bufferIndicator);
        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
    } else {
        console.error('HLS not supported in this environment');
    }

    const player = new Plyr(video, {
        controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'fullscreen'],
        settings: ['quality', 'speed'],
        clickToPlay: true,
        hideControls: true,
        disableContextMenu: true
    });

    setupGestureHint(video, gestureHint);
    setupDoubleTapSeek(video);

    shareBtn?.addEventListener('click', async () => {
        const shareData = {
            title: 'KIUMA Stream',
            text: 'Watch this session securely on KIUMA',
            url: window.location.href
        };
        if (navigator.share) {
            try { await navigator.share(shareData); } catch (e) {}
        } else {
            navigator.clipboard?.writeText(shareData.url);
            shareBtn.textContent = 'Link copied!';
            setTimeout(() => shareBtn.textContent = 'Share', 2000);
        }
    });

    reportBtn?.addEventListener('click', () => {
        window.location.href = 'mailto:support@kiuma.org?subject=Streaming%20Issue';
    });
}

document.addEventListener('DOMContentLoaded', initPlayer);
