# KIUMA Native App Build Guide

Build the KIUMA web app as a native Android APK and iOS IPA using Capacitor.  
All web assets are bundled **locally inside the app** — no "website failed to load" errors.

---

## Prerequisites

### For Android (APK)
1. **Android Studio** — Download: https://developer.android.com/studio
2. **Java JDK 17+** — Usually bundled with Android Studio
3. After installing Android Studio, open it once and install:
   - Android SDK (API 34+)
   - Android Build Tools
   - Accept all license agreements

### For iOS (IPA) — Mac only
1. **Xcode 15+** — Install from Mac App Store
2. **CocoaPods** — Run: `sudo gem install cocoapods`
3. Apple Developer account (free for testing on device, $99/year for App Store)

---

## Quick Start — Build Android APK

### Step 1: Sync web files to native project
```bash
npm run build:android
```
This runs `build-www.js` (copies web assets to `www/`), syncs to the Android project, and opens Android Studio.

### Step 2: Build APK in Android Studio
1. Android Studio will open with the project
2. Wait for Gradle sync to finish (bottom progress bar)
3. To run on a connected phone:
   - Enable **Developer Options** and **USB Debugging** on your phone
   - Connect phone via USB
   - Click the green **Run ▶** button in Android Studio
4. To build a release APK:
   - Go to **Build → Generate Signed Bundle / APK**
   - Select **APK**
   - Create a new keystore (first time) or use existing
   - Select **release** build type
   - Click **Create**
   - APK will be at: `android/app/release/app-release.apk`

### Quick Debug APK (unsigned, for testing)
In Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**  
Output: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## Quick Start — Build iOS IPA (Mac only)

### Step 1: Sync and open Xcode
```bash
npm run build:ios
```

### Step 2: Build in Xcode
1. Xcode opens with the project
2. Select your team in **Signing & Capabilities**
3. Connect your iPhone or select a simulator
4. Click **Run ▶**
5. For App Store: **Product → Archive** then distribute

---

## Daily Workflow

After making changes to HTML/CSS/JS files:

```bash
# Sync changes to both platforms
npm run cap:sync

# Or just one platform
npm run cap:sync:android
npm run cap:sync:ios

# Open in IDE
npm run cap:open:android
npm run cap:open:ios
```

---

## App Icon Setup

The default Capacitor icon is a placeholder. To set the KIUMA logo:

### Option A: Using capacitor-assets (recommended)
```bash
npm install -g @capacitor/assets
npx capacitor-assets generate --iconBackgroundColor "#1a1a2e" --splashBackgroundColor "#1a1a2e"
```
Place your icon as `assets/icon-only.png` (1024x1024) and `assets/icon-foreground.png` (1024x1024) before running.

### Option B: Manual (Android)
Replace these files with your logo at the correct sizes:
- `android/app/src/main/res/mipmap-mdpi/ic_launcher.png` (48x48)
- `android/app/src/main/res/mipmap-hdpi/ic_launcher.png` (72x72)
- `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png` (96x96)
- `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png` (144x144)
- `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` (192x192)

---

## What's Included

| Feature | Status |
|---------|--------|
| All pages bundled locally | ✅ |
| Offline support (service worker) | ✅ |
| Push notifications (Firebase) | ✅ |
| Location/GPS (mosques, qibla) | ✅ |
| File downloads (media, library) | ✅ |
| WhatsApp integration | ✅ |
| Splash screen | ✅ |
| Status bar theming | ✅ |
| Back button handling | ✅ |

---

## Troubleshooting

**"Website failed to load"** → Run `npm run cap:sync` to rebundle assets  
**White screen on launch** → Check `www/index.html` exists after `node build-www.js`  
**External links don't open** → They're handled via `allowNavigation` in `capacitor.config.json`  
**Location not working** → Accept the permission prompt; location permissions are in AndroidManifest.xml  

---

## Project Structure

```
sake-main/
├── android/          ← Native Android project (open in Android Studio)
├── ios/              ← Native iOS project (open in Xcode)
├── www/              ← Built web assets (auto-generated, don't edit)
├── build-www.js      ← Script that copies web files to www/
├── capacitor.config.json ← Capacitor configuration
├── package.json      ← npm scripts for building
└── *.html, *.js, etc ← Your source web files (edit these)
```
