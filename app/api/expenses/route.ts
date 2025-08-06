import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/local-db"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const database = getDatabase()
    
    const expenses = await new Promise<any[]>((resolve, reject) => {
      database.all(
        'SELECT * FROM expenses ORDER BY created_at DESC',
        (err, rows) => {
          if (err) {
            reject(err)
          } else {
            resolve(rows || [])
          }
        }
      )
    })

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
    
    const expense = await new Promise<any>((resolve, reject) => {
      database.run(
        `INSERT INTO expenses (expense_type, amount, date, description, vendor, receipt_url, notes, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [expense_type, amount, date || new Date().toISOString().split('T')[0], description, vendor || null, receipt_url || null, notes || null],
        function(err) {
          if (err) {
            reject(err)
          } else {
            // Get the created expense
            database.get(
              'SELECT * FROM expenses WHERE id = ?',
              [this.lastID],
              (err, expense) => {
                if (err) {
                  reject(err)
                } else {
                  resolve(expense)
                }
              }
            )
          }
        }
      )
    })

    return NextResponse.json({ expense }, { status: 201 })
  } catch (error) {
    console.error("Create expense API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 