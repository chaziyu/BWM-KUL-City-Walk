# Project Documentation: Jejak Warisan KL

**Prepared For:** Badan Warisan Malaysia (BWM)  
**Live Website:** [https://bwm-kul-city-walk.vercel.app/](https://bwm-kul-city-walk.vercel.app/)  
**Technology Stack:** HTML5, CSS3, JavaScript (ES6+), Vercel Serverless Functions, Leaflet.js, Google Sheets, Google Gemini API

---

## 1. Architecture Overview

This project is a **modern, zero-cost Progressive Web Application (PWA)** designed to guide visitors through Kuala Lumpur's heritage sites.

### Frontend Architecture
- **Core Technologies:** HTML5, Vanilla JavaScript (ES6 Modules), CSS3 with Tailwind utility classes
- **Mapping System:** Leaflet.js with OpenStreetMap tiles
- **State Management:** LocalStorage-based persistence with versioned migration system
- **File Structure:**
  - `index.html` - Main application entry point with all UI components
  - `app.js` - Core application logic (88KB - contains all operational code)
  - `style.css` - Global styles and animations with hardware acceleration
  - `tour.js` - Interactive onboarding tour system
  - `localization.js` - Multi-language string constants (currently supports English/Malay)
  - `storage-migration.js` - LocalStorage data versioning and migration utility
  - `config.js` - Runtime configuration module with environment variable support

### Backend Architecture (Serverless)
The backend uses **Vercel Serverless Functions** deployed in the `/api` folder:

1. **`/api/chat.js`** - AI chatbot endpoint
   - Uses Google GenAI SDK v1.0+ with fallback model chain
   - Implements context caching for optimal performance
   - Primary model: `gemini-2.5-flash-lite` (falls back through 9 model variants)
   - Includes text sanitization and structured XML-based context injection
   
2. **`/api/check-passkey.js`** - Daily passkey validation
   - Fetches passkey from published Google Sheet CSV
   - Timezone-aware validation (Asia/Kuala_Lumpur)
   - Case-insensitive passkey matching
   
3. **`/api/get-admin-code.js`** - Staff dashboard passkey retrieval
   - Admin password verification
   - Returns today's passkey for counter staff display

### Data Architecture (SSOT - Single Source of Truth)
All content is centralized in two files:

1. **`data.json`** (83KB) - Heritage site master data
   - Contains **11 heritage sites** (down from original 13 due to site removal)
   - Each site includes:
     - `id`, `name`, `coordinates` (marker + polygon), `image`, `built`, `architects`
     - `category` ("must_visit" or "recommended")
     - `info` (brief description), `info_more` (detailed history)
     - `quiz` (question, answer, options, hint)
     - `ai_context` (detailed context for AI chatbot)
     - `faq` (opening hours, ticket fees, tips)
     - `flyer_text`, `flyer_image` (print material content)

2. **`general_knowledge.js`** (6KB) - Non-site-specific AI context
   - AI persona definition ("Tok Waris" - friendly local guide)
   - Thematic deep dives (architecture, history, culture)
   - Practical safety and etiquette information
   - Quick facts cheat sheet for AI responses

### Hosting & Deployment
- **Platform:** Vercel (Free "Hobby Tier")
- **CDN:** Global edge network with automatic HTTPS
- **Build:** Zero-config static site with serverless API routes
- **Cost:** $0/month with generous free tier limits

---

## 2. Complete Feature List

### 🔐 Security & Access Control
- **Dual Landing Page:** Separate "Visitor" (passkey entry) and "Staff Login" buttons
- **Daily Dynamic Passkeys:** Fetched from BWM-controlled Google Sheet, validated server-side
- **Persistent Sessions:** Authenticated sessions stored in `localStorage` with `jejak_session` key
- **Admin Dashboard:** Staff login displays large, high-contrast "Today's Passkey" for counter use
- **API Quota Monitoring:** Direct link to Google Cloud API Dashboard in staff panel

### 🗺️ Interactive Map & Navigation
- **11 Heritage Sites:** Interactive Leaflet.js map with custom markers
- **Site Categories:** 
  - Must-Visit Sites (premium badges)
  - Recommended Sites (standard badges)
- **Polygon Overlays:** Accurate building footprints shown with 20% opacity
- **Welcome Modal:** First-visit popup explaining app purpose (dismissible)
- **Site Popups:** Rich modals showing:
  - Site name, photo, architect, year built
  - Brief and detailed descriptions (expandable "More Info")
  - Quiz question for stamp collection
  - "Directions" button (opens Google Maps with walking route)
  - "Food Near Here" and "Hotels Near Here" buttons (embedded map search)
- **Proximity Pulse:** User's GPS marker pulses faster when approaching undiscovered sites
- **Recenter Button:** Floating action button to snap map back to Dataran Merdeka (default center)
- **Zoom Controls:** Pinch-to-zoom enabled, threshold-based zoom level triggers
- **Branded UI:** BWM logo overlay with semi-transparent buttons

### 🎮 Gamification ("Heritage Passport")
- **Stamp Collection:** Answer quiz to unlock stamp for each site
- **Progress Tracker:** Glassmorphic progress bar showing "X/11 Sites Visited"
- **Audio Feedback:** "Cha-ching" sound effect on correct quiz answer
- **Visual Feedback:** Marker turns gold upon successful check-in
- **Digital Passport View:** Dedicated modal displaying all collected stamps
- **Completion Reward:** Congratulations modal with WhatsApp share button upon completing all 11 sites
- **Badge Generation:** AI-powered personalized certificate generation (heritage level: Beginner/Explorer/Specialist/Master)

### 🤖 AI Tour Guide (Chatbot)
- **Context-Aware Intelligence:** Knows detailed history of all 11 sites + general KL heritage knowledge
- **Friendly Persona:** "Tok Waris" character with Malaysian warmth and humor
- **Message Quota:** Limited to 15 messages per session (configurable via `MAX_MESSAGES_PER_SESSION`)
- **Markdown Support:** Rich text formatting in responses
- **Multilingual:** Automatically detects and responds in user's language (English/Mandarin)
- **Cost Control:** Free tier provides 1,000 requests/day (no billing required)
- **History Window:** Maintains context of last 30 messages (configurable via `HISTORY_WINDOW_SIZE`)

### 🎓 Interactive Onboarding System
- **7-Step Spotlight Tour:** 
  1. Welcome message
  2. Map controls explanation
  3. Progress tracker introduction
  4. Digital passport walkthrough
  5. AI chatbot features
  6. Site exploration tutorial
  7. Completion message with help button reminder
- **Auto-Start Logic:** Launches 2 seconds after first successful login
- **Spotlight Animations:** Dynamic highlight of UI elements with purple glow
- **Tooltip Positioning:** Smart positioning (center/top/bottom/left/right)
- **Progress Indicator:** "X of 7" step counter
- **Persistent Help Button:** Purple (?) button always visible in bottom-right for tour replay
- **Completion Tracking:** `tutorialCompleted` flag in `localStorage.userProgress`

### 📱 PWA Features
- **Installable:** Manifest.json with 192x192 and 512x512 icons
- **Standalone Mode:** Runs in full-screen without browser chrome
- **Offline-Ready:** Service worker caching (architecture present, ready for activation)
- **Add to Home Screen:** Native app-like experience on mobile
- **Safe Area Support:** iOS notch and Android gesture navigation padding
- **Theme Color:** Indigo (#4F46E5) for native integration

### 🎨 Premium UI/UX Enhancements
- **Zero Tap Delay:** `touch-action: manipulation` removes 300ms mobile lag
- **Hardware Acceleration:** `transform: translateZ(0)` on all animated elements
- **Smooth Scrolling:** Momentum scrolling on iOS with no overscroll bounce
- **200ms Transitions:** Standardized animation duration across all interactions
- **Gradient Buttons:** Modern purple-to-indigo gradients throughout
- **Glassmorphism:** Backdrop blur effects on modals and overlays
- **Spring Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` for natural motion
- **Responsive Design:** Mobile-first with Tailwind breakpoints (sm/md/lg/xl)

### 🔧 Storage & Migration System
- **Versioned Data:** `jejak_db_version` key tracks schema version
- **Automatic Migration:** `storage-migration.js` upgrades old data on app load
- **Removed Site Cleanup:** Filters out deprecated site IDs (8, 10) from user data
- **Data Validation:** Ensures `visitedSites` and `discoveredSites` are always valid arrays
- **Graceful Degradation:** Resets corrupt data instead of crashing

---

## 3. Environment Variables & Configuration

### Required Environment Variables (Vercel)
Set these in **Vercel Dashboard → Project Settings → Environment Variables**:

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_API_KEY` | Google Gemini AI API Key | `AIzaSy...` |
| `GOOGLE_SHEET_URL` | Published CSV URL for passkeys | `https://docs.google.com/spreadsheets/d/e/.../pub?output=csv` |
| `ADMIN_PASSWORD` | Secure staff login password | `BWM_Staff_2025!` |

### Optional Configuration Variables
These have defaults in `config.js`:

| Variable | Default | Description |
|----------|---------|-------------|
| `HISTORY_WINDOW_SIZE` | `30` | AI chat history length |
| `MAX_MESSAGES_PER_SESSION` | `15` | Chat message quota |
| `DEFAULT_CENTER` | `[3.1495, 101.696]` | Map center (Dataran Merdeka) |
| `ZOOM` | `16` | Initial map zoom level |
| `ZOOM_THRESHOLD` | `18` | Zoom level to show site labels |
| `POLYGON_OPACITY` | `0.2` | Building footprint transparency |

---

## 4. Project Handover & Setup (For BWM Admin)

### Step 1: Create BWM Accounts
You will need **three free accounts**:

1. **Google Account** (e.g., `projects.bwm@gmail.com`)  
   Purpose: Own passkey database and AI project
   
2. **GitHub Account**  
   Purpose: Own website source code repository
   
3. **Vercel Account** (sign up using your GitHub)  
   Purpose: Host the live website

### Step 2: Set Up Google Cloud & Passkey Sheet

#### A. Create Google Sheet for Passkeys
1. In Google Drive, create a new Sheet named **"Jejak Warisan Passkeys"**
2. Format (CSV structure):
   ```
   Date       | Passkey
   20/12/2025 | JWK-001
   21/12/2025 | JWK-002
   ```
   - Column A: Date in `DD/MM/YYYY` format
   - Column B: Alphanumeric passkey (case-insensitive)

3. **Publish Sheet as CSV:**
   - Go to **File > Share > Publish to web**
   - Select "Entire Document" and "Comma-separated values (.csv)"
   - Click "Publish" and copy the generated URL
   - Example URL: `https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv`

#### B. Create Google Cloud Project for AI
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project (e.g., "BWM-Heritage-AI")
3. **Enable API:**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Generative Language API"
   - Click "Enable"
4. **Create API Key:**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated key (starts with `AIza...`)
   - ⚠️ **Do NOT add billing info** to stay on free tier
5. **Monitor Usage:**
   - Go to "APIs & Services" > "Dashboard"
   - Click "Generative Language API" to view quota usage
   - Free tier: 1,000 requests/day

### Step 3: Deploy on Vercel

#### A. Transfer Repository
The development team will transfer the GitHub repository to your BWM GitHub account.

#### B. Import to Vercel
1. Log in to [Vercel](https://vercel.com/) using your GitHub account
2. Click **"Add New..." > "Project"**
3. Select the `BWM-KUL-City-Walk` repository
4. Click "Import"

#### C. Configure Environment Variables
Before deploying, add these in **Settings > Environment Variables**:

- `ADMIN_PASSWORD`: Your secure staff password (e.g., `BWM_Admin_2025!`)
- `GOOGLE_API_KEY`: The Gemini API key from Step 2B
- `GOOGLE_SHEET_URL`: The published CSV URL from Step 2A

#### D. Deploy
1. Click **"Deploy"**
2. Wait 1-2 minutes for build completion
3. Your live URL will be: `https://your-project-name.vercel.app`
4. (Optional) Add custom domain in Vercel Settings

---

## 5. Staff User Guide

### Part 1: For Counter Staff (Daily Operations)

**Goal:** Provide paying visitors with today's passkey.

**Steps:**
1. Open the website: `https://your-site.vercel.app`
2. Click **"BWM Staff Login"** on the landing page
3. Enter the `ADMIN_PASSWORD` when prompted
4. The screen displays **"Today's Passkey"** in large, bright purple text
5. Read this passkey aloud to the visitor

**Note:** The passkey automatically updates daily based on the Google Sheet.

### Part 2: For Admins (Management & Updates)

#### A. Changing Passkeys
1. Open your "Jejak Warisan Passkeys" Google Sheet
2. Find the row with the target date (Column A)
3. Edit the passkey in Column B
4. Save automatically syncs (no manual refresh needed)

**Pro Tip:** Pre-fill passkeys for the entire month to avoid daily updates.

#### B. Monitoring AI API Usage
1. Log in to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **"APIs & Services" > "Dashboard"**
3. Click **"Generative Language API"**
4. View quota usage:
   - **Free Tier Limit:** 1,000 requests/day
   - **Current Usage:** Shown in real-time graph
5. If quota is reached, chatbot stops working (no charges incurred)

**Quick Link:** The staff dashboard includes a direct link to this page.

#### C. Updating Heritage Site Content (SSOT Model)

**Important:** All content lives in two files. Edit these on GitHub to update both the map AND the AI chatbot simultaneously.

##### To Edit a Specific Site:
1. Log in to GitHub and open the `BWM-KUL-City-Walk` repository
2. Navigate to **`data.json`**
3. Click the **pencil icon (Edit)** in the top-right
4. Find the site by searching for its name (e.g., "Masjid Jamek")
5. Edit these fields:
   - `info` - Short description shown on map popup
   - `info_more` - Detailed description (expandable section)
   - `ai_context` - Detailed context for AI chatbot responses
   - `quiz` - Quiz question, answer, and options
   - `faq` - Opening hours, ticket fees, tips
6. Scroll to bottom and click **"Commit changes"**
7. Enter a commit message (e.g., "Updated Masjid Jamek description")
8. Click **"Commit changes"**

Vercel automatically redeploys in 60-90 seconds. Changes appear live immediately.

##### To Edit General History or Architect Bios:
1. Open the repository on GitHub
2. Navigate to **`general_knowledge.js`**
3. Click the **pencil icon (Edit)**
4. Modify text in these sections:
   - `## THEMATIC DEEP DIVES` - Architecture, history, culture explanations
   - `## PRACTICAL GUIDE & SAFETY` - Weather, safety, etiquette information
   - `## QUICK FACTS CHEAT SHEET` - Key statistics
5. Commit changes (same process as above)

**Auto-Deployment:** Every commit triggers automatic redeployment on Vercel (no manual action required).

---

## 6. Technical Specifications

### Browser Compatibility
- **Modern Browsers:** Chrome 90+, Safari 14+, Firefox 88+, Edge 90+
- **Mobile:** iOS 14+, Android 8+
- **Fallbacks:** Graceful degradation for older browsers (core functionality maintained)

### Performance Metrics
- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3.0s
- **Lighthouse Score:** 90+ (Performance, Accessibility, Best Practices, SEO)
- **Bundle Size:** ~200KB total (uncompressed)

### API Rate Limits
- **Google Gemini API (Free Tier):** 1,000 requests/day
- **Google Sheets CSV:** Unlimited reads (public document)
- **Vercel Serverless:** 100GB bandwidth/month, 100 hours compute/month (free tier)

### Data Persistence
- **LocalStorage Keys:**
  - `jejak_session` - Authentication session data
  - `jejak_visited` - Array of visited site IDs
  - `jejak_discovered` - Array of discovered site IDs
  - `jejak_message_count` - AI chat quota tracker
  - `jejak_db_version` - Database schema version
  - `userProgress` - Tutorial completion status

### Security Considerations
- **HTTPS Only:** Enforced by Vercel
- **CORS Protection:** API endpoints validate origin
- **Input Sanitization:** All user input sanitized before AI processing
- **No Sensitive Data:** Passkeys are ephemeral, no PII stored

---

## 7. Content Management Guide

### Heritage Site Data Structure (data.json)

Each site object follows this schema:

```json
{
  "id": "1",
  "name": "Bangunan Sultan Abdul Samad",
  "coordinates": {
    "marker": [3.1484, 101.6947],
    "polygon": [[3.1480, 101.6942], ...]
  },
  "image": "images/bangunan_sultan_abdul_samad.jpeg",
  "built": "1894-1897",
  "architects": "A.C. Norman, R.A.J. Bidwell, A.B. Hubback",
  "info": "Brief description for map popup",
  "info_more": "Detailed historical information (expandable)",
  "category": "must_visit",
  "quiz": {
    "q": "Quiz question?",
    "a": "Correct answer",
    "options": ["Option 1", "Option 2", "Option 3"],
    "hint": "Helpful hint text"
  },
  "flyer_text": "Print material description",
  "flyer_image": "images/...",
  "ai_context": "Rich context for AI chatbot (first-person narrative)",
  "faq": {
    "opening_hours": "9:00 AM - 5:00 PM",
    "ticket_fee": "Free",
    "tips": "Best photographed from the Padang"
  }
}
```

### Localization Strings (localization.js)

To add new UI text or translate existing strings, edit the `STRINGS` object:

```javascript
export const STRINGS = {
  auth: {
    verifying: "Verifying...",
    invalidPasskey: "Invalid or expired passkey.",
    // Add more auth strings here
  },
  game: {
    progress: (visited, total) => `You have visited ${visited} of the ${total} heritage buildings`,
    // Function-based strings for dynamic content
  }
};
```

**Usage in code:**
```javascript
import { STRINGS } from './localization.js';
alert(STRINGS.auth.invalidPasskey);
```

---

## 8. Troubleshooting & FAQs

### Common Issues

**Q: The passkey isn't working!**  
A: Check these:
1. Verify the date format in Google Sheet is `DD/MM/YYYY` (e.g., `20/12/2025`)
2. Ensure the CSV URL is published (File > Share > Publish to web)
3. Check server timezone matches Asia/Kuala_Lumpur
4. Verify `GOOGLE_SHEET_URL` environment variable is set correctly in Vercel

**Q: The AI chatbot says "I'm having trouble connecting"**  
A: Possible causes:
1. API quota exceeded (check Google Cloud Console)
2. `GOOGLE_API_KEY` environment variable missing or invalid
3. `data.json` file failed to load (check deployment logs)

**Q: The map isn't loading**  
A: Check:
1. Internet connection (Leaflet requires online tiles from OpenStreetMap)
2. Browser console for JavaScript errors
3. GPS permission granted (required for user location marker)

**Q: How do I add a new heritage site?**  
A: This requires developer assistance:
1. Obtain accurate GPS coordinates (marker + polygon footprint)
2. Prepare site photo, historical information, quiz question
3. Add new object to `data.json` following the schema
4. Increment site count in UI (progress tracker, completion logic)

**Q: Can I change the maximum chat messages?**  
A: Yes, set the `MAX_MESSAGES_PER_SESSION` environment variable in Vercel (default: 15)

---

## 9. Maintenance & Support

### Regular Maintenance Tasks
- **Weekly:** Review API quota usage in Google Cloud Console
- **Monthly:** Update passkeys for next 30 days in Google Sheet
- **Quarterly:** Review and update heritage site information for accuracy
- **Yearly:** Renew Google Cloud project (automatic) and Vercel deployment (automatic)

### Backup & Recovery
- **Code Backup:** GitHub repository (version-controlled)
- **Data Backup:** Download `data.json` and `general_knowledge.js` monthly
- **Passkey Backup:** Download Google Sheet as Excel file quarterly
- **Recovery:** Vercel automatic rollback to previous deployment available

### Getting Help
- **Technical Issues:** Contact development team or create GitHub Issue
- **Content Updates:** Follow Section 5C (Updating Content via GitHub)
- **Google Cloud Support:** [Google Cloud Help Center](https://support.google.com/cloud)
- **Vercel Support:** [Vercel Documentation](https://vercel.com/docs)

---

## 10. Acknowledgments

**Built For:**  
Badan Warisan Malaysia (BWM)

**Developed By:**  
Universiti Malaya SULAM Project Team

**Powered By:**
- Google Gemini AI (Generative AI)
- Vercel (Hosting & Serverless)
- OpenStreetMap (Map Tiles)
- Leaflet.js (Interactive Maps)

**Heritage Consultant:**  
Badan Warisan Malaysia

---

**© 2025 Badan Warisan Malaysia (BWM) & Universiti Malaya SULAM Project**  
**Built with ❤️ for Malaysian Heritage**
