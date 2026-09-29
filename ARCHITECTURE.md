# Architecture Notes

## Product direction

The application remains a Vanilla JavaScript modular monolith. The differentiator is the physical heritage walk rather than the presence of a chatbot.

The primary experience is now built around **Heritage Threads**: curated narratives that connect verified heritage sites into 30, 60, or 90 minute walks. Thread planning is deterministic and runs in the browser, so it has no routing API cost.

## Runtime boundaries

### Browser-owned

- Heritage map and site catalogue
- Heritage Thread planning
- Passport and challenge progress
- Demo-mode access to public trail features
- PWA cache and offline app shell
- Local browser storage

### Server-owned

- Visitor/admin authorization
- Signed HttpOnly sessions
- AI quota and rate limiting
- Gemini synthesis
- Shared AI answer cache

Demo mode is intentionally static-first. It can enter the public trail even when the session API is unavailable. When online, it still attempts to obtain a signed demo cookie so AI chat can use the protected API.

## AI cost path

Chat requests follow this order:

1. Retrieve relevant verified site data.
2. Return deterministic answers for supported factual intents.
3. Check the in-memory answer cache.
4. Check the shared Upstash answer cache when configured.
5. Apply rate/quota controls.
6. Call Gemini only for synthesis that still needs generation.

This keeps the existing free-tier architecture while reducing provider calls.

## Offline behavior

The service worker caches the same-origin app shell, heritage site data, Heritage Thread data, and same-origin static assets after they are requested.

The service worker deliberately does **not** cache:

- `/api/*` responses
- OpenFreeMap / MapLibre tiles
- Google Maps
- Google Translate
- Gemini or other third-party services

Offline mode is therefore an app/content fallback, not an attempt to replicate an offline basemap.
