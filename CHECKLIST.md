# RAPTOR DFAC SURVEY - DEPLOYMENT CHECKLIST

## CRITICAL PATH (40 minutes total)

### 1. FIREBASE SETUP (15 min)
□ Create Firebase project at console.firebase.google.com
□ Enable Realtime Database (us-central1, test mode)
□ Copy firebaseConfig from Project Settings
□ Paste config into src/config/firebase.js (replace YOUR_* placeholders)
□ Upload database.rules.json to Database Rules tab
□ Publish rules

### 2. SECURITY UPDATE (2 min)
□ Change admin password in src/pages/AdminPage.jsx line 12
□ Current default: "raptor2024" - CHANGE THIS

### 3. LOCAL TEST (10 min)
□ Run: npm install
□ Run: npm run dev
□ Submit test survey at localhost:3000
□ Verify data appears in Firebase Console
□ Test admin page at localhost:3000/admin
□ Verify calendar download works

### 4. DEPLOY TO VERCEL (10 min)
□ Create GitHub repo
□ Push code: git init && git add . && git commit -m "Initial" && git push
□ Sign up at vercel.com with GitHub
□ Import project from GitHub
□ Framework preset: Vite
□ Deploy
□ Copy production URL (e.g., raptor-dfac-survey.vercel.app)

### 5. QR CODE GENERATION (3 min)
□ Go to qr-code-generator.com
□ Enter Vercel production URL
□ Add title: "Raptor DFAC Survey"
□ Download PNG (300 DPI)
□ Print at 3x3 inches minimum

## POST-DEPLOYMENT

### Placement
□ QR code at DFAC entrance
□ QR code at exit
□ Table tent cards with QR codes

### Staff Brief
□ Show admin dashboard URL
□ Provide admin password (changed from default)
□ Schedule weekly review cadence

### Monitor
□ Check Firebase Console for response count
□ Review admin dashboard daily first week
□ Adjust based on feedback volume

## URLS TO SAVE

Survey: https://[your-app].vercel.app
Admin: https://[your-app].vercel.app/admin
Firebase: https://console.firebase.google.com/project/[your-project]

## CONTACTS

QR Code Issues: Reprint from saved PNG
App Issues: Check browser console + Firebase logs
Advisory Board Updates: Edit 3 files (see DEPLOYMENT.md line 156)

## COST: $0
Firebase free tier: 100K+ responses
Vercel free tier: Unlimited bandwidth
