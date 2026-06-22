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