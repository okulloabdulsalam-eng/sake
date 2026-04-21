// ==============================
// KIUMA Admin Panel — Fallback Functions
// These only define if NOT already defined by the inline script in admin.html
// (The inline script has complete Firestore/FCM-aware versions)
// ==============================

// --- Utility (always safe to define — these are simple helpers) ---
if (typeof getDb !== 'function') {
    window.getDb = function() {
        return window.firebaseDb || null;
    };
}

if (typeof formatFileSize !== 'function') {
    window.formatFileSize = function(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
}

if (typeof showStatus !== 'function') {
    window.showStatus = function(elementId, message, type) {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.className = 'alert ' + (type === 'error' ? 'error' : 'success');
        el.textContent = message;
        el.style.display = 'block';
        if (type === 'success') setTimeout(() => { el.style.display = 'none'; }, 5000);
    };
}

if (typeof updateStats !== 'function') {
    window.updateStats = function() { if (typeof updateAdminStats === 'function') updateAdminStats(); };
}

// --- Notifications ---
// IMPORTANT: These are guarded so they do NOT overwrite the complete
// Firestore/FCM-aware versions defined in admin.html inline script.

if (typeof saveNotificationsToStorage !== 'function') {
    window.saveNotificationsToStorage = function(list) {
        try { localStorage.setItem('adminNotificationsList', JSON.stringify(list)); } catch(e) {}
    };
}

if (typeof initNotificationForm !== 'function') {
    window.initNotificationForm = function() {
        if (typeof notificationManagerInitialized !== 'undefined' && notificationManagerInitialized) return;
        notificationManagerInitialized = true;
        const catSelect = document.getElementById('notificationCategory');
        const iconSelect = document.getElementById('notificationIcon');
        if (catSelect && catSelect.options.length === 0 && typeof notificationCategories !== 'undefined') {
            notificationCategories.forEach(c => {
                catSelect.innerHTML += '<option value="'+c.value+'">'+c.label+'</option>';
            });
        }
        if (iconSelect && iconSelect.options.length === 0 && typeof notificationIconOptions !== 'undefined') {
            notificationIconOptions.forEach(i => {
                iconSelect.innerHTML += '<option value="'+i.value+'">'+i.label+'</option>';
            });
        }
        ['notificationTitle','notificationMessage','notificationCategory','notificationIcon'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', updateNotificationPreview);
            if (el) el.addEventListener('change', updateNotificationPreview);
        });
    };
}

if (typeof updateNotificationPreview !== 'function') {
    window.updateNotificationPreview = function() {
        const title = document.getElementById('notificationTitle')?.value || 'Notification title';
        const msg = document.getElementById('notificationMessage')?.value || 'Notification message preview...';
        const cat = document.getElementById('notificationCategory')?.value || 'general';
        const icon = document.getElementById('notificationIcon')?.value || 'fas fa-bell';
        const previewTitle = document.querySelector('.notification-preview-title');
        const previewMsg = document.querySelector('.notification-preview-message');
        const previewCat = document.querySelector('.notification-preview-category');
        const previewIcon = document.querySelector('.notification-preview-icon');
        if (previewTitle) previewTitle.textContent = title;
        if (previewMsg) previewMsg.textContent = msg;
        if (previewCat) previewCat.textContent = cat;
        if (previewIcon) previewIcon.className = 'notification-preview-icon ' + icon;
    };
}

if (typeof renderAdminNotificationsList !== 'function') {
    window.renderAdminNotificationsList = function() {
        const container = document.getElementById('adminNotificationsList');
        if (!container) return;
        if (typeof currentNotifications === 'undefined' || currentNotifications.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">No notifications yet</p>';
            return;
        }
        let html = '';
        currentNotifications.forEach(n => {
            html += '<div class="file-item" style="display:flex;align-items:center;gap:12px;padding:12px;margin-bottom:8px;background:#f9f9f9;border-radius:10px;">';
            html += '<div style="width:36px;height:36px;border-radius:8px;background:rgba(76,175,80,0.12);display:flex;align-items:center;justify-content:center;"><i class="'+(n.icon||'fas fa-bell')+'" style="color:var(--primary-green);"></i></div>';
            html += '<div style="flex:1;"><div style="font-weight:600;">'+(n.title||'Untitled')+'</div><div style="font-size:12px;color:#888;">'+(n.message||'').substring(0,80)+'</div></div>';
            html += '<div style="display:flex;gap:6px;">';
            html += '<button class="btn-icon btn-primary" onclick="editNotification(\''+n.id+'\')"><i class="fas fa-pen"></i></button>';
            html += '<button class="btn-icon btn-danger" onclick="deleteNotification(\''+n.id+'\')"><i class="fas fa-trash"></i></button>';
            html += '</div></div>';
        });
        container.innerHTML = html;
    };
}

