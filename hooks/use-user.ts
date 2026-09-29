"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

/**
 * For pages that need a signed-in user: sends visitors to /login (and back afterwards).
 * `ready` is true only once a user is available.
 */
export function useRequireUser() {
  const auth = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!auth.loading && !auth.user && !auth.configError) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
    }
  }, [auth.loading, auth.user, auth.configError, router, pathname])

  return { ...auth, ready: !auth.loading && !!auth.user }
}
