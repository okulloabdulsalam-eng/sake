/* KIUMA Quran reader — Tarteel-style UI. Depends on #quranApp DOM in quran-reader.html */
(function () {
  'use strict';

  var API = 'https://api.alquran.cloud/v1';
  var QCOM = 'https://api.quran.com/api/v4';
  var AUDIO_CDN = 'https://cdn.islamic.network/quran/audio/128';
  var QURAN_PROXY = 'https://kiuma-quran.kiuma4.workers.dev';
  var RECITE_WS = 'wss://kiuma-recitation.kiuma4.workers.dev/ws';

  var RECITER_NAMES = {
    'ar.alafasy': 'Mishary Alafasy',
    'ar.abdulbasitmurattal': 'Abdul Basit',
    'ar.husary': 'Al-Husary',
    'ar.minshawi': 'Al-Minshawi',
    'ar.abdurrahmaanas-sudais': 'As-Sudais'
  };

  var SURAH_PAGE = [1, 2, 50, 77, 106, 128, 151, 177, 187, 208, 221, 235, 249, 255, 262, 267, 282, 293, 305, 312, 322, 332, 342, 350, 359, 367, 377, 385, 396, 404, 411, 415, 418, 428, 434, 440, 446, 453, 458, 467, 477, 483, 489, 496, 499, 502, 507, 511, 515, 518, 520, 523, 526, 528, 531, 534, 537, 542, 545, 549, 551, 553, 554, 556, 558, 560, 562, 564, 566, 568, 570, 572, 574, 575, 577, 578, 580, 582, 583, 585, 586, 587, 587, 589, 590, 591, 591, 592, 593, 594, 595, 595, 596, 596, 597, 597, 598, 598, 599, 599, 600, 600, 601, 601, 601, 602, 602, 602, 603, 603, 603, 604, 604, 604];
  var JUZ_PAGES = [1, 22, 42, 62, 82, 102, 122, 142, 162, 182, 202, 222, 242, 262, 282, 302, 322, 342, 362, 382, 402, 422, 442, 462, 482, 502, 522, 542, 562, 582];
  var HIZB_PAGES = [1, 11, 22, 32, 42, 51, 62, 72, 82, 92, 102, 111, 121, 131, 141, 151, 161, 171, 181, 201, 211, 221, 231, 241, 251, 261, 271, 281, 291, 302, 311, 321, 331, 341, 351, 361, 371, 382, 391, 401, 411, 421, 431, 441, 451, 461, 471, 481, 491, 502, 512, 521, 531, 541, 552, 561, 572, 581, 591, 602];

  var JUZ = [
    { n: 1, nm: 'Alif Lam Mim', s: 1, a: 1 }, { n: 2, nm: 'Sayaqul', s: 2, a: 142 }, { n: 3, nm: 'Tilkal Rusul', s: 2, a: 253 },
    { n: 4, nm: 'Lan Tanaloo', s: 3, a: 93 }, { n: 5, nm: 'Wal Muhsanat', s: 4, a: 24 }, { n: 6, nm: 'La Yuhibbullah', s: 4, a: 148 },
    { n: 7, nm: "Wa Iza Sami'u", s: 5, a: 82 }, { n: 8, nm: 'Wa Lau Annana', s: 6, a: 111 }, { n: 9, nm: 'Qalal Mala', s: 7, a: 88 },
    { n: 10, nm: "Wa A'lamu", s: 8, a: 41 }, { n: 11, nm: "Ya'tazirun", s: 9, a: 93 }, { n: 12, nm: 'Wa Ma Min Dabbah', s: 11, a: 6 },
    { n: 13, nm: "Wa Ma Ubarri'u", s: 12, a: 53 }, { n: 14, nm: 'Rubama', s: 15, a: 1 }, { n: 15, nm: 'Subhanallazi', s: 17, a: 1 },
    { n: 16, nm: 'Qal Alam', s: 18, a: 75 }, { n: 17, nm: 'Iqtaraba', s: 21, a: 1 }, { n: 18, nm: 'Qad Aflaha', s: 23, a: 1 },
    { n: 19, nm: 'Wa Qalallazina', s: 25, a: 21 }, { n: 20, nm: 'Amman Khalaq', s: 27, a: 56 }, { n: 21, nm: 'Utlu Ma Uhiya', s: 29, a: 46 },
    { n: 22, nm: 'Wa Man Yaqnut', s: 33, a: 31 }, { n: 23, nm: 'Wa Mali', s: 36, a: 28 }, { n: 24, nm: 'Faman Azlamu', s: 39, a: 32 },
    { n: 25, nm: 'Ilaihi Yuraddu', s: 41, a: 47 }, { n: 26, nm: 'Ha Mim', s: 46, a: 1 }, { n: 27, nm: 'Qala Fama Khatbukum', s: 51, a: 31 },
    { n: 28, nm: "Qad Sami'a", s: 58, a: 1 }, { n: 29, nm: 'Tabarakallazi', s: 67, a: 1 }, { n: 30, nm: 'Amma Yatasaalun', s: 78, a: 1 }
  ];

  var QUICK = [
    { label: 'AL-MULK', surah: 67, ayah: 1 },
    { label: 'AL-KAHF', surah: 18, ayah: 1 },
    { label: 'AYATUL KURSI', surah: 2, ayah: 255 },
    { label: 'YA SIN', surah: 36, ayah: 1 }
  ];

  var surahs = [], curSurah = 1, curAyahs = [], curPage = 1;
  var activeTab = 'surah';
  var audioEl = null, audioPlaying = false, audioAyahIdx = 0, audioRepeatOn = false, audioSpeed = 1;
  var reciteWs = null, reciteRecorder = null, reciteStream = null, reciteAyahIdx = 0, reciteMistakes = 0;
  var fetchAbort = null, autoScrollTimer = null, autoScrollOn = false;
  var actData = null;
  var surahCache = {}, pageCache = {};
  var toastTimer = null;
  var touchStartX = 0, touchStartY = 0;

  function loadSettings() { try { return JSON.parse(localStorage.getItem('quran_settings')) || {}; } catch (e) { return {}; } }
  function saveSettings(s) { try { localStorage.setItem('quran_settings', JSON.stringify(s)); } catch (e) { } }
  function getSet() {
    var d = { theme: 'dark', fontSize: 22, showTrans: true, transEd: 'en.asad', tajweed: false, reciter: 'ar.alafasy', showTranslit: false, memorization: false };
    var s = loadSettings();
    for (var k in d) if (s[k] !== undefined) d[k] = s[k];
    return d;
  }
  function putSet(k, v) { var s = loadSettings(); s[k] = v; saveSettings(s); }

  function loadBookmarks() { try { return JSON.parse(localStorage.getItem('quran_bookmarks')) || []; } catch (e) { return []; } }
  function saveBookmarks(b) { try { localStorage.setItem('quran_bookmarks', JSON.stringify(b)); } catch (e) { } }
  function isBookmarked(su, ay) { return loadBookmarks().some(function (b) { return b.surah === su && b.ayah === ay; }); }
  function addBookmark(su, ay) {
    var b = loadBookmarks();
    if (!isBookmarked(su, ay)) {
      var s = surahs[su - 1];
      b.unshift({ surah: su, ayah: ay, name: s ? s.englishName : '', ts: Date.now() });
      saveBookmarks(b);
    }
    return b;
  }
  function removeBookmark(su, ay) { var b = loadBookmarks().filter(function (x) { return !(x.surah === su && x.ayah === ay); }); saveBookmarks(b); return b; }

  function loadContinue() { try { return JSON.parse(localStorage.getItem('quran_continue')) || null; } catch (e) { return null; } }
  function saveContinue(su, ay, pg) {
    var s = surahs[su - 1];
    var d = { surah: su, ayah: ay || 1, page: pg || SURAH_PAGE[su - 1], name: s ? s.englishName : '', arName: s ? s.name : '', ts: Date.now() };
    try { localStorage.setItem('quran_continue', JSON.stringify(d)); } catch (e) { }
    pushLastRead(d);
  }

  function pushLastRead(d) {
    try {
      var arr = JSON.parse(localStorage.getItem('quran_last_reads') || '[]');
      var label = (d.name || '').toUpperCase().replace(/\s+/g, '-') + ' ' + d.surah + ':' + d.ayah;
      arr = arr.filter(function (x) { return x.label !== label; });
      arr.unshift({ label: label, surah: d.surah, ayah: d.ayah, ts: Date.now() });
      arr = arr.slice(0, 5);
      localStorage.setItem('quran_last_reads', JSON.stringify(arr));
    } catch (e) { }
  }

  function renderLastReadChips() {
    var el = document.getElementById('qrLastReadRow');
    if (!el) return;
    try {
      var arr = JSON.parse(localStorage.getItem('quran_last_reads') || '[]');
      el.innerHTML = arr.map(function (x) {
        return '<button type="button" class="qr-chip" onclick="window.qrOpenSurahAyah(' + x.surah + ',' + x.ayah + ')">' + escapeHtml(x.label) + '</button>';
      }).join('') || '<span class="qr-muted">No recent reads yet</span>';
    } catch (e) { el.innerHTML = ''; }
  }

  function escapeHtml(t) {
    var d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
  }

  /** Opens Quran.com mushaf page view (Madinah layout). Home: continue-reading page or 1. Reader: current page. */
  window.qrOpenQuranComMushaf = function (page) {
    var p = page;
    var readerOn = document.getElementById('qrReader') && document.getElementById('qrReader').classList.contains('active');
    if (p == null || p === '') {
      if (readerOn) p = curPage;
      else {
        try {
          var c = JSON.parse(localStorage.getItem('quran_continue') || 'null');
          if (c && c.page) p = c.page;
        } catch (e) { }
      }
    }
    if (p == null || p === '') p = 1;
    p = Math.max(1, Math.min(604, Number(p) || 1));
    window.open('https://quran.com/page/' + p, '_blank', 'noopener,noreferrer');
  };

  function updateStreak() {
    var el = document.getElementById('qrStreak');
    if (!el) return;
    try {
      var today = new Date().toDateString();
      var o = JSON.parse(localStorage.getItem('quran_streak') || '{}');
      if (o.day !== today) {
        var y = new Date(); y.setDate(y.getDate() - 1);
        if (o.day === y.toDateString()) o.count = (o.count || 0) + 1;
        else o.count = 1;
        o.day = today;
        localStorage.setItem('quran_streak', JSON.stringify(o));
      }
      el.textContent = String(o.count || 1);
    } catch (e) { el.textContent = '1'; }
  }

  function juzFromPage(p) {
    for (var i = 29; i >= 0; i--) if (p >= JUZ_PAGES[i]) return i + 1;
    return 1;
  }
  function hizbFromPage(p) {
    for (var i = 59; i >= 0; i--) if (p >= HIZB_PAGES[i]) return i + 1;
    return 1;
  }
  function rukuLabelForPage(p) {
    var r = Math.min(556, Math.max(1, Math.round((p - 0.5) * 556 / 604)));
    return r;
  }

  function abortPending() {
    if (fetchAbort) { try { fetchAbort.abort(); } catch (e) { } }
    fetchAbort = new AbortController();
    return fetchAbort.signal;
  }

  function showView(id) {
    document.querySelectorAll('.qr-view').forEach(function (v) { v.classList.remove('active'); });
    var n = document.getElementById(id);
    if (n) n.classList.add('active');
  }

  function showHome() {
    stopAutoScroll();
    audioClose();
    showView('qrHome');
    renderLastReadChips();
    updateContinuePill();
    if (activeTab === 'surah') renderSurahList();
    else if (activeTab === 'juz') renderJuzList();
    else if (activeTab === 'page') renderPageTab();
    else if (activeTab === 'hizb') renderHizbList();
    else if (activeTab === 'ruku') renderRukuList();
  }

  function updateContinuePill() {
    var c = loadContinue();
    var pill = document.getElementById('qrContinuePill');
    if (!pill) return;
    if (!c) { pill.classList.remove('show'); return; }
    pill.classList.add('show');
    pill.querySelector('.qr-pill-text').textContent = 'Continue Reading';
    pill.querySelector('.qr-pill-sub').textContent = (c.name || '') + ' · ' + c.surah + ':' + c.ayah;
  }

  function resumeReading() {
    var c = loadContinue();
    if (!c) return;
    curSurah = c.surah;
    curPage = c.page || SURAH_PAGE[c.surah - 1];
    openSurah(c.surah, c.ayah, curPage);
  }

  window.qrOpenSurahAyah = function (su, ay) {
    curSurah = su;
    curPage = SURAH_PAGE[su - 1];
    openSurah(su, ay);
  };

  function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.qr-cat-tab').forEach(function (t) {
      t.classList.toggle('on', t.getAttribute('data-tab') === tab);
    });
    var searchEl = document.getElementById('qrSearchRow');
    if (searchEl) searchEl.style.display = tab === 'surah' ? '' : 'none';
    if (tab === 'surah') renderSurahList();
    else if (tab === 'juz') renderJuzList();
    else if (tab === 'page') renderPageTab();
    else if (tab === 'hizb') renderHizbList();
    else if (tab === 'ruku') renderRukuList();
  }

  function filterList() {
    var q = (document.getElementById('qrSearchInput').value || '').toLowerCase();
    document.querySelectorAll('.qr-surah-row').forEach(function (row) {
      var en = (row.getAttribute('data-en') || '').toLowerCase();
      var ar = (row.getAttribute('data-ar') || '').toLowerCase();
      var num = row.getAttribute('data-num') || '';
      row.style.display = (!q || en.indexOf(q) >= 0 || ar.indexOf(q) >= 0 || num.indexOf(q) >= 0) ? '' : 'none';
    });
  }

  function renderSurahList() {
    var list = document.getElementById('qrList');
    if (!list || !surahs.length) return;
    list.innerHTML = surahs.map(function (s) {
      var meccan = s.revelationType === 'Meccan';
      return '<div class="qr-surah-row" data-num="' + s.number + '" data-en="' + escapeHtml(s.englishName) + '" data-ar="' + escapeHtml(s.name) + '" onclick="window.qrOpenSurah(' + s.number + ')">' +
        '<span class="qr-sn">' + s.number + '</span>' +
        '<div class="qr-smid"><div class="qr-sname">' + escapeHtml(s.englishName) + '</div><div class="qr-str">' + escapeHtml(s.englishNameTranslation || '') + ' <i class="fas ' + (meccan ? 'fa-kaaba' : 'fa-mosque') + '"></i></div></div>' +
        '<span class="qr-sar">' + s.name + '</span></div>';
    }).join('');
  }

  function renderJuzList() {
    var list = document.getElementById('qrList');
    list.innerHTML = JUZ.map(function (j) {
      var sp = JUZ_PAGES[j.n - 1];
      return '<div class="qr-juz-row" onclick="window.qrJumpPage(' + sp + ')"><span class="qr-jn">' + j.n + '</span><div><div class="qr-jname">' + escapeHtml(j.nm) + '</div><div class="qr-jmeta">Starts Surah ' + j.s + '</div></div></div>';
    }).join('');
  }

  function renderPageTab() {
    var list = document.getElementById('qrList');
    list.innerHTML = '<div class="qr-page-box"><label class="qr-muted">Go to page (1–604)</label><div class="qr-page-row"><input type="number" id="qrPageIn" class="qr-page-in" min="1" max="604" placeholder="Page"><button type="button" class="qr-page-go" onclick="window.qrJumpPage(parseInt(document.getElementById(\'qrPageIn\').value,10)||1)">Go</button></div><div class="qr-jgrid">' +
      JUZ.map(function (_, i) { var p = JUZ_PAGES[i]; return '<button type="button" class="qr-jc" onclick="window.qrJumpPage(' + p + ')">' + (i + 1) + '</button>'; }).join('') + '</div></div>';
  }

  function renderHizbList() {
    var list = document.getElementById('qrList');
    list.innerHTML = HIZB_PAGES.map(function (p, i) {
      return '<div class="qr-juz-row" onclick="window.qrJumpPage(' + p + ')"><span class="qr-jn">' + (i + 1) + '</span><div><div class="qr-jname">Ḥizb ' + (i + 1) + '</div><div class="qr-jmeta">Page ' + p + '</div></div></div>';
    }).join('');
  }

  function renderRukuList() {
    var list = document.getElementById('qrList');
    var rows = [];
    for (var r = 1; r <= 40; r++) {
      var p = Math.min(604, Math.max(1, Math.round((r - 0.5) * 604 / 40)));
      rows.push('<div class="qr-juz-row" onclick="window.qrJumpPage(' + p + ')"><span class="qr-jn">' + r + '</span><div><div class="qr-jname">Section ' + r + '</div><div class="qr-jmeta">~Page ' + p + '</div></div></div>');
    }
    list.innerHTML = '<p class="qr-muted" style="padding:0 16px 12px">Quick sections (approximate pages). Use adaptive reader for exact ruku markers.</p>' + rows.join('');
  }

  window.qrJumpPage = function (page) {
    page = Math.max(1, Math.min(604, page));
    curPage = page;
    (async function () {
      try {
        var r = await fetch(QCOM + '/verses/by_page/' + page + '?per_page=1&fields=verse_key');
        if (r.ok) {
          var j = await r.json();
          var v = (j.verses || [])[0];
          if (v && v.verse_key) {
            var p = v.verse_key.split(':');
            openSurah(parseInt(p[0], 10), parseInt(p[1], 10), page);
            return;
          }
        }
      } catch (e) { }
      var sn = 1;
      for (var i = 0; i < SURAH_PAGE.length; i++) {
        if (SURAH_PAGE[i] <= page) sn = i + 1;
        else break;
      }
      openSurah(sn, 1, page);
    })();
  };

  window.qrOpenSurah = function (num) {
    curSurah = num;
    curPage = SURAH_PAGE[num - 1];
    openSurah(num, 1);
  };

  function openSurah(num, ayah, pageOverride) {
    stopAutoScroll();
    curSurah = num;
    curPage = pageOverride != null ? pageOverride : SURAH_PAGE[num - 1];
    showView('qrReader');
    document.getElementById('qrReaderTitle').textContent = num + '. ' + (surahs[num - 1] ? surahs[num - 1].englishName : '');
    document.getElementById('qrReaderSub').textContent = 'Page ' + curPage;
    document.getElementById('qrRibbon').textContent = 'Juz ' + juzFromPage(curPage) + ' · Ḥizb ' + hizbFromPage(curPage) + ' · Page ' + curPage + ' · Ruku ~' + rukuLabelForPage(curPage);
    loadAdaptiveContent(num, ayah);
  }

  async function loadAdaptiveContent(surahNum, scrollToAyah) {
    var sig = abortPending();
    var s = getSet();
    var list = document.getElementById('qrRBody');
    list.innerHTML = '<div class="qr-skel">Loading…</div>';
    try {
      var proxyVerses = await fetchProxyVersesForSurah(surahNum);
      if (proxyVerses && proxyVerses.length) {
        curAyahs = proxyVerses.map(function (v) { return normalizeProxyVerse(v, surahNum); });
        renderAdaptiveFromWords(curAyahs, surahNum, scrollToAyah);
        return;
      }
    } catch (e) { }
    try {
      var ar = await fetch(API + '/surah/' + surahNum + '/quran-uthmani', { signal: sig });
      var ja = await ar.json();
      if (!ja.data || !ja.data.ayahs) throw new Error('no ayahs');
      var tr = null;
      if (s.showTrans) {
        var rt = await fetch(API + '/surah/' + surahNum + '/' + s.transEd, { signal: sig });
        var jt = await rt.json();
        tr = jt.data ? jt.data.ayahs : [];
      }
      curAyahs = ja.data.ayahs.map(function (a, i) {
        return {
          numberInSurah: a.numberInSurah,
          text: a.text,
          translation: tr && tr[i] ? tr[i].text : '',
          words: null
        };
      });
      renderAdaptiveSimple(curAyahs, surahNum, scrollToAyah);
    } catch (e) {
      list.innerHTML = '<p class="qr-muted">Could not load. Check connection.</p>';
    }
  }

  async function fetchProxyVersesForSurah(surahNum) {
    var all = [];
    var page = 1;
    for (var guard = 0; guard < 25; guard++) {
      var u = QURAN_PROXY + '/verses/by_chapter/' + surahNum + '?words=true&per_page=50&page=' + page;
      var r = await fetch(u);
      if (!r.ok) return null;
      var j = await r.json();
      var verses = j.verses || j.data || [];
      if (!verses.length) break;
      all = all.concat(verses);
      var next = j.pagination && j.pagination.next_page;
      if (!next) break;
      page = next;
    }
    return all.length ? all : null;
  }

  function normalizeProxyVerse(v, surahNum) {
    var words = (v.words || []).map(function (w) {
      var t = (w.translation && w.translation.text) || (w.word_translation && w.word_translation.text) || '';
      return { text: w.text_uthmani || w.text || '', trans: t };
    });
    var text = words.map(function (x) { return x.text; }).join(' ');
    var transFull = (v.translations && v.translations[0] && v.translations[0].text) || '';
    var num = v.verse_number || parseInt((v.verse_key || '').split(':')[1], 10) || 0;
    return { numberInSurah: num, text: text, translation: transFull, words: words };
  }

  function renderAdaptiveFromWords(ayahs, surahNum, scrollToAyah) {
    var s = surahs[surahNum - 1];
    var list = document.getElementById('qrRBody');
    var cardImg = s && s.revelationType === 'Meccan' ? 'kaaba' : 'madina';
    var head = '<div class="qr-info-card"><div class="qr-info-thumb ' + cardImg + '"></div><div class="qr-info-txt"><div class="qr-info-name">' + escapeHtml(s.englishName) + '</div><div class="qr-info-meta">' + escapeHtml(s.englishNameTranslation || '') + ' · ' + s.numberOfAyahs + ' Ayahs</div></div><a href="#" class="qr-link" onclick="event.preventDefault();window.open(\'https://quran.com/' + surahNum + '\')">Surah info</a></div>';
    list.innerHTML = head + ayahs.map(function (a) {
      var wbw = '';
      if (a.words && a.words.length) {
        wbw = '<div class="qr-wbw">' + a.words.map(function (w) {
          return '<span class="qr-w"><span class="qr-wa">' + w.text + '</span><span class="qr-we">' + escapeHtml(w.trans || '·') + '</span></span>';
        }).join('') + '</div>';
      } else {
        wbw = '<div class="qr-ayah-ar">' + a.text + '</div>';
      }
      var memo = getSet().memorization ? ' qr-memo' : '';
      return '<div class="qr-verse' + memo + '" id="qrV' + a.numberInSurah + '" data-surah="' + surahNum + '" data-ayah="' + a.numberInSurah + '">' +
        '<div class="qr-vhead"><span class="qr-vn">' + a.numberInSurah + '</span><button type="button" class="qr-vmenu" onclick="window.qrOpenAct(' + surahNum + ',' + a.numberInSurah + ')"><i class="fas fa-ellipsis-h"></i></button></div>' +
        wbw +
        (getSet().showTrans && a.translation ? '<div class="qr-ayah-en">' + a.translation + '</div>' : '') +
        '<div class="qr-vactions"><button type="button" onclick="window.qrPlayAyah(' + (a.numberInSurah - 1) + ')"><i class="far fa-play-circle"></i></button><button type="button" onclick="window.open(\'https://quran.com/' + surahNum + ':' + a.numberInSurah + '/tafsirs\')"><i class="fas fa-graduation-cap"></i></button><button type="button" onclick="window.qrToggleBmAyah(' + surahNum + ',' + a.numberInSurah + ')"><i class="far fa-bookmark"></i></button></div></div>';
    }).join('');
    if (scrollToAyah) {
      var el = document.getElementById('qrV' + scrollToAyah);
      if (el) el.scrollIntoView({ block: 'center' });
    }
    saveContinue(surahNum, scrollToAyah || 1, curPage);
  }

  function renderAdaptiveSimple(ayahs, surahNum, scrollToAyah) {
    var s = surahs[surahNum - 1];
    var list = document.getElementById('qrRBody');
    var cardImg = s && s.revelationType === 'Meccan' ? 'kaaba' : 'madina';
    var head = '<div class="qr-info-card"><div class="qr-info-thumb ' + cardImg + '"></div><div class="qr-info-txt"><div class="qr-info-name">' + escapeHtml(s.englishName) + '</div><div class="qr-info-meta">' + escapeHtml(s.englishNameTranslation || '') + ' · ' + s.numberOfAyahs + ' Ayahs</div></div><a href="#" class="qr-link" onclick="event.preventDefault();window.open(\'https://quran.com/' + surahNum + '\')">Surah info</a></div>';
    list.innerHTML = head + ayahs.map(function (a) {
      var memo = getSet().memorization ? ' qr-memo' : '';
      return '<div class="qr-verse' + memo + '" id="qrV' + a.numberInSurah + '"><div class="qr-vhead"><span class="qr-vn">' + a.numberInSurah + '</span><button type="button" class="qr-vmenu" onclick="window.qrOpenAct(' + surahNum + ',' + a.numberInSurah + ')"><i class="fas fa-ellipsis-h"></i></button></div><div class="qr-ayah-ar">' + a.text + '</div>' +
        (getSet().showTrans && a.translation ? '<div class="qr-ayah-en">' + a.translation + '</div>' : '') +
        '<div class="qr-vactions"><button type="button" onclick="window.qrPlayAyah(' + (a.numberInSurah - 1) + ')"><i class="far fa-play-circle"></i></button><button type="button" onclick="window.open(\'https://quran.com/' + surahNum + ':' + a.numberInSurah + '/tafsirs\')"><i class="fas fa-graduation-cap"></i></button><button type="button" onclick="window.qrToggleBmAyah(' + surahNum + ',' + a.numberInSurah + ')"><i class="far fa-bookmark"></i></button></div></div>';
    }).join('');
    if (scrollToAyah) {
      var el = document.getElementById('qrV' + scrollToAyah);
      if (el) el.scrollIntoView({ block: 'center' });
    }
    saveContinue(surahNum, scrollToAyah || 1, curPage);
  }

  function prevSurah() { if (curSurah > 1) openSurah(curSurah - 1, 1); }
  function nextSurah() { if (curSurah < 114) openSurah(curSurah + 1, 1); }

  function openContentsSheet() {
    var sheet = document.getElementById('qrContentsSheet');
    var list = document.getElementById('qrContentsList');
    document.getElementById('qrContBD').classList.add('show');
    sheet.classList.add('show');
    list.innerHTML = surahs.map(function (s) {
      return '<div class="qr-pick-item" onclick="window.qrPickSurah(' + s.number + ')">' + s.number + '. ' + escapeHtml(s.englishName) + '</div>';
    }).join('');
  }
  function closeContentsSheet() {
    document.getElementById('qrContBD').classList.remove('show');
    document.getElementById('qrContentsSheet').classList.remove('show');
  }
  window.qrPickSurah = function (n) {
    closeContentsSheet();
    curSurah = n;
    curPage = SURAH_PAGE[n - 1];
    var activeEl = document.querySelector('.qr-view.active');
    var id = activeEl ? activeEl.id : '';
    if (id === 'qrReader') openSurah(n, 1);
    else window.qrOpenSurah(n);
  };

  window.qrQuick = function (surah, ayah) {
    curSurah = surah;
    curPage = SURAH_PAGE[surah - 1];
    openSurah(surah, ayah || 1);
  };

  function toggleAutoScroll() {
    var el = document.getElementById('qrRBody');
    if (!el || !document.getElementById('qrReader').classList.contains('active')) return;
    autoScrollOn = !autoScrollOn;
    document.getElementById('qrAutoBtn').classList.toggle('on', autoScrollOn);
    if (autoScrollTimer) { clearInterval(autoScrollTimer); autoScrollTimer = null; }
    if (autoScrollOn) {
      autoScrollTimer = setInterval(function () {
        el.scrollTop += 0.8;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) stopAutoScroll();
      }, 50);
    }
  }
  function stopAutoScroll() {
    autoScrollOn = false;
    var b = document.getElementById('qrAutoBtn');
    if (b) b.classList.remove('on');
    if (autoScrollTimer) { clearInterval(autoScrollTimer); autoScrollTimer = null; }
  }

  function toggleAudioBar() {
    var bar = document.getElementById('qrAudio');
    if (!curAyahs.length) { showToast('Open a surah first'); return; }
    bar.classList.toggle('show');
    if (bar.classList.contains('show')) playFromAyah(audioAyahIdx || 0);
  }

  function ensureAudio() {
    if (!audioEl) {
      audioEl = new Audio();
      audioEl.addEventListener('ended', onAudioEnd);
      audioEl.addEventListener('timeupdate', onAudioTime);
    }
    return audioEl;
  }
  function globalAyahIndex(surahNum, ayInSurah) {
    var t = 0;
    for (var i = 1; i < surahNum; i++) t += surahs[i - 1].numberOfAyahs;
    return t + ayInSurah;
  }
  function playFromAyah(idx) {
    var a = curAyahs[idx];
    if (!a) return;
    audioAyahIdx = idx;
    var su = a.surah ? a.surah.number : curSurah;
    var g = globalAyahIndex(su, a.numberInSurah);
    var url = AUDIO_CDN + '/' + getSet().reciter + '/' + g + '.mp3';
    var el = ensureAudio();
    el.src = url;
    el.playbackRate = audioSpeed;
    el.play();
    audioPlaying = true;
    document.getElementById('qrAudio').classList.add('show');
    document.getElementById('qrAudioIcon').className = 'fas fa-pause';
    highlightAyah(idx);
    updateAudioInfo();
  }
  window.qrPlayAyah = function (idx) {
    document.getElementById('qrAudio').classList.add('show');
    playFromAyah(idx);
  };
  function onAudioEnd() {
    unhighlightAll();
    if (audioRepeatOn) { audioEl.currentTime = 0; audioEl.play(); return; }
    if (audioAyahIdx < curAyahs.length - 1) { audioAyahIdx++; playFromAyah(audioAyahIdx); }
    else audioClose();
  }
  function onAudioTime() {
    if (!audioEl || !audioEl.duration) return;
    document.getElementById('qrAudioFill').style.width = (audioEl.currentTime / audioEl.duration * 100) + '%';
  }
  function audioToggle() {
    if (!audioEl) return;
    if (audioEl.paused) { audioEl.play(); document.getElementById('qrAudioIcon').className = 'fas fa-pause'; }
    else { audioEl.pause(); document.getElementById('qrAudioIcon').className = 'fas fa-play'; }
  }
  function audioClose() {
    if (audioEl) { audioEl.pause(); try { audioEl.removeAttribute('src'); audioEl.load(); } catch (e) { } }
    document.getElementById('qrAudio').classList.remove('show');
    unhighlightAll();
  }
  function updateAudioInfo() {
    var a = curAyahs[audioAyahIdx];
    if (!a) return;
    document.getElementById('qrAudioTitle').textContent = 'Ayah ' + a.numberInSurah;
    document.getElementById('qrAudioSub').textContent = RECITER_NAMES[getSet().reciter] || '';
  }
  function highlightAyah(idx) {
    unhighlightAll();
    var a = curAyahs[idx];
    if (!a) return;
    var el = document.getElementById('qrV' + a.numberInSurah);
    if (el) el.classList.add('playing');
  }
  function unhighlightAll() {
    document.querySelectorAll('.qr-verse.playing').forEach(function (e) { e.classList.remove('playing'); });
  }
  function cycleSpeed() {
    var speeds = [0.75, 1, 1.25, 1.5];
    audioSpeed = speeds[(speeds.indexOf(audioSpeed) + 1) % speeds.length];
    if (audioEl) audioEl.playbackRate = audioSpeed;
    document.getElementById('qrSpeedBtn').textContent = audioSpeed + 'x';
  }

  window.qrOpenAct = function (su, ay) {
    var a = curAyahs.filter(function (x) { return x.numberInSurah === ay; })[0];
    actData = { surah: su, ayah: ay, text: a ? a.text : '', trans: a ? a.translation : '' };
    document.getElementById('qrActBD').classList.add('show');
    document.getElementById('qrActSheet').classList.add('show');
    document.getElementById('qrActVerse').textContent = actData.text;
    document.getElementById('qrActRef').textContent = su + ':' + ay;
  };
  function closeAct() {
    document.getElementById('qrActBD').classList.remove('show');
    document.getElementById('qrActSheet').classList.remove('show');
  }
  window.qrActCopy = function (k) {
    var t = k === 'en' ? actData.trans : actData.text;
    navigator.clipboard.writeText(t).then(function () { showToast('Copied'); });
  };
  window.qrActBm = function () {
    if (isBookmarked(actData.surah, actData.ayah)) removeBookmark(actData.surah, actData.ayah);
    else addBookmark(actData.surah, actData.ayah);
    showToast('Bookmark updated');
    closeAct();
  };
  window.qrActShare = function () {
    var txt = actData.text + '\n' + actData.trans;
    if (navigator.share) navigator.share({ text: txt });
    else navigator.clipboard.writeText(txt);
  };
  window.qrActPlay = function () {
    var idx = curAyahs.findIndex(function (x) { return x.numberInSurah === actData.ayah; });
    if (idx >= 0) qrPlayAyah(idx);
    closeAct();
  };
  window.qrToggleBmAyah = function (su, ay) {
    if (isBookmarked(su, ay)) removeBookmark(su, ay);
    else addBookmark(su, ay);
    showToast('Bookmark updated');
  };

  function openSettings() {
    document.getElementById('qrSetBD').classList.add('show');
    document.getElementById('qrSetSheet').classList.add('show');
  }
  function closeSettings() {
    document.getElementById('qrSetBD').classList.remove('show');
    document.getElementById('qrSetSheet').classList.remove('show');
  }
  function applySettings() {
    var s = getSet();
    document.getElementById('quranApp').setAttribute('data-theme', s.theme);
    document.querySelectorAll('.qr-theme-dot').forEach(function (d) {
      d.classList.toggle('on', d.getAttribute('data-t') === s.theme);
    });
    document.getElementById('qrFs').value = s.fontSize;
    document.getElementById('qrFsVal').textContent = s.fontSize + 'px';
    document.getElementById('qrTransT').classList.toggle('on', s.showTrans);
    document.getElementById('qrTransSel').value = s.transEd;
    document.getElementById('qrTajT').classList.toggle('on', s.tajweed);
    document.getElementById('qrRecSel').value = s.reciter;
    document.getElementById('qrMemoT').classList.toggle('on', s.memorization);
    document.getElementById('qrRBody').style.fontSize = s.fontSize + 'px';
  }
  window.qrSetTheme = function (t) { putSet('theme', t); applySettings(); };
  window.qrSetFs = function (v) { putSet('fontSize', parseInt(v, 10)); document.getElementById('qrFsVal').textContent = v + 'px'; applySettings(); };
  window.qrToggleTrans = function () { putSet('showTrans', !getSet().showTrans); applySettings(); };
  window.qrSetTrans = function (v) { putSet('transEd', v); };
  window.qrToggleTaj = function () { putSet('tajweed', !getSet().tajweed); applySettings(); };
  window.qrSetRec = function (v) { putSet('reciter', v); };
  window.qrToggleMemo = function () { putSet('memorization', !getSet().memorization); applySettings(); };

  function toggleReaderPicker() {
    var p = document.getElementById('qrPicker');
    var b = document.getElementById('qrPickBD');
    var open = !p.classList.contains('show');
    p.classList.toggle('show', open);
    b.classList.toggle('show', open);
    if (open) {
      p.innerHTML = surahs.map(function (s) {
        return '<div class="qr-pick-item" onclick="window.qrPickFromReader(' + s.number + ')">' + s.number + '. ' + escapeHtml(s.englishName) + '</div>';
      }).join('');
    }
  }
  window.qrPickFromReader = function (n) {
    document.getElementById('qrPicker').classList.remove('show');
    document.getElementById('qrPickBD').classList.remove('show');
    curSurah = n;
    curPage = SURAH_PAGE[n - 1];
    openSurah(n, 1);
  };

  function startRecite() {
    if (!curAyahs.length) { showToast('Load a surah first'); return; }
    reciteAyahIdx = 0;
    reciteMistakes = 0;
    document.getElementById('qrRecite').classList.add('show');
    document.getElementById('qrRecMistakes').textContent = '0';
    updateReciteView();
  }
  function stopRecite() {
    if (reciteRecorder && reciteRecorder.state === 'recording') reciteRecorder.stop();
    if (reciteStream) reciteStream.getTracks().forEach(function (t) { t.stop(); });
    if (reciteWs) { try { reciteWs.send(JSON.stringify({ type: 'stop' })); } catch (e) { } reciteWs.close(); reciteWs = null; }
    document.getElementById('qrRecite').classList.remove('show');
    var fab = document.querySelector('#quranApp .qr-fab');
    if (fab) fab.classList.remove('rec');
  }
  function updateReciteView() {
    var a = curAyahs[reciteAyahIdx];
    if (!a) return;
    document.getElementById('qrRecExp').innerHTML = escapeHtml(a.text).replace(/\n/g, '<br>');
    document.getElementById('qrRecTrans').textContent = '';
    document.getElementById('qrRecStat').textContent = 'Tap mic to start';
  }
  function toggleMicRec() {
    var btn = document.getElementById('qrMicInner');
    if (btn.classList.contains('rec')) {
      btn.classList.remove('rec');
      if (reciteRecorder && reciteRecorder.state === 'recording') reciteRecorder.stop();
      return;
    }
    btn.classList.add('rec');
    if (!reciteWs || reciteWs.readyState !== WebSocket.OPEN) {
      reciteWs = new WebSocket(RECITE_WS + '?session=' + Date.now());
      reciteWs.onopen = function () {
        var a = curAyahs[reciteAyahIdx];
        var sn = a && a.surah && a.surah.number ? a.surah.number : curSurah;
        reciteWs.send(JSON.stringify({ type: 'init', surahNumber: sn, ayahIndex: reciteAyahIdx, expectedText: a ? a.text : '' }));
        startMicRecording();
      };
      reciteWs.onmessage = function (e) {
        try {
          var msg = JSON.parse(e.data);
          if (msg.type === 'transcription') {
            document.getElementById('qrRecTrans').textContent = msg.fullTranscript || msg.segmentText || '';
            matchWords(msg.fullTranscript || '');
          }
        } catch (err) { }
      };
    } else {
      var a2 = curAyahs[reciteAyahIdx];
      reciteWs.send(JSON.stringify({ type: 'update_ayah', ayahIndex: reciteAyahIdx, expectedText: a2 ? a2.text : '' }));
      startMicRecording();
    }
  }
  function startMicRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      reciteStream = stream;
      reciteRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      reciteRecorder.ondataavailable = function (e) {
        if (e.data.size > 0 && reciteWs && reciteWs.readyState === WebSocket.OPEN) e.data.arrayBuffer().then(function (b) { reciteWs.send(b); });
      };
      reciteRecorder.start(3000);
    }).catch(function () { showToast('Mic denied'); });
  }
  function matchWords(transcript) {
    var a = curAyahs[reciteAyahIdx];
    if (!a) return;
    var expected = normalizeAr(a.text).split(/\s+/);
    var spoken = normalizeAr(transcript).split(/\s+/);
    var words = a.text.split(/\s+/);
    var html = '';
    var mistakes = 0;
    words.forEach(function (w, i) {
      var ok = i < spoken.length && normalizeAr(spoken[i]) === normalizeAr(expected[i]);
      if (i < spoken.length && !ok) mistakes++;
      html += (ok ? '<span class="ok">' : '<span class="bad">') + escapeHtml(w) + '</span> ';
    });
    document.getElementById('qrRecExp').innerHTML = html;
    reciteMistakes = mistakes;
    document.getElementById('qrRecMistakes').textContent = String(mistakes);
  }
  function normalizeAr(t) {
    return (t || '').replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, '').replace(/[ٱ]/g, 'ا').replace(/\s+/g, ' ').trim();
  }
  function recitePrev() { if (reciteAyahIdx > 0) { reciteAyahIdx--; updateReciteView(); } }
  function reciteNext() { if (reciteAyahIdx < curAyahs.length - 1) { reciteAyahIdx++; updateReciteView(); } }

  function showToast(m) {
    var t = document.getElementById('qrToast');
    if (!t) return;
    t.textContent = m;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2000);
  }

  function initSwipe() {
    var el = document.getElementById('qrRBody');
    if (!el) return;
    el.addEventListener('touchstart', function (e) {
      if (e.touches.length === 1) { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; }
    }, { passive: true });
    el.addEventListener('touchend', function (e) {
      if (e.changedTouches.length !== 1) return;
      var dx = e.changedTouches[0].clientX - touchStartX;
      var dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx) * 0.55) return;
      if (dx < 0) nextSurah();
      else prevSurah();
    }, { passive: true });
  }

  async function fetchSurahs() {
    try {
      var r = await fetch(API + '/surah');
      var j = await r.json();
      surahs = j.data || [];
      renderSurahList();
      updateContinuePill();
    } catch (e) {
      document.getElementById('qrList').innerHTML = '<p class="qr-muted">Offline — open when online to load surahs.</p>';
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.body.classList.add('quran-standalone');
    var mt = document.getElementById('menuToggle');
    if (mt) {
      document.getElementById('qrMenuBtn').addEventListener('click', function () { mt.click(); });
    }
    applySettings();
    renderLastReadChips();
    updateStreak();
    updateContinuePill();
    fetchSurahs();
    setTimeout(initSwipe, 400);
  });

  window.qrShowHome = showHome;
  window.qrSwitchTab = switchTab;
  window.qrFilterList = filterList;
  window.qrResume = resumeReading;
  window.qrOpenContents = openContentsSheet;
  window.qrCloseContents = closeContentsSheet;
  window.qrToggleAuto = toggleAutoScroll;
  window.qrToggleAudio = toggleAudioBar;
  window.qrAudioToggle = audioToggle;
  window.qrAudioClose = audioClose;
  window.qrAudioSeek = function (e) {
    if (!audioEl || !audioEl.duration) return;
    var rect = e.currentTarget.getBoundingClientRect();
    audioEl.currentTime = ((e.clientX - rect.left) / rect.width) * audioEl.duration;
  };
  window.qrCycleSpeed = cycleSpeed;
  window.qrOpenSettings = openSettings;
  window.qrCloseSettings = closeSettings;
  window.qrPrevSurah = prevSurah;
  window.qrNextSurah = nextSurah;
  window.qrTogglePicker = toggleReaderPicker;
  window.qrClosePicker = function () {
    document.getElementById('qrPicker').classList.remove('show');
    document.getElementById('qrPickBD').classList.remove('show');
  };
  window.qrStartRecite = startRecite;
  window.qrStopRecite = stopRecite;
  window.qrToggleMic = toggleMicRec;
  window.qrRecPrev = recitePrev;
  window.qrRecNext = reciteNext;
  window.qrCloseAct = closeAct;
})();
