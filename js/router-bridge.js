/**
 * KIUMA Router Bridge - instant in-app navigation for simple pages; full load for script-heavy pages.
 * Pages that need their own scripts (media, library, notifications, etc.) do a full load so they work.
 */
(function () {
    'use strict';

    var SCOPE = location.pathname.replace(/\/[^/]*$/, '') || '/';
    var ORIGIN = location.origin;

    // Pages that must full-load so their inline scripts run (avoid incomplete/empty content)
    var FULL_LOAD_PAGES = ['index.html', 'media.html', 'library.html', 'notifications.html', 'quran-reader.html', 'search.html', 'media-settings.html', 'counselling.html', 'admin.html', 'subscription-form.html', 'zakat-form.html', 'ask-question.html', 'pay.html', 'join-programs.html', 'important-lessons.html', 'mosques.html', 'dhikr.html', 'names-of-allah.html', 'live-streaming.html', 'payment-callback.html', 'whatsapp-join-modal.html'];

    function isSameOriginSameScope(href) {
        if (!href || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) return false;
        try {
            var url = new URL(href, location.href);
            if (url.origin !== ORIGIN) return false;
            var path = url.pathname;
            if (path.indexOf(SCOPE) !== 0) return false;
            var isHtml = path.endsWith('.html') || path === SCOPE || path === SCOPE + '/' || path === '';
            return isHtml && !url.searchParams.has('full'); // ?full=1 forces full reload
        } catch (e) {
            return false;
        }
    }

    function requiresFullLoad(pathname) {
        var name = pathname.split('/').pop() || 'index.html';
        return FULL_LOAD_PAGES.some(function (p) { return name === p || pathname.indexOf(p) !== -1; });
    }

    function getContainer() {
        return document.querySelector('.container');
    }

    function replaceContainer(html) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        var newContainer = doc.querySelector('.container');
        var current = getContainer();
        if (!newContainer || !current) return false;
        current.innerHTML = newContainer.innerHTML;
        var title = doc.querySelector('title');
        if (title && title.textContent) document.title = title.textContent;
        return true;
    }

    function pageInit() {
        if (typeof window.updateNavigationLinks === 'function') window.updateNavigationLinks();
        window.scrollTo(0, 0);
        try {
            window.dispatchEvent(new CustomEvent('kiuma-page-changed', { detail: { url: location.href } }));
        } catch (e) {}
    }

    document.addEventListener('click', function (e) {
        var a = e.target && (e.target.closest ? e.target.closest('a') : e.target);
        if (!a || a.tagName !== 'A') return;
        var href = a.getAttribute('href');
        if (!isSameOriginSameScope(href)) return;
        if (a.target === '_blank' || a.hasAttribute('download')) return;
        var url = new URL(href, location.href);
        var targetPath = url.pathname + url.search;
        if (requiresFullLoad(url.pathname)) {
            location.href = href;
            return;
        }
        e.preventDefault();

        fetch(targetPath, { credentials: 'same-origin' })
            .then(function (res) {
                if (!res.ok) throw new Error(res.status);
                return res.text();
            })
            .then(function (html) {
                if (!replaceContainer(html)) {
                    location.href = href;
                    return;
                }
                history.pushState({ kiumaRouter: true, url: targetPath }, '', targetPath);
                pageInit();
            })
            .catch(function () {
                location.href = href;
            });
    }, true);

    window.addEventListener('popstate', function (e) {
        var targetUrl = (e.state && e.state.url) || location.href;
        var targetPath = '';
        try { targetPath = new URL(targetUrl, location.href).pathname; } catch(err) { targetPath = location.pathname; }

        // If the target page requires a full load, always do a full reload
        if (requiresFullLoad(targetPath)) {
            location.reload();
            return;
        }

        // If the current page is a full-load page (e.g. pay.html), soft-loading into it
        // would leave stale inline scripts running — always do a full reload instead
        if (requiresFullLoad(location.pathname)) {
            location.href = targetUrl;
            return;
        }

        if (e.state && e.state.kiumaRouter && e.state.url) {
            fetch(e.state.url, { credentials: 'same-origin' })
                .then(function (res) { return res.ok ? res.text() : Promise.reject(); })
                .then(function (html) {
                    replaceContainer(html);
                    pageInit();
                })
                .catch(function () { location.href = e.state.url; });
        } else {
            // No router state — do a full reload to ensure clean page
            location.reload();
        }
    });

    console.log('[RouterBridge] Instant navigation enabled for same-origin .html links');
})();
