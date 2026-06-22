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
