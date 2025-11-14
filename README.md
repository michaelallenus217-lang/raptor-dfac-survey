# 1-2 SBCT Raptor DFAC Survey Application

Mobile-optimized customer feedback system for the Raptor Dining Facility.

## Features

- ⭐ Star ratings (Customer Satisfaction, Food Quality, Cleanliness)
- 💬 Text feedback (Improvements & Likes)
- 📋 Enlisted Advisory Board promotion with info modal
- 📅 Add to calendar (.ics download)
- 📊 Admin dashboard with analytics
- 📱 Mobile-first responsive design
- 🔒 Simple password-protected admin access

## Tech Stack

- **Frontend:** React 18 + Vite
- **Backend:** Firebase Realtime Database
- **Hosting:** Vercel (free tier)
- **Styling:** Inline CSS (zero dependencies)

## Quick Start

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete setup instructions.

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Build for production
npm run build
```

## URLs

- **Survey:** `/` (main QR code destination)
- **Thank You:** `/thank-you` (post-submission)
- **Admin:** `/admin` (password: raptor2024)

## Firebase Setup Required

1. Create Firebase project
2. Enable Realtime Database
3. Copy config to `src/config/firebase.js`
4. Deploy security rules from `database.rules.json`

## Advisory Board Details

- **Next Meeting:** 09 March 2026 at 1500
- **Location:** Raptor DFAC
- **Reference:** AR 30-22 (Army Food Program)

## Admin Password

Default: `raptor2024`

**CHANGE THIS** in `src/pages/AdminPage.jsx` line 12 before production deployment.

## Data Structure

```javascript
{
  "surveys": {
    "unique_id": {
      "customerSatisfaction": 1-5,
      "foodQuality": 1-5,
      "cleanliness": 1-5,
      "improvements": "text",
      "likes": "text",
      "timestamp": "ISO8601"
    }
  }
}
```

## Support

Created for 1-2 SBCT Raptor DFAC customer feedback operations.

For technical issues, check Firebase Console logs and browser console.
