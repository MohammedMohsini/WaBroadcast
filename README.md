# WaBroadcast 💬
### WhatsApp Broadcast App — Each user brings their own Meta API key

---

## How It Works

1. User signs up to your app
2. User gets their own WhatsApp Business API key from Meta (free, 15 min)
3. User pastes the key into the app Settings
4. User can now send messages **automatically** to 1000+ contacts in one click
5. Messages come FROM the user's own WhatsApp number

**You never need Meta approval.** Each user self-serves their own key.

---

## Project Structure

```
wabcast_final/
├── src/
│   ├── App.jsx              ← Complete React app (all screens)
│   └── main.jsx             ← Entry point
├── backend/
│   ├── server.js            ← Express API (handles WhatsApp sending)
│   ├── package.json
│   └── .env.example
├── index.html
├── package.json
├── vite.config.js
├── .env.example             ← Frontend environment variables
└── supabase_schema.sql      ← Run once in Supabase SQL Editor
```

---

## Setup (20 minutes total)

### Step 1 — Supabase (5 min)
1. Go to https://supabase.com → New Project → name "wabroadcast"
2. Go to SQL Editor → paste `supabase_schema.sql` → Run
3. Go to Settings → API → copy:
   - Project URL
   - anon public key
   - service_role key (for backend only)

### Step 2 — Backend (5 min)
```bash
cd backend
cp .env.example .env
# Fill in SUPABASE_URL and SUPABASE_SERVICE_KEY
npm install
npm start
```

### Step 3 — Frontend (5 min)
```bash
cp .env.example .env
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON, VITE_API_URL
npm install
npm run dev
```
Open http://localhost:5173

---

## Deploy to Internet (FREE)

### Backend → Render.com
1. Push backend/ folder to GitHub
2. Go to render.com → New Web Service → connect repo
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add environment variables (from backend/.env)
6. Deploy → copy the URL (e.g. https://wabroadcast-api.onrender.com)

### Frontend → Vercel
1. Push entire project to GitHub
2. Go to vercel.com → New Project → import repo
3. Add environment variables:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON
   - VITE_API_URL = your Render URL
4. Deploy → get live URL

---

## Subscription Plans

| Plan      | 1mo    | 3mo    | 6mo    | 12mo    | Msgs/mo  |
|-----------|--------|--------|--------|---------|----------|
| Free      | ₹0     | —      | —      | —       | 30 total |
| Basic     | ₹199   | ₹499   | ₹899   | ₹1,499  | 2,000    |
| Pro ⭐    | ₹499   | ₹1,199 | ₹2,199 | ₹3,999  | 10,000   |
| Business  | ₹999   | ₹2,499 | ₹4,499 | ₹7,999  | 50,000   |
| Unlimited | ₹1,999 | ₹4,999 | ₹8,999 | ₹15,999 | Unlimited|

---

## Publish to Google Play Store

### What you need first:
- Google Play Developer Account: one-time ₹1,750 registration fee
- App built as Android APK/AAB using Capacitor

### Step 1 — Build Android APK (30 min)

Install Node.js, then:
```bash
# Install Capacitor
npm install @capacitor/core @capacitor/android @capacitor/cli

# Build the web app
npm run build

# Initialize Capacitor
npx cap init "WaBroadcast" "com.yourname.wabroadcast"

# Add Android platform
npx cap add android

# Copy built files
npx cap sync android

# Open in Android Studio
npx cap open android
```

In Android Studio:
- Build → Generate Signed Bundle/APK → Android App Bundle (AAB)
- Create a new keystore (save it — you need it forever)
- Build release AAB

### Step 2 — Create Play Store Listing

1. Go to play.google.com/console
2. Pay ₹1,750 one-time registration
3. Create New App → name "WaBroadcast"
4. Fill in:
   - Short description (80 chars): "Send WhatsApp messages to 1000+ contacts in one click"
   - Full description: explain features
   - Screenshots: take 2-8 screenshots on phone
   - App icon: 512×512 PNG
   - Feature graphic: 1024×500 PNG

### Step 3 — Upload and Submit

1. Go to Production → Releases → Create new release
2. Upload your AAB file
3. Add release notes
4. Submit for review

Google review takes 3-7 days for new apps.

### App Icon (quick)
Create a simple icon at appicon.co or use Figma:
- Green WhatsApp-style bubble
- "WB" text or speech bubble emoji
- Export as 512×512 PNG

### Required Permissions in AndroidManifest.xml
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.READ_CONTACTS" />
```

### capacitor.config.json
```json
{
  "appId": "com.yourname.wabroadcast",
  "appName": "WaBroadcast",
  "webDir": "dist",
  "server": {
    "androidScheme": "https"
  }
}
```

---

## Revenue Estimate

If you get 100 paying users on Basic plan (₹199/mo):
- Monthly revenue: ₹19,900
- Your costs: Supabase free + Render $7/mo + ₹1,750 Play Store (once)
- Monthly profit: ~₹19,300

At 500 users mixed plans: ₹80,000-1,20,000/month

---

## Support & Questions
- Supabase docs: supabase.com/docs
- Meta WhatsApp API: developers.facebook.com/docs/whatsapp
- Capacitor Android: capacitorjs.com/docs/android
- Render deploy: render.com/docs/deploy-node-express-app