if (typeof saveNotification !== 'function') {
    window.saveNotification = async function(send) {
        const title = document.getElementById('notificationTitle')?.value?.trim();
        const message = document.getElementById('notificationMessage')?.value?.trim();
        const category = document.getElementById('notificationCategory')?.value || 'general';
        const icon = document.getElementById('notificationIcon')?.value || 'fas fa-bell';
        if (!title || !message) { showStatus('notificationStatus','Please fill in title and message.','error'); return; }
        const id = (typeof editingNotificationId !== 'undefined' && editingNotificationId) ? editingNotificationId : 'notif_'+Date.now().toString(36)+Math.random().toString(36).substr(2,4);
        const notification = { id, title, message, category, icon, status: send ? 'sent' : 'draft', date: new Date().toISOString(), createdAt: new Date().toISOString(), sentCount: send ? 1 : 0 };
        if (typeof currentNotifications !== 'undefined') {
            const idx = currentNotifications.findIndex(n => n.id === id);
            if (idx >= 0) currentNotifications[idx] = {...currentNotifications[idx], ...notification};
            else currentNotifications.unshift(notification);
        }
        saveNotificationsToStorage(currentNotifications);
        if (typeof upsertNotificationInFirestore === 'function') await upsertNotificationInFirestore(notification);
        if (typeof saveNotificationsToGitHub === 'function') await saveNotificationsToGitHub(currentNotifications, {showStatusMessage:false});
        renderAdminNotificationsList();
        if (typeof resetNotificationForm === 'function') resetNotificationForm();
        showStatus('notificationStatus', send ? 'Notification sent!' : 'Draft saved!', 'success');
    };
}

if (typeof editNotification !== 'function') {
    window.editNotification = function(id) {
        if (typeof currentNotifications === 'undefined') return;
        const n = currentNotifications.find(x => x.id === id);
        if (!n) return;
        editingNotificationId = id;
        document.getElementById('notificationTitle').value = n.title || '';
        document.getElementById('notificationMessage').value = n.message || '';
        if (document.getElementById('notificationCategory')) document.getElementById('notificationCategory').value = n.category || 'general';
        if (document.getElementById('notificationIcon')) document.getElementById('notificationIcon').value = n.icon || 'fas fa-bell';
        const banner = document.getElementById('notificationEditBanner');
        if (banner) { banner.style.display = 'block'; }
        const editTitle = document.getElementById('notificationEditTitle');
        if (editTitle) editTitle.textContent = n.title;
        if (typeof updateNotificationPreview === 'function') updateNotificationPreview();
    };
}

if (typeof cancelNotificationEditing !== 'function') {
    window.cancelNotificationEditing = function() {
        editingNotificationId = null;
        const banner = document.getElementById('notificationEditBanner');
        if (banner) banner.style.display = 'none';
        if (typeof resetNotificationForm === 'function') resetNotificationForm();
    };
}

