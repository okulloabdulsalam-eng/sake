const fs = require('fs');
const path = require('path');

// ===== CONFIG =====
const BASE_PATH = './sake'; // base folder where your site files live
const SW_FILE = path.join(BASE_PATH, 'sw.js');

// List of all files you want to cache
const cacheFiles = [
  'media.html',
  'media-settings.html',
  'notifications.html',
  'pay.html',
  'programs.html',
  'quran.html',
  'quran-reader.html',
  'mosques.html',
  'dhikr.html',
  'search.html',
  'names-of-allah.html',
  'subscription-form.html',
  'values.html',
  'zakat-form.html',
  'styles.min.css',
  'offline.html',
  'styles.css',
  'fonts/fontawesome.min.css',
  'fonts/webfonts/fa-brands-400.woff2',
  'fonts/webfonts/fa-regular-400.woff2',
  'fonts/webfonts/fa-solid-900.woff2',
  'script.js',
  'js/register-service-worker.js',
  'js/search-data.js',
  'firebase-config.js',
  'js/search.js',
  'update-navigation.js',
  'offline-db.js',
  'media-offline.js',
  'assets/css/player.css',
  'app-storage.js'
];

// ===== STEP 1: Check which files exist =====
console.log('🔍 Checking files in', BASE_PATH);
const missingFiles = cacheFiles.filter(file => !fs.existsSync(path.join(BASE_PATH, file)));

if (missingFiles.length) {
    console.warn('⚠️ Missing files:', missingFiles);
} else {
    console.log('✅ All cache files found');
}

// ===== STEP 2: Update sw.js paths =====
if (!fs.existsSync(SW_FILE)) {
    console.error('❌ sw.js not found at', SW_FILE);
    process.exit(1);
}

let swContent = fs.readFileSync(SW_FILE, 'utf-8');

// Create string array of cache paths with /sake/ prefix
const filesToCacheString = cacheFiles.map(f => `'/${BASE_PATH.replace('./','')}/${f}'`).join(',\n    ');

// Replace cache.addAll section in sw.js
swContent = swContent.replace(
    /caches\.open\([^)]+\)\.then\(cache => \{[\s\S]*?cache\.addAll\([\s\S]*?\]\);/m,
    `caches.open('app-cache-v1').then(cache => {
    return cache.addAll([
    ${filesToCacheString}
    ]);
});`
);

// Save updated sw.js
fs.writeFileSync(SW_FILE, swContent, 'utf-8');
console.log('✅ sw.js updated with correct /sake/ paths');

// ===== STEP 3: Summary =====
console.log('📋 Summary:');
console.log(`Missing files: ${missingFiles.length ? missingFiles.length : 'None'}`);
console.log('sw.js updated ✅');