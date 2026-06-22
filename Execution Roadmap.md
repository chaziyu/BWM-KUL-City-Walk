# Execution Roadmap

Do **not** add Route Composer, Heritage Lens, event mode, or new AI features first.

First make the current project easier to maintain. The app already has a Vite structure, reusable utilities, server session APIs, tests, and data validation, but the main runtime still imports the large legacy `app.js`, while much UI remains in the large HTML shell.

---

## Phase 0 — Establish a Safe Baseline

**Goal:** Ensure every later refactor can be checked against the current working version.

### Tasks

* Run and record:

  ```bash
  npm run lint
  npm run test
  npm run validate:data
  npm run build
  ```
* Create a short `docs/current-behaviour.md`:

  * Landing flow
  * Demo flow
  * Visitor passkey flow
  * Admin prototype flow
  * Map filtering
  * Site modal
  * Quiz and passport
  * Chat
  * GPS fallback
* Capture screenshots for:

  * Mobile width: 360px, 390px, 430px
  * Tablet: 768px
  * Desktop: 1440px
* Create GitHub issues grouped by:

  * `architecture`
  * `bug`
  * `ui-ux`
  * `security`
  * `feature`
* Resolve documentation inconsistencies before adding features.

### Important cleanup

The README says full offline functionality is planned, but another section says the app works offline with cached content. Do not claim offline support until a service worker and cache strategy exist.

### Done when

* Current build passes.
* You have a visual reference for regression checks.
* Every existing major flow is documented.

---

# Part A — Codebase Structure First

## Phase 1 — Introduce a Real App Core

**Goal:** Stop adding logic directly into `app.js`.

Do not rewrite the app into React. Keep Vanilla JavaScript and refactor gradually.

### Target structure

```text
src/
├── core/
│   ├── app-controller.js
│   ├── app-state.js
│   ├── dom.js
│   ├── event-bus.js
│   └── router.js
├── features/
│   ├── access/
│   ├── map/
│   ├── sites/
│   ├── passport/
│   ├── challenges/
│   ├── chat/
│   ├── badge/
│   └── onboarding/
├── services/
│   ├── api-client.js
│   ├── storage.js
│   ├── session-client.js
│   ├── geolocation.js
│   └── analytics.js
├── ui/
│   ├── modal-manager.js
│   ├── toast.js
│   ├── loading-state.js
│   └── components/
├── config/
├── utils/
└── styles/
```

### Tasks

* Replace `app.js` as the main controller with `src/core/app-controller.js`.
* Keep `app.js` temporarily as a compatibility bridge only.
* Create one central `appState` object instead of many unrelated global variables.
* Create standard helpers:

  * `openModal()`
  * `closeModal()`
  * `showToast()`
  * `setLoading()`
  * `renderError()`
* Create a small event system for cross-feature actions:

```js
emit('site:selected', site);
emit('passport:updated', visitedSites);
emit('session:changed', session);
```

### Do not do yet

* Do not redesign screens.
* Do not add routes, AI features, or event mode.
* Do not move every function in one commit.

### Done when

* New work no longer goes into root `app.js`.
* Global state is reduced.
* A feature can be initialized independently.

---

## Phase 2 — Extract the Core Visitor Journey

**Goal:** Modularize the parts users touch most.

Extract in this order:

### 2.1 Access and session

Move into:

```text
src/features/access/
├── landing-screen.js
├── demo-access.js
├── visitor-access.js
├── admin-access.js
└── access-ui.js
```

The project already has a proper signed-cookie session model and browser client, so preserve that design rather than replacing it.

### 2.2 Map

Move into:

```text
src/features/map/
├── map-controller.js
├── marker-renderer.js
├── polygon-renderer.js
├── map-filter.js
├── geolocation.js
└── map-ui.js
```

### 2.3 Site details

Move into:

```text
src/features/sites/
├── site-modal.js
├── site-renderer.js
├── site-actions.js
└── site-data.js
```

### 2.4 Passport and progress

Move into:

```text
src/features/passport/
├── passport-controller.js
├── progress-service.js
├── stamp-renderer.js
└── progress-ui.js
```

### Done when

* Map functionality works without site-modal logic inside it.
* Passport state does not directly manipulate map DOM.
* Site modal can be tested with mock site data.

---

## Phase 3 — Extract Secondary Features and Clean HTML

