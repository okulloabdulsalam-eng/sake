/**
 * KIUMA App - Build script for Capacitor
 * Copies web assets to www/ directory for native app bundling.
 * Run: node build-www.js
 */
const fs = require('fs');
const path = require('path');

const SRC = __dirname;
const DEST = path.join(__dirname, 'www');

// Directories to copy (only web-facing assets)
const DIRS_TO_COPY = ['css', 'js', 'images', 'fonts'];

// Directories to SKIP (server-side / build tooling, not needed in the app)
const SKIP_DIRS = [
    'www', 'android', 'ios', 'node_modules', '.git', '.github',
    'api', 'auth', 'cloudflare', 'config', 'database', 'docs',
    'functions', 'media-storage', 'models', 'notifications',
    'payment', 'payments', 'public', 'railway-server', 'server',
    'services', 'utils'
];

// File extensions to include from root
const WEB_EXTENSIONS = [
    '.html', '.css', '.js', '.json', '.png', '.jpg', '.jpeg',
    '.webp', '.svg', '.ico', '.gif', '.woff', '.woff2', '.ttf', '.eot'
];

// Files to skip
const SKIP_FILES = [
    'build-www.js', 'package.json', 'package-lock.json',
    'capacitor.config.json', 'capacitor.config.ts',
    'server.js', 'composer.json', '.gitignore',
    'firebase.json', 'firestore.rules', 'firestore.indexes.json',
    '.firebaserc', 'test-account-storage.html', 'test-storage-console.js',
    'offline-db-example.js'
];

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function copyFileSync(src, dest) {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
}

function copyDirRecursive(src, dest) {
    if (!fs.existsSync(src)) return;
    ensureDir(dest);
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath);
        } else {
            copyFileSync(srcPath, destPath);
        }
    }
}

// Clean www directory
if (fs.existsSync(DEST)) {
    fs.rmSync(DEST, { recursive: true, force: true });
    console.log('Cleaned www/');
}
ensureDir(DEST);

// Copy root-level web files
let fileCount = 0;
const rootFiles = fs.readdirSync(SRC, { withFileTypes: true });
for (const entry of rootFiles) {
    if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (WEB_EXTENSIONS.includes(ext) && !SKIP_FILES.includes(entry.name)) {
            copyFileSync(path.join(SRC, entry.name), path.join(DEST, entry.name));
            fileCount++;
        }
    }
}
console.log(`Copied ${fileCount} root files`);

// Copy web asset directories
for (const dir of DIRS_TO_COPY) {
    const srcDir = path.join(SRC, dir);
    if (fs.existsSync(srcDir)) {
        copyDirRecursive(srcDir, path.join(DEST, dir));
        console.log(`Copied ${dir}/`);
    }
}

// Copy whatsapp-join-modal.html if it exists (used as include)
const modalFile = path.join(SRC, 'whatsapp-join-modal.html');
if (fs.existsSync(modalFile)) {
    copyFileSync(modalFile, path.join(DEST, 'whatsapp-join-modal.html'));
}

console.log('\n✅ www/ directory ready for Capacitor sync');
console.log(`   Total: ${fileCount} root files + asset directories`);
console.log('   Next: npx cap sync');
