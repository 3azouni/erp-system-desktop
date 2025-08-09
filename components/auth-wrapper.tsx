"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TopNav } from "@/components/top-nav"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { Loader2 } from "lucide-react"

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      router.push("/login")
    }
  }, [user, loading, pathname, router])

  // Show loading spinner while checking authentication
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  // If on login page, show login page regardless of auth state
  if (pathname === "/login") {
    return <>{children}</>
  }

  // If user is not authenticated, show nothing (will redirect)
  if (!user) {
    router.push('/login')
    return null
  }

  // If user is authenticated, show the main app layout
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <TopNav />
          <main className="flex-1 p-6">
            <BreadcrumbNav />
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
