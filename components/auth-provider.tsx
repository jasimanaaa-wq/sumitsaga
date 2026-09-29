"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, signOut as fbSignOut, type User } from "firebase/auth"
import { getFirebaseAuth } from "@/lib/firebase"

type AuthState = {
  user: User | null
  /** Human-friendly name: profile name, else the part of the email before the @ */
  name: string
  loading: boolean
  configError: string | null
  signOut: () => Promise<void>
  /** Re-read the profile (e.g. after updateProfile) and re-render */
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function displayNameOf(user: User | null) {
  if (!user) return ""
  return user.displayName?.trim() || user.email?.split("@")[0] || "Trekker"
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [configError, setConfigError] = useState<string | null>(null)
  const [, setTick] = useState(0)

  useEffect(() => {
    try {
      return onAuthStateChanged(getFirebaseAuth(), (u) => {
        setUser(u)
        setLoading(false)
      })
    } catch (e) {
      setConfigError(e instanceof Error ? e.message : "Firebase is not configured")
      setLoading(false)
    }
  }, [])

  const signOut = () => fbSignOut(getFirebaseAuth())
  const refresh = async () => {
    await getFirebaseAuth().currentUser?.reload()
    setTick((t) => t + 1)
  }

  return (
    <AuthContext.Provider value={{ user, name: displayNameOf(user), loading, configError, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
