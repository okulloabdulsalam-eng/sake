/**
 * Full Firebase + Site Diagnostic
 * Run: node check_setup.cursor.js
 * Output: diagnostics_report.txt
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const REPORT_PATH = path.join(__dirname, 'diagnostics_report.txt');
const PROJECT_ID = 'kiuma-mob-app';
const BASE_URL = 'https://okulloabdulsalam-eng.github.io';
const SAKE_BASE = BASE_URL + '/sake';
const API_BASE = BASE_URL + '/api';

const lines = [];

function log(msg) {
  const line = typeof msg === 'string' ? msg : JSON.stringify(msg);
  lines.push(line);
  console.log(line);
}

function fetchUrl(url, method = 'GET', postBody = null) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const client = u.protocol === 'https:' ? https : http;
    const opts = { hostname: u.hostname, path: u.pathname + u.search, method };
    const req = client.request(opts, (res) => {
      let data = '';
      res.on('data', (ch) => { data += ch; });
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    });
    req.on('error', (err) => resolve({ error: err.message }));
    if (postBody) req.write(postBody);
    req.end();
  });
}

async function run() {
  log('========================================');
  log('KIUMA Firebase + Site Diagnostic Report');
  log('Generated: ' + new Date().toISOString());
  log('========================================\n');

  // --- 1. Firebase project ---
  log('--- 1. Firebase project (kiuma-mob-app) ---');
  try {
    const configPath = path.join(__dirname, 'firebase-config.js');
    const configContent = fs.readFileSync(configPath, 'utf8');
    const hasProject = configContent.includes('kiuma-mob-app') && configContent.includes('projectId');
    if (hasProject) {
      const m = configContent.match(/projectId:\s*["']([^"']+)["']/);
      log('OK: firebase-config.js found with projectId: ' + (m ? m[1] : 'kiuma-mob-app'));
    } else {
      log('WARN: firebase-config.js missing or projectId not kiuma-mob-app');
    }
  } catch (e) {
    log('FAIL: firebase-config.js not found or unreadable: ' + e.message);
  }
  log('');

  // --- 2. FCM token (code path + VAPID) ---
  log('--- 2. FCM token & VAPID key ---');
  try {
    const scriptPath = path.join(__dirname, 'script.js');
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    const hasGetToken = scriptContent.includes('getToken') && scriptContent.includes('messaging');
    const vapidMatch = scriptContent.match(/vapidKey:\s*['"]([^'"]+)['"]/);
    if (hasGetToken) log('OK: FCM getToken path present in script.js');
    else log('WARN: FCM getToken path not found in script.js');
    if (vapidMatch) {
      const key = vapidMatch[1];
      log('OK: VAPID key found in script.js (length ' + key.length + ')');
      log('    Value: ' + (key.length > 40 ? key.substring(0, 40) + '...' : key));
    } else {
      log('WARN: No vapidKey found in script.js - replace YOUR_PUBLIC_VAPID_KEY_HERE with key from Firebase Console > Project Settings > Cloud Messaging');
    }
  } catch (e) {
    log('FAIL: script.js: ' + e.message);
  }
  log('');

  // --- 3. Service worker ---
  log('--- 3. Service worker ---');
  const swPaths = [
    { name: 'sw.js (main)', path: 'sw.js' },
    { name: 'firebase-messaging-sw.js', path: 'firebase-messaging-sw.js' }
  ];
  for (const { name, path: p } of swPaths) {
    const full = path.join(__dirname, p);
    try {
      if (fs.existsSync(full)) {
        const content = fs.readFileSync(full, 'utf8');
        const hasFcm = content.includes('firebase') && content.includes('messaging');
        log('OK: ' + name + ' exists' + (hasFcm ? ' (contains Firebase messaging)' : ''));
      } else {
        log('MISSING: ' + name);
      }
    } catch (e) {
      log('FAIL: ' + name + ' - ' + e.message);
    }
  }
  log('Live check: ' + SAKE_BASE + '/firebase-messaging-sw.js');
  const swRes = await fetchUrl(SAKE_BASE + '/firebase-messaging-sw.js');
  if (swRes.error) log('  Live: ERROR - ' + swRes.error);
  else if (swRes.status === 200) log('  Live: OK (200)');
  else log('  Live: HTTP ' + swRes.status);
  log('');

  // --- 4. VAPID key (summary) ---
  log('--- 4. VAPID key (for Firebase Console) ---');
  log('Ensure Firebase Console > Project Settings > Cloud Messaging > Web Push certificates has this key added and that okulloabdulsalam-eng.github.io is an authorized domain.');
  log('');

  // --- 5. Authorized domain ---
  log('--- 5. Authorized domain (okulloabdulsalam-eng.github.io) ---');
  log('Manual: In Firebase Console > Authentication > Settings > Authorized domains, add: okulloabdulsalam-eng.github.io');
  log('Live: Site reachable at ' + BASE_URL);
  const domainRes = await fetchUrl(BASE_URL);
  if (domainRes.error) log('  Fetch: ERROR - ' + domainRes.error);
  else log('  Fetch: HTTP ' + domainRes.status);
  log('');

  // --- 6. PHP APIs ---
  log('--- 6. PHP / API endpoints ---');
  const getUsersUrl = API_BASE + '/get_all_users.php';
  const sendNotifUrl = API_BASE + '/send_notifications_to_all.php';
  log('GET  ' + getUsersUrl);
  const getRes = await fetchUrl(getUsersUrl, 'GET');
  if (getRes.error) log('  Result: ERROR - ' + getRes.error);
  else {
    log('  Status: ' + getRes.status);
    if (getRes.body) {
      const isJson = (getRes.headers['content-type'] || '').includes('json') || /^\s*[{[]/.test(getRes.body);
      log('  JSON response: ' + (isJson ? 'yes' : 'no (or not detected)'));
      if (getRes.body.length < 300) log('  Body sample: ' + getRes.body.trim().substring(0, 200));
    }
  }
  log('POST ' + sendNotifUrl);
  const postRes = await fetchUrl(sendNotifUrl, 'POST', 'subject=test&message=test&admin_password=');
  if (postRes.error) log('  Result: ERROR - ' + postRes.error);
  else {
    log('  Status: ' + postRes.status);
    if (postRes.body) {
      const isJson = (postRes.headers['content-type'] || '').includes('json') || /^\s*[{[]/.test(postRes.body);
      log('  JSON response: ' + (isJson ? 'yes' : 'no (or not detected)'));
    }
  }
  log('');

  // --- 7. app-bridge.js ---
  log('--- 7. js/app-bridge.js ---');
  const bridgePath = path.join(__dirname, 'js', 'app-bridge.js');
  try {
    if (fs.existsSync(bridgePath)) {
      const content = fs.readFileSync(bridgePath, 'utf8');
      const hasKiuma = content.includes('KiumaBridge') && content.includes('KiumaApp');
      log('OK: js/app-bridge.js exists' + (hasKiuma ? ' (KiumaBridge/KiumaApp)' : ''));
    } else {
      log('MISSING: js/app-bridge.js');
    }
  } catch (e) {
    log('FAIL: ' + e.message);
  }
  log('Live: ' + SAKE_BASE + '/js/app-bridge.js');
  const bridgeRes = await fetchUrl(SAKE_BASE + '/js/app-bridge.js');
  if (bridgeRes.error) log('  Live: ERROR - ' + bridgeRes.error);
  else log('  Live: HTTP ' + bridgeRes.status);
  log('');

  // --- 8. JSON response (summary) ---
  log('--- 8. JSON response check ---');
  log('get_all_users.php and send_notifications_to_all.php should return JSON (e.g. { success, users } or { success, totalUsers }). See section 6 above.');
  log('');

  log('========================================');
  log('End of report');
  log('========================================');

  fs.writeFileSync(REPORT_PATH, lines.join('\n'), 'utf8');
  console.log('\nReport written to: ' + REPORT_PATH);
}

run().catch((err) => {
  console.error(err);
  lines.push('FATAL: ' + err.message);
  fs.writeFileSync(REPORT_PATH, lines.join('\n'), 'utf8');
});
