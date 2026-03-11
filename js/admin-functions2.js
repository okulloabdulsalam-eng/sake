// ==============================
// KIUMA Admin Functions — Part 2
// Upload, Settings, Firestore tabs
// ==============================

// --- Media Upload ---
async function handleMediaUpload(files) {
    if (!files || files.length === 0) return;
    const type = document.getElementById('mediaType')?.value || 'video';
    const title = document.getElementById('mediaTitle')?.value?.trim() || '';
    const author = document.getElementById('mediaAuthor')?.value?.trim() || '';
    const category = document.getElementById('mediaCategory')?.value?.trim() || 'general';
    const progressBar = document.getElementById('mediaProgress');
    const statusEl = document.getElementById('mediaUploadStatus');
    if (typeof saveMediaCategory === 'function') saveMediaCategory(category);

    let uploaded = 0, failed = 0;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const safeName = (title || file.name).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.\-]/g, '');
        const key = 'media/' + type + '/' + Date.now() + '_' + safeName;
        if (progressBar) progressBar.style.width = Math.round((i / files.length) * 100) + '%';
        if (statusEl) { statusEl.className = 'alert'; statusEl.textContent = 'Uploading ' + (i + 1) + ' of ' + files.length + '...'; statusEl.style.display = 'block'; }

        // Try R2 first
        let success = false;
        try {
            let acct = null;
            if (type === 'video' && typeof findAvailableVideoAccount === 'function') {
                const result = await findAvailableVideoAccount(file.size);
                if (result) acct = result.account;
            }
            if (!acct) {
                const mc = typeof getR2MultiConfig === 'function' ? getR2MultiConfig() : null;
                if (type === 'audio' && mc?.audio?.workerUrl) acct = mc.audio;
                else if (mc?.video?.[0]?.workerUrl) acct = mc.video[0];
            }
            if (acct && acct.workerUrl) {
                const token = acct.adminToken || (typeof _R2_DEFAULT_TOKEN !== 'undefined' ? _R2_DEFAULT_TOKEN : '');
                const res = await fetch(acct.workerUrl + '/upload', {
                    method: 'PUT',
                    headers: { 'X-Admin-Token': token, 'X-File-Name': key, 'Content-Type': file.type || 'application/octet-stream' },
                    body: file
                });
                if (res.ok) { success = true; uploaded++; }
            }
        } catch (e) { console.warn('R2 upload failed:', e); }

        // Fallback to GitHub
        if (!success) {
            try {
                const config = typeof getGitHubConfig === 'function' ? getGitHubConfig() : {};
                if (config.token && config.owner && config.repo) {
                    const reader = new FileReader();
                    const content = await new Promise((resolve, reject) => {
                        reader.onload = () => resolve(reader.result.split(',')[1]);
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });
                    const ghPath = (config.mediaPath || 'media') + '/' + key.split('/').pop();
                    const res = await fetch('https://api.github.com/repos/' + config.owner + '/' + config.repo + '/contents/' + ghPath, {
                        method: 'PUT',
                        headers: { 'Authorization': 'token ' + config.token, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: 'Upload: ' + ghPath, content, branch: config.branch || 'main' })
                    });
                    if (res.ok) { uploaded++; } else { failed++; }
                } else { failed++; }
            } catch (e) { failed++; }
        }
    }
    if (progressBar) progressBar.style.width = '100%';
    showStatus('mediaUploadStatus', 'Uploaded ' + uploaded + ' file(s)' + (failed ? ', ' + failed + ' failed' : ''), failed ? 'error' : 'success');
    document.getElementById('mediaFileInput').value = '';
    loadMediaList();
    if (typeof checkAllR2Storage === 'function') checkAllR2Storage();
}

