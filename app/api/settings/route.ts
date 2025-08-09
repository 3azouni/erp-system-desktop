import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get settings from Supabase
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('app_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error("Settings fetch error:", settingsError)
      throw new Error("Failed to fetch settings")
    }

    if (!settings) {
      // Return default settings if none exist
      const defaultSettings = {
        electricity_cost_per_kwh: 0.12,
        labor_rate_per_hour: 25.0,
        default_marketing_percentage: 10.0,
        platform_fee_percentage: 5.0,
        misc_buffer_percentage: 5.0,
        currency: "USD",
        app_name: "3DP Commander",
        app_logo_url: null,
        footer_text: "© 2024 3DP Commander. All rights reserved.",
        printer_profiles: [
          {
            id: "ender3-pro",
            name: "Ender 3 Pro",
            power_draw_watts: 220,
            default_print_speed: 50
          },
          {
            id: "prusa-mk3s",
            name: "Prusa i3 MK3S+",
            power_draw_watts: 120,
            default_print_speed: 60
          }
        ]
      }
      return NextResponse.json({ settings: defaultSettings })
    }

    // Parse printer_profiles JSON if it exists
    let printerProfiles = []
    if (settings.printer_profiles) {
      try {
        printerProfiles = typeof settings.printer_profiles === 'string' 
          ? JSON.parse(settings.printer_profiles) 
          : settings.printer_profiles
      } catch (error) {
        console.error('Error parsing printer_profiles:', error)
        printerProfiles = []
      }
    }

    // Add printer_profiles to the settings object
    const settingsWithProfiles = {
      ...settings,
      printer_profiles: printerProfiles
    }

    return NextResponse.json({ settings: settingsWithProfiles })
  } catch (error) {
    console.error("Settings API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()

    // Check if settings exist in Supabase
    const { data: existingSettings, error: checkError } = await supabaseAdmin
      .from('app_settings')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error("Settings check error:", checkError)
      throw new Error("Failed to check settings")
    }

    if (existingSettings) {
      // Update existing settings in Supabase
      const { error: updateError } = await supabaseAdmin
        .from('app_settings')
        .update({
          electricity_cost_per_kwh: body.electricity_cost_per_kwh || 0.12,
          labor_rate_per_hour: body.labor_rate_per_hour || 25.0,
          default_marketing_percentage: body.default_marketing_percentage || 10.0,
          platform_fee_percentage: body.platform_fee_percentage || 5.0,
          misc_buffer_percentage: body.misc_buffer_percentage || 5.0,
          currency: body.currency || "USD",
          app_name: body.app_name || "3DP Commander",
          app_logo_url: body.app_logo_url || null,
          footer_text: body.footer_text || "© 2024 3DP Commander. All rights reserved.",
          printer_profiles: body.printer_profiles || [],
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSettings.id)

      if (updateError) {
        console.error("Settings update error:", updateError)
        throw new Error("Failed to update settings")
      }
    } else {
      // Insert new settings in Supabase
      const { error: insertError } = await supabaseAdmin
        .from('app_settings')
        .insert({
          electricity_cost_per_kwh: body.electricity_cost_per_kwh || 0.12,
          labor_rate_per_hour: body.labor_rate_per_hour || 25.0,
          default_marketing_percentage: body.default_marketing_percentage || 10.0,
          platform_fee_percentage: body.platform_fee_percentage || 5.0,
          misc_buffer_percentage: body.misc_buffer_percentage || 5.0,
          currency: body.currency || "USD",
          app_name: body.app_name || "3DP Commander",
          app_logo_url: body.app_logo_url || null,
          footer_text: body.footer_text || "© 2024 3DP Commander. All rights reserved.",
          printer_profiles: body.printer_profiles || []
        })

      if (insertError) {
        console.error("Settings insert error:", insertError)
        throw new Error("Failed to insert settings")
      }
    }

    // Get updated settings from Supabase
    const { data: updatedSettings, error: fetchError } = await supabaseAdmin
      .from('app_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError) {
      console.error("Settings fetch error:", fetchError)
      throw new Error("Failed to fetch updated settings")
    }

    // Parse printer_profiles JSON if it exists
    let printerProfiles = []
    if (updatedSettings.printer_profiles) {
      try {
        printerProfiles = typeof updatedSettings.printer_profiles === 'string' 
          ? JSON.parse(updatedSettings.printer_profiles) 
          : updatedSettings.printer_profiles
      } catch (error) {
        console.error('Error parsing printer_profiles:', error)
        printerProfiles = []
      }
    }

    // Add printer_profiles to the settings object
    const settingsWithProfiles = {
      ...updatedSettings,
      printer_profiles: printerProfiles
    }

    return NextResponse.json({ settings: settingsWithProfiles })
  } catch (error) {
    console.error("Settings update API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 