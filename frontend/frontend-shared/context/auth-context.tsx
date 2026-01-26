"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { User, LoginCredentials, SignupCredentials } from "@/types/auth"
import { authApi, clearTokens, getAccessToken } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<{ requiresTwoFactor?: boolean }>
  signup: (credentials: SignupCredentials) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  const refreshUser = useCallback(async () => {
    try {
      const token = getAccessToken()
      if (!token) {
        setUser(null)
        return
      }

      const currentUser = await authApi.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error("Failed to fetch user:", error)
      setUser(null)
      clearTokens()
    }
  }, [])

  useEffect(() => {
    const initAuth = async () => {
      await refreshUser()
      setIsLoading(false)
    }

    initAuth()
  }, [refreshUser])

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true)
      const response = await authApi.login(credentials)

      if (response.requiresTwoFactor) {
        setIsLoading(false)
        return { requiresTwoFactor: true }
      }

      setUser(response.user)
      router.push("/dashboard")
      return {}
    } catch (error: unknown) {
      setIsLoading(false)
      const errorMessage = error instanceof Error ? error.message : "Failed to login"
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      })
      throw error
    }
  }

  const signup = async (credentials: SignupCredentials) => {
    try {
      setIsLoading(true)
      const response = await authApi.signup(credentials)
      setUser(response.user)
      router.push("/dashboard")
    } catch (error: unknown) {
      setIsLoading(false)
      const errorMessage = error instanceof Error ? error.message : "Failed to create account"
      toast({
        title: "Signup failed",
        description: errorMessage,
        variant: "destructive",
      })
      throw error
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setUser(null)
      clearTokens()
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      })
      router.push("/login")
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
