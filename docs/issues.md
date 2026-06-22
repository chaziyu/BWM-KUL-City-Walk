# Issue Catalog

> Discovered during Phase 0 baseline review. Grouped by label.

---

## `architecture`

### ARCH-1: Monolithic `app.js` (2,577 lines)
All game state, DOM wiring, map logic, authentication flows, modals, and UI listeners live in a single file. Makes it hard to test, maintain, or add features independently.

### ARCH-2: ~20 scattered global variables
`map`, `activeSession`, `visitedSites`, `discoveredSites`, `allSiteData`, `mainSites`, `chatHistory`, `userMessageCount`, `currentModalSite`, `currentModalMarker`, `userMarker`, `solvedRiddle`, `markersLayer`, `polygonsLayer`, `allMarkers`, `allPolygons`, `activeFilterMode`, `previewCard`, `currentPreviewSiteId`, `deferredPrompt` — all module-level or truly global. No central state management.

### ARCH-3: Empty feature folders
`src/features/chat/`, `src/features/map/`, `src/features/passport/`, `src/features/sites/`, `src/features/challenge/`, `src/features/pwa/` are all empty. Code for these features still lives in `app.js`.

### ARCH-4: Existing `src/app/state.js` is unused by `app.js`
`src/app/state.js` exports an `appState` object but `app.js` never imports or uses it — it maintains its own parallel globals.

### ARCH-5: Multiple `onDomReady` blocks in `app.js`
Three separate `onDomReady()` callbacks (lines 185, 1445, 2290) plus top-level code (lines 2399–2570) that runs immediately. Unclear initialization order.

### ARCH-6: `bootstrap.js` is a one-liner
`src/app/bootstrap.js` only does `await import('../../app.js')` — provides no orchestration or error handling.

---

## `bug`

### BUG-1: `TOTAL_SITES` hardcoded to 11 alongside dynamic `mainSites.length`
Line 87 hardcodes `const TOTAL_SITES = 11` while line 558 dynamically computes `mainSites`. The congratulations check (line 1090) uses `TOTAL_SITES` but `updateGameProgress` (line 1371) uses `mainSites.length || TOTAL_SITES`. If site count ever changes, these will diverge.

### BUG-2: Preview card "Read Full History" handler duplicated
Lines 2028–2037 (inside `setupGameUIListeners`) and lines 2342–2359 (inside another `onDomReady`) both attach click handlers to `#previewOpenBtn`, potentially double-firing.

### BUG-3: `stamp.querySelector('img')` always returns null
Line 1426 calls `stamp.querySelector('img')?.classList.add('stamp-animate')` right after creating the stamp div but before appending the `<img>` child (which happens on line 1437). The query always returns null.

### BUG-4: Badge template `html2canvas` uses external default image
Line 236 loads a default avatar from `cdn-icons-png.flaticon.com` which may fail if the CDN is down or CORS blocks it.

---

## `ui-ux`

### UX-1: Staggered animation logic is fragile and overly complex
Lines 890–973 in `handleMarkerClick` manually reset and re-apply stagger animations, then immediately override them for buttons. The animation skip logic uses multiple try/catch blocks and manual DOM queries.

### UX-2: No feedback when GPS falls back to low accuracy
When GPS times out and falls back (line 734), the user only sees a brief toast. There's no persistent indicator showing they're on low-accuracy mode.

### UX-3: Chat modal doesn't show history count on open
The user only sees "X messages remaining" text but doesn't see past conversation until the chat modal opens and `loadChatHistory()` runs.

### UX-4: Badge modal close uses `classList.add('hidden')` not `animateCloseModal`
Line 203 in the badge modal close handler uses `classList.add('hidden')` directly, bypassing the animation system. Later (line 2274) a second handler does use `animateCloseModal`.

---

## `security`

### SEC-1: `innerHTML` used for dynamic content in several places
Lines 280–283 (badge stamp), 989–991 (flyer text), 996–1005 (FAQ), 1580–1593 (platform warning) use `innerHTML` with string interpolation. While most data comes from `sites.json`, the pattern is risky if data is ever user-contributed.

### SEC-2: `document.execCommand('copy')` fallback
Line 1621 uses the deprecated `document.execCommand('copy')` as a clipboard fallback.

### SEC-3: Device ID generation uses `Math.random()`
Line 114 generates device IDs with `Math.random().toString(36)` which is not cryptographically secure. Fine for a device fingerprint but worth noting.

---

## `feature`

### FEAT-1: No service worker or cache strategy
The README and manifest describe PWA capabilities but there is no `service-worker.js` or workbox configuration. Offline support is not functional.

### FEAT-2: No route system
All navigation is done via showing/hiding DOM elements and `history.pushState` for modals. No URL-based routing exists.

### FEAT-3: Tour system removed
Lines 2572–2576 note the tour system was removed by user request. The README (line 27–31) still describes it as a feature. The help button references remain in the HTML.

### FEAT-4: Google Translate loaded but not fully integrated
The Google Translate loader exists in `src/features/access/google-translate.js` but there's no user-facing button or trigger documented in the current flows.

### FEAT-5: No analytics or usage tracking
No analytics service exists despite `src/services/analytics.js` being listed in the target structure.
