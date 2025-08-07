import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/local-db"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const database = getDatabase()
    
    const products = await new Promise<any[]>((resolve, reject) => {
      database.all(
        'SELECT * FROM products ORDER BY created_at DESC',
        (err, rows) => {
          if (err) {
            reject(err)
          } else {
            resolve(rows || [])
          }
        }
      )
    })

    // Parse required_materials JSON strings back into arrays
    const parsedProducts = products.map(product => {
      console.log('Raw product required_materials:', product.required_materials, typeof product.required_materials)
      
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
            console.error('Error parsing required_materials:', error, 'Raw value:', product.required_materials)
            parsedMaterials = []
          }
        } else if (Array.isArray(product.required_materials)) {
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

    const database = getDatabase()
    
    // Ensure required_materials is always an array and properly stringified
    const materialsArray = Array.isArray(required_materials) ? required_materials : []
    const materialsToSave = JSON.stringify(materialsArray)
    console.log('Saving materials to DB:', materialsToSave, 'Original:', required_materials)
    
    const product = await new Promise<any>((resolve, reject) => {
      database.run(
        `INSERT INTO products (product_name, sku, category, description, image_url, required_materials, print_time, weight, printer_type, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [product_name, sku, category, description || null, image_url || null, materialsToSave, print_time, weight, printer_type],
        function(err) {
          if (err) {
            reject(err)
          } else {
            // Get the created product
            database.get(
              'SELECT * FROM products WHERE id = ?',
              [this.lastID],
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
          console.error('Error parsing required_materials in POST:', error, 'Raw value:', product.required_materials)
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

    return NextResponse.json({ product: parsedProduct }, { status: 201 })
  } catch (error) {
    console.error("Create product API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 