"use client"

import type React from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Sidebar } from "@/components/layout/sidebar"

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#F7F9FA]">
        <Sidebar />
        <main className="ml-64 min-h-screen transition-all duration-300 ease-in-out">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
