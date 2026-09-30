# 🏛️ BWM KUL City Walk (Heritage Trail)

> A modern, interactive, installable PWA shell for exploring Kuala Lumpur's heritage sites.
> **Live Website:** [https://bwm-kul-city-walk.vercel.app/](https://bwm-kul-city-walk.vercel.app/)

**Prepared For:** Badan Warisan Malaysia (BWM)

## 📖 Project Overview

**BWM KUL City Walk** is a Vanilla JavaScript portfolio prototype designed to guide visitors through **11 core heritage sites** in Kuala Lumpur. It combines an interactive map, gamification, AI-powered assistance, and access-controlled demo/visitor/admin flows.

The project is designed as a low-cost portfolio prototype using Vercel serverless functions and managed third-party services where appropriate.

### Key Highlights
*   **📱 Offline-capable PWA:** Same-origin app assets and heritage content are cached after use; third-party map tiles remain online-only
*   **🎓 Interactive Onboarding:** Beautiful guided tour system with spotlight effects to help new users discover features instantly
*   **🧭 Story Walks:** Curated 30/60/90-minute Heritage Threads are planned locally with no routing API cost\n*   **🧠 AI Tour Guide:** Context-aware chatbot powered by Google GenAI, with deterministic factual answers before model calls
*   **🛂 Digital Passport:** Collect stamps, check-in to sites, and track your exploration progress
*   **📍 Interactive Map:** Quiet CARTO Positron basemap, heritage-first markers/polygons, food & hotel search, and site details
*   **⚡ Performance Aware:** Hardware-accelerated animations, local build assets, and lazy-loaded optional libraries
*   **♿ Accessible:** Global UI zoom controls, high-contrast design, and keyboard navigation support

---

## ✨ Major Features

### 🎯 **1. Interactive Onboarding System** *(NEW!)*
- **Guided Tour:** 7-step spotlight walkthrough that highlights all features
- **Smart Auto-Start:** Automatically launches for first-time users with non-intrusive timing
- **Help Button:** Always-accessible purple (?) button to restart the tour anytime
- **Beautiful Animations:** Smooth spotlight transitions with glowing purple effects
- **Progress Tracking:** Remembers completion status via localStorage

### 🚀 **2. Native App Performance** *(NEW!)*
- **Zero Tap Delay:** Removed 300ms mobile tap delay for instant response
- **Hardware Acceleration:** GPU-powered animations for smooth 60fps performance
- **Instant Feedback:** Visual tap responses with subtle scale effects
- **Safe Area Support:** Perfect iPhone notch and Android gesture area handling
- **Smooth Scrolling:** Momentum scrolling on iOS with no bounce/overscroll

### 🗺️ **3. Enhanced Map Experience** *(UPGRADED!)*
- **Heritage-first Basemap:** CARTO Positron keeps roads, buildings, and POIs visually quiet so BWM content remains the focus
- **Muted Overlay Palette:** Bronze must-visit sites, desaturated teal recommended sites, green completed sites, and navy selected states
- **Transit Routes:** View interactive transit lines and travel times directly in embedded maps
- **Smart Search:** Find food and hotels near heritage sites (centered on site location)
- **Dynamic Titles:** Map modal shows contextual titles like "🍔 Food Near [Site Name]"
- **Larger Modal:** Wider map view (max-w-4xl) for better visibility
- **Helpful Context:** Clear info banner explaining how to access full Google Maps details

### 🔐 **4. Security & Access Control**
*   **Explore Demo:** Recruiters, lecturers, and evaluators can enter the full heritage trail instantly without a code
*   **Visitor Passkey Access:** Future event participants can use organiser-issued passkeys validated by server APIs
*   **Project Admin Prototype:** Protected proof-of-concept workflow for organiser passkey management
*   **Signed Server Sessions:** Access roles are issued through HttpOnly `bwm_session` cookies, not trusted from browser storage
*   **Transparent Scope:** The admin workflow is a portfolio prototype and is not currently operated by Badan Warisan Malaysia

### 🎮 **5. Gamification**
*   **Stamp Collection:** Visit sites to unlock digital stamps
*   **Progress Tracker:** Beautiful glassmorphic progress bar showing collection status
*   **Digital Passport:** View all collected stamps with elegant presentation
*   **Challenge System:** Daily riddles to discover mystery locations

### 🤖 **6. AI Tour Guide**
*   **Grounded Answers:** Resolves Unicode-safe multilingual site aliases and retrieves compact verified fact packets from `data/sites.json` before calling Gemini
*   **Friendly Persona:** Helpful local guide character
*   **Smart Limits:** Dates, architects, opening hours, fees, visit duration, and curated visitor tips are answered deterministically before Gemini; provider calls still use server-side quotas, rate limits, and optional Upstash-backed caching
*   **Safe Rendering:** AI Markdown is sanitized before display to reduce XSS risk
*   **Structured Responses:** Uses Gemini structured JSON, validates source site IDs, and derives confidence from server-side retrieval quality rather than model self-rating
*   **Source Chips:** Answers can show verified trail source labels below the chat message

### 🎨 **7. Premium UI/UX**
- **Consistent Transitions:** All buttons have smooth 200ms hover effects
- **Login/Logout Animations:** Elegant fade-in/fade-out with backdrop blur
- **Modal Animations:** Physics-based slide-up with spring easing
- **Gradient Buttons:** Modern purple-to-indigo gradients throughout
- **Touch Optimized:** Tap highlights removed, text selection controlled

---

## 🏗️ Technology Stack

### Frontend
*   **Core:** HTML5, Vanilla JavaScript (ES6+), Tailwind CSS
*   **Mapping:** Leaflet.js with CARTO Positron tiles and OpenStreetMap data attribution
*   **Animations:** Native CSS transitions with hardware acceleration
*   **Configuration:** Modular `src/config/app-config.js` for runtime settings

### Backend (Serverless)
*   **Hosting:** Vercel (Static + Serverless Functions)
*   **Passkey Service:** Google Apps Script-backed visitor validation/generation with a legacy sheet fallback
*   **Admin Tools:** Protected server API for prototype passkey generation
*   **AI Engine:** Gemini 3.5 Flash-Lite with minimal thinking, compact grounded prompts, structured JSON validation, and one transient-error Flash-Lite fallback

### Performance
*   **PWA:** Installable app shell with a service worker for same-origin assets and previously loaded heritage content; third-party map tiles remain online-only
*   **Optimization:** Hardware acceleration, CSS containment, will-change hints
*   **Caching:** Scoped localStorage for demo and visitor tour progress; authorization is stored in signed cookies
*   **Load Time:** Optimized for fast initial paint and interaction

---

## 🚀 Quick Start

### Prerequisites
1. **Node.js 20.19+**
2. **Vercel Account** for deployment
3. **Google Cloud Account** for Gemini AI API
4. **Google Apps Script** for visitor passkey validation/generation (optional prototype workflow)

### Installation

```bash
git clone https://github.com/chaziyu/BWM-KUL-City-Walk.git
cd BWM-KUL-City-Walk
npm install
npm run dev
```

Open the Vite URL printed by the terminal, usually `http://localhost:5173`.

### Local Development

Use `npm run dev` for frontend-only development. The app uses ES modules and cannot be run directly from `file://`.

For full API behavior, run through Vercel’s local runtime after installing the Vercel CLI:

```bash
vercel dev
```

Use `vercel dev` for passkey, admin, and chat testing because those flows depend on the `/api/*` serverless endpoints. Static file servers such as `npx serve .` can show the frontend shell, but they cannot execute those routes.

### Build and Test Commands

```bash
npm run check
npm run typecheck
npm run test:coverage
npm run test:browser
npm run preview
```

`npm run check` is the main local/CI verification command. It runs ESLint, JSDoc/TypeScript `checkJs` validation, heritage-data validation, the Vitest suite with V8 coverage, and a production build. Coverage gates are intentionally focused on business-risk modules such as sessions, quotas, storage, API contracts, site classification, and progress logic rather than template markup.

### Environment Variables

Configure these in Vercel Dashboard for deployment. For local API testing, create a root `.env.local` file; do not use a duplicate root `.env` file for secrets.

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_API_KEY` | Google Gemini API Key | `AIzaSy...` |
| `SESSION_SECRET` | 64-character random hex secret for signing `bwm_session` cookies | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `GOOGLE_SCRIPT_URL` | Google Apps Script endpoint for visitor validation/passkey generation | `https://script.google.com/.../exec` |
| `ADMIN_PASSWORD` | Secure admin password | `SecurePass123!` |
| `DEMO_CHAT_LIMIT` | Demo AI messages per signed demo session | `5` |
| `VISITOR_CHAT_LIMIT` | Visitor AI messages per day | `15` |
| `ADMIN_CHAT_LIMIT` | Admin AI messages per hour | `30` |
| `DEMO_SESSION_MAX_AGE` | Demo session duration in seconds | `7200` |
| `VISITOR_SESSION_MAX_AGE` | Visitor session duration in seconds | `86400` |
| `ADMIN_SESSION_MAX_AGE` | Admin session duration in seconds | `3600` |
| `CHAT_MAX_QUERY_CHARS` | Server-side max characters per chat question | `1000` |
| `CHAT_HISTORY_MESSAGES` | Server-side max history messages sent to AI | `10` |
| `CHAT_HISTORY_TEXT_CHARS` | Server-side max characters per history message | `1500` |
| `CHAT_RATE_LIMIT_MAX` | Server-side chat requests per device/IP window | `30` |
| `CHAT_RATE_LIMIT_WINDOW_MS` | Server-side chat rate-limit window in milliseconds | `3600000` |

### Explore Demo

Use **Explore Demo** on the landing page for portfolio evaluation. Public trail features start locally so the map, Story Walks, quizzes, passport, and challenges can remain usable during a session-API outage. When online, the client also obtains a short-lived signed `demo` session for protected AI chat.

### Visitor Passkey Access

Visitor passkeys remain available as a proposed real-event workflow. The browser sends passkeys to `/api/session/visitor`; the server validates them through Google Apps Script or the legacy sheet fallback, then issues a signed `visitor` cookie.

### Project Admin Prototype

The **Project Admin (Prototype)** area demonstrates a proposed organiser workflow for issuing visitor passkeys and managing event access. It is retained as a proof of concept and is not currently operated by Badan Warisan Malaysia.

### Current AI Chat Contract

The serverless chat endpoint retrieves 1-3 relevant verified sites for general questions, or uses the current site for site-specific chat. Ask AI from a heritage site opens the same chat box and records the exchange in the shared AI history, while the request still keeps the site context for grounding. The server asks the GenAI SDK to return structured JSON, then validates source IDs against `data/sites.json` before returning:

```json
{
  "reply": "Answer text",
  "sourceSiteIds": ["1"],
  "confidence": "high",
  "notFound": false,
  "remainingQuota": 14
}
```

The endpoint uses low-temperature factual calls and tries models in this order:

```js
[
  "gemini-3.5-flash-lite",
  "gemma-4-26b-a4b-it",
  "gemma-4-31b-it"
]
```

Supported factual questions are answered directly from verified site fields before Gemini is called. Repeated cacheable generated answers use an in-memory L1 cache and, when Upstash is configured, a shared Redis L2 cache keyed by knowledge version, context, language, and normalized question.

---

## 📁 Project Structure

```
BWM-KUL-City-Walk/
├── index.html              # Vite HTML entry
├── data/
│   ├── sites.json          # Canonical heritage site data source
│   └── sites.schema.json   # Data validation schema
├── public/
│   ├── audio/              # Static sound assets
│   └── images/
│       ├── branding/       # Logos and UI textures
│       ├── pwa/            # Manifest/app icons
│       └── sites/          # Heritage site photos
├── src/
│   ├── main.js             # Browser dependency bootstrap
│   ├── app/                # Composition root, app state, lifecycle, and view controller
│   ├── config/             # Runtime configuration and localization
│   ├── features/           # Feature modules split by domain
│   ├── services/           # Browser service clients and storage helpers
│   ├── styles/             # Tailwind, Leaflet, and app CSS imports
│   └── utils/              # Extracted low-risk utility modules
├── scripts/validate-data.js
├── tests/                  # Vitest unit/data tests
├── api/
│   ├── _shared/            # Config, HTTP, security, observability, quota and AI helpers
│   ├── health.js           # Secret-free deployment/config health status
│   ├── chat.js             # Serverless AI chat endpoint
│   ├── session/            # Demo, visitor, admin, current, logout session APIs
│   └── admin/              # Protected admin prototype APIs
├── manifest.json           # PWA install metadata
└── vite.config.mjs         # Vite build configuration
```

---

## Architecture

The frontend remains a Vanilla JavaScript modular monolith. Vite builds `src/main.js`, while `src/app/` owns composition, lifecycle state, and view transitions. Feature controllers live under `src/features/`; browser infrastructure is isolated under `src/services/` and `src/ui/`.

`api/` remains outside `src/` because those files are Vercel serverless functions. Shared API concerns such as environment parsing, HTTP contracts, same-origin enforcement, request correlation, quota storage, and AI provider logic live under `api/_shared/`.

## Access Model

**Demo Mode:** `Explore Demo` starts with a local public-demo session and stores progress under the demo localStorage namespace. When the backend is reachable, it also obtains a signed short-lived demo cookie for protected AI requests.

**Visitor Passkey Workflow:** Visitor codes are submitted to `/api/session/visitor`; the server validates the code and issues a signed HttpOnly cookie.

**Project Admin Prototype Scope:** The admin screen demonstrates organiser passkey tooling. It remains a prototype workflow and should not be described as an operated BWM production admin system.

## Data Validation

Run `npm run validate:data` before deployment. The validator checks site schema/IDs, coordinates, image references, quiz consistency, AI context, the expected 11 `must_visit` records, Heritage Thread schema, duplicate thread stops, and cross-referenced site IDs.

## Security Boundaries

Client UI state is not trusted for authorization. Demo, visitor, admin, and chat authorization are based on the signed `bwm_session` cookie read by serverless APIs.

## Known Limitations

- Offline support covers the app shell and previously loaded same-origin content; CARTO basemap tiles and other external services remain online-only.
- The admin workflow is a portfolio prototype.
- Recommended sites do not all have quiz content yet.
- Google Translate is a third-party widget loaded only when requested.
- Shared AI answer caching requires Upstash configuration; without it, caching falls back to per-instance memory.
- AI retrieval is lexical and depends on curated `search_terms`; add verified aliases from real visitor questions before considering heavier retrieval.
- Invalid Gemini JSON fails safely without consuming quota, but may show fallback/error responses more often if the model ignores the response contract.
- Source chips depend on local client site data, so labels may not render if frontend site data fails to load.

---

## 🎯 Key Improvements (December 2024)

### Performance Enhancements
- ✅ Removed 300ms tap delay for instant mobile response
- ✅ Added hardware acceleration to all animated elements
- ✅ Implemented CSS containment for better rendering
- ✅ Optimized scrolling with momentum and no-bounce

### User Experience
- ✅ Built complete interactive onboarding tour system
- ✅ Enhanced map modal with transit route visualization
- ✅ Added safe area insets for modern phones
- ✅ Standardized all UI transitions to 200ms

### Features
- ✅ Signed server-managed sessions for demo, visitor, and admin access
- ✅ Dynamic map modal titles with contextual icons
- ✅ Larger map viewing area (max-w-4xl)
- ✅ Smart food/hotel search centered on heritage sites

---

## Recent Maintenance Updates

- Completed Phase 7 grounded AI chat: site-scoped prompts, lexical retrieval, structured Gemini JSON validation, source chips, and answer caching.
- Ask AI now stores site-triggered questions in the shared AI chat history so reopening the chat does not hide earlier site prompts.
- Hardened AI chat rendering by sanitizing Markdown before inserting it into the DOM.
- Added server-side chat input limits, history normalization, same-origin checks, signed-session authorization, and rate limiting.
- Removed public interview codes and replaced them with direct Explore Demo access.
- Moved admin and visitor authorization to signed HttpOnly session cookies.
- Split demo and visitor progress into separate localStorage namespaces with Reset Demo Progress.
- Fixed recommended map sites K, L, and M so they appear in map filters.
- Removed empty site records from `data/sites.json` and stopped migration from deleting live site IDs `8` and `10`.
- Improved GPS timeout messaging so users see visible feedback when location fails or falls back.

---

## Content Management

### Heritage Sites (`data/sites.json`)
Edit this file to add/modify heritage sites:

```json
{
  "id": "1",
  "name": "Sultan Abdul Samad Building",
  "category": "must_visit",
  "coordinates": {"marker": [3.1481, 101.6961]},
  "info": "Brief description...",
  "info_more": "Detailed history...",
  "image": "images/sites/sultan-abdul-samad.jpg",
  "architect": "A.C. Norman",
  "year": "1897"
}
```

### Localization (`src/config/localization.js`)
Update UI strings for internationalization support.

---

## 🎨 Design Guidelines

### Color Scheme
- **Primary:** Indigo/Purple gradients (`from-purple-500 to-indigo-500`)
- **Accent:** Blue for actions (`bg-blue-600`)
- **Success:** Green for confirmations (`bg-green-600`)
- **Neutral:** Gray shades for subtle elements

### Animation Principles
- **Duration:** 200ms for interactions, 500ms for modals
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` for smooth, natural feel
- **Hardware:** Always use `transform` + `opacity` for GPU acceleration

---

## 📱 PWA Features

### Installation
- Prompts users to install as home screen app
- Same-origin app assets and previously loaded heritage content can be reused offline; external map tiles remain online-only
- Full-screen immersive mode on mobile

### Icons
- **192x192:** Standard icon
- **512x512:** High-res icon
- Maskable icons for adaptive display


---

## 🙏 Acknowledgments

- **Badan Warisan Malaysia** for heritage preservation
- **Google Gemini** for AI capabilities
- **Vercel** for hosting infrastructure
- **OpenStreetMap** contributors for mapping data
- **CARTO** for the Positron basemap tiles
- **Leaflet.js** community for excellent documentation

---
