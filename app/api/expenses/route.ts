import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/local-db"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const database = getDatabase()
    
    const expenses = database.prepare('SELECT * FROM expenses ORDER BY created_at DESC').all()

    return NextResponse.json({ expenses })
  } catch (error) {
    console.error("Get expenses API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
    const { expense_type, amount, date, description, vendor, receipt_url, notes } = body

    if (!expense_type || !amount || !description) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 })
    }

    const database = getDatabase()
    
    const stmt = database.prepare(
      `INSERT INTO expenses (expense_type, amount, date, description, vendor, receipt_url, notes, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    )
    const result = stmt.run(expense_type, amount, date || new Date().toISOString().split('T')[0], description, vendor || null, receipt_url || null, notes || null)
    
    // Get the created expense
    const expense = database.prepare('SELECT * FROM expenses WHERE id = ?').get(result.lastInsertRowid)

    return NextResponse.json({ expense }, { status: 201 })
  } catch (error) {
    console.error("Create expense API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 