**Goal:** Reduce the oversized `index.html` and avoid fixed UI controls being managed everywhere.

The current page includes numerous independent floating controls: map filters, font zoom, challenge, passport, chat, language and landing controls.

### Extract into modules

```text
src/features/
├── chat/
├── challenges/
├── badge/
├── onboarding/
├── translation/
└── directions/
```

### Refactor HTML

Keep `index.html` only for:

```html
<body>
  <div id="app"></div>
</body>
```

Then each feature owns its template:

```text
src/features/chat/chat-template.js
src/features/passport/passport-template.js
src/features/sites/site-modal-template.js
```

This is still Vanilla JavaScript. It does not require React.

### Done when

* `index.html` becomes mostly an app shell.
* Each modal has one owner module.
* Modal opening, closing, focus trapping, and keyboard behavior use the same shared system.

---

## Phase 4 — Reliability, Testing, Security, and Performance

**Goal:** Make the refactored base stable before product expansion.

The project already has Vitest, linting, and data validation. Existing tests mainly cover data validation and smaller utility functions.

### Add tests

| Area       | Test                                             |
| ---------- | ------------------------------------------------ |
| Access     | Demo, visitor passkey, logout, expired session   |
| Map        | Filter changes, marker visibility, selected site |
| Passport   | Check-in, quiz success, progress update          |
| Site modal | Correct content and action buttons               |
| Chat       | Empty input, quota reached, unsupported question |
| Storage    | Separate demo and visitor progress               |
| Responsive | Key mobile viewport regression checks            |

### Add browser tests

Use Playwright for:

* Start Exploring → open site → quiz → passport
* GPS denied fallback
* Visitor passkey access
* Mobile landscape behaviour
* Keyboard navigation and modal focus

### Security tasks

* Add durable rate limiting using Vercel KV, Upstash Redis, or similar.
* Apply rate limiting to session/admin endpoints, not only chat.
* Add CSP and security headers.
* Remove public Google Sheet CSV fallback for production.
* Add audit logs for admin actions.
* Disable production source maps unless needed for monitored error reporting.

The current chat rate and quota data is stored in memory, so it may reset across serverless cold starts or separate instances.

### Done when

* Critical visitor flows have browser tests.
* Every production API endpoint has validation and rate limiting.
* No public spreadsheet is used as an authentication fallback.
* Production deployment has clear monitoring and error logs.

---

# Part B — UI/UX Enhancement

## Phase 5 — Create a Unified Design System

**Goal:** Make the interface feel intentional rather than feature-by-feature.

### Define tokens

```text
Colour
Typography
Spacing
Radius
Shadow
Button sizes
Icon sizes
Modal widths
Animation duration
Accessibility contrast
```

### Recommended visual direction

Move away from generic purple SaaS styling.

Use a heritage-oriented system:

* Deep ink / charcoal
* Warm ivory / paper background
* Bronze or terracotta accent
* One serif display typeface for landmark headings
* One clean sans-serif font for interface text
* One consistent icon library instead of mixing many emojis

### Build reusable UI components

```text
Button
Icon button
Bottom sheet
Modal
Card
Tag
Progress indicator
Site badge
Toast
Loading skeleton
Empty state
Error state
```

### Responsive redesign priorities

1. Replace scattered floating controls with one expandable action tray.
2. Use a bottom sheet for selected site details.
3. Keep one primary action visible at a time.
4. Ensure all buttons remain reachable with one hand on mobile.
5. Test keyboard open state, landscape mode, and smaller Android devices.

### Done when

* All modals use shared spacing, typography, and actions.
* Landing, map, passport, and chat look like one product.
* No screen has more than one dominant CTA.

---

# Part C — New and Enhanced Features

## Phase 6 — Improve Current Features Before Adding Major New Ones

**Goal:** Make existing features more useful.

### 6.1 Replace “Explore Demo”

Rename:

```text
Explore Demo → Start Exploring
Visitor Passkey → Join an Event
```

Public users should not feel they are using a demo.

### 6.2 Improve passport logic

Create two progress types:

| Type          | Meaning                                  |
| ------------- | ---------------------------------------- |
| Explorer      | User read and explored a site remotely   |
| On-site stamp | User verified presence through GPS or QR |

This avoids forcing visitors to travel while preserving meaningful real-world achievements.

