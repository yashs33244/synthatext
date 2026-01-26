"use client"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, User, Mail, Phone, FileText, Upload } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { userApi } from "@/lib/api"
import { updateProfileSchema, type UpdateProfileFormData } from "@/lib/validators"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user?.name || "",
      bio: "",
      phone: "",
    },
  })

  const onSubmit = async (data: UpdateProfileFormData) => {
    setIsLoading(true)
    try {
      await userApi.updateProfile(data)
      await refreshUser()
      toast({
        title: "Profile updated!",
        description: "Your profile has been successfully updated.",
      })
    } catch (error) {
      console.error("Profile update error:", error)
      toast({
        title: "Update failed",
        description: "Could not update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      })
      return
    }

    setIsUploadingAvatar(true)
    try {
      // Convert to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64String = reader.result as string
        await userApi.updateProfile({ avatar: base64String })
        await refreshUser()
        toast({
          title: "Avatar updated!",
          description: "Your profile picture has been updated.",
        })
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Avatar upload error:", error)
      toast({
        title: "Upload failed",
        description: "Could not update avatar. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[34px] font-bold leading-[41px] tracking-[0.37px] text-[#1A1A1A]">Profile</h1>
        <p className="mt-2 text-[17px] text-[#6F959F]">Manage your personal information</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-[#E5E5E5] bg-white shadow-sm lg:col-span-1 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-[20px] font-semibold text-[#1A1A1A]">Profile Picture</CardTitle>
            <CardDescription className="text-[15px] text-[#6F959F]">
              Your avatar and basic info
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <Avatar className="h-32 w-32 ring-4 ring-[#F7F9FA]">
              <AvatarImage src={user?.avatar || undefined} alt={user?.name || user?.email} />
              <AvatarFallback className="bg-gradient-to-br from-[#F7DC6F] to-[#FFF1C2] text-[32px] text-[#1A1A1A] font-semibold">
                {user?.email ? getInitials(user.email) : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="text-[17px] font-semibold text-[#1A1A1A]">{user?.name || "User"}</p>
              <p className="text-[15px] text-[#6F959F]">{user?.email}</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              variant="outline"
              className="h-11 w-full rounded-xl border-[#E5E5E5] bg-[#F7F9FA] text-[15px] font-medium hover:bg-[#E0F4FA] active:scale-[0.98]"
            >
              {isUploadingAvatar ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Change Picture
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-[#E5E5E5] bg-white shadow-sm lg:col-span-2 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-[20px] font-semibold text-[#1A1A1A]">Personal Information</CardTitle>
            <CardDescription className="text-[15px] text-[#6F959F]">
              Update your personal details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="flex items-center gap-2 text-[13px] font-medium text-[#6F959F]"
                >
                  <User className="h-4 w-4" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  className="h-11 rounded-xl border-[#E5E5E5] bg-[#F7F9FA] text-[17px] text-[#1A1A1A] placeholder:text-[#B2BABF] focus:border-[#F7DC6F] focus:ring-2 focus:ring-[#F7DC6F]/20"
                  {...register("name")}
                  disabled={isLoading}
                />
                {errors.name && <p className="text-[13px] text-[#FF3B30]">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="flex items-center gap-2 text-[13px] font-medium text-[#6F959F]"
                >
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="h-11 rounded-xl border-[#E5E5E5] bg-[#F7F9FA] text-[17px] text-[#1A1A1A] opacity-60"
                />
                <p className="text-[13px] text-[#B2BABF]">
                  Email cannot be changed here. Go to Settings to update your email.
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className="flex items-center gap-2 text-[13px] font-medium text-[#6F959F]"
                >
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  className="h-11 rounded-xl border-[#E5E5E5] bg-[#F7F9FA] text-[17px] text-[#1A1A1A] placeholder:text-[#B2BABF] focus:border-[#F7DC6F] focus:ring-2 focus:ring-[#F7DC6F]/20"
                  {...register("phone")}
                  disabled={isLoading}
                />
                {errors.phone && <p className="text-[13px] text-[#FF3B30]">{errors.phone.message}</p>}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="bio"
                  className="flex items-center gap-2 text-[13px] font-medium text-[#6F959F]"
                >
                  <FileText className="h-4 w-4" />
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  rows={4}
                  className="rounded-xl border-[#E5E5E5] bg-[#F7F9FA] text-[17px] text-[#1A1A1A] placeholder:text-[#B2BABF] focus:border-[#F7DC6F] focus:ring-2 focus:ring-[#F7DC6F]/20"
                  {...register("bio")}
                  disabled={isLoading}
                />
                {errors.bio && <p className="text-[13px] text-[#FF3B30]">{errors.bio.message}</p>}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="h-11 w-full rounded-xl bg-gradient-to-r from-[#F7DC6F] to-[#FFF1C2] text-[17px] font-semibold text-[#1A1A1A] hover:opacity-90 active:scale-[0.98] disabled:opacity-50 shadow-md"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
