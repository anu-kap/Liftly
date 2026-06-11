import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signOut as fbSignOut,
  type User,
} from 'firebase/auth'
import {
  doc, getDoc, setDoc, initializeFirestore, persistentLocalCache, type Firestore,
} from 'firebase/firestore'
import { firebaseConfig, firebaseEnabled } from './firebaseConfig'
import { emptyData, type AppData } from './types'

const LOCAL_KEY = 'liftly.data.v1'

// ---- Local persistence (always on; source of truth when signed out) ----

export function loadLocal(): AppData {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return structuredClone(emptyData)
    const parsed = JSON.parse(raw) as AppData
    return { ...structuredClone(emptyData), ...parsed, profile: { ...emptyData.profile, ...parsed.profile } }
  } catch {
    return structuredClone(emptyData)
  }
}

export function saveLocal(data: AppData): void {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data))
}

// ---- Firebase (cloud sync when configured + signed in) ----

let app: FirebaseApp | null = null
let db: Firestore | null = null

function ensureFirebase() {
  if (!firebaseEnabled) return null
  if (!app) {
    app = initializeApp(firebaseConfig)
    // Offline cache so the app keeps working in the gym basement.
    db = initializeFirestore(app, { localCache: persistentLocalCache() })
  }
  return app
}

export const cloudAvailable = firebaseEnabled

export function watchAuth(cb: (user: User | null) => void): () => void {
  const a = ensureFirebase()
  if (!a) { cb(null); return () => {} }
  return onAuthStateChanged(getAuth(a), cb)
}

export async function signInWithGoogle(): Promise<User> {
  const a = ensureFirebase()
  if (!a) throw new Error('Firebase is not configured yet — see src/lib/firebaseConfig.ts')
  const res = await signInWithPopup(getAuth(a), new GoogleAuthProvider())
  return res.user
}

export async function signOut(): Promise<void> {
  const a = ensureFirebase()
  if (a) await fbSignOut(getAuth(a))
}

function userDoc(uidStr: string) {
  return doc(db!, 'users', uidStr)
}

export async function loadCloud(uidStr: string): Promise<AppData | null> {
  ensureFirebase()
  const snap = await getDoc(userDoc(uidStr))
  if (!snap.exists()) return null
  const d = snap.data() as { json?: string }
  if (!d.json) return null
  const parsed = JSON.parse(d.json) as AppData
  return { ...structuredClone(emptyData), ...parsed, profile: { ...emptyData.profile, ...parsed.profile } }
}

// Whole-state doc keeps sync conflict-free and trivially correct for a single
// user. Debounced by the caller; ~years of workouts fit well under the 1 MB doc cap.
export async function saveCloud(uidStr: string, data: AppData): Promise<void> {
  ensureFirebase()
  await setDoc(userDoc(uidStr), { json: JSON.stringify(data), updatedAt: Date.now() })
}
