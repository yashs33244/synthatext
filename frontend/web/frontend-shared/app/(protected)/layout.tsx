"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Sidebar } from "@/components/layout/sidebar"

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const handleSidebarToggle = (e: Event) => {
      const customEvent = e as CustomEvent<{ isCollapsed: boolean }>
      setIsCollapsed(customEvent.detail.isCollapsed)
    }

    window.addEventListener('sidebar-toggle', handleSidebarToggle)
    return () => window.removeEventListener('sidebar-toggle', handleSidebarToggle)
  }, [])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#F7F9FA]">
        <Sidebar />
        <main className={`min-h-screen transition-all duration-300 ease-in-out ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
          <div className="p-8">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
