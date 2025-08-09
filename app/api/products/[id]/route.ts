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
    const { product_name, sku, category, description, image_url, required_materials, print_time, weight, printer_type } = body

    console.log('PUT - Received required_materials:', required_materials, typeof required_materials)

    if (!product_name || !sku || !category || !print_time || !weight || !printer_type) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 })
    }

    // Ensure required_materials is always an array
    const materialsArray = Array.isArray(required_materials) ? required_materials : []
    console.log('PUT - Saving materials to DB:', materialsArray, 'Original:', required_materials)
    
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .update({
        product_name,
        sku,
        category,
        description: description || null,
        image_url: image_url || null,
        required_materials: materialsArray,
        print_time,
        weight,
        printer_type
      })
      .eq('id', params.id)
      .select()
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
    console.error("Update product API error:", error)
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