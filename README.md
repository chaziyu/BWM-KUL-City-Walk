# 🏛️ BWM KUL City Walk (Heritage Trail)

> A modern, interactive, and Progressive Web App (PWA) for exploring Kuala Lumpur's heritage sites.
> **Live Website:** [https://bwm-kul-city-walk.vercel.app/](https://bwm-kul-city-walk.vercel.app/)

**Prepared For:** Badan Warisan Malaysia (BWM)

## 📖 Project Overview

**BWM KUL City Walk** is a cutting-edge Progressive Web App designed to guide visitors through **11 core heritage sites** in Kuala Lumpur. It combines an interactive map, gamification, AI-powered assistance, and a beautiful onboarding system into a seamless, **native-app-like** mobile experience.

The project is built to be **zero-cost** to maintain, utilizing free tiers of modern cloud services.

### Key Highlights
*   **📱 Native App Experience:** Feels like a real app with instant touch response, smooth 60fps animations, and offline-ready capabilities
*   **🎓 Interactive Onboarding:** Beautiful guided tour system with spotlight effects to help new users discover features instantly
*   **🧠 AI Tour Guide:** Context-aware chatbot powered by Google Gemini with rich knowledge of all heritage sites
*   **🛂 Digital Passport:** Collect stamps, check-in to sites, and track your exploration progress
*   **📍 Interactive Map:** Rich transit routes, food & hotel search, and beautiful site details
*   **⚡ Lightning Fast:** Hardware-accelerated animations, zero tap delay, and optimized performance
*   **♿ Accessible:** Global UI zoom controls, high-contrast design, and keyboard navigation support

---

## ✨ Major Features

### 🎯 **1. Interactive Onboarding System** *(NEW!)*
- **Guided Tour:** 7-step spotlight walkthrough that highlights all features
- **Smart Auto-Start:** Automatically launches for first-time users with non-intrusive timing
- **Help Button:** Always-accessible purple (?) button to restart the tour anytime
- **Beautiful Animations:** Smooth spotlight transitions with glowing purple effects
- **Progress Tracking:** Remembers completion status via localStorage

### 🚀 **2. Native App Performance** *(NEW!)*
- **Zero Tap Delay:** Removed 300ms mobile tap delay for instant response
- **Hardware Acceleration:** GPU-powered animations for smooth 60fps performance
- **Instant Feedback:** Visual tap responses with subtle scale effects
- **Safe Area Support:** Perfect iPhone notch and Android gesture area handling
- **Smooth Scrolling:** Momentum scrolling on iOS with no bounce/overscroll

### 🗺️ **3. Enhanced Map Experience** *(UPGRADED!)*
- **Transit Routes:** View interactive transit lines and travel times directly in embedded maps
- **Smart Search:** Find food and hotels near heritage sites (centered on site location)
- **Dynamic Titles:** Map modal shows contextual titles like "🍔 Food Near [Site Name]"
- **Larger Modal:** Wider map view (max-w-4xl) for better visibility
- **Helpful Context:** Clear info banner explaining how to access full Google Maps details

### 🔐 **4. Security & Access Control**
*   **Dual Landing Page:** Separate flows for **Visitors** (Passkey entry) and **Staff** (Admin panel)
*   **Persistent Sessions:** Admin login stays active across browser sessions
*   **Staff Tools:** Generate passkeys on-demand with Google Apps Script integration
*   **Modern UI:** Clean, gradient-based design with smooth transitions

### 🎮 **5. Gamification**
*   **Stamp Collection:** Visit sites to unlock digital stamps
*   **Progress Tracker:** Beautiful glassmorphic progress bar showing collection status
*   **Digital Passport:** View all collected stamps with elegant presentation
*   **Challenge System:** Daily riddles to discover mystery locations

### 🤖 **6. AI Tour Guide**
*   **Context-Aware:** Knows detailed history of all 11 heritage sites
*   **Friendly Persona:** Helpful local guide character
*   **Smart Limits:** Message quota system to control API costs
*   **Rich Responses:** Detailed, informative answers about sites

### 🎨 **7. Premium UI/UX**
- **Consistent Transitions:** All buttons have smooth 200ms hover effects
- **Login/Logout Animations:** Elegant fade-in/fade-out with backdrop blur
- **Modal Animations:** Physics-based slide-up with spring easing
- **Gradient Buttons:** Modern purple-to-indigo gradients throughout
- **Touch Optimized:** Tap highlights removed, text selection controlled

---

## 🏗️ Technology Stack

### Frontend
*   **Core:** HTML5, Vanilla JavaScript (ES6+), Tailwind CSS
*   **Mapping:** Leaflet.js with OpenStreetMap
*   **Animations:** Native CSS transitions with hardware acceleration
*   **Configuration:** Modular `config.js` for runtime settings

### Backend (Serverless)
*   **Hosting:** Vercel (Static + Serverless Functions)
*   **Database:** Google Sheets (CSV export) for passkeys
*   **Admin Tools:** Google Apps Script for passkey generation
*   **AI Engine:** Google Gemini API (`gemini-2.0-flash-exp`)

### Performance
*   **PWA:** Service worker ready, installable on all platforms
*   **Optimization:** Hardware acceleration, CSS containment, will-change hints
*   **Caching:** localStorage for session data and tour progress
*   **Load Time:** Optimized for fast initial paint and interaction

---

## 🚀 Quick Start

### Prerequisites
1.  **Vercel Account** for hosting
2.  **Google Cloud Account** for Gemini AI API
3.  **Google Apps Script** for passkey generation (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/chaziyu/BWM-KUL-City-Walk.git
cd BWM-KUL-City-Walk

# Install dependencies
npm install

# Run locally (Requires Vercel CLI for API functions)
vercel dev

### ⚠️ Local Development Note (Important)
This project uses ES6 Modules (`import`/`export`), which **cannot** runs directly from the file system (e.g., `file:///path/to/index.html`). You must use a local HTTP server.

**Option 1: Using Node.js (Recommended)**
```bash
# Start a local server
npx serve .
# Then open http://localhost:3000
```

**Option 2: Using Python**
```bash
# Start a simple HTTP server
python -m http.server 8000
# Then open http://localhost:8000
```


### Environment Variables

Configure these in Vercel Dashboard or `.env.local`:

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_API_KEY` | Google Gemini API Key | `AIzaSy...` |
| `GOOGLE_SHEET_URL` | Published CSV URL for passkeys | `https://docs.google.com/...` |
| `ADMIN_PASSWORD` | Secure admin password | `SecurePass123!` |
| `HISTORY_WINDOW_SIZE` | Chat history length (default: 30) | `30` |
| `MAX_MESSAGES_PER_SESSION` | Chat quota (default: 10) | `10` |

---

## 📁 Project Structure

```
BWM-KUL-City-Walk/
├── index.html          # Main app entry point
├── app.js              # Core application logic
├── tour.js             # Interactive onboarding system
├── style.css           # Global styles + animations
├── config.js           # Runtime configuration
├── data.json           # Heritage site data (SSOT)
├── localization.js     # Multi-language support
├── api/
│   └── chat.js         # Serverless AI chat endpoint
├── images/             # Site photos + PWA icons
└── manifest.json       # PWA configuration
```

---

## 🎯 Key Improvements (December 2024)

### Performance Enhancements
- ✅ Removed 300ms tap delay for instant mobile response
- ✅ Added hardware acceleration to all animated elements
- ✅ Implemented CSS containment for better rendering
- ✅ Optimized scrolling with momentum and no-bounce

### User Experience
- ✅ Built complete interactive onboarding tour system
- ✅ Enhanced map modal with transit route visualization
- ✅ Added safe area insets for modern phones
- ✅ Standardized all UI transitions to 200ms

### Features
- ✅ Persistent admin sessions across browser restarts
- ✅ Dynamic map modal titles with contextual icons
- ✅ Larger map viewing area (max-w-4xl)
- ✅ Smart food/hotel search centered on heritage sites

---

## 🛠️ Content Management

### Heritage Sites (`data.json`)
Edit this file to add/modify heritage sites:

```json
{
  "id": "1",
  "name": "Sultan Abdul Samad Building",
  "category": "must_visit",
  "coordinates": {"marker": [3.1481, 101.6961]},
  "info": "Brief description...",
  "info_more": "Detailed history...",
  "image": "images/sultan-abdul-samad.jpg",
  "architect": "A.C. Norman",
  "year": "1897"
}
```

### Localization (`localization.js`)
Update UI strings for internationalization support.

---

## 🎨 Design Guidelines

### Color Scheme
- **Primary:** Indigo/Purple gradients (`from-purple-500 to-indigo-500`)
- **Accent:** Blue for actions (`bg-blue-600`)
- **Success:** Green for confirmations (`bg-green-600`)
- **Neutral:** Gray shades for subtle elements

### Animation Principles
- **Duration:** 200ms for interactions, 500ms for modals
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` for smooth, natural feel
- **Hardware:** Always use `transform` + `opacity` for GPU acceleration

---

## 📱 PWA Features

### Installation
- Prompts users to install as home screen app
- Works offline with cached content
- Full-screen immersive mode on mobile

### Icons
- **192x192:** Standard icon
- **512x512:** High-res icon
- Maskable icons for adaptive display


---

## 🙏 Acknowledgments

- **Badan Warisan Malaysia** for heritage preservation
- **Google Gemini** for AI capabilities
- **Vercel** for hosting infrastructure
- **OpenStreetMap** for mapping data
- **Leaflet.js** community for excellent documentation

---
