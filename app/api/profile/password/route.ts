import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current password and new password are required" }, { status: 400 })
    }

    // Get session from Supabase
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('user_sessions')
      .select('*')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get current user from Supabase
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('password_hash')
      .eq('id', session.user_id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify current password (simple verification for demo)
    const isValidPassword =
      currentPassword === user.password_hash ||
      user.password_hash === `${currentPassword}_simple_hash` ||
      (currentPassword === "admin123" && user.password_hash === "admin123_simple_hash")

    if (!isValidPassword) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
    }

    // Update password in Supabase (simple hash for demo)
    const newPasswordHash = `${newPassword}_simple_hash`
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user_id)

    if (updateError) {
      console.error("Supabase error:", updateError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    return NextResponse.json({ message: "Password updated successfully" })
  } catch (error) {
    console.error("Password update API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
