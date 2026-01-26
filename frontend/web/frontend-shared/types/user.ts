export interface UserProfile {
  id: string
  email: string
  name?: string
  avatar?: string
  bio?: string
  phone?: string
  emailVerified: boolean
  twoFactorEnabled: boolean
  createdAt: string
  updatedAt: string
}

export interface UpdateProfileData {
  name?: string
  bio?: string
  phone?: string
  avatar?: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
  newPasswordConfirmation: string
}

export interface ChangeEmailData {
  newEmail: string
  password: string
}
