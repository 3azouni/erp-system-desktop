import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Query expenses from Supabase
    const { data: expenses, error } = await supabaseAdmin
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

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

    // Insert expense into Supabase
    const { data: expense, error } = await supabaseAdmin
      .from('expenses')
      .insert({
        expense_type,
        amount,
        date: date || new Date().toISOString().split('T')[0],
        description,
        vendor: vendor || null,
        receipt_url: receipt_url || null,
        notes: notes || null
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    return NextResponse.json({ expense }, { status: 201 })
  } catch (error) {
    console.error("Create expense API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 