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