// --- Library Upload ---
async function handleLibraryUpload(files) {
    if (!files || files.length === 0) return;
    const category = document.getElementById('bookCategory')?.value || 'islamic';
    const collection = document.getElementById('bookCollection')?.value?.trim() || '';
    const progressBar = document.getElementById('libraryProgress');
    if (typeof saveBookCollection === 'function' && collection) saveBookCollection(collection);

    let uploaded = 0, failed = 0;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const safeName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.\-]/g, '');
        const key = 'library/' + category + '/' + Date.now() + '_' + safeName;
        if (progressBar) progressBar.style.width = Math.round((i / files.length) * 100) + '%';
        try {
            const mc = typeof getR2MultiConfig === 'function' ? getR2MultiConfig() : null;
            if (mc?.library?.workerUrl) {
                const token = mc.library.adminToken || (typeof _R2_DEFAULT_TOKEN !== 'undefined' ? _R2_DEFAULT_TOKEN : '');
                const res = await fetch(mc.library.workerUrl + '/upload', {
                    method: 'PUT',
                    headers: { 'X-Admin-Token': token, 'X-File-Name': key, 'Content-Type': file.type || 'application/octet-stream' },
                    body: file
                });
                if (res.ok) uploaded++; else failed++;
            } else { failed++; }
        } catch (e) { failed++; }
    }
    if (progressBar) progressBar.style.width = '100%';
    showStatus('libraryUploadStatus', 'Uploaded ' + uploaded + ' book(s)' + (failed ? ', ' + failed + ' failed' : ''), failed ? 'error' : 'success');
    document.getElementById('libraryFileInput').value = '';
    loadLibraryList();
}

// --- R2 Settings ---
function loadR2SettingsUI() {
    if (typeof renderVideoAccountsUI === 'function') renderVideoAccountsUI();
    const mc = typeof getR2MultiConfig === 'function' ? getR2MultiConfig() : {};
    if (mc.audio?.workerUrl) { const el = document.getElementById('audioWorkerUrl'); if (el) el.value = mc.audio.workerUrl; }
    if (mc.library?.workerUrl) { const el = document.getElementById('libraryWorkerUrl'); if (el) el.value = mc.library.workerUrl; }
}

function saveAllR2Settings() {
    const mc = typeof getR2MultiConfig === 'function' ? getR2MultiConfig() : {};
    // Save video accounts
    if (mc.video) {
        mc.video.forEach((acct, i) => {
            const urlEl = document.getElementById('videoUrl_' + i);
            const tokenEl = document.getElementById('videoToken_' + i);
            if (urlEl) acct.workerUrl = urlEl.value.trim();
            if (tokenEl) acct.adminToken = tokenEl.value.trim();
        });
    }
    // Audio
    const audioUrl = document.getElementById('audioWorkerUrl');
    if (audioUrl && mc.audio) mc.audio.workerUrl = audioUrl.value.trim();
    // Library
    const libUrl = document.getElementById('libraryWorkerUrl');
    if (libUrl && mc.library) mc.library.workerUrl = libUrl.value.trim();
    localStorage.setItem('r2MultiConfig', JSON.stringify(mc));
    showStatus('r2SettingsStatus', 'R2 settings saved!', 'success');
}

async function checkAllR2Storage() {
    const mc = typeof getR2MultiConfig === 'function' ? getR2MultiConfig() : {};
    if (mc.video) {
        for (let i = 0; i < mc.video.length; i++) {
            if (!mc.video[i].workerUrl) continue;
            try {
                const storage = await checkAccountStorage(mc.video[i].workerUrl);
                const bar = document.getElementById('videoBar_' + i);
                const text = document.getElementById('videoStorageText_' + i);
                if (bar) bar.style.width = (storage.usagePercent || 0) + '%';
                if (text) text.textContent = (storage.totalGB || 0) + ' GB / 10 GB (' + storage.fileCount + ' files)';
            } catch (e) {}
        }
    }
}

