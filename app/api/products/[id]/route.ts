import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/local-db"
import { verifyToken } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const database = getDatabase()
    
    const product = await new Promise<any>((resolve, reject) => {
      database.get(
        'SELECT * FROM products WHERE id = ?',
        [params.id],
        (err, product) => {
          if (err) {
            reject(err)
          } else {
            resolve(product)
          }
        }
      )
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Parse required_materials JSON string back into array
    let parsedMaterials = []
    if (product.required_materials) {
      if (typeof product.required_materials === 'string') {
        try {
          // Handle both JSON arrays and empty strings
          if (product.required_materials === '[]' || product.required_materials === '') {
            parsedMaterials = []
          } else {
            parsedMaterials = JSON.parse(product.required_materials)
          }
        } catch (error) {
          console.error('Error parsing required_materials in GET:', error, 'Raw value:', product.required_materials)
          parsedMaterials = []
        }
      } else if (Array.isArray(product.required_materials)) {
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

    const database = getDatabase()
    
    // Ensure required_materials is always an array and properly stringified
    const materialsArray = Array.isArray(required_materials) ? required_materials : []
    const materialsToSave = JSON.stringify(materialsArray)
    console.log('PUT - Saving materials to DB:', materialsToSave, 'Original:', required_materials)
    
    const product = await new Promise<any>((resolve, reject) => {
      database.run(
        `UPDATE products SET 
         product_name = ?, sku = ?, category = ?, description = ?, image_url = ?, 
         required_materials = ?, print_time = ?, weight = ?, printer_type = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [product_name, sku, category, description || null, image_url || null, materialsToSave, print_time, weight, printer_type, params.id],
        function(err) {
          if (err) {
            reject(err)
          } else {
            // Get the updated product
            database.get(
              'SELECT * FROM products WHERE id = ?',
              [params.id],
              (err, product) => {
                if (err) {
                  reject(err)
                } else {
                  resolve(product)
                }
              }
            )
          }
        }
      )
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Parse required_materials JSON string back into array
    let parsedMaterials = []
    if (product.required_materials) {
      if (typeof product.required_materials === 'string') {
        try {
          // Handle both JSON arrays and empty strings
          if (product.required_materials === '[]' || product.required_materials === '') {
            parsedMaterials = []
          } else {
            parsedMaterials = JSON.parse(product.required_materials)
          }
        } catch (error) {
          console.error('Error parsing required_materials in PUT:', error, 'Raw value:', product.required_materials)
          parsedMaterials = []
        }
      } else if (Array.isArray(product.required_materials)) {
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

    const database = getDatabase()
    
    await new Promise<void>((resolve, reject) => {
      database.run(
        'DELETE FROM products WHERE id = ?',
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
    console.error("Delete product API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 