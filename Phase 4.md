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