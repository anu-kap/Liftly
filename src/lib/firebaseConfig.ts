// ── Firebase setup ──────────────────────────────────────────────────────────
// This project is wired to a real Firebase project. The app (storage.ts) reads
// `firebaseConfig` and `firebaseEnabled` from here and initializes Firebase
// itself, so this file only needs to EXPORT the config — don't call
// initializeApp() here.
//
// If sign-in fails on the live site, make sure you've done:
//   Authentication → Sign-in method → enable "Google"
//   Authentication → Settings → Authorized domains → add "<username>.github.io"
//   Firestore Database → created + rules from firestore.rules published

export const firebaseConfig = {
  apiKey: 'AIzaSyA8G5Qq1ajcvgViLbdcN5vn0yilllyBcKU',
  authDomain: 'liftly-eb864.firebaseapp.com',
  projectId: 'liftly-eb864',
  storageBucket: 'liftly-eb864.firebasestorage.app',
  messagingSenderId: '726083080358',
  appId: '1:726083080358:web:bec646240bee73e11ae467',
  measurementId: 'G-12CP583QD8',
}

export const firebaseEnabled = !firebaseConfig.apiKey.startsWith('PASTE_')
