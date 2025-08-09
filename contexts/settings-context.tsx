"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

export interface AppSettings {
  id: number
  company_name: string
  timezone: string
  currency: string
  date_format: string
  electricity_cost_per_kwh: number
  labor_rate_per_hour: number
  default_marketing_percentage: number
  platform_fee_percentage: number
  misc_buffer_percentage: number
  usd_to_lbp_rate: number
  app_name: string
  app_logo_url: string | null
  footer_text: string
  printer_profiles: PrinterProfile[]
  created_at: string
  updated_at: string
}

export interface PrinterProfile {
  id: string
  name: string
  type: string
  build_volume: {
    x: number
    y: number
    z: number
  }
  materials: string[]
  nozzle_sizes: number[]
  default_settings: {
    layer_height: number
    infill_density: number
    print_speed: number
    temperature: number
  }
}

interface SettingsContextType {
  settings: AppSettings | null
  loading: boolean
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>
  refreshSettings: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(newSettings)
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Failed to update settings:', error)
      throw error
    }
  }

  const refreshSettings = async () => {
    await loadSettings()
  }

  useEffect(() => {
    loadSettings()
  }, [])

  return (
    <SettingsContext.Provider value={{
      settings,
      loading,
      updateSettings,
      refreshSettings
    }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
