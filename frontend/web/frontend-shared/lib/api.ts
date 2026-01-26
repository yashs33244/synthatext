import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios"
import Cookies from "js-cookie"
import type {
  AuthResponse,
  LoginCredentials,
  SignupCredentials,
  PasswordResetRequest,
  PasswordReset,
  TwoFactorSetup,
  User,
} from "@/types/auth"
import type { UserProfile, UpdateProfileData, ChangePasswordData, ChangeEmailData } from "@/types/user"

// Auth API URL (Node.js auth service)
const API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:3000"

// Token management
const TOKEN_KEY = "access_token"
const REFRESH_TOKEN_KEY = "refresh_token"
const SESSION_KEY = "session" // Backend session cookie

export const getAccessToken = (): string | undefined => {
  return Cookies.get(TOKEN_KEY)
}

export const getRefreshToken = (): string | undefined => {
  // Check for backend session cookie first
  const sessionCookie = Cookies.get(SESSION_KEY)
  if (sessionCookie) {
    return sessionCookie
  }
  return Cookies.get(REFRESH_TOKEN_KEY)
}

export const getSessionCookie = (): string | undefined => {
  return Cookies.get(SESSION_KEY)
}

export const setTokens = (accessToken: string, refreshToken: string): void => {
  Cookies.set(TOKEN_KEY, accessToken, { expires: 7, secure: true, sameSite: "strict" })
  Cookies.set(REFRESH_TOKEN_KEY, refreshToken, { expires: 30, secure: true, sameSite: "strict" })
}

export const clearTokens = (): void => {
  Cookies.remove(TOKEN_KEY)
  Cookies.remove(REFRESH_TOKEN_KEY)
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
  withCredentials: true, // Important: Send cookies with requests
})

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor - handle token refresh
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return apiClient(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = getRefreshToken()

      if (!refreshToken) {
        clearTokens()
        window.location.href = "/login"
        return Promise.reject(error)
      }

      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        })

        const { accessToken, refreshToken: newRefreshToken } = response.data
        setTokens(accessToken, newRefreshToken)

        processQueue(null, accessToken)

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
        }

        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError as Error, null)
        clearTokens()
        window.location.href = "/login"
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

// Auth API endpoints
export const authApi = {
  // Email/Password Authentication
  signup: async (credentials: SignupCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post("/auth/signup", {
      email: credentials.email,
      password: credentials.password,
      firstName: credentials.name?.split(' ')[0] || '',
      lastName: credentials.name?.split(' ').slice(1).join(' ') || '',
    })
    const { user, accessToken, refreshToken } = response.data
    setTokens(accessToken, refreshToken)
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        emailVerified: user.emailVerified || false,
        twoFactorEnabled: user.twoFactorEnabled || false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      tokens: { accessToken, refreshToken }
    }
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post("/auth/login", {
      email: credentials.email,
      password: credentials.password,
    })
    const data = response.data

    // Check if 2FA is required
    if (data.requiresTwoFactor) {
      return {
        user: null as any,
        tokens: { accessToken: "", refreshToken: "" },
        requiresTwoFactor: true
      }
    }

    const { user, accessToken, refreshToken } = data
    setTokens(accessToken, refreshToken)
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        emailVerified: user.emailVerified || false,
        twoFactorEnabled: user.twoFactorEnabled || false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      tokens: { accessToken, refreshToken }
    }
  },

  logout: async (): Promise<void> => {
    try {
      const refreshToken = getRefreshToken()
      if (refreshToken) {
        await apiClient.post("/auth/logout", { refreshToken })
      }
    } finally {
      clearTokens()
    }
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get("/auth/me")
    const data = response.data

    // Handle the response structure from backend
    if (data.success && data.userData) {
      const user = data.userData
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        emailVerified: user.emailVerified || false,
        twoFactorEnabled: user.twoFactorEnabled || false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    }

    // Fallback for direct user object (if structure changes)
    const user = data.userData || data.user || data
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      emailVerified: user.emailVerified || false,
      twoFactorEnabled: user.twoFactorEnabled || false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  },

  // Email Verification
  verifyEmail: async (token: string): Promise<void> => {
    await apiClient.post("/auth/verify-email", { token })
  },

  resendVerification: async (): Promise<void> => {
    await apiClient.post("/auth/resend-verification")
  },

  // Password Reset
  forgotPassword: async (request: PasswordResetRequest): Promise<void> => {
    await apiClient.post("/auth/forgot-password", { email: request.email })
  },

  resetPassword: async (reset: PasswordReset): Promise<void> => {
    await apiClient.post("/auth/reset-password", {
      token: reset.token,
      password: reset.password,
    })
  },

  // Two-Factor Authentication
  setup2FA: async (): Promise<TwoFactorSetup> => {
    const response = await apiClient.post("/auth/2fa/setup")
    return response.data
  },

  verify2FA: async (code: string, trustDevice?: boolean): Promise<AuthResponse> => {
    const response = await apiClient.post("/auth/2fa/verify", { code, trustDevice })
    const { user, accessToken, refreshToken } = response.data
    setTokens(accessToken, refreshToken)
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        emailVerified: user.emailVerified || false,
        twoFactorEnabled: user.twoFactorEnabled || false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      tokens: { accessToken, refreshToken }
    }
  },

  disable2FA: async (password: string): Promise<void> => {
    await apiClient.post("/auth/2fa/disable", { password })
  },

  // OAuth
  getOAuthUrl: (provider: string): string => {
    return `${API_URL}/auth/oauth/${provider}`
  },
}

// User API endpoints
export const userApi = {
  getProfile: async (): Promise<UserProfile> => {
    // Use the /me endpoint since /users/profile doesn't exist yet
    const response = await apiClient.get("/auth/me")
    const data = response.data

    // Handle the response structure from backend
    if (data.success && data.userData) {
      const user = data.userData
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        bio: "", // Not available in current user model
        phone: "", // Not available in current user model
        emailVerified: user.emailVerified || false,
        twoFactorEnabled: user.twoFactorEnabled || false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    }

    // Fallback for direct user object (if structure changes)
    const user = data.userData || data.user || data
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      bio: "", // Not available in current user model
      phone: "", // Not available in current user model
      emailVerified: user.emailVerified || false,
      twoFactorEnabled: user.twoFactorEnabled || false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  },

  updateProfile: async (profileData: UpdateProfileData): Promise<UserProfile> => {
    // For now, just return the current user data since update endpoint doesn't exist
    // TODO: Implement actual profile update endpoint in backend
    const currentProfile = await userApi.getProfile()
    return {
      ...currentProfile,
      name: profileData.name || currentProfile.name,
      bio: profileData.bio || currentProfile.bio,
      phone: profileData.phone || currentProfile.phone,
    }
  },

  changePassword: async (passwordData: ChangePasswordData): Promise<void> => {
    await apiClient.post("/api/users/change-password", {
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    })
  },

  changeEmail: async (emailData: ChangeEmailData): Promise<void> => {
    await apiClient.post("/api/users/change-email", {
      newEmail: emailData.newEmail,
      password: emailData.password,
    })
  },

  deleteAccount: async (password: string): Promise<void> => {
    await apiClient.delete("/api/users/account", { data: { password } })
    clearTokens()
  },
}

export default apiClient
