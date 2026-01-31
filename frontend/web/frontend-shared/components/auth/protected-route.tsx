"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { getLandingUrl } from "@/lib/config"

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export function ProtectedRoute({ children, requireAuth = true, redirectTo }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const loginUrl = redirectTo || `${getLandingUrl()}/login`

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        console.log("Not authenticated, redirecting to landing page login")
        // Redirect to landing page login (full URL to change domain)
        window.location.href = loginUrl
      } else if (!requireAuth && isAuthenticated) {
        router.push("/dashboard")
      }
    }
  }, [isAuthenticated, isLoading, requireAuth, loginUrl, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--ios-blue)] border-t-transparent" />
      </div>
    )
  }

  if (requireAuth && !isAuthenticated) {
    return null
  }

  if (!requireAuth && isAuthenticated) {
    return null
  }

  return <>{children}</>
}