// --- GitHub Settings ---
function loadGitHubSettingsUI() {
    const config = typeof getGitHubConfig === 'function' ? getGitHubConfig() : {};
    const fields = { 'githubOwner': config.owner, 'githubRepo': config.repo, 'githubBranch': config.branch, 'githubToken': config.token };
    Object.keys(fields).forEach(id => { const el = document.getElementById(id); if (el) el.value = fields[id] || ''; });
}

function saveGitHubSettings() {
    const config = {
        owner: document.getElementById('githubOwner')?.value?.trim() || '',
        repo: document.getElementById('githubRepo')?.value?.trim() || '',
        branch: document.getElementById('githubBranch')?.value?.trim() || 'main',
        token: document.getElementById('githubToken')?.value?.trim() || '',
        mediaPath: 'media', libraryPath: 'library', notificationsPath: 'notifications/notifications.json'
    };
    localStorage.setItem('githubStorageConfig', JSON.stringify(config));
    showStatus('githubSettingsStatus', 'GitHub settings saved!', 'success');
    if (config.token) { if (typeof saveEncryptedTokenToGitHub === 'function') saveEncryptedTokenToGitHub(config.token); }
}

async function testGitHubConnection() {
    const config = typeof getGitHubConfig === 'function' ? getGitHubConfig() : {};
    if (!config.owner || !config.repo) { showStatus('githubSettingsStatus', 'Owner and repo are required.', 'error'); return; }
    try {
        const headers = config.token ? { 'Authorization': 'token ' + config.token } : {};
        const res = await fetch('https://api.github.com/repos/' + config.owner + '/' + config.repo, { headers });
        if (res.ok) showStatus('githubSettingsStatus', 'Connected to ' + config.owner + '/' + config.repo + '!', 'success');
        else showStatus('githubSettingsStatus', 'Failed: ' + res.status, 'error');
    } catch (e) { showStatus('githubSettingsStatus', 'Connection failed: ' + e.message, 'error'); }
}

function changeAdminPassword() {
    const current = document.getElementById('currentPassword')?.value;
    const newPw = document.getElementById('newPassword')?.value;
    const confirm = document.getElementById('confirmPassword')?.value;
    if (current !== ADMIN_PASSWORD) { showStatus('passwordChangeStatus', 'Current password is incorrect.', 'error'); return; }
    if (!newPw || newPw.length < 4) { showStatus('passwordChangeStatus', 'New password must be at least 4 characters.', 'error'); return; }
    if (newPw !== confirm) { showStatus('passwordChangeStatus', 'Passwords do not match.', 'error'); return; }
    showStatus('passwordChangeStatus', 'Password change not persisted (hardcoded). Update ADMIN_PASSWORD in code.', 'error');
}

// --- Firestore-based admin tabs ---
async function loadPrayerTimesAdmin() {
    const db = getDb();
    if (!db) { showStatus('prayerTimesStatus', 'Firestore not available.', 'error'); return; }
    try {
        const doc = await db.collection('config').doc('prayerTimes').get();
        if (doc.exists) {
            const data = doc.data();
            const prayers = ['Fajr','Dhuhr','Asr','Maghrib','Isha','Jumuah'];
            prayers.forEach(p => {
                const key = p.toLowerCase();
                if (data[key]) {
                    const adhanEl = document.getElementById('pt'+p+'Adhan');
                    const iqaamaEl = document.getElementById('pt'+p+'Iqaama');
                    if (adhanEl && data[key].adhan) adhanEl.value = data[key].adhan;
                    if (iqaamaEl && data[key].iqaama) iqaamaEl.value = data[key].iqaama;
                }
            });
            showStatus('prayerTimesStatus', 'Prayer times loaded from Firestore.', 'success');
        } else {
            showStatus('prayerTimesStatus', 'No prayer times saved yet. Enter times and save.', 'success');
        }
    } catch (e) { showStatus('prayerTimesStatus', 'Failed to load: ' + e.message, 'error'); }
}

