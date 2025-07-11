# Firebase Deployment Instructions for UB FoodHub

## Prerequisites Setup Complete ✓
- Firebase CLI installed
- Firebase configuration files created (firebase.json, .firebaserc)
- Project configured for hosting

## Next Steps (Manual Actions Required)

### 1. Authentication
Since we're in a non-interactive environment, you'll need to:

```bash
# On your local machine or in a terminal with browser access:
firebase login

# Then get a CI token for deployment:
firebase login:ci
```

### 2. Build and Deploy
```bash
# Build the production version (this may take 2-3 minutes)
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### 3. Configure Firebase Project
If you haven't created a Firebase project yet:
1. Go to https://console.firebase.google.com
2. Create a new project named "ub-foodhub"
3. Enable Hosting in the Firebase console

### 4. Environment Variables
Your Firebase config is already set up in the app using environment variables. Make sure your Firebase project has:
- Authentication enabled
- Firestore database enabled
- Hosting enabled

## Alternative: Deploy to Replit Hosting
Since you're already on Replit, you can also deploy directly using Replit's built-in hosting:

1. Click the "Deploy" button in the Replit interface
2. Your app will be available at a `.replit.app` domain
3. This is simpler and doesn't require Firebase hosting

## Files Created
- `firebase.json` - Firebase hosting configuration
- `.firebaserc` - Firebase project settings
- `deploy-instructions.md` - These instructions

## Production Build Contents
The build will create:
- Optimized React app in `dist/` folder
- Static files ready for hosting
- Service worker for PWA capabilities (if configured)

## Performance Considerations
- The build process is intensive due to:
  - Large icon library (Lucide React)
  - Multiple UI component libraries
  - Firebase SDK
  - Framer Motion animations

Expected build time: 2-5 minutes depending on system performance.