# Current Behaviour Reference

> Captured 2026-06-22. Use this document as a visual and functional baseline for regression checks during refactoring.

---

## 1. Landing Flow

1. Page loads → Vite builds `src/main.js` → bootstraps `app.js`.
2. If the user has no active session, the **Landing Page** (`#landing-page`) is displayed.
3. Three entry buttons are presented:
   - **▶ Explore Demo** — creates a signed short-lived demo session.
   - **I'm a Visitor** — transitions to the Gatekeeper screen.
   - **Project Admin (Prototype)** — transitions to the Staff screen.
4. A pre-login **User Guide** (`#userGuideModal`) button may appear to explain the app.
5. A **PWA Install Prompt** (`#pwaInstallPrompt`) may appear depending on platform and dismissal history.

---

## 2. Demo Flow

1. User clicks **Explore Demo** on the landing page.
2. Frontend calls `POST /api/session/demo`.
3. Server issues a signed HttpOnly `bwm_session` cookie with role `demo`.
4. `showMapExperience()` is called:
   - Hides landing page and gatekeeper.
   - Shows progress container and map.
   - Initializes map and game UI listeners.
   - Loads scoped state from `localStorage` under the `demo` namespace.
5. Demo progress (stamps, chat, challenges) is isolated from visitor progress.
6. A **Reset Demo Progress** button appears in the UI for demo sessions.

---

## 3. Visitor Passkey Flow

