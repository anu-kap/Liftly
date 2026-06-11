/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { User } from 'firebase/auth'
import {
  cloudAvailable, loadCloud, loadLocal, saveCloud, saveLocal, signInWithGoogle, signOut, watchAuth,
} from '../lib/storage'
import { emptyData, type AppData } from '../lib/types'

export type SyncState = 'local' | 'syncing' | 'synced' | 'error'

interface AppContextValue {
  data: AppData
  update: (fn: (d: AppData) => AppData) => void
  user: User | null
  cloudAvailable: boolean
  syncState: SyncState
  signIn: () => Promise<void>
  logOut: () => Promise<void>
  resetAll: () => void
}

const Ctx = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadLocal())
  const [user, setUser] = useState<User | null>(null)
  const [syncState, setSyncState] = useState<SyncState>('local')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const userRef = useRef<User | null>(null)
  useEffect(() => { userRef.current = user }, [user])

  // Auth listener: on sign-in, prefer cloud data; if cloud is empty, migrate local up.
  useEffect(() => {
    return watchAuth(async (u) => {
      setUser(u)
      if (!u) { setSyncState('local'); return }
      setSyncState('syncing')
      try {
        const cloud = await loadCloud(u.uid)
        if (cloud) {
          setData(cloud)
          saveLocal(cloud)
        } else {
          const local = loadLocal()
          await saveCloud(u.uid, local)
        }
        setSyncState('synced')
      } catch (e) {
        console.error('Cloud load failed', e)
        setSyncState('error')
      }
    })
  }, [])

  const persist = useCallback((next: AppData) => {
    saveLocal(next)
    const u = userRef.current
    if (u) {
      setSyncState('syncing')
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        try {
          await saveCloud(u.uid, next)
          setSyncState('synced')
        } catch (e) {
          console.error('Cloud save failed', e)
          setSyncState('error')
        }
      }, 800)
    }
  }, [])

  const update = useCallback((fn: (d: AppData) => AppData) => {
    setData(prev => {
      const next = fn(prev)
      persist(next)
      return next
    })
  }, [persist])

  const signIn = useCallback(async () => { await signInWithGoogle() }, [])
  const logOut = useCallback(async () => {
    await signOut()
    setSyncState('local')
  }, [])

  const resetAll = useCallback(() => {
    const fresh = structuredClone(emptyData)
    setData(fresh)
    persist(fresh)
  }, [persist])

  return (
    <Ctx.Provider value={{ data, update, user, cloudAvailable, syncState, signIn, logOut, resetAll }}>
      {children}
    </Ctx.Provider>
  )
}

export function useApp(): AppContextValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp must be used within AppProvider')
  return v
}
