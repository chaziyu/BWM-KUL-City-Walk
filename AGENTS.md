# BWM KUL City Walk — Codex Instructions

## Project stack
- Vanilla JavaScript ES6 modules
- HTML5 and CSS3
- Tailwind CSS CDN
- Leaflet.js
- Vercel Serverless Functions
- Google Apps Script and Google Sheets
- Google Gemini API

## Engineering rules
- Preserve the existing Vanilla JavaScript architecture.
- Do not migrate to React, Vue, TypeScript, or a bundler unless explicitly requested.
- Do not add npm packages unless a browser-native feature, existing dependency, or small utility cannot solve the need safely.
- Reuse data.json as the single source of truth for heritage site content.
- Keep sensitive values only in Vercel environment variables or Google Apps Script properties.
- Never expose API keys, admin passwords, session secrets, or Sheets URLs in frontend code.
- Keep visitor and admin flows separate.
- Preserve mobile-first behavior, accessibility labels, keyboard navigation, and modal focus handling.
- Before editing, inspect relevant files and explain the smallest safe plan.
- After editing, run available checks and summarize changed files, risks, and rollback steps.