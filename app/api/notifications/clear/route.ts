import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Delete all notifications for the user from Supabase
    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('user_id', decoded.userId || 1)

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    return NextResponse.json({ message: "All notifications cleared successfully" })
  } catch (error) {
    console.error("Clear notifications API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 