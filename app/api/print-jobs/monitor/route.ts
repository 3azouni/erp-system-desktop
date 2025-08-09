import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: user, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user.user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { data: rows, error } = await supabaseAdmin
      .from('print_jobs')
      .select(`
        *,
        products(product_name),
        printers(printer_name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch print jobs' }, { status: 500 })
    }

    return NextResponse.json({ printJobs: rows || [] })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 