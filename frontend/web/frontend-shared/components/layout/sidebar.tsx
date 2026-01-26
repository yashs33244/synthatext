"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import {
  LayoutDashboard,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export function Sidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    // Broadcast sidebar state change
    window.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: { isCollapsed } }))
  }, [isCollapsed])

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Profile", href: "/profile", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
  ]

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r transition-all duration-300 ease-in-out",
        "bg-[#FFFFFF] border-[#E5E5E5]",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-[#E5E5E5] px-4">
          {!isCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#F7DC6F] to-[#FFF1C2]">
                <Sparkles className="h-5 w-5 text-[#1A1A1A]" />
              </div>
              <span className="text-lg font-semibold text-[#1A1A1A]">AI Slidemaker</span>
            </Link>
          )}
          {isCollapsed && (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#F7DC6F] to-[#FFF1C2]">
              <Sparkles className="h-5 w-5 text-[#1A1A1A]" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors",
                    isCollapsed ? "justify-center px-0" : "",
                    isActive
                      ? "bg-[#E0F4FA] text-[#1A1A1A]"
                      : "text-[#6F959F] hover:bg-[#F7F9FA] hover:text-[#1A1A1A]"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && <span>{item.name}</span>}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* User Profile */}
        <div className="border-t border-[#E5E5E5] p-3">
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-[#F7F9FA]",
              isCollapsed ? "justify-center" : ""
            )}
          >
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={user?.avatar || undefined} alt={user?.name || user?.email} />
              <AvatarFallback className="bg-[#F7DC6F] text-[#1A1A1A] font-medium">
                {user?.email ? getInitials(user.email) : "U"}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-[#1A1A1A]">
                  {user?.name || "User"}
                </p>
                <p className="truncate text-xs text-[#6F959F]">{user?.email}</p>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <Button
            onClick={() => logout()}
            variant="ghost"
            className={cn(
              "mt-2 w-full justify-start gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-[#FF3B30] transition-colors hover:bg-[#FFEBEE] hover:text-[#FF3B30]",
              isCollapsed ? "justify-center px-0" : ""
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </Button>
        </div>

        {/* Collapse Toggle */}
        <div className="border-t border-[#E5E5E5] p-3">
          <Button
            onClick={() => setIsCollapsed(!isCollapsed)}
            variant="ghost"
            className="w-full justify-center rounded-xl p-2.5 text-[#6F959F] hover:bg-[#F7F9FA] hover:text-[#1A1A1A]"
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </aside>
  )
}
