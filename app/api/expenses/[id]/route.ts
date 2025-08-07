import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/local-db"
import { verifyToken } from "@/lib/auth"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        `UPDATE expenses SET 
         expense_type = ?, amount = ?, date = ?, description = ?, 
         vendor = ?, receipt_url = ?, notes = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [expense_type, amount, date || new Date().toISOString().split('T')[0], description, vendor || null, receipt_url || null, notes || null, params.id],
        function(err) {
          if (err) {
            reject(err)
          } else {
            // Get the updated expense
            database.get(
              'SELECT * FROM expenses WHERE id = ?',
              [params.id],
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

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 })
    }

    return NextResponse.json({ expense })
  } catch (error) {
    console.error("Update expense API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const database = getDatabase()
    
    await new Promise<void>((resolve, reject) => {
      database.run(
        'DELETE FROM expenses WHERE id = ?',
        [params.id],
        function(err) {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        }
      )
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete expense API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 