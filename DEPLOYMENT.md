# Raptor DFAC Survey Application

## DEPLOYMENT GUIDE

### PHASE 1: FIREBASE SETUP (15 minutes)

**Step 1: Create Firebase Project**
1. Go to https://console.firebase.google.com
2. Click "Add project"
3. Name: "raptor-dfac-survey"
4. Disable Google Analytics (not needed)
5. Click "Create project"

**Step 2: Enable Realtime Database**
1. In Firebase Console, click "Realtime Database" in left menu
2. Click "Create Database"
3. Select location: us-central1
4. Start in "Test mode" (we'll secure it next)
5. Click "Enable"

**Step 3: Configure Database Rules**
1. Click "Rules" tab in Realtime Database
2. Replace contents with the rules from `database.rules.json`
3. Click "Publish"

**Step 4: Get Firebase Config**
1. Click gear icon (⚙️) > "Project settings"
2. Scroll to "Your apps" section
3. Click "</> Web" icon
4. Register app name: "Raptor DFAC Survey"
5. Copy the firebaseConfig object
6. Replace the config in `src/config/firebase.js` with your values

### PHASE 2: LOCAL TESTING (10 minutes)

**Step 1: Install Dependencies**
```bash
cd raptor-dfac-survey
npm install
```

**Step 2: Test Locally**
```bash
npm run dev
```
Opens at http://localhost:3000

**Step 3: Verify Functionality**
- Submit test survey
- Check Firebase Console > Realtime Database for data
- Access /admin page (password: raptor2024)
- Verify statistics display correctly

### PHASE 3: DEPLOYMENT TO VERCEL (10 minutes)

**Option A: GitHub Method (Recommended)**
1. Create GitHub repository
2. Push code:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_REPO_URL
git push -u origin main
```
3. Go to https://vercel.com
4. Sign up with GitHub
5. Click "Import Project"
6. Select your repository
7. Framework: Vite
8. Click "Deploy"

**Option B: Vercel CLI Method**
1. Install Vercel CLI:
```bash
npm i -g vercel
```
2. Deploy:
```bash
vercel
```
3. Follow prompts (accept defaults)
4. Get production URL

### PHASE 4: QR CODE GENERATION (5 minutes)

**Step 1: Get Your URL**
After deployment, you'll get a URL like: https://raptor-dfac-survey.vercel.app

**Step 2: Generate QR Code**
- Go to https://www.qr-code-generator.com
- Enter your Vercel URL
- Customize: Add "Raptor DFAC Survey" as title
- Download high-resolution PNG (300 DPI for printing)

**Step 3: Print Materials**
- Print QR code at 3x3 inches minimum
- Add text: "Scan to provide feedback"
- Place at entrance, exit, and table tents

### ADMIN ACCESS

**URL:** https://your-app.vercel.app/admin
**Password:** raptor2024

**SECURITY NOTE:** Change password in `src/pages/AdminPage.jsx` line 12 before deployment.

### FIREBASE SECURITY (CRITICAL)

Current setup allows:
- Anyone can WRITE surveys (required for public access)
- Only authenticated users can READ surveys (admin protection)

For admin read access without authentication:
1. Firebase Console > Authentication
2. Enable "Anonymous" sign-in
3. Or use Firebase Auth with email/password

### COST ANALYSIS

**Firebase Free Tier:**
- 1 GB storage: ~100,000 responses
- 10 GB/month downloads
- More than sufficient for DFAC usage

**Vercel Free Tier:**
- Unlimited bandwidth
- 100 GB-hours compute
- Custom domain support

**Total Monthly Cost:** $0 (within free tiers)

### MONITORING

**Check Response Count:**
- Firebase Console > Realtime Database
- View real-time entry count

**Analytics (Optional):**
- Add Google Analytics to track QR scans
- Monitor response patterns by time of day

### TROUBLESHOOTING

**Problem:** Survey won't submit
**Fix:** Check Firebase config in `firebase.js`

**Problem:** Admin page shows no data
**Fix:** Verify database rules allow reading

**Problem:** Calendar download doesn't work
**Fix:** Check browser allows .ics file downloads

### MAINTENANCE

**Update Advisory Board Date:**
1. Edit `src/components/AdvisoryBoardBanner.jsx` (line 9)
2. Edit `src/components/InfoModal.jsx` (line 19)
3. Edit `src/pages/ThankYouPage.jsx` (line 15)
4. Redeploy: `git push` (auto-deploys via Vercel)

**Change Admin Password:**
1. Edit `src/pages/AdminPage.jsx` (line 12)
2. Redeploy

### CUSTOM DOMAIN (Optional)

1. Purchase domain (e.g., raptordfac.com)
2. Vercel Dashboard > Project > Settings > Domains
3. Add domain and follow DNS instructions

### DATA EXPORT

**Manual Export:**
1. Firebase Console > Realtime Database
2. Click three dots (⋮) > "Export JSON"

**Automated Export:**
Add to admin page for CSV download functionality

### TIMELINE SUMMARY

- Firebase setup: 15 min
- Local testing: 10 min  
- Deployment: 10 min
- QR generation: 5 min
- **Total: 40 minutes to production**

### NEXT STEPS

1. Complete Firebase setup
2. Test locally with real scenarios
3. Deploy to Vercel
4. Generate and print QR codes
5. Place QR codes in DFAC
6. Brief staff on monitoring admin dashboard
7. Schedule weekly review of feedback