async function savePrayerTimes() {
    const db = getDb();
    if (!db) { showStatus('prayerTimesStatus', 'Firestore not available.', 'error'); return; }
    const prayers = ['Fajr','Dhuhr','Asr','Maghrib','Isha','Jumuah'];
    const data = { updatedAt: new Date().toISOString() };
    prayers.forEach(p => {
        data[p.toLowerCase()] = {
            adhan: document.getElementById('pt'+p+'Adhan')?.value || '',
            iqaama: document.getElementById('pt'+p+'Iqaama')?.value || ''
        };
    });
    try {
        await db.collection('config').doc('prayerTimes').set(data, {merge:true});
        showStatus('prayerTimesStatus', 'Prayer times saved!', 'success');
    } catch (e) { showStatus('prayerTimesStatus', 'Failed to save: ' + e.message, 'error'); }
}

async function loadEventsAdmin() {
    const db = getDb();
    const container = document.getElementById('adminEventsList');
    if (!db || !container) { if (container) container.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">Firestore not available.</p>'; return; }
    container.innerHTML = '<p style="text-align:center;color:#888;padding:20px;"><i class="fas fa-spinner fa-spin"></i> Loading...</p>';
    try {
        const snap = await db.collection('events').orderBy('date','desc').limit(50).get();
        if (snap.empty) { container.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">No events yet. Create one above!</p>'; return; }
        let html = '';
        snap.forEach(doc => {
            const e = doc.data();
            html += '<div class="file-item" style="padding:12px;margin-bottom:8px;background:#f9f9f9;border-radius:10px;display:flex;align-items:center;gap:12px;">';
            html += '<div style="width:40px;height:40px;border-radius:10px;background:rgba(33,150,243,0.12);display:flex;align-items:center;justify-content:center;"><i class="fas fa-calendar-alt" style="color:#1565C0;"></i></div>';
            html += '<div style="flex:1;"><div style="font-weight:600;">'+(e.title||'Untitled')+'</div><div style="font-size:12px;color:#888;">'+(e.date||'')+(e.time?' · '+e.time:'')+(e.venue?' · '+e.venue:'')+'</div></div>';
            html += '<button class="btn-icon btn-danger" onclick="deleteEvent(\''+doc.id+'\')"><i class="fas fa-trash"></i></button>';
            html += '</div>';
        });
        container.innerHTML = html;
    } catch (e) { container.innerHTML = '<p style="color:#e53935;padding:20px;text-align:center;">Error: '+e.message+'</p>'; }
}

async function saveEvent() {
    const db = getDb();
    if (!db) { showStatus('eventFormStatus', 'Firestore not available.', 'error'); return; }
    const title = document.getElementById('eventTitle')?.value?.trim();
    if (!title) { showStatus('eventFormStatus', 'Title is required.', 'error'); return; }
    const data = {
        title, date: document.getElementById('eventDate')?.value || '',
        time: document.getElementById('eventTime')?.value || '',
        venue: document.getElementById('eventVenue')?.value?.trim() || '',
        description: document.getElementById('eventDescription')?.value?.trim() || '',
        category: document.getElementById('eventCategory')?.value || 'general',
        createdAt: new Date().toISOString()
    };
    try {
        await db.collection('events').add(data);
        showStatus('eventFormStatus', 'Event saved!', 'success');
        ['eventTitle','eventVenue','eventDescription'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        loadEventsAdmin();
    } catch (e) { showStatus('eventFormStatus', 'Failed: ' + e.message, 'error'); }
}

async function deleteEvent(id) {
    if (!confirm('Delete this event?')) return;
    const db = getDb();
    if (!db) return;
    try { await db.collection('events').doc(id).delete(); loadEventsAdmin(); } catch(e) { alert('Failed: '+e.message); }
}

async function loadAnnouncementAdmin() {
    const db = getDb();
    if (!db) { showStatus('announcementStatus', 'Firestore not available.', 'error'); return; }
    try {
        const doc = await db.collection('config').doc('announcement').get();
        if (doc.exists) {
            const d = doc.data();
            if (document.getElementById('announcementTitle')) document.getElementById('announcementTitle').value = d.title || '';
            if (document.getElementById('announcementMessage')) document.getElementById('announcementMessage').value = d.message || '';
            if (document.getElementById('announcementType')) document.getElementById('announcementType').value = d.type || 'info';
            if (document.getElementById('announcementExpiry')) document.getElementById('announcementExpiry').value = d.expiry || '';
            if (document.getElementById('announcementActive')) document.getElementById('announcementActive').checked = d.active !== false;
            showStatus('announcementStatus', 'Announcement loaded.', 'success');
        }
    } catch (e) { showStatus('announcementStatus', 'Failed: ' + e.message, 'error'); }
}

async function saveAnnouncement() {
    const db = getDb();
    if (!db) { showStatus('announcementStatus', 'Firestore not available.', 'error'); return; }
    const data = {
        title: document.getElementById('announcementTitle')?.value?.trim() || '',
        message: document.getElementById('announcementMessage')?.value?.trim() || '',
        type: document.getElementById('announcementType')?.value || 'info',
        expiry: document.getElementById('announcementExpiry')?.value || '',
        active: document.getElementById('announcementActive')?.checked !== false,
        updatedAt: new Date().toISOString()
    };
    if (!data.title) { showStatus('announcementStatus', 'Title is required.', 'error'); return; }
    try {
        await db.collection('config').doc('announcement').set(data, {merge:true});
        showStatus('announcementStatus', 'Announcement saved!', 'success');
    } catch (e) { showStatus('announcementStatus', 'Failed: ' + e.message, 'error'); }
}

async function clearAnnouncement() {
    const db = getDb();
    if (!db) return;
    try {
        await db.collection('config').doc('announcement').set({active:false, updatedAt:new Date().toISOString()}, {merge:true});
        showStatus('announcementStatus', 'Announcement deactivated.', 'success');
    } catch(e) { showStatus('announcementStatus', 'Failed: '+e.message, 'error'); }
}

// --- Trackers ---
function onTrackerTypeChange() {
    const type = document.getElementById('trackerType')?.value;
    const results = document.getElementById('trackerResultsFields');
    const amounts = document.getElementById('trackerAmountFields');
    if (results) results.style.display = type === 'results' ? '' : 'none';
    if (amounts) amounts.style.display = type !== 'results' ? '' : 'none';
}

async function loadTrackersAdmin() {
    const db = getDb();
    const container = document.getElementById('adminTrackersList');
    if (!db || !container) { if (container) container.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">Firestore not available.</p>'; return; }
    container.innerHTML = '<p style="text-align:center;color:#888;padding:20px;"><i class="fas fa-spinner fa-spin"></i> Loading...</p>';
    try {
        const snap = await db.collection('trackers').orderBy('createdAt','desc').limit(20).get();
        if (snap.empty) { container.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">No trackers yet.</p>'; return; }
        let html = '';
        snap.forEach(doc => {
            const t = doc.data();
            html += '<div class="file-item" style="padding:12px;margin-bottom:8px;background:#f9f9f9;border-radius:10px;display:flex;align-items:center;gap:12px;">';
            html += '<div style="flex:1;"><div style="font-weight:600;">'+(t.title||'Untitled')+'</div><div style="font-size:12px;color:#888;">'+t.type+' · '+(t.active?'Active':'Inactive')+'</div></div>';
            html += '<button class="btn-icon btn-danger" onclick="deleteTracker(\''+doc.id+'\')"><i class="fas fa-trash"></i></button>';
            html += '</div>';
        });
        container.innerHTML = html;
    } catch(e) { container.innerHTML = '<p style="color:#e53935;padding:20px;text-align:center;">Error: '+e.message+'</p>'; }
}

async function saveTracker() {
    const db = getDb();
    if (!db) { showStatus('trackerFormStatus', 'Firestore not available.', 'error'); return; }
    const title = document.getElementById('trackerTitle')?.value?.trim();
    if (!title) { showStatus('trackerFormStatus', 'Title is required.', 'error'); return; }
    const type = document.getElementById('trackerType')?.value || 'results';
    const data = {
        title, type, description: document.getElementById('trackerDescription')?.value?.trim() || '',
        active: document.getElementById('trackerActive')?.checked !== false,
        expiry: document.getElementById('trackerExpiry')?.value || '',
        createdAt: new Date().toISOString()
    };
    if (type === 'results') data.results = document.getElementById('trackerResultsText')?.value || '';
    else {
        data.goalAmount = parseFloat(document.getElementById('trackerGoalAmount')?.value) || 0;
        data.currentAmount = parseFloat(document.getElementById('trackerCurrentAmount')?.value) || 0;
        data.purpose = document.getElementById('trackerPurpose')?.value?.trim() || '';
        data.donationLink = document.getElementById('trackerDonationLink')?.value?.trim() || '';
    }
    try {
        await db.collection('trackers').add(data);
        showStatus('trackerFormStatus', 'Tracker saved!', 'success');
        resetTrackerForm();
        loadTrackersAdmin();
    } catch(e) { showStatus('trackerFormStatus', 'Failed: '+e.message, 'error'); }
}

function resetTrackerForm() {
    ['trackerTitle','trackerDescription','trackerResultsText','trackerGoalAmount','trackerCurrentAmount','trackerPurpose','trackerDonationLink','trackerExpiry'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
    });
}

async function deleteTracker(id) {
    if (!confirm('Delete this tracker?')) return;
    const db = getDb();
    if (!db) return;
    try { await db.collection('trackers').doc(id).delete(); loadTrackersAdmin(); } catch(e) { alert('Failed: '+e.message); }
}

// --- Mosques ---
async function loadPendingMosques() {
    const db = getDb();
    const container = document.getElementById('pendingMosquesList');
    if (!db || !container) { if (container) container.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">Firestore not available.</p>'; return; }
    container.innerHTML = '<p style="text-align:center;color:#888;padding:20px;"><i class="fas fa-spinner fa-spin"></i> Loading...</p>';
    try {
        const snap = await db.collection('mosques').where('status','==','pending').limit(50).get();
        if (snap.empty) { container.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">No pending submissions.</p>'; return; }
        let html = '';
        snap.forEach(doc => {
            const m = doc.data();
            html += '<div class="file-item" style="padding:12px;margin-bottom:8px;background:#f9f9f9;border-radius:10px;">';
            html += '<div style="font-weight:600;">'+(m.name||'Unnamed Mosque')+'</div>';
            html += '<div style="font-size:12px;color:#888;">'+(m.address||'')+(m.city?' · '+m.city:'')+'</div>';
            html += '<div style="margin-top:8px;display:flex;gap:8px;">';
            html += '<button class="btn btn-primary" style="padding:6px 14px;font-size:12px;" onclick="approveMosque(\''+doc.id+'\')"><i class="fas fa-check"></i> Approve</button>';
            html += '<button class="btn btn-outline" style="padding:6px 14px;font-size:12px;border-color:#e53935;color:#e53935;" onclick="rejectMosque(\''+doc.id+'\')"><i class="fas fa-times"></i> Reject</button>';
            html += '</div></div>';
        });
        container.innerHTML = html;
    } catch(e) { container.innerHTML = '<p style="color:#e53935;padding:20px;text-align:center;">Error: '+e.message+'</p>'; }
}

async function loadAllMosques() {
    const db = getDb();
    const container = document.getElementById('pendingMosquesList');
    if (!db || !container) return;
    container.innerHTML = '<p style="text-align:center;color:#888;padding:20px;"><i class="fas fa-spinner fa-spin"></i> Loading all...</p>';
    try {
        const snap = await db.collection('mosques').limit(100).get();
        if (snap.empty) { container.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">No mosques.</p>'; return; }
        let html = '';
        snap.forEach(doc => {
            const m = doc.data();
            const statusColor = m.status === 'approved' ? '#4CAF50' : m.status === 'rejected' ? '#e53935' : '#FF9800';
            html += '<div class="file-item" style="padding:12px;margin-bottom:8px;background:#f9f9f9;border-radius:10px;display:flex;align-items:center;gap:12px;">';
            html += '<div style="flex:1;"><div style="font-weight:600;">'+(m.name||'Unnamed')+'</div><div style="font-size:12px;color:#888;">'+(m.address||'')+'</div></div>';
            html += '<span style="font-size:11px;padding:3px 10px;border-radius:6px;background:'+statusColor+'22;color:'+statusColor+';font-weight:600;">'+(m.status||'pending')+'</span>';
            html += '</div>';
        });
        container.innerHTML = html;
    } catch(e) { container.innerHTML = '<p style="color:#e53935;padding:20px;">Error: '+e.message+'</p>'; }
}

async function approveMosque(id) {
    const db = getDb(); if (!db) return;
    try { await db.collection('mosques').doc(id).update({status:'approved'}); loadPendingMosques(); } catch(e) { alert('Failed: '+e.message); }
}

async function rejectMosque(id) {
    const db = getDb(); if (!db) return;
    try { await db.collection('mosques').doc(id).update({status:'rejected'}); loadPendingMosques(); } catch(e) { alert('Failed: '+e.message); }
}

// --- Payments ---
async function loadPaymentsReceiptBook() {
    const db = getDb();
    const container = document.getElementById('paymentsReceiptList');
    if (!db || !container) { if (container) container.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">Firestore not available.</p>'; return; }
    container.innerHTML = '<p style="text-align:center;color:#888;padding:20px;"><i class="fas fa-spinner fa-spin"></i> Loading payments...</p>';
    try {
        const snap = await db.collection('payments').orderBy('createdAt','desc').limit(100).get();
        if (snap.empty) { container.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">No payments recorded yet.</p>'; return; }
        let html = '<table style="width:100%;border-collapse:collapse;font-size:13px;">';
        html += '<thead><tr style="background:#f5f5f5;"><th style="padding:10px;text-align:left;">Name</th><th style="padding:10px;text-align:left;">Amount</th><th style="padding:10px;text-align:left;">Category</th><th style="padding:10px;text-align:left;">Date</th><th style="padding:10px;text-align:left;">Status</th></tr></thead><tbody>';
        snap.forEach(doc => {
            const p = doc.data();
            const statusColor = p.status === 'completed' ? '#4CAF50' : '#FF9800';
            html += '<tr style="border-bottom:1px solid #eee;">';
            html += '<td style="padding:10px;">'+(p.name||p.email||'Unknown')+'</td>';
            html += '<td style="padding:10px;font-weight:600;">UGX '+(p.amount||0).toLocaleString()+'</td>';
            html += '<td style="padding:10px;">'+(p.category||'General')+'</td>';
            html += '<td style="padding:10px;">'+(p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '')+'</td>';
            html += '<td style="padding:10px;"><span style="color:'+statusColor+';font-weight:600;">'+(p.status||'pending')+'</span></td>';
            html += '</tr>';
        });
        html += '</tbody></table>';
        container.innerHTML = html;
    } catch(e) { container.innerHTML = '<p style="color:#e53935;padding:20px;text-align:center;">Error: '+e.message+'</p>'; }
}

// --- Init on load ---
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        initNotificationForm();
        if (typeof loadNotificationsFromGitHub === 'function') loadNotificationsFromGitHub(false).then(function() { renderAdminNotificationsList(); });
        if (typeof syncNotificationsFromFirestore === 'function') syncNotificationsFromFirestore();
        loadMediaList();
        loadLibraryList();
    }, 1500);
});
