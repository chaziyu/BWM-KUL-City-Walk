# 🏛️ BWM KUL City Walk (Heritage Trail)

> A modern, interactive, and "serverless" digital guide for the Kuala Lumpur Heritage Walk.
> **Live Website:** [https://bwm-kul-city-walk.vercel.app/](https://bwm-kul-city-walk.vercel.app/)

**Prepared For:** Badan Warisan Malaysia (BWM)

## 📖 Project Overview

**BWM KUL City Walk** is a Progressive Web App (PWA) designed to guide visitors through 24 historical sites in Kuala Lumpur. It combines a digital map, gamification elements, and an AI-powered tour guide into a seamless mobile experience.

The project is built to be **zero-cost** to maintain, utilizing free tiers of modern cloud services.

### Key Highlights
*   **📱 PWA / No App Download:** Installable on iOS/Android as a native-like app.
*   **🧠 AI Tour Guide:** "Tok Waris" chatbot powered by Google Gemini.
*   **🛂 Digital Passport:** Collect stamps, "check-in" to sites, and generate a **Personalized Explorer ID Badge** with your photo.
*   **📍 Interactive Map:** Filter between **"Must Visit"** highlights and **"Recommended"** gems.
*   **♿ Accessible:** Global UI Zoom controls and high-contrast design.

---

## 🏗️ Technology Stack

*   **Frontend:** HTML5, Tailwind CSS, Vanilla JavaScript.
*   **Configuration:** `config.js` module for runtime settings.
*   **Mapping:** Leaflet.js (OpenStreetMap adapters).
*   **Backend (Serverless):** Vercel Serverless Functions.
*   **Database:** Google Sheets (Published as CSV) for Passkeys.
*   **AI Engine:** Google Gemini API (`gemini-2.5-flash-lite`).
*   **Tools:** `html2canvas` (Badge Generation), `Canvas Confetti`.

---

## ✨ Features

### 1. Security & Access Control ("The Gatekeeper")
*   **Dual Landing Page:** Separate flows for **Visitors** (Passkey entry) and **Staff** (Admin login).
*   **Permanent Session:** Login persists indefinitely until manually cleared.
*   **Staff Dashboard:** Retrieves "Today's Passkey" from Google Sheets.

### 2. Smart Map Interface
*   **Dual Categories:** Toggle between **"✨ Must Visit"** (11 Core Sites) and **"Recommended"** (13 Bonus Sites).
*   **Proximity Pulse:** GPS tracking with visual proximity indicators.
*   **Rich Popups:** Site history, architect info, and photos.

### 3. Gamification ("The Passport")
*   **Stamp Collection:** Visit sites to unlock "stamps" in your digital passport.
*   **Explorer ID:** Generate a **shareable photo ID badge** instantly upon progress.
*   **Daily Challenge:** A daily riddle that guides users to a specific mystery location.
*   **Social Sharing:** Native WhatsApp sharing for achievements.

### 4. User Experience (UX) Polish
*   **Global UI Zoom:** Custom `+ / -` controls to scale text/interface for better readability.
*   **PWA Optimized:** "Add to Home Screen" support with full-screen immersive mode (iOS/Android).
*   **Haptic Feel:** Disabled rubber-banding and text selection for an app-like touch experience.

### 5. AI Tour Guide (Chatbot)
*   **Context-Aware:** The AI knows the exact history of the 24 sites (fed from `data.json`).
*   **Persona:** "Tok Waris", a friendly local guide.
*   **Cost Control:** Limited message quota per session.

---

## 🚀 Setup & Deployment

### Prerequisites
1.  **Vercel Account:** For hosting `api/` functions.
2.  **Google Cloud Account:** For Gemini API Key.
3.  **Google Drive:** For the Passkey Spreadsheet.

### Step 1: Google Sheet Setup
1.  Create a Google Sheet with columns: `Date` (YYYY-MM-DD) and `Passcode`.
2.  **File > Share > Publish to web**.
3.  Select **Entire Document** as **Comma-separated values (.csv)**.

### Step 2: Environment Variables
Configure these in Vercel:

| Variable Name | Description | Example |
| :--- | :--- | :--- |
| `GOOGLE_API_KEY` | Your Google Gemini API Key. | `AIzaSy...` |
| `GOOGLE_SHEET_URL` | The CSV URL from Step 1. | `https://docs.google.com/...output=csv` |
| `ADMIN_PASSWORD` | Secure password for Staff Dashboard. | `SecretPass!` |
| `HISTORY_WINDOW_SIZE` | Chat history length (Optional, default 30). | `30` |
| `MAX_MESSAGES_PER_SESSION` | Chat limit per session (Optional, default 10). | `10` |
| `DEFAULT_CENTER` | Map start coordinates (Optional). | `[3.14, 101.69]` |
| `ZOOM` | Default map zoom level (Optional). | `16` |

### Step 3: Local Development
```bash
# Clone the repository
git clone https://github.com/chaziyu/jejak-warisan.git

# Install dependencies
npm install

# Run locally (Requires Vercel CLI for API functions)
vercel dev
```

---

## 🛠️ Content Management (SSOT)

Content is managed via code files, serving as a **Single Source of Truth**.

### 1. `data.json` (Site Data)
Contains the definition for all sites, categorized by `category`:
```json
{
  "id": "1",
  "name": "Bangunan Sultan Abdul Samad",
  "category": "must_visit", // or "recommended"
  "coordinates": [3.1489, 101.6944],
  "info": "Display text...",
  "ai_context": "Detailed history..."
}
```

### 2. `images/` Folder
Stores site images and PWA icons (`icon-192.png`, `icon-512.png`).

---

**© 2025 Badan Warisan Malaysia (BWM) & Universiti Malaya SULAM Project**
