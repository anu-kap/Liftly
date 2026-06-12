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

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA8G5Qq1ajcvgViLbdcN5vn0yilllyBcKU",
  authDomain: "liftly-eb864.firebaseapp.com",
  projectId: "liftly-eb864",
  storageBucket: "liftly-eb864.firebasestorage.app",
  messagingSenderId: "726083080358",
  appId: "1:726083080358:web:bec646240bee73e11ae467",
  measurementId: "G-12CP583QD8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);