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

1. Resolve site context with Unicode-safe names and curated multilingual aliases.
2. Retrieve a compact 1–3 site verified fact packet and derive retrieval confidence server-side.
3. Return deterministic answers for dates, architects, opening hours, fees, visit duration, and curated visitor tips.
4. Check the in-memory answer cache, then the shared Upstash cache when configured.
5. Apply rate/quota controls only when a provider call is still required.
6. Call `gemini-3.5-flash-lite` with minimal thinking, bounded output, structured JSON, compact context, and conversation history only for dependent follow-ups.
7. Use `gemini-3.1-flash-lite` only after transient provider failures.

The model does not self-rate confidence. Deterministic, no-match, and cache-hit paths return `remainingQuota: null`, meaning quota is unchanged and no quota read is required on those fast paths.

Provider logs record request-path latency, provider latency, context size, history size, and token usage metadata when available. No user query text is logged.

This keeps the free-tier-oriented architecture while reducing provider calls, token volume, and avoidable network round trips.

## Offline behavior

The service worker caches the same-origin app shell, heritage site data, Heritage Thread data, and same-origin static assets after they are requested.

The service worker deliberately does **not** cache:

- `/api/*` responses
- CARTO Positron basemap tiles
- Google Maps
- Google Translate
- Gemini or other third-party services

Offline mode is therefore an app/content fallback, not an attempt to replicate an offline basemap.
