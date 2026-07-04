# Contributing to BWM KUL City Walk

## Local Development and Verification

To ensure that your changes will pass the automated CI quality checks, please verify them locally before opening a pull request.

### Prerequisites

- **Node.js**: Version **22** (declared in `.nvmrc`). We use this version consistently across local and CI environments.

### Local Setup

Install dependencies reproducibly:
```bash
npm ci
```

### Verification Scripts

Run the following scripts from a clean clone:

1. **Quality Checks**: Run linting, data validation, unit tests, and production build:
   ```bash
   npm run check:quality
   ```
2. **Browser/Integration Tests**: Run Playwright end-to-end tests:
   ```bash
   npm run test:e2e
   ```

## CI / CD Workflow

On every pull request and push to the `main` branch, a GitHub Actions workflow runs the following checks:
- **Quality**: Enforces code style (linting), heritage site data validation (`public/data/sites.json` schema validation), unit/feature tests, and Vite build compilation.
- **Browser**: Installs Playwright system dependencies, then runs E2E tests against the built production bundle using Chromium and WebKit (Mobile WebKit).

### Accessing E2E Diagnostic Reports

If a browser integration test fails in CI, Playwright generates a diagnostic HTML report containing screenshots and traces of the failures.
1. Navigate to the failed workflow run on the GitHub Actions tab.
2. Scroll to the **Artifacts** section at the bottom.
3. Download the `playwright-report` zip file.
4. Extract the contents and open `index.html` to inspect the failure logs and traces.

## Security Guidelines

- **Secrets and Credentials**: Never commit API keys, service accounts, Redis credentials, or `.env` files to the repository.
- **Dependency Caching**: While dependencies are cached in CI to speed up builds, the caching configuration must never cache credentials, tokens, or browser-session data. Cache contents are accessible to pull-request actors.
