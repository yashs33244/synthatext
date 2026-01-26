"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Shield, Lock, Mail, Trash2, Eye, EyeOff, AlertTriangle } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { authApi, userApi } from "@/lib/api"
import {
  changePasswordSchema,
  changeEmailSchema,
  type ChangePasswordFormData,
  type ChangeEmailFormData,
} from "@/lib/validators"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { user, refreshUser } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Password change state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Email change state
  const [isChangingEmail, setIsChangingEmail] = useState(false)

  // 2FA state
  const [isDisabling2FA, setIsDisabling2FA] = useState(false)
  const [disable2FAPassword, setDisable2FAPassword] = useState("")

  // Delete account state
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")

  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  })

  const emailForm = useForm<ChangeEmailFormData>({
    resolver: zodResolver(changeEmailSchema),
  })

  const onPasswordSubmit = async (data: ChangePasswordFormData) => {
    setIsChangingPassword(true)
    try {
      await userApi.changePassword(data)
      toast({
        title: "Password changed!",
        description: "Your password has been successfully updated.",
      })
      passwordForm.reset()
    } catch (error) {
      console.error("Password change error:", error)
      toast({
        title: "Change failed",
        description: "Could not change password. Please check your current password.",
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const onEmailSubmit = async (data: ChangeEmailFormData) => {
    setIsChangingEmail(true)
    try {
      await userApi.changeEmail(data)
      toast({
        title: "Email change requested!",
        description: "Please check your new email address for verification.",
      })
      emailForm.reset()
    } catch (error) {
      console.error("Email change error:", error)
      toast({
        title: "Change failed",
        description: "Could not change email. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsChangingEmail(false)
    }
  }

  const handleDisable2FA = async () => {
    if (!disable2FAPassword) {
      toast({
        title: "Password required",
        description: "Please enter your password to disable 2FA.",
        variant: "destructive",
      })
      return
    }

    setIsDisabling2FA(true)
    try {
      await authApi.disable2FA(disable2FAPassword)
      await refreshUser()
      toast({
        title: "2FA disabled",
        description: "Two-factor authentication has been disabled.",
      })
      setDisable2FAPassword("")
    } catch (error) {
      console.error("Disable 2FA error:", error)
      toast({
        title: "Failed to disable",
        description: "Could not disable 2FA. Please check your password.",
        variant: "destructive",
      })
    } finally {
      setIsDisabling2FA(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast({
        title: "Password required",
        description: "Please enter your password to delete your account.",
        variant: "destructive",
      })
      return
    }

    setIsDeleting(true)
    try {
      await userApi.deleteAccount(deletePassword)
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      })
      router.push("/login")
    } catch (error) {
      console.error("Delete account error:", error)
      toast({
        title: "Deletion failed",
        description: "Could not delete account. Please check your password.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[34px] font-bold leading-[41px] tracking-[0.37px]">Settings</h1>
        <p className="mt-2 text-[17px] text-[var(--label-secondary)]">Manage your account settings and security</p>
      </div>

      <div className="space-y-6">
        {/* Security Section */}
        <Card className="border-[var(--separator)] shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[var(--ios-blue)]" />
              <CardTitle className="text-[20px] font-semibold">Security</CardTitle>
            </div>
            <CardDescription className="text-[15px] text-[var(--label-secondary)]">
              Manage your security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-[10px] bg-[var(--fill-tertiary)] p-4">
              <div>
                <p className="text-[15px] font-medium">Two-Factor Authentication</p>
                <p className="text-[13px] text-[var(--label-secondary)]">
                  {user?.twoFactorEnabled ? "Currently enabled" : "Add an extra layer of security"}
                </p>
              </div>
              {user?.twoFactorEnabled ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-9 rounded-[8px] border-[var(--separator)] bg-background text-[15px] font-medium hover:bg-[var(--fill-secondary)]"
                    >
                      Disable
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-[16px] border-[var(--separator)]">
                    <DialogHeader>
                      <DialogTitle className="text-[20px] font-semibold">Disable Two-Factor Authentication</DialogTitle>
                      <DialogDescription className="text-[15px] text-[var(--label-secondary)]">
                        Enter your password to disable 2FA
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                      <Label
                        htmlFor="disable2FAPassword"
                        className="text-[13px] font-normal text-[var(--label-secondary)]"
                      >
                        Password
                      </Label>
                      <Input
                        id="disable2FAPassword"
                        type="password"
                        value={disable2FAPassword}
                        onChange={(e) => setDisable2FAPassword(e.target.value)}
                        className="h-11 rounded-[10px] border-[var(--separator)] bg-[var(--fill-tertiary)]"
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleDisable2FA}
                        disabled={isDisabling2FA}
                        className="h-11 rounded-[10px] bg-[var(--ios-red)] text-white hover:bg-[var(--ios-red)]/90"
                      >
                        {isDisabling2FA ? <Loader2 className="h-5 w-5 animate-spin" /> : "Disable 2FA"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button
                  onClick={() => router.push("/2fa/setup")}
                  className="h-9 rounded-[8px] bg-[var(--ios-blue)] text-[15px] font-medium text-white hover:bg-[var(--ios-blue)]/90"
                >
                  Enable
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="border-[var(--separator)] shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-[var(--ios-blue)]" />
              <CardTitle className="text-[20px] font-semibold">Change Password</CardTitle>
            </div>
            <CardDescription className="text-[15px] text-[var(--label-secondary)]">
              Update your password regularly for security
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-[13px] font-normal text-[var(--label-secondary)]">
                  Current Password
                </Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    className="h-11 rounded-[10px] border-[var(--separator)] bg-[var(--fill-tertiary)] pr-10"
                    {...passwordForm.register("currentPassword")}
                    disabled={isChangingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--label-tertiary)]"
                    tabIndex={-1}
                  >
                    {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-[13px] text-[var(--ios-red)]">
                    {passwordForm.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-[13px] font-normal text-[var(--label-secondary)]">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    className="h-11 rounded-[10px] border-[var(--separator)] bg-[var(--fill-tertiary)] pr-10"
                    {...passwordForm.register("newPassword")}
                    disabled={isChangingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--label-tertiary)]"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-[13px] text-[var(--ios-red)]">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="newPasswordConfirmation"
                  className="text-[13px] font-normal text-[var(--label-secondary)]"
                >
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="newPasswordConfirmation"
                    type={showConfirmPassword ? "text" : "password"}
                    className="h-11 rounded-[10px] border-[var(--separator)] bg-[var(--fill-tertiary)] pr-10"
                    {...passwordForm.register("newPasswordConfirmation")}
                    disabled={isChangingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--label-tertiary)]"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {passwordForm.formState.errors.newPasswordConfirmation && (
                  <p className="text-[13px] text-[var(--ios-red)]">
                    {passwordForm.formState.errors.newPasswordConfirmation.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isChangingPassword}
                className="h-11 w-full rounded-[10px] bg-[var(--ios-blue)] text-[17px] font-semibold text-white hover:bg-[var(--ios-blue)]/90 active:scale-[0.98] disabled:opacity-50"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Changing...
                  </>
                ) : (
                  "Change Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Email */}
        <Card className="border-[var(--separator)] shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-[var(--ios-blue)]" />
              <CardTitle className="text-[20px] font-semibold">Change Email</CardTitle>
            </div>
            <CardDescription className="text-[15px] text-[var(--label-secondary)]">
              Update your email address
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="currentEmail" className="text-[13px] font-normal text-[var(--label-secondary)]">
                  Current Email
                </Label>
                <Input
                  id="currentEmail"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="h-11 rounded-[10px] border-[var(--separator)] bg-[var(--fill-tertiary)] opacity-60"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newEmail" className="text-[13px] font-normal text-[var(--label-secondary)]">
                  New Email
                </Label>
                <Input
                  id="newEmail"
                  type="email"
                  placeholder="new@example.com"
                  className="h-11 rounded-[10px] border-[var(--separator)] bg-[var(--fill-tertiary)]"
                  {...emailForm.register("newEmail")}
                  disabled={isChangingEmail}
                />
                {emailForm.formState.errors.newEmail && (
                  <p className="text-[13px] text-[var(--ios-red)]">{emailForm.formState.errors.newEmail.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailPassword" className="text-[13px] font-normal text-[var(--label-secondary)]">
                  Confirm Password
                </Label>
                <Input
                  id="emailPassword"
                  type="password"
                  placeholder="Enter your password"
                  className="h-11 rounded-[10px] border-[var(--separator)] bg-[var(--fill-tertiary)]"
                  {...emailForm.register("password")}
                  disabled={isChangingEmail}
                />
                {emailForm.formState.errors.password && (
                  <p className="text-[13px] text-[var(--ios-red)]">{emailForm.formState.errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isChangingEmail}
                className="h-11 w-full rounded-[10px] bg-[var(--ios-blue)] text-[17px] font-semibold text-white hover:bg-[var(--ios-blue)]/90 active:scale-[0.98] disabled:opacity-50"
              >
                {isChangingEmail ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Changing...
                  </>
                ) : (
                  "Change Email"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-[var(--ios-red)]/30 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[var(--ios-red)]" />
              <CardTitle className="text-[20px] font-semibold text-[var(--ios-red)]">Danger Zone</CardTitle>
            </div>
            <CardDescription className="text-[15px] text-[var(--label-secondary)]">
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="h-11 w-full rounded-[10px] border-[var(--ios-red)] text-[17px] font-semibold text-[var(--ios-red)] hover:bg-[var(--ios-red)]/10 bg-transparent"
                >
                  <Trash2 className="mr-2 h-5 w-5" />
                  Delete Account
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[16px] border-[var(--separator)]">
                <DialogHeader>
                  <DialogTitle className="text-[20px] font-semibold text-[var(--ios-red)]">Delete Account</DialogTitle>
                  <DialogDescription className="text-[15px] text-[var(--label-secondary)]">
                    This action cannot be undone. All your data will be permanently deleted.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="deletePassword" className="text-[13px] font-normal text-[var(--label-secondary)]">
                    Confirm Password
                  </Label>
                  <Input
                    id="deletePassword"
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-11 rounded-[10px] border-[var(--separator)] bg-[var(--fill-tertiary)]"
                  />
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="h-11 rounded-[10px] bg-[var(--ios-red)] text-white hover:bg-[var(--ios-red)]/90"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete My Account"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
