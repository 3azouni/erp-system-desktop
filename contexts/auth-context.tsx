"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getAuthToken, setAuthToken, removeAuthToken } from "@/lib/ssr-safe-storage"
import type { User, UserPermission } from "@/lib/auth"

interface AuthContextType {
  user: User | null
  permissions: UserPermission[]
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  hasPermission: (module: string, action: "view" | "create" | "edit" | "delete") => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [permissions, setPermissions] = useState<UserPermission[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = getAuthToken()
      if (!token) {
        setUser(null)
        setLoading(false)
        return
      }

      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setPermissions(data.permissions || [])
      } else {
        removeAuthToken()
        setUser(null)
      }
    } catch (error) {
      removeAuthToken()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      if (response.ok) {
        const data = await response.json()
        setAuthToken(data.token)
        setUser(data.user)
        setPermissions(data.permissions || [])
        return { success: true }
      } else {
        const errorData = await response.json()
        return { success: false, error: errorData.error }
      }
    } catch (error) {
      return { success: false, error: 'Network error' }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      const token = getAuthToken()
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        })
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      removeAuthToken()
      setUser(null)
      setPermissions([])
      router.push("/login")
    }
  }

  const hasPermission = (module: string, action: "view" | "create" | "edit" | "delete"): boolean => {
    if (!user) return false
    if (user.role === "admin") return true

    const permission = permissions.find((p) => p.module === module)
    if (!permission) return false

    switch (action) {
      case "view":
        return permission.can_view
      case "create":
        return permission.can_create
      case "edit":
        return permission.can_edit
      case "delete":
        return permission.can_delete
      default:
        return false
    }
  }

  return (
    <AuthContext.Provider value={{ user, permissions, loading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
