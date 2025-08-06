import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { getDatabase, initializeDatabase } from "@/lib/local-db"

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

    // Initialize database if needed
    try {
      await initializeDatabase()
    } catch (error) {
      console.error("Database initialization error:", error)
    }

    const database = getDatabase()
    
    // Get settings from database
    const settings = await new Promise<any>((resolve, reject) => {
      database.get(
        'SELECT * FROM app_settings ORDER BY id DESC LIMIT 1',
        (err, row) => {
          if (err) {
            reject(err)
          } else {
            resolve(row)
          }
        }
      )
    })

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

    // Initialize database if needed
    try {
      await initializeDatabase()
    } catch (error) {
      console.error("Database initialization error:", error)
    }

    const database = getDatabase()
    
    // Check if settings exist
    const existingSettings = await new Promise<any>((resolve, reject) => {
      database.get(
        'SELECT id FROM app_settings ORDER BY id DESC LIMIT 1',
        (err, row) => {
          if (err) {
            reject(err)
          } else {
            resolve(row)
          }
        }
      )
    })

    if (existingSettings) {
      // Update existing settings
      await new Promise<void>((resolve, reject) => {
        database.run(
          `UPDATE app_settings SET 
           electricity_cost_per_kwh = ?, labor_rate_per_hour = ?, 
           default_marketing_percentage = ?, platform_fee_percentage = ?, 
           misc_buffer_percentage = ?, currency = ?, app_name = ?, 
           app_logo_url = ?, footer_text = ?, printer_profiles = ?, updated_at = datetime('now')
           WHERE id = ?`,
          [
            body.electricity_cost_per_kwh || 0.12,
            body.labor_rate_per_hour || 25.0,
            body.default_marketing_percentage || 10.0,
            body.platform_fee_percentage || 5.0,
            body.misc_buffer_percentage || 5.0,
            body.currency || "USD",
            body.app_name || "3DP Commander",
            body.app_logo_url || null,
            body.footer_text || "© 2024 3DP Commander. All rights reserved.",
            JSON.stringify(body.printer_profiles || []),
            existingSettings.id
          ],
          function(err) {
            if (err) {
              reject(err)
            } else {
              resolve()
            }
          }
        )
      })
    } else {
      // Insert new settings
      await new Promise<void>((resolve, reject) => {
        database.run(
          `INSERT INTO app_settings 
           (electricity_cost_per_kwh, labor_rate_per_hour, default_marketing_percentage, 
            platform_fee_percentage, misc_buffer_percentage, currency, app_name, 
            app_logo_url, footer_text, printer_profiles, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          [
            body.electricity_cost_per_kwh || 0.12,
            body.labor_rate_per_hour || 25.0,
            body.default_marketing_percentage || 10.0,
            body.platform_fee_percentage || 5.0,
            body.misc_buffer_percentage || 5.0,
            body.currency || "USD",
            body.app_name || "3DP Commander",
            body.app_logo_url || null,
            body.footer_text || "© 2024 3DP Commander. All rights reserved.",
            JSON.stringify(body.printer_profiles || [])
          ],
          function(err) {
            if (err) {
              reject(err)
            } else {
              resolve()
            }
          }
        )
      })
    }

    // Get updated settings
    const updatedSettings = await new Promise<any>((resolve, reject) => {
      database.get(
        'SELECT * FROM app_settings ORDER BY id DESC LIMIT 1',
        (err, row) => {
          if (err) {
            reject(err)
          } else {
            resolve(row)
          }
        }
      )
    })

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