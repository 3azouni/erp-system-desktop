import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Get products API error:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    // Parse required_materials JSONB back into arrays
    const parsedProducts = (products || []).map(product => {
      console.log('Raw product required_materials:', product.required_materials, typeof product.required_materials)
      
      let parsedMaterials = []
      if (product.required_materials) {
        if (Array.isArray(product.required_materials)) {
          parsedMaterials = product.required_materials
        } else {
          parsedMaterials = []
        }
      }
      
      console.log('Parsed materials:', parsedMaterials)
      
      return {
        ...product,
        required_materials: parsedMaterials
      }
    })

    return NextResponse.json({ products: parsedProducts })
  } catch (error) {
    console.error("Get products API error:", error)
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
    const { product_name, sku, category, description, image_url, required_materials, print_time, weight, printer_type } = body

    console.log('Received required_materials:', required_materials, typeof required_materials)

    if (!product_name || !sku || !category || !print_time || !weight || !printer_type) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 })
    }

    // Ensure required_materials is always an array
    const materialsArray = Array.isArray(required_materials) ? required_materials : []
    console.log('Saving materials to DB:', materialsArray, 'Original:', required_materials)
    
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .insert({
        product_name,
        sku,
        category,
        description: description || null,
        image_url: image_url || null,
        required_materials: materialsArray,
        print_time,
        weight,
        printer_type,
        price: 0, // Default price
        status: 'active' // Default status
      })
      .select()
      .single()

    if (error) {
      console.error("Create product API error:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
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

    return NextResponse.json({ product: parsedProduct }, { status: 201 })
  } catch (error) {
    console.error("Create product API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 