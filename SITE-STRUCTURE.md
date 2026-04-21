# SAKE-FINAL — Site Structure

Canonical layout and source (SAKE-MAIN shell vs SAKE core). All paths relative to `SAKE-FINAL/`.

```
SAKE-FINAL/
│
├─ index.html                   (SAKE-MAIN: hybrid wrapper + SAKE core)
├─ about.html                   (SAKE-MAIN: hybrid wrapper + SAKE core)
├─ activities.html              (SAKE-MAIN)
├─ ask-question.html            (SAKE-MAIN)
├─ contact.html                 (SAKE-MAIN)
├─ counselling.html             (SAKE-MAIN)
├─ dhikr.html                   (SAKE, compact hero)
├─ events.html                  (SAKE-MAIN)
├─ important-lessons.html       (SAKE-MAIN)
├─ join-programs.html           (SAKE-MAIN)
├─ join-us.html                 (SAKE-MAIN)
├─ leadership.html              (SAKE-MAIN)
├─ library.html                 (SAKE)
├─ media.html                   (SAKE)
├─ media-settings.html          (SAKE-MAIN)
├─ mosques.html                 (SAKE)
├─ notifications.html           (SAKE)
├─ pay.html                     (SAKE)
├─ programs.html                (SAKE-MAIN)
├─ quran.html                   (SAKE-MAIN)
├─ quran-reader.html            (SAKE)
├─ search.html                  (SAKE-MAIN)
├─ subscription-form.html       (SAKE-MAIN)
├─ values.html                  (SAKE-MAIN)
├─ zakat-form.html              (SAKE-MAIN)
├─ admin.html                   (SAKE)
├─ names-of-allah.html         (SAKE, compact hero)
├─ offline.html                 (SAKE-MAIN)
├─ test-account-storage.html    (SAKE-MAIN)
├─ whatsapp-join-modal.html     (SAKE-MAIN)
│
├─ auth/
│   └─ callback.html           (SAKE/SAKE-MAIN)
│
├─ media-storage/
│   └─ index.html               (SAKE)
│
├─ payment/
│   ├─ callback.html            (SAKE)
│   └─ cancel.html              (SAKE)
│
├─ public/
│   └─ payment-example.html     (SAKE)
│
├─ css/
│   └─ search.css              (SAKE)
├─ assets/css/
│   └─ player.css               (SAKE)
├─ fonts/
│   └─ fontawesome.min.css      (SAKE / SAKE-MAIN)
│
├─ js/
│   ├─ router-bridge.js         (SAKE)
│   ├─ search.js                (SAKE-MAIN)
│   └─ search-data.js           (SAKE-MAIN)
├─ assets/js/
│   └─ player.js                 (SAKE)
├─ script.js                    (SAKE)
├─ update-navigation.js         (SAKE)
│
├─ api/
│   └─ pesapal.js               (SAKE)
├─ models/
│   └─ LibraryItem.js           (SAKE)
├─ services/
│   ├─ uploadService.js         (SAKE)
│   ├─ supabaseClient.js        (SAKE)
│   ├─ supabaseAuth.js          (SAKE)
│   ├─ searchService.js         (SAKE)
│   ├─ prayerTimesService.js    (SAKE)
│   ├─ libraryService.js        (SAKE)
│   └─ githubStorageService.js  (SAKE)
├─ utils/
│   ├─ errorHandler.js          (SAKE)
│   └─ logger.js                (SAKE)
│
├─ functions/
│   ├─ index.js                 (SAKE)
│   └─ barakahpush-functions.js (SAKE)
├─ cloudflare/                  (SAKE)
│   └─ workers/
├─ railway-server/             (SAKE)
├─ payments/                    (SAKE)
├─ server.js                    (SAKE-MAIN)
├─ firebase-config.js           (SAKE hybrid)
├─ firebase-auth.js             (SAKE hybrid)
├─ firebase-messaging-sw.js     (SAKE hybrid)
├─ sw.js                        (SAKE hybrid)
├─ offline-db.js                (SAKE)
├─ offline-db-example.js        (SAKE)
├─ media-offline.js             (SAKE)
├─ supabase-config.js           (SAKE)
├─ supabase-storage.js          (SAKE)
├─ api-config.js                (SAKE)
│
└─ images/                      (SAKE)
    ├─ home.jpg
    ├─ charity.webp
    ├─ ball.jpeg
    ├─ iftar.jpg
    └─ competition.webp
```

---

## Verification (current repo)

| Item | Status |
|------|--------|
| All listed HTML pages | ✓ Present |
| auth/callback.html | ✓ |
| media-storage/index.html | ✓ |
| payment/callback.html, cancel.html | ✓ |
| public/payment-example.html | ✓ |
| css/search.css, assets/css/player.css | ✓ |
| fonts/fontawesome.min.css | ✓ |
| js/router-bridge.js, search.js, search-data.js | ✓ |
| assets/js/player.js | ✓ |
| script.js, update-navigation.js | ✓ |
| api/pesapal.js, models/LibraryItem.js | ✓ |
| All 7 services/*.js | ✓ |
| utils/errorHandler.js, logger.js | ✓ |
| functions/index.js, barakahpush-functions.js | ✓ |
| cloudflare/, railway-server/, payments/ | ✓ |
| server.js, firebase-*.js, sw.js | ✓ |
| offline-db.js, media-offline.js, supabase-*.js, api-config.js | ✓ |
| images/ (home.jpg, charity.webp, ball.jpeg, iftar.jpg, competition.webp) | ✓ (plus dates.webp, juma.jpg, quran.avif) |

**Extra in repo (not in spec):**  
Root: styles.css, manifest.json, logo.png, app-storage.js, network-sync.js, config/, database/, docs/, notifications/, server/, config and PHP/Node files, Stage reports, etc.  
js/: register-service-worker.js.  
cloudflare/: worker files at root and in subdirs (pesapal, recitation, etc.); spec shows `workers/` subfolder.  
public/: payment.js, payment-railway.js, payment-vercel.js in addition to payment-example.html.

This file is the single reference for the intended site structure and source labels.
