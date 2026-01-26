"use client"

import { useState, useEffect } from "react"
import type { UserProfile } from "@/types/user"
import { userApi } from "@/lib/api"

export function useUser() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await userApi.getProfile()
        setProfile(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      const updated = await userApi.updateProfile(data)
      setProfile(updated)
      return updated
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }

  return {
    profile,
    isLoading,
    error,
    updateProfile,
  }
}