### 6.3 Improve daily challenge

Instead of only rotating riddles:

* Link each riddle to route themes.
* Reward a bonus stamp or route clue.
* Explain the answer after completion.
* Add difficulty levels.

### 6.4 Improve accessibility information

Add verified optional data fields later:

```json
{
  "walkingDifficulty": "easy",
  "stepFreeAccess": "unknown",
  "nearestTransit": "Pasar Seni LRT",
  "bestVisitTime": "morning",
  "shadeAvailable": true
}
```

Do not publish these until physically checked.

---

## Phase 7 — Grounded AI Tour Guide 2.0

**Goal:** Make AI faster, cheaper, and verifiably accurate.

The current server sends a broad knowledge prompt with all site context and tries multiple fallback models sequentially.

### 7.1 Contextual site chat

When the visitor is viewing a site, send only:

* Current site facts
* User question
* Recent relevant messages
* Short behaviour instructions

Do not send all sites.

### 7.2 Retrieval for general questions

For broader questions:

```text
User question
→ retrieve 1–3 relevant sites
→ send only matching verified facts to Gemini
→ return answer with source site IDs
```

### 7.3 Structured AI response

Require internal JSON:

```json
{
  "answer": "The building was completed in 1897.",
  "sourceSiteIds": ["1"],
  "confidence": "high",
  "notFound": false
}
```

Then validate `sourceSiteIds` against `sites.json`.

### 7.4 UI changes

Show source chips below answers:

```text
Verified trail source:
Sultan Abdul Samad Building
```

### 7.5 Cost and latency

* Use one primary model and one fallback.
* Lower factual-answer temperature to `0.2`.
* Cache answers by site ID, language, and normalized question.
* Summarize old chat history instead of sending all history.
* Count user quota only after a successful answer.

### Done when

* Every factual answer is traceable to a known site.
* Unsupported questions explicitly state that verified information is unavailable.
* Average prompt size is substantially reduced.

---

## Phase 8 — Route Composer

**Goal:** Turn the app from a map into a guided journey.

### Input

Ask the visitor:

* Available time
* Interest theme
* Starting point
* Walking preference
* Accessibility requirement

### Output

Generate routes such as:

```text
60-minute Merdeka Story
90-minute Faith and Culture Walk
Architecture Photo Trail
Family Heritage Quest
```

### Technical design

Start rules-based, not AI-generated.

```text
route = selectSites({
  duration,
  theme,
  startPoint,
  walkingDifficulty
});
```

Use AI only later for narrative wording, not route safety or factual routing.

### Done when

* A visitor can choose a route in under one minute.
* The map gives a clear “next stop.”
* The visitor can continue a route after closing the app.

---

## Phase 9 — “Wow” Features

Only start after Phases 0–8 are stable.

### Priority order

1. **Audio Walk Mode**

   * 30–45 second site narrations
   * Continue route button
   * Minimal interaction while walking

2. **Then vs Now**

   * Historical photo and current image slider
   * “What changed?” story

3. **QR On-Site Stamps**

   * More reliable than GPS-only verification

4. **School / Group Event Mode**

   * Team routes
   * Event QR
   * Leaderboard
   * Organiser dashboard

5. **Heritage Lens**

   * Camera identifies a landmark
   * Historical overlay
   * AI story grounded in verified site data

6. **BWM Partner Layer**

   * Curated museum, café, event, or cultural partner rewards

---

# Recommended Exact Order

```text
Phase 0 — Baseline and documentation
Phase 1 — App core and shared state
Phase 2 — Extract map, site modal, passport
Phase 3 — Extract chat, onboarding, challenge, badge, HTML shell
Phase 4 — Testing, security, PWA, observability
Phase 5 — Unified visual design and responsive redesign
Phase 6 — Improve current product flows
Phase 7 — Grounded AI 2.0
Phase 8 — Route Composer
Phase 9 — Audio, Then vs Now, QR stamps, events, Heritage Lens
```

## Do not build yet

Avoid these until Phase 8:

* Full React rewrite
* Complex user accounts
* Large database migration
* Camera-based recognition
* AR
* Social community feed
* Marketplace / paid partners
* AI-generated historical facts
* Complex admin dashboard

This order protects the existing project while making each later feature easier to develop, test, and explain in a portfolio or hackathon pitch.
