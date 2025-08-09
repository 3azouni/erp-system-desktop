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
      
      let parsedMaterials = []
      if (product.required_materials) {
        if (Array.isArray(product.required_materials)) {
          parsedMaterials = product.required_materials
        } else {
          parsedMaterials = []
        }
      }
      
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
      .insert({
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