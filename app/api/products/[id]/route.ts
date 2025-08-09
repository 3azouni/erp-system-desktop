import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { verifyToken } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Parse required_materials JSONB back into array
    let parsedMaterials = []
    if (product.required_materials) {
      if (Array.isArray(product.required_materials)) {
        parsedMaterials = product.required_materials
      } else {
        parsedMaterials = []
      }
    }
    
    const parsedProduct = {
      ...product,
      required_materials: parsedMaterials
    }

    return NextResponse.json({ product: parsedProduct })
  } catch (error) {
    console.error("Get product API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { 
      product_name, 
      description, 
      price, 
      cost, 
      required_materials, 
      print_time_hours, 
      weight_grams,
      dimensions,
      category,
      sku,
      barcode
    } = body

    // Parse materials if it's a string
    let materialsArray = required_materials
    if (typeof required_materials === 'string') {
      try {
        materialsArray = JSON.parse(required_materials)
      } catch (e) {
        materialsArray = []
      }
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .update({
        product_name,
        description,
        price,
        cost,
        required_materials: materialsArray,
        print_time_hours,
        weight_grams,
        dimensions,
        category,
        sku,
        barcode
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ product: data })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error("Delete product API error:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete product API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 