# BWM KUL City Walk

[![CI](https://github.com/chaziyu/BWM-KUL-City-Walk/actions/workflows/ci.yml/badge.svg)](https://github.com/chaziyu/BWM-KUL-City-Walk/actions/workflows/ci.yml)

A progressive web application for exploring Kuala Lumpur heritage sites through curated Story Walks, an interactive heritage map, digital passport progression, and a grounded AI guide.

**Live demo:** https://bwm-kul-city-walk.vercel.app/  
**Prepared for:** Badan Warisan Malaysia (BWM)

> **Project status:** Prototype prepared for evaluation and event-workflow exploration. This repository, its admin workflow, and its deployed demo should not be interpreted as an official production service operated by Badan Warisan Malaysia.

## Overview

BWM KUL City Walk is a Vanilla JavaScript modular application built with Vite and deployed on Vercel. The browser owns the public heritage experience, while protected access and AI functions run through serverless APIs.

The product is designed around a low-cost, static-first architecture:

- public map, Story Walks, passport, quizzes, and challenges can run without a continuously available backend;
- Story Walks are planned locally from curated heritage data;
- AI answers are grounded in local verified site records before Gemini is called;
- supported factual questions are answered deterministically without model usage;
- optional Upstash Redis provides shared quota, rate-limit, and AI-answer cache state.

For deeper implementation details, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Features

- **Story Walks** — curated 30, 60, and 90 minute heritage narratives generated locally without a routing API.
- **Heritage Map** — Leaflet with a quiet CARTO Positron basemap and distinct must-visit, recommended, completed, and selected site states.
- **Digital Passport** — local stamp collection and visit progress.
- **Grounded AI Guide** — Gemini 3.5 Flash-Lite with multilingual entity retrieval, deterministic factual answers, compact verified context, structured responses, quotas, and caching.
- **Demo and visitor access** — static-first demo access plus signed server sessions for protected API features.
- **PWA support** — installable application shell with same-origin asset/content caching.
- **Responsive interface** — viewport-safe dialogs, safe-area handling, keyboard navigation, and persisted interface scaling.

## Architecture

The frontend is a Vanilla JavaScript modular monolith.

### Browser-owned

- heritage map and site catalogue;
- Story Walk planning;
- passport, quiz, and challenge progress;
- demo-mode access to public trail features;
- service worker and same-origin offline cache;
- local browser preferences and progress state.

### Server-owned

- visitor and admin authorization;
- signed HttpOnly sessions;
- AI rate limiting and quota enforcement;
- Gemini synthesis;
- shared AI answer caching when Upstash is configured.

The AI request path is:

1. resolve site context with Unicode-safe names and curated multilingual aliases;
2. retrieve a compact 1–3 site verified fact packet;
3. answer supported factual intents deterministically;
4. check local/shared answer caches;
5. apply rate and quota controls only if a provider call is still required;
6. call `gemini-3.5-flash-lite` with minimal thinking and bounded output;
7. use `gemini-3.1-flash-lite` only after transient provider failures.

Model confidence is derived from server-side retrieval quality rather than self-reported by the model.

## Technology Stack

| Area | Technology |
|---|---|
| Frontend | HTML5, Vanilla JavaScript, Tailwind CSS, Vite |
| Mapping | Leaflet, CARTO Positron, OpenStreetMap data |
| Backend | Vercel Serverless Functions |
| AI | Google GenAI SDK, Gemini 3.5 Flash-Lite |
| Shared state | Upstash Redis (optional) |
| Validation | TypeScript/checkJs, ESLint, AJV |
| Unit tests | Vitest with V8 coverage |
| Browser tests | Playwright |
| PWA | Web App Manifest, service worker |

## Getting Started

### Prerequisites

- Node.js 20.19 or newer
- npm
- a Vercel account for serverless deployment or `vercel dev`
- a Google Gemini API key for AI chat
- Google Apps Script only if testing the visitor/admin passkey prototype

### Installation

```bash
git clone https://github.com/chaziyu/BWM-KUL-City-Walk.git
cd BWM-KUL-City-Walk
npm ci
npm run dev
```

Vite prints the local development URL, normally `http://localhost:5173`.

### Full local API runtime

Frontend-only work can use:

```bash
npm run dev
```

Protected session, admin, and AI routes require the Vercel serverless runtime:

```bash
vercel dev
```

Do not run the application directly from `file://`; the project uses ES modules and serverless API routes.

## Configuration

Copy the relevant values from [.env.example](./.env.example) into a local `.env.local` file or configure them in Vercel.

### Server configuration

| Variable | Required | Default / purpose |
|---|---:|---|
| `SESSION_SECRET` | Yes for protected sessions | 64-character random hex secret used to sign `bwm_session` cookies |
| `GOOGLE_API_KEY` | Yes for AI chat | Gemini API key |
| `GOOGLE_SCRIPT_URL` | Optional | Google Apps Script endpoint for visitor validation/admin prototype generation |
| `ADMIN_PASSWORD` | Optional | Project Admin prototype password |
| `KV_REST_API_URL` | Optional | Upstash Redis endpoint |
| `KV_REST_API_TOKEN` | Optional | Upstash Redis token |
| `DEMO_CHAT_LIMIT` | No | `5` |
| `VISITOR_CHAT_LIMIT` | No | `15` |
| `ADMIN_CHAT_LIMIT` | No | `30` |
| `DEMO_SESSION_MAX_AGE` | No | `7200` seconds |
| `VISITOR_SESSION_MAX_AGE` | No | `86400` seconds |
| `ADMIN_SESSION_MAX_AGE` | No | `3600` seconds |
| `CHAT_MAX_QUERY_CHARS` | No | `1000` |
| `CHAT_HISTORY_MESSAGES` | No | `4` dependent follow-up messages |
| `CHAT_HISTORY_TEXT_CHARS` | No | `700` characters per follow-up message |
| `CHAT_RATE_LIMIT_MAX` | No | `30` requests per rate-limit window |
| `CHAT_RATE_LIMIT_WINDOW_MS` | No | `3600000` ms |
| `CHAT_PROVIDER_TIMEOUT_MS` | No | `5000` ms per provider attempt |
| `CHAT_MAX_OUTPUT_TOKENS` | No | `512` |

If Upstash is not configured, shared quota/cache state falls back to per-instance memory.

### Browser configuration

Only `VITE_`-prefixed variables are exposed to the browser.

| Variable | Default |
|---|---|
| `VITE_HISTORY_WINDOW_SIZE` | `30` |
| `VITE_MAX_MESSAGES_PER_SESSION` | `15` |
| `VITE_DEFAULT_CENTER` | `[3.1495519988154683,101.69609103393907]` |
| `VITE_ZOOM` | `16` |
| `VITE_ZOOM_THRESHOLD` | `16` |
| `VITE_POLYGON_OPACITY` | `0.2` |
| `VITE_MAX_FONT_SIZE` | `130` |

## Development and Quality Gates

The main local and CI verification command is:

```bash
npm run check
```

It runs:

- ESLint;
- TypeScript/checkJs validation;
- heritage-site and Story Walk data validation;
- Vitest with coverage;
- production Vite build.

Browser regression tests run separately:

```bash
npm run test:browser
```

Other useful commands:

```bash
npm run test
npm run test:watch
npm run test:coverage
npm run validate:data
npm run build
npm run preview
```

## Project Structure

```text
BWM-KUL-City-Walk/
├── api/
│   ├── _shared/            # Sessions, security, quotas, observability, AI helpers
│   │   └── ai/             # Retrieval, prompt, model, cache, response contracts
│   ├── admin/              # Project Admin prototype APIs
│   ├── session/            # Demo, visitor, admin, current and logout routes
│   ├── chat.js             # Grounded AI chat endpoint
│   └── health.js
├── data/
│   ├── sites.json          # Canonical heritage-site data
│   ├── sites.schema.json
│   ├── trails.json         # Story Walk definitions
│   └── trails.schema.json
├── public/
│   ├── images/
│   ├── audio/
│   └── sw.js               # Service worker
├── src/
│   ├── app/                # Composition, state, lifecycle, view flow
│   ├── config/             # Browser runtime configuration
│   ├── features/           # Feature modules
│   ├── services/           # Browser infrastructure and API clients
│   ├── styles/             # Application and Leaflet styles
│   ├── ui/                 # Shared UI controllers/helpers
│   └── main.js             # Browser entry point
├── scripts/
│   └── validate-data.js
├── tests/                  # Unit, data, UI and browser tests
├── ARCHITECTURE.md
├── manifest.json
└── vite.config.mjs
```

## Data and Content

Heritage content is maintained in `data/sites.json`. Story Walk definitions live in `data/trails.json`.

Run data validation after editing either source:

```bash
npm run validate:data
```

Validation covers schema conformance, unique IDs, coordinates, image references, quiz consistency, AI aliases/context, the expected must-visit site set, Story Walk structure, duplicate stops, and site cross-references.

## AI Guide Behavior

The chat endpoint does not send the full site catalogue to Gemini.

For general questions it retrieves up to three relevant verified sites. Site-specific chat uses the current site directly.

Supported factual questions can bypass Gemini entirely, including:

- construction dates;
- architects/designers;
- opening hours;
- ticket or entry fees;
- recommended visit duration;
- curated visitor tips.

Generated answers use structured JSON and source IDs are validated against local site data before being returned to the browser.

Typical response:

```json
{
  "reply": "Answer text",
  "sourceSiteIds": ["1"],
  "confidence": "high",
  "notFound": false,
  "remainingQuota": 14
}
```

`remainingQuota: null` means the request did not consume AI quota, for example a deterministic answer, retrieval miss, or cache hit.

## Access and Security

Browser state is not trusted for authorization.

Protected APIs rely on signed HttpOnly `bwm_session` cookies. Demo, visitor, and admin roles are validated server-side before protected operations are allowed.

The chat API also applies:

- same-origin enforcement;
- server-side query/history limits;
- rate limiting;
- role-specific quotas;
- structured response validation;
- sanitized Markdown rendering on the client.

Real secrets belong in `.env.local` or Vercel environment variables and must not be committed.

## Deployment

The project is designed for Vercel:

```bash
npm run check
vercel
```

Production configuration should provide at minimum:

- `SESSION_SECRET` for signed sessions;
- `GOOGLE_API_KEY` for AI chat.

Upstash is recommended when shared quota/cache state must survive across serverless instances.

## Offline Behavior

The service worker caches the same-origin application shell and previously requested same-origin heritage content.

It deliberately does not cache:

- `/api/*` responses;
- CARTO basemap tiles;
- Google Maps;
- Google Translate;
- Gemini or other third-party services.

Offline support is therefore an app/content fallback, not an offline map implementation.

## Known Limitations

- The Project Admin workflow is a prototype and is not an official BWM production administration system.
- Third-party map tiles and external services require network access.
- Recommended sites do not all have quiz content.
- Google Translate is loaded as a third-party widget only when requested.
- Shared AI quotas and cross-instance answer caching require Upstash; otherwise state is per serverless instance.
- AI retrieval is local and lexical. Accuracy depends on curated site names, aliases, and verified content.
- Source labels depend on local site data being available in the browser.

## Attribution

- Badan Warisan Malaysia — heritage preservation context and project brief
- OpenStreetMap contributors — map data
- CARTO — Positron basemap tiles
- Google Gemini — AI model capabilities
- Leaflet — interactive map library
- Vercel — hosting and serverless runtime

## License

No license file is currently declared in this repository. Do not assume permission to redistribute or reuse the source, heritage content, branding, or media outside the intended project context.
