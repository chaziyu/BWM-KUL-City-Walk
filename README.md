# 🏛️ Jejak Warisan KL (Heritage Trail)

> A modern, interactive, and cost-free digital guide for the Kuala Lumpur Heritage Walk.
> **Live Website:** [https://jejak-warisan.vercel.app/](https://jejak-warisan.vercel.app/)

**Prepared For:** Badan Warisan Malaysia (BWM)

## 📖 Project Overview

**Jejak Warisan KL** is a "serverless" web application designed to guide visitors through 26 historical sites in Kuala Lumpur. It combines a digital map, gamification elements, and an AI-powered tour guide into a seamless mobile experience.

The project is built to be **zero-cost** to maintain, utilizing free tiers of modern cloud services.

### Key Highlights
*   **📱 No App Download:** Works entirely in the mobile browser.
*   **🧠 AI Tour Guide:** A "Talk to Tok Waris" chatbot powered by Google Gemini (Flash Lite).
*   **🔐 Daily Passkeys:** Secure access management via a simple Google Sheet.
*   **🏆 Gamification:** Digital passport, stamp collecting, and daily riddles.
*   **📍 Smart Navigation:** Proximity-based pulsing and "Take Me There" Google Maps integration.

---

## 🏗️ Technology Stack

*   **Frontend:** HTML5, Tailwind CSS (via CDN), Vanilla JavaScript.
*   **Mapping:** Leaflet.js (OpenStreetMap adapters).
*   **Backend (Serverless):** Vercel Serverless Functions (Node.js).
*   **Database:** Google Sheets (Published as CSV) for Passkeys.
*   **AI Engine:** Google Gemini API (`gemini-2.5-flash-lite`).
*   **Content Management:** JSON & JavaScript (Single Source of Truth).

---

## ✨ Features

### 1. Security & Access Control ("The Gatekeeper")
*   **Dual Landing Page:** Separate flows for **Visitors** (Passkey entry) and **Staff** (Admin login).
*   **24-Hour Session:** Login persists for 24 hours via local storage.
*   **BWM Staff Dashboard:** A specialized view for counter staff to retrieve and display "Today's Passkey" from the Google Sheet.

### 2. Interactive Map
*   **Digital Heritage Trail:** 13 Primary Sites (Numbered) + 13 Bonus Discovery Sites (Lettered).
*   **Proximity Pulse:** The user's GPS dot pulses faster (Green -> Fast Pulse) as they approach a hidden site.
*   **Rich Popups:** Site history, architect info, and photos.

### 3. Gamification ("The Passport")
*   **Stamp Collection:** Users answer site-specific quizzes to "collect stamps".
*   **Progress Tracking:** Visual progress bar (e.g., "7/13 Sites").
*   **Completion Reward:** A "Congratulations" modal with WhatsApp sharing upon collecting all 13 stamps.
*   **Daily Challenge:** A logic riddle that points to a specific site. Users must find the site and click "Solve Challenge" on location.

### 4. AI Tour Guide (Chatbot)
*   **Context-Aware:** The AI knows the exact history of the 26 sites (fed from `data.json`) and general KUL history (from `general_knowledge.js`).
*   **Persona:** "Tok Waris", a friendly local guide.
*   **Cost & Usage Control:** Limited to 10 messages per session to prevent API abuse.

---

## 🚀 Setup & Deployment

### Prerequisites
1.  **Vercel Account:** For hosting.
2.  **Google Cloud Account:** For Gemini API Key.
3.  **Google Drive:** For the Passkey Spreadsheet.

### Step 1: Google Sheet Setup
1.  Create a Google Sheet.
2.  **Column A:** Dates (YYYY-MM-DD).
3.  **Column B:** Passcodes (e.g., `JWK-001`).
4.  **File > Share > Publish to web**.
5.  Select **Entire Document** as **Comma-separated values (.csv)**.
6.  Copy the generated URL.

### Step 2: Environment Variables
Configure the following secrets in your Vercel Project Settings:

| Variable Name | Description | Example |
| :--- | :--- | :--- |
| `GOOGLE_API_KEY` | Your Google Gemini API Key. | `AIzaSy...` |
| `GOOGLE_SHEET_URL` | The CSV URL from Step 1. | `https://docs.google.com/...output=csv` |
| `ADMIN_PASSWORD` | Secure password for Staff Dashboard. | `MySecretPass2025!` |

### Step 3: Local Development
```bash
# Clone the repository
git clone https://github.com/chaziyu/jejak-warisan.git

# Install dependencies
npm install

# Run locally (Note: API functions require Vercel CLI or similar environment)
npm start
```
*Note: To test API functions locally, it is recommended to use `vercel dev`.*

---

## 🛠️ Content Management (SSOT)

Content is managed via code files, serving as a **Single Source of Truth**.

### 1. `data.json` (Site Data)
Contains the definition for all 26 sites.
```json
{
  "id": "1",
  "name": "Bangunan Sultan Abdul Samad",
  "coordinates": [3.1489, 101.6944],
  "info": "Display text for the map popup...",
  "ai_context": "Detailed history for the AI chatbot...",
  "quiz": { "q": "Question?", "a": "Answer" }
}
```

### 2. `general_knowledge.js` (AI Context)
Contains non-site specifics:
*   History of Kuala Lumpur.
*   Biographies of architects (A.B. Hubback, A.O. Coltman).
*   AI Persona instructions.

### 3. `images/` Folder
Stores all site images. Ensure filenames match those referenced in `data.json`.

---

## 📂 Project Structure

```
/
├── api/                   # Serverless Functions
│   ├── chat.js            # AI Chatbot Handler
│   ├── check-passkey.js   # Visitor Login Validation
│   └── get-admin-code.js  # Staff Dashboard Validation
├── images/                # Static Asset Images
├── app.js                 # Main Frontend Logic
├── data.json              # Master Data File (Sites)
├── general_knowledge.js   # AI Knowledge Base
├── index.html             # Main Entry Point
└── package.json           # Dependencies
```

---

## 🧩 Maintenance Guide

### Handling Passkeys
Edit the Google Sheet directly. Changes reflect instantly (or as soon as Google publishes the CSV update, usually <5 mins).

### Changing Content
1.  Edit `data.json` to update text, quizzes, or coordinates.
2.  Commit and Push to GitHub.
3.  Vercel will auto-redeploy.

### Monitoring API Usage
*   **Google Cloud Console:** Check "Generative Language API" for quota usage (Free tier: 1,500 req/day).

---

**© 2025 Badan Warisan Malaysia (BWM) & Universiti Malaya SULAM Project**
