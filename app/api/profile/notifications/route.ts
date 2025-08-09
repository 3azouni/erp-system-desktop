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

    // Verify token and get user data
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get or create notification preferences from Supabase
    let { data: notifications, error } = await supabaseAdmin
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', decoded.userId || 1)
      .single()

    if (error || !notifications) {
      // Create default notification preferences
      const { data: newNotifications, error: insertError } = await supabaseAdmin
        .from('user_notification_preferences')
        .insert({
          user_id: decoded.userId || 1,
          email_notifications: true,
          push_notifications: true,
          sms_notifications: false,
          marketing_emails: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) {
        console.error("Supabase error:", insertError)
        return NextResponse.json({ error: "Database error" }, { status: 500 })
      }

      notifications = newNotifications
    }

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error("Notifications API error:", error)
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
    const body = await request.json()

    // Verify token and get user data
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Update notification preferences in Supabase
    const { data: notifications, error } = await supabaseAdmin
      .from('user_notification_preferences')
      .upsert({
        user_id: decoded.userId || 1,
        email_notifications: body.email_notifications || false,
        push_notifications: body.push_notifications || false,
        sms_notifications: body.sms_notifications || false,
        marketing_emails: body.marketing_emails || false,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error("Notifications update API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
