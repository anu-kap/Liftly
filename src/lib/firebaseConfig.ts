// ── Firebase setup ──────────────────────────────────────────────────────────
// 1. Go to https://console.firebase.google.com → Add project (name it anything).
// 2. In the project: Build → Authentication → Get started → Sign-in method →
//    enable "Google".
// 3. Authentication → Settings → Authorized domains → add
//    "<your-username>.github.io" (localhost is pre-authorized).
// 4. Build → Firestore Database → Create database → production mode → any region.
// 5. Firestore → Rules → paste the rules from README.md → Publish.
// 6. Project settings (gear icon) → General → Your apps → Web app (</>) →
//    register → copy the firebaseConfig object and paste it below.
//
// Until you do this, the app runs in "local mode": everything works and is
// saved on the device, and your data is migrated to the cloud automatically
// the first time you sign in.

export const firebaseConfig = {
  apiKey: 'PASTE_YOUR_API_KEY',
  authDomain: 'PASTE_YOUR_PROJECT.firebaseapp.com',
  projectId: 'PASTE_YOUR_PROJECT_ID',
  storageBucket: 'PASTE_YOUR_PROJECT.appspot.com',
  messagingSenderId: 'PASTE_YOUR_SENDER_ID',
  appId: 'PASTE_YOUR_APP_ID',
}

export const firebaseEnabled = !firebaseConfig.apiKey.startsWith('PASTE_')
