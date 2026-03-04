# SAKE-FINAL — Import note

**Date:** 2026-03-01

This folder is a full import of all changes from the beginning of the hybrid work into one place.

## Contents

- **Base:** SAKE-MAIN (shell: layout, sidebar, bottom nav, page links).
- **Stage 2:** SAKE backend/core merged in — Firebase (kiuma-mob-app), Supabase, R2, services, functions, offline-db, router-bridge, player assets, cloudflare, railway-server, payments, etc. See `STAGE2-HYBRID-REPORT.md`.
- **Stage 3:** Media page — SAKE media logic inside SAKE-MAIN layout (R2, offline, savedSet, 3-arg viewer). See `STAGE3-MEDIA-REPORT.md`.

## Not copied

- **node_modules** — Omitted to keep the copy small. Run `npm install` (and `cd functions && npm install` if using Firebase Functions) when needed.

## Reports

| File | Description |
|------|-------------|
| `STAGE2-HYBRID-REPORT.md` | Hybrid base: file list, Firebase/SW validation, conflicts. |
| `STAGE3-MEDIA-REPORT.md` | Media import: integration steps, conflicts, validation. |

You can use SAKE-FINAL as the single codebase for deployment or further development.
