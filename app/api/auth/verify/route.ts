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

    // Get user from Supabase
    const { data: userRow, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single()

    if (userError) {
      console.error("User fetch error:", userError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!userRow) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: userRow.id,
        email: userRow.email,
        full_name: userRow.full_name,
        role: userRow.role,
        department: userRow.department,
        created_at: userRow.created_at,
        updated_at: userRow.updated_at,
      },
      permissions: [], // Replace with actual permissions logic when permissions table is implemented
    })
  } catch (error) {
    console.error("Verify API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