1. User clicks **I'm a Visitor** → Landing page slides out, **Gatekeeper** (`#gatekeeper`) slides in.
2. User enters a passkey code (or it's auto-filled from a `?code=` URL parameter).
3. Clicking **Unlock** triggers the **Platform Warning Modal** (`#platformWarningModal`):
   - Detects PWA vs. browser mode.
   - Warns that the passkey will be locked to the current platform.
   - Displays the passkey with a copy button.
   - Offers Continue (proceed to login) or Cancel (clear input).
   - Optional "What is PWA?" explanation modal.
4. On Continue, `POST /api/session/visitor` is called with the passkey and device ID.
5. Server validates via Google Apps Script, issues a signed `visitor` cookie.
6. `showMapExperience()` is called with visitor-scoped state.

---

## 4. Admin Prototype Flow

1. User clicks **Project Admin** → Landing slides out, **Staff Screen** (`#staff-screen`) slides in.
2. Admin login form with password input.
3. `POST /api/session/admin` validates the password, issues a signed `admin` cookie.
4. On success, the admin tool panel appears:
   - **Generate New Passkey** button → `POST /api/admin/generate-passkey`.
   - **Share via Email** button → opens mailto link with the passkey/magic link.
   - **Switch to Map** button → shows the map experience with admin chrome.
   - **Logout** button → calls `POST /api/session/logout`, reloads page.
5. Admin session shows a toggle button (`#btnAdminToggle`) on the map to return to admin tools.

---

## 5. Map Filtering

- The map has **two filter tabs**: "Must Visit" (`#tabMustVisit`) and "Recommended" (`#tabRecommended`).
- Clicking a tab sets `activeFilterMode` and calls `updateVisibility()`.
- `updateVisibility()` logic:
  - Filters `allSiteData` by the active category.
  - If zoom < `ZOOM_THRESHOLD` (18): shows markers, hides polygons.
  - If zoom ≥ `ZOOM_THRESHOLD`: shows polygons, hides markers.
  - Markers/polygons not matching the filter are removed from their layer group.
- The heritage zone boundary is drawn as a dashed brown polyline.

---

## 6. Site Modal

1. Clicking a marker or polygon triggers `openSiteDetails(site, marker)`.
2. The **Site Modal** (`#siteModal`) opens with an animated entrance:
   - Site image, label number, name, and description.
   - Staggered entrance animations on text elements (not buttons).
3. **More Info** section (if data exists):
   - Flyer image (B&W historical photo).
   - Flyer text (additional historical text).
   - Visitor FAQ (hours, fee, tip).
4. **Action buttons**:
   - 🧭 **Directions** → opens Google Maps embed in `#directionsModal`.
   - 🤖 **Ask AI** → pre-fills a question in the chat modal.
   - 🍔 **Food Nearby** → Google Maps restaurant search.
   - 🏨 **Hotels Nearby** → Google Maps hotel search.
5. **Quiz area** (main sites with numerical IDs):
   - Multiple-choice quiz with shuffled options.
   - Correct answer → stamp collected, progress updated, cha-ching sound.
   - Wrong answer → shake effect, hint shown.
   - All 11 stamps → confetti + congratulations modal.
6. **Check-in button** (bonus/recommended sites):
   - Marks the site as "discovered" instead of requiring a quiz.
7. **Daily Challenge button** (if the current site matches today's riddle answer):
   - Marks the challenge as solved, triggers confetti.
8. **Text size controls**: Increase/decrease/reset font size for the modal content.

---

## 7. Quiz and Passport

### Quiz
- Each of the 11 main heritage sites has a `quiz` object with `q`, `a`, `options`, and `hint`.
- Options are shuffled on each open.
- Correct → green highlight, buttons disabled, stamp added.
- Wrong → red shake, hint text revealed.

### Passport
- **Passport Modal** (`#passportModal`) shows a grid of all main sites.
- Visited sites display in full color; unvisited are grayscale.
- Progress text: "You have visited X of the Y heritage buildings".
- **Share** button uses Web Share API or WhatsApp fallback.

---

## 8. Chat

- **Chat Modal** (`#chatModal`) with message history and input field.
- Messages are sent to `POST /api/chat` with the user query and recent chat history.
- Server sends the query to Google Gemini (with model fallback chain).
- AI responses are rendered as sanitized Markdown (via `marked` + custom sanitizer).
- **Message limit**: Daily per-session quota (demo: 5, visitor: 15, admin: 30).
- Chat history and message count are persisted in scoped localStorage.
- Daily reset: message count resets when `last_active_day` changes.

### 8.1 Chat Baseline Before Refactor

Captured 2026-06-23 against `api/chat.js`.

- Prompt size: 20,643 characters / 20,723 UTF-8 bytes, approximately 5,161 tokens by chars / 4 estimate.
- Prompt content: `GENERAL_KNOWLEDGE`, all 24 records from `data/sites.json`, and the existing Markdown/short-paragraph formatting instructions.
- Answer format: `POST /api/chat` returns JSON `{ "reply": "..." }`; successful replies are sanitized to 5,000 characters and rendered by the frontend as sanitized Markdown.
- Latency baseline: mocked `tests/unit/chat.test.js` provider path completed 4 chat quota tests in 17ms test time, 284ms Vitest run duration. Live Gemini latency is network/model dependent and was not fixed here.
- Quota behaviour: empty or invalid requests return 400 without consuming quota; answered requests consume quota; demo quota allows 5 answered requests, then returns 429; provider failure returns 500 and refunds quota.

---

## 9. GPS Fallback

1. `map.locate()` starts with high accuracy, 10s timeout, 10s maximum age.
2. On `locationfound`: user marker and accuracy circle update.
3. On `locationerror`:
   - **Permission denied (code 1)**: Toast with permission instructions.
   - **Position unavailable (code 2)**: Toast suggesting outdoor relocation.
   - **Timeout (code 3)**: Retry counter increments.
     - First timeout: Falls back to low-accuracy mode (`enableHighAccuracy: false`).
     - Second timeout: Stops locate entirely, shows persistent toast.
4. GPS status toasts auto-hide after 7 seconds.

---

## 10. Daily Challenge

- A pool of 11 riddles in `allRiddles[]`.
- Today's riddle is selected by `getDayOfYear() % allRiddles.length`.
- **Challenge Modal** (`#challengeModal`) displays the riddle.
- If the user opens the matching site's modal, a **Solve Challenge** button appears.
- Clicking it marks the riddle as solved (stored in scoped localStorage), triggers confetti.
- Already-solved state is checked on each modal open.

---

## 11. Badge Generation

- **Badge Modal** (`#badgeInputModal`) lets users enter their name and upload a photo.
- A hidden badge template (`#hiddenBadgeTemplate`) is populated with:
  - User name, date, photo.
  - Dynamic status title (Beginner / Explorer / Specialist / Master).
  - Visit count caption and red stamp.
- `html2canvas` captures the template as a PNG, which auto-downloads.
- Cha-ching sound plays on success.

---

## 12. Preview Card

- When a marker is clicked, a **Preview Card** (`#previewCard`) can slide up from the bottom.
- Shows site image, name, and "Tap for details" text.
- Clicking the card opens the full site modal.
- Close button dismisses the preview.

---

## 13. PWA Install Prompt

- Captures the `beforeinstallprompt` event on Android/Chrome.
- After a 300ms delay (post-load), shows `#pwaInstallPrompt` if:
  - App is not already installed.
  - User hasn't dismissed the prompt in the last 7 days.
  - User is not already logged in.
- Device-specific UI:
  - **iOS**: Manual instructions (share → add to home screen).
  - **Android**: Programmatic install button.
  - **Desktop**: Generic instructions.

---

## 14. User Guide Modal

- Pre-login help button (`#btnPreLoginHelp`) opens `#userGuideModal`.
- Close and "Got It" buttons dismiss the modal.

---

## 15. UI Zoom

- **Global UI Zoom** (`#btnUIZoomIn`, `#btnUIZoomOut`): adjusts `document.documentElement.style.fontSize` between 80% and 130%.
- **Per-modal text zoom** (`#btnTextSizeLarge`, `#btnTextSizeSmall`, `#btnTextSizeReset`): sets CSS variable `--content-font-size` between 80% and 130%.

---

## 16. Google Translate

- `installGoogleTranslateLoader()` in `src/features/access/google-translate.js` lazy-loads the Google Translate widget when requested.
- Called during bootstrap in `src/main.js`.

---

## 17. Proximity Pulse

- When the user's GPS position is tracked, the user location pin changes its pulse animation speed:
  - **< 75m** from nearest unvisited site: `pulse-fast`
  - **< 250m**: `pulse-medium`
  - **> 250m**: `pulse-slow`
- Only unvisited/undiscovered main sites are considered.
- Debounced at 500ms to limit DOM updates.

---

## 18. Congratulations Flow

- When all 11 main sites are visited (quiz answered correctly):
  - **Congratulations Modal** (`#congratsModal`) appears.
  - Confetti burst animates for 3 seconds.
  - **Share** button available (WhatsApp / Web Share API).
