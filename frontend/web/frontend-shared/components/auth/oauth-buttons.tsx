"use client"

import { useState } from "react"
import { Github, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { authApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

const oauthProviders = [
  {
    id: "google",
    name: "Google",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    ),
  },
  {
    id: "github",
    name: "GitHub",
    icon: <Github className="h-5 w-5" />,
  },
]

export function OAuthButtons() {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null)
  const { toast } = useToast()

  const handleOAuthLogin = async (providerId: string) => {
    setLoadingProvider(providerId)
    try {
      // Get the OAuth authorization URL from the backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:3000'}/auth/oauth/${providerId}`)
      const data = await response.json()
      
      if (data.success && data.url) {
        // Redirect to the OAuth provider
        window.location.href = data.url
      } else {
        throw new Error(data.message || 'Failed to get OAuth URL')
      }
    } catch (error) {
      console.error("OAuth error:", error)
      toast({
        title: "Authentication failed",
        description: "Failed to initiate OAuth login. Please try again.",
        variant: "destructive",
      })
      setLoadingProvider(null)
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {oauthProviders.map((provider) => (
        <Button
          key={provider.id}
          type="button"
          variant="outline"
          onClick={() => handleOAuthLogin(provider.id)}
          disabled={loadingProvider !== null}
          className="h-11 rounded-[10px] border-[var(--separator)] bg-[var(--fill-tertiary)] text-[15px] font-medium hover:bg-[var(--fill-secondary)] active:scale-[0.98]"
        >
          {loadingProvider === provider.id ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              {provider.icon}
              <span className="ml-2">{provider.name}</span>
            </>
          )}
        </Button>
      ))}
    </div>
  )
}
