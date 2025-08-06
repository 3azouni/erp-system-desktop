import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getDatabase, initializeDatabase } from "@/lib/local-db"
import { generateToken } from "@/lib/auth"

interface UserRow {
  id: number
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

    // Initialize database if needed
    try {
      await initializeDatabase()
    } catch (error) {
      console.error("Database initialization error:", error)
    }

    const database = getDatabase()

    // Regular user authentication
    return new Promise<NextResponse>((resolve) => {
      database.get(
        'SELECT * FROM users WHERE email = ? AND is_active = 1',
        [email],
        async (err, userRow: UserRow) => {
          if (err) {
            console.error("Database error:", err)
            resolve(NextResponse.json({ error: "Database error" }, { status: 500 }))
            return
          }

          if (!userRow) {
            resolve(NextResponse.json({ error: "Invalid credentials" }, { status: 401 }))
            return
          }

          // Proper password verification using bcrypt
          const isValidPassword = await bcrypt.compare(password, userRow.password_hash)
          if (!isValidPassword) {
            resolve(NextResponse.json({ error: "Invalid credentials" }, { status: 401 }))
            return
          }

          // Generate JWT token
          const user = {
            id: userRow.id.toString(),
            email: userRow.email,
            full_name: userRow.full_name,
            role: userRow.role,
            department: userRow.department,
            created_at: userRow.created_at,
            updated_at: userRow.updated_at,
          }
          const token = generateToken(user)

          // TODO: Fetch permissions from local DB if you have a permissions table
          const permissions: any[] = [] // Replace with actual permissions logic

          resolve(
            NextResponse.json({
              user,
              token,
              permissions,
            })
          )
        }
      )
    })
  } catch (error) {
    console.error("Login API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
