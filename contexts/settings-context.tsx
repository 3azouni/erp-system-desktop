"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { getAuthToken } from "@/lib/ssr-safe-storage"
import type { AppSettings, PrinterProfile } from "@/lib/local-db"

interface SettingsContextType {
  settings: AppSettings
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>
  loading: boolean
  formatCurrency: (amount: number) => string
}

const defaultSettings: AppSettings = {
  electricity_cost_per_kwh: 0.12,
  labor_rate_per_hour: 25.0,
  default_marketing_percentage: 10.0,
  platform_fee_percentage: 3.0,
  misc_buffer_percentage: 5.0,
  currency: "USD",
  usd_to_lbp_rate: 89.5,
  app_name: "3DP Commander",
  app_logo_url: null,
  footer_text: "© 2024 3DP Commander. All rights reserved.",
  printer_profiles: [
    {
      id: "ender3-pro",
      name: "Ender 3 Pro",
      power_draw_watts: 270,
      default_print_speed: 50,
    },
    {
      id: "prusa-mk3s",
      name: "Prusa i3 MK3S+",
      power_draw_watts: 120,
      default_print_speed: 60,
    },
    {
      id: "bambu-x1",
      name: "Bambu X1 Carbon",
      power_draw_watts: 350,
      default_print_speed: 80,
    },
  ],
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const formatCurrency = (amount: number): string => {
    if (settings.currency === "LBP") {
      // Convert USD to LBP using configurable exchange rate
      const exchangeRate = settings.usd_to_lbp_rate || 89.5
      const lbpAmount = amount * exchangeRate
      return `${lbpAmount.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })} LBP`
    }
    // Default to USD
    return `$${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  const loadSettings = async () => {
    try {
      setLoading(true)
      const token = getAuthToken()
      if (!token) {
        setSettings(defaultSettings)
        return
      }

      const response = await fetch("/api/settings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      } else {
        console.error("Failed to load settings, using defaults")
        setSettings(defaultSettings)
      }
    } catch (error) {
      console.error("Error loading settings:", error)
      toast({
        title: "Error",
        description: "Failed to load settings. Using defaults.",
        variant: "destructive",
      })
      setSettings(defaultSettings)
    } finally {
      setLoading(false)
    }
  }

  const updateSettingsHandler = async (newSettings: Partial<AppSettings>) => {
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error("No authentication token")
      }

      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newSettings),
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
        toast({
          title: "Success",
          description: "Settings updated successfully",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update settings")
      }
    } catch (error) {
      console.error("Error updating settings:", error)
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      })
      throw error
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings: updateSettingsHandler,
        loading,
        formatCurrency,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}
