"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth"
import { ArrowLeft, Mountain } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/components/auth-provider"
import { getFirebaseAuth } from "@/lib/firebase"

function friendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? ""
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password."
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in."
    case "auth/weak-password":
      return "Password must be at least 6 characters."
    case "auth/invalid-email":
      return "Please enter a valid email address."
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again."
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return ""
    case "auth/operation-not-allowed":
      return "This sign-in method isn't enabled in the Firebase console yet."
    default:
      return err instanceof Error ? err.message : "Something went wrong."
  }
}

export default function LoginPage() {
  const router = useRouter()
  const { user, loading, configError, refresh } = useAuth()
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [next, setNext] = useState("/group")

  useEffect(() => {
    const n = new URLSearchParams(window.location.search).get("next")
    // only allow same-site relative paths
    if (n && n.startsWith("/") && !n.startsWith("//")) setNext(n)
  }, [])

  // Already signed in (or just signed in) -> go where they were headed
  useEffect(() => {
    if (!loading && user) router.replace(next)
  }, [loading, user, next, router])

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      await fn()
    } catch (err) {
      const msg = friendlyError(err)
      if (msg) setError(msg)
    } finally {
      setBusy(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const auth = getFirebaseAuth()
    run(async () => {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
        await updateProfile(cred.user, { displayName: name.trim() })
        // the auth listener fired before the name was set, so re-read the profile
        await refresh()
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password)
      }
    })
  }

  const handleGoogle = () => run(() => signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider()))

  const handleReset = () => {
    if (!email.trim()) {
      setError("Enter your email above first, then click “Forgot password?”.")
      return
    }
    run(async () => {
      await sendPasswordResetEmail(getFirebaseAuth(), email.trim())
      setInfo("Password reset email sent. Check your inbox.")
    })
  }

  if (configError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-center">
        <p className="text-destructive max-w-md">Firebase isn't configured: {configError}. Check your .env.local values.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-4">
        <Link href="/search">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <Card>
          <CardHeader className="text-center">
            <Mountain className="h-10 w-10 text-primary mx-auto mb-2" />
            <CardTitle>{mode === "signin" ? "Welcome back" : "Create your account"}</CardTitle>
            <CardDescription>
              {mode === "signin" ? "Sign in to join groups and chat with trekkers." : "Sign up to create and join trek groups."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={busy}>
              Continue with Google
            </Button>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">or</span>
              <Separator className="flex-1" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="How trekkers will see you" maxLength={40} required />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "signin" && (
                    <button type="button" onClick={handleReset} className="text-xs text-primary hover:underline">
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  minLength={6}
                  required
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
              {info && <p className="text-sm text-muted-foreground">{info}</p>}

              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              {mode === "signin" ? "New here? " : "Already have an account? "}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin")
                  setError(null)
                  setInfo(null)
                }}
              >
                {mode === "signin" ? "Create an account" : "Sign in"}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
