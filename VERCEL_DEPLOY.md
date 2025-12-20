# Vercel Deployment Guide

Follow these steps to publish the refactored code with the new configuration module.

## 1️⃣ Push Changes
Ensure all new files (`config.js`) and changes (`app.js`, `README.md`) are committed and pushed to your GitHub repository.

```bash
git add .
git commit -m "Refactor: Remove session expiration and add config module"
git push origin main
```

## 2️⃣ Configure Vercel Environment Variables
In your Vercel Project Dashboard:
1.  Go to **Settings** → **Environment Variables**.
2.  Add the following variables (overriding defaults if needed):

| Variable | Recommended Value | Description |
| :--- | :--- | :--- |
| `HISTORY_WINDOW_SIZE` | `30` | Number of chat messages to retain. |
| `MAX_MESSAGES_PER_SESSION` | `10` | Chat limit per session. |
| `DEFAULT_CENTER` | `[3.149552, 101.696091]` | Initial map coordinates. |
| `ZOOM` | `16` | Initial map zoom level. |

3.  Ensure your existing secrets (like `GOOGLE_API_KEY`, `ADMIN_PASSWORD`) are also present.

## 3️⃣ Deploy
*   **Automatic:** Pushing to `main` should trigger a deployment automatically.
*   **Manual:** You can trigger a redeploy from the Vercel Dashboard -> Deployments -> Redeploy.

## 4️⃣ Verification
1.  Open your Vercel URL (e.g., `https://bwm-kul-city-walk.vercel.app/`).
2.  **Login:** Enter a passkey (or Admin password).
3.  **Test Persistence:** 
    *   Refresh the page. You should stay logged in (no Landing Page).
    *   Close and reopen the tab. You should stay logged in.
4.  **Test Config:** Verify that chat history limit and map zoom reflect your settings.
