import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { supabaseAdmin } from "@/lib/supabase-server"
import { generateToken } from "@/lib/auth"

interface UserRow {
  id: string
  email: string
  password_hash: string
  full_name: string
  role: string
  department: string
  is_active: boolean
  created_at: string
  updated_at: string
  // add other fields as needed
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Query user from Supabase
    const { data: userRow, error: dbError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!userRow) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Proper password verification using bcrypt
    const isValidPassword = await bcrypt.compare(password, userRow.password_hash)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Generate JWT token
    const user = {
      id: userRow.id,
      email: userRow.email,
      full_name: userRow.full_name,
      role: userRow.role,
      department: userRow.department,
      created_at: userRow.created_at,
      updated_at: userRow.updated_at,
    }
    const token = generateToken(user)

    // TODO: Fetch permissions from Supabase if you have a permissions table
    const permissions: any[] = [] // Replace with actual permissions logic

    return NextResponse.json({
      user,
      token,
      permissions,
    })
  } catch (error) {
    console.error("Login API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
