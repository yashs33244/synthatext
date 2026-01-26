export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  emailVerified: boolean
  twoFactorEnabled: boolean
  createdAt: string
  updatedAt: string
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface SignupCredentials {
  email: string
  password: string
  passwordConfirmation: string
  name?: string
  acceptTerms: boolean
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthResponse {
  user: User
  tokens: AuthTokens
  requiresTwoFactor?: boolean
}

export interface TwoFactorSetup {
  secret: string
  qrCode: string
  recoveryCodes: string[]
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordReset {
  token: string
  password: string
  passwordConfirmation: string
}

export interface OAuthProvider {
  id: "google" | "github" | "apple" | "microsoft" | "twitter"
  name: string
  icon: string
}