if (typeof resetNotificationForm !== 'function') {
    window.resetNotificationForm = function() {
        editingNotificationId = null;
        ['notificationTitle','notificationMessage'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        const banner = document.getElementById('notificationEditBanner');
        if (banner) banner.style.display = 'none';
        if (typeof updateNotificationPreview === 'function') updateNotificationPreview();
    };
}

if (typeof deleteNotification !== 'function') {
    window.deleteNotification = async function(id) {
        if (!confirm('Delete this notification?')) return;
        if (typeof currentNotifications !== 'undefined') {
            currentNotifications = currentNotifications.filter(n => n.id !== id);
        }
        saveNotificationsToStorage(currentNotifications);
        if (typeof deleteNotificationFromFirestore === 'function') await deleteNotificationFromFirestore(id);
        if (typeof saveNotificationsToGitHub === 'function') await saveNotificationsToGitHub(currentNotifications, {showStatusMessage:false});
        renderAdminNotificationsList();
        showStatus('notificationStatus', 'Notification deleted.', 'success');
    };
}

if (typeof clearAllNotifications !== 'function') {
    window.clearAllNotifications = async function() {
        if (!confirm('Delete ALL notifications? This cannot be undone.')) return;
        currentNotifications = [];
        saveNotificationsToStorage([]);
        if (typeof clearNotificationsInFirestore === 'function') await clearNotificationsInFirestore();
        if (typeof saveNotificationsToGitHub === 'function') await saveNotificationsToGitHub([], {showStatusMessage:false});
        renderAdminNotificationsList();
        showStatus('notificationStatus', 'All notifications cleared.', 'success');
    };
}

if (typeof syncNotificationsFromGitHub !== 'function') {
    window.syncNotificationsFromGitHub = async function() {
        showStatus('notificationStatus', 'Syncing...', 'success');
        if (typeof loadNotificationsFromGitHub === 'function') await loadNotificationsFromGitHub(true);
        renderAdminNotificationsList();
    };
}

// --- Media & Library ---
// These are always safe to define (not duplicated in inline scripts)
window._mediaFiles = window._mediaFiles || [];
window._libraryFiles = window._libraryFiles || [];

async function loadMediaList() {
    const container = document.getElementById('mediaFileList');
    if (!container) return;
    container.innerHTML = '<p style="text-align:center;color:#888;padding:20px;"><i class="fas fa-spinner fa-spin"></i> Loading media...</p>';
    let files = [];
    // Try R2
    try {
        const mc = typeof getR2MultiConfig === 'function' ? getR2MultiConfig() : null;
        if (mc) {
            const allAccounts = [...(mc.video||[]), ...(mc.audio ? [mc.audio] : []), ...(mc.library ? [mc.library] : [])];
            for (const acct of allAccounts) {
                if (!acct.workerUrl) continue;
                try {
                    const res = await fetch(acct.workerUrl + '/list?prefix=media/', {cache:'no-store'});
                    if (res.ok) {
                        const data = await res.json();
                        if (data.files) {
                            data.files.forEach(f => {
                                const type = f.key.includes('/video/') ? 'video' : f.key.includes('/audio/') ? 'audio' : 'image';
                                files.push({ name: f.key.split('/').pop(), path: f.key, size: f.size||0, type, source: 'r2', workerUrl: acct.workerUrl, downloadUrl: acct.workerUrl+'/file/'+encodeURIComponent(f.key) });
                            });
                        }
                    }
                } catch(e) { console.warn('R2 list failed for', acct.workerUrl, e); }
            }
        }
    } catch(e) {}
    // Try GitHub
    try {
        const config = typeof getGitHubConfig === 'function' ? getGitHubConfig() : null;
        if (config && config.owner && config.repo) {
            const headers = config.token ? {'Authorization':'token '+config.token} : {};
            const res = await fetch('https://api.github.com/repos/'+config.owner+'/'+config.repo+'/contents/'+(config.mediaPath||'media')+'?ref='+(config.branch||'main'), {headers});
            if (res.ok) {
                const items = await res.json();
                if (Array.isArray(items)) {
                    items.forEach(f => {
                        if (f.type === 'file') {
                            files.push({ name: f.name, path: f.path, size: f.size||0, type: 'media', source: 'github', sha: f.sha, downloadUrl: f.download_url });
                        }
                    });
                }
            }
        }
    } catch(e) {}
    window._mediaFiles = files;
    renderMediaFileList(files);
    if (document.getElementById('mediaCount')) document.getElementById('mediaCount').textContent = files.length;
    if (typeof updateAdminStats === 'function') updateAdminStats();
}

function renderMediaFileList(files) {
    files = files || window._mediaFiles || [];
    const container = document.getElementById('mediaFileList');
    if (!container) return;
    if (files.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">No media files found. Upload some!</p>';
        return;
    }
    let html = '';
    files.forEach(f => {
        const icon = f.type === 'video' ? 'fa-video' : f.type === 'audio' ? 'fa-music' : 'fa-image';
        const color = f.type === 'video' ? '#e53935' : f.type === 'audio' ? '#7B1FA2' : '#1565C0';
        const badge = f.source === 'r2' ? '<span style="font-size:10px;padding:2px 6px;border-radius:4px;background:#fff3e0;color:#E65100;">R2</span>' : '<span style="font-size:10px;padding:2px 6px;border-radius:4px;background:#f3e5f5;color:#6A1B9A;">GitHub</span>';
        const displayName = f.name.replace(/^\d+_[a-z0-9]+_/,'').replace(/_/g,' ').replace(/\.[^/.]+$/,'');
        const editData = encodeURIComponent(JSON.stringify({name:f.name,path:f.path,size:f.size,type:f.type,source:f.source,sha:f.sha,downloadUrl:f.downloadUrl,workerUrl:f.workerUrl,section:'media',category:f.type}));
        html += '<div class="file-item" data-name="'+f.name.toLowerCase()+'" data-url="'+(f.downloadUrl||'')+'" data-source="'+(f.source||'')+'" data-path="'+(f.path||'')+'" data-sha="'+(f.sha||'')+'" data-worker="'+(f.workerUrl||'')+'" data-size="'+(f.size||0)+'" data-type="'+(f.type||'')+'" onclick="onFileItemClick(this,\'media\')">';
        html += '<span class="fi-checkbox"><i class="fas fa-check"></i></span>';
        html += '<div class="file-icon"><i class="fas '+icon+'" style="color:'+color+';"></i></div>';
        html += '<div class="file-info"><div class="file-name">'+displayName+' '+badge+'</div><div class="file-meta">'+formatFileSize(f.size)+' · '+f.type+'</div></div>';
        html += '<div class="file-actions">';
        html += '<button class="btn-icon btn-primary" onclick="event.stopPropagation();openEditModal(\''+editData+'\')"><i class="fas fa-pen"></i></button>';
        html += '<a href="'+(f.downloadUrl||'#')+'" target="_blank" class="btn-icon btn-primary" onclick="event.stopPropagation()"><i class="fas fa-external-link-alt"></i></a>';
        html += '<button class="btn-icon btn-danger" onclick="event.stopPropagation();deleteSingleFile(\''+f.source+'\',\''+encodeURIComponent(f.path)+'\',\''+(f.sha||'')+'\',\''+(f.workerUrl||'')+'\',\'media\')"><i class="fas fa-trash"></i></button>';
        html += '</div></div>';
    });
    container.innerHTML = html;
}

async function loadLibraryList() {
    const container = document.getElementById('libraryFileList');
    if (!container) return;
    container.innerHTML = '<p style="text-align:center;color:#888;padding:20px;"><i class="fas fa-spinner fa-spin"></i> Loading books...</p>';
    let files = [];
    // Try R2 library account
    try {
        const mc = typeof getR2MultiConfig === 'function' ? getR2MultiConfig() : null;
        if (mc && mc.library && mc.library.workerUrl) {
            const res = await fetch(mc.library.workerUrl + '/list?prefix=library/', {cache:'no-store'});
            if (res.ok) {
                const data = await res.json();
                if (data.files) {
                    data.files.forEach(f => {
                        const cat = f.key.includes('/islamic/') ? 'islamic' : f.key.includes('/educational/') ? 'educational' : f.key.includes('/quran/') ? 'quran' : 'other';
                        files.push({ name: f.key.split('/').pop(), path: f.key, size: f.size||0, category: cat, source: 'r2', workerUrl: mc.library.workerUrl, downloadUrl: mc.library.workerUrl+'/file/'+encodeURIComponent(f.key) });
                    });
                }
            }
        }
    } catch(e) {}
    // Try GitHub
    try {
        const config = typeof getGitHubConfig === 'function' ? getGitHubConfig() : null;
        if (config && config.owner && config.repo) {
            const headers = config.token ? {'Authorization':'token '+config.token} : {};
            const res = await fetch('https://api.github.com/repos/'+config.owner+'/'+config.repo+'/contents/'+(config.libraryPath||'library')+'?ref='+(config.branch||'main'), {headers});
            if (res.ok) {
                const items = await res.json();
                if (Array.isArray(items)) {
                    items.forEach(f => {
                        if (f.type === 'file') {
                            files.push({ name: f.name, path: f.path, size: f.size||0, category: 'other', source: 'github', sha: f.sha, downloadUrl: f.download_url });
                        }
                    });
                }
            }
        }
    } catch(e) {}
    window._libraryFiles = files;
    renderLibraryFileList(files);
    if (document.getElementById('libraryCount')) document.getElementById('libraryCount').textContent = files.length;
    if (typeof updateAdminStats === 'function') updateAdminStats();
}

function renderLibraryFileList(files) {
    files = files || window._libraryFiles || [];
    const container = document.getElementById('libraryFileList');
    if (!container) return;
    if (files.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">No books found. Upload some!</p>';
        return;
    }
    let html = '';
    files.forEach(f => {
        const badge = f.source === 'r2' ? '<span style="font-size:10px;padding:2px 6px;border-radius:4px;background:#fff3e0;color:#E65100;">R2</span>' : '<span style="font-size:10px;padding:2px 6px;border-radius:4px;background:#f3e5f5;color:#6A1B9A;">GitHub</span>';
        const displayName = f.name.replace(/^\d+_[a-z0-9]+_/,'').replace(/_/g,' ').replace(/\.[^/.]+$/,'');
        const editData = encodeURIComponent(JSON.stringify({name:f.name,path:f.path,size:f.size,type:'book',source:f.source,sha:f.sha,downloadUrl:f.downloadUrl,workerUrl:f.workerUrl,section:'library',category:f.category}));
        html += '<div class="file-item" data-name="'+f.name.toLowerCase()+'" data-url="'+(f.downloadUrl||'')+'" data-source="'+(f.source||'')+'" data-path="'+(f.path||'')+'" data-sha="'+(f.sha||'')+'" data-worker="'+(f.workerUrl||'')+'" data-size="'+(f.size||0)+'" data-category="'+(f.category||'')+'" onclick="onFileItemClick(this,\'library\')">';
        html += '<span class="fi-checkbox"><i class="fas fa-check"></i></span>';
        html += '<div class="file-icon"><i class="fas fa-book" style="color:#6A1B9A;"></i></div>';
        html += '<div class="file-info"><div class="file-name">'+displayName+' '+badge+'</div><div class="file-meta">'+formatFileSize(f.size)+' · '+f.category+'</div></div>';
        html += '<div class="file-actions">';
        html += '<button class="btn-icon btn-primary" onclick="event.stopPropagation();openEditModal(\''+editData+'\')"><i class="fas fa-pen"></i></button>';
        html += '<a href="'+(f.downloadUrl||'#')+'" target="_blank" class="btn-icon btn-primary" onclick="event.stopPropagation()"><i class="fas fa-external-link-alt"></i></a>';
        html += '<button class="btn-icon btn-danger" onclick="event.stopPropagation();deleteSingleFile(\''+f.source+'\',\''+encodeURIComponent(f.path)+'\',\''+(f.sha||'')+'\',\''+(f.workerUrl||'')+'\',\'library\')"><i class="fas fa-trash"></i></button>';
        html += '</div></div>';
    });
    container.innerHTML = html;
}

async function deleteSingleFile(source, encodedPath, sha, workerUrl, section) {
    const path = decodeURIComponent(encodedPath);
    if (!confirm('Delete "'+path.split('/').pop()+'"?')) return;
    try {
        if (source === 'r2' && workerUrl) {
            const token = typeof _R2_DEFAULT_TOKEN !== 'undefined' ? _R2_DEFAULT_TOKEN : '';
            await fetch(workerUrl+'/file/'+encodeURIComponent(path), {method:'DELETE', headers:{'X-Admin-Token':token}});
        } else if (source === 'github' && sha) {
            const config = typeof getGitHubConfig === 'function' ? getGitHubConfig() : {};
            if (!config.token) { alert('GitHub token required to delete.'); return; }
            await fetch('https://api.github.com/repos/'+config.owner+'/'+config.repo+'/contents/'+path, {
                method:'DELETE', headers:{'Authorization':'token '+config.token,'Content-Type':'application/json'},
                body: JSON.stringify({message:'Delete: '+path, sha, branch: config.branch||'main'})
            });
        }
        alert('File deleted!');
        if (section === 'media') loadMediaList(); else loadLibraryList();
    } catch(e) { alert('Delete failed: '+e.message); }
}
