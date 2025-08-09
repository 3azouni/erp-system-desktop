import { NextRequest, NextResponse } from 'next/server'
import { generateUniqueSku, generateSkuPreview } from '@/lib/sku-generator'
import { trackSkuGenerated } from '@/lib/analytics'

export async function POST(request: NextRequest) {
  try {
    const { productName, category, materials, preview = false } = await request.json()

    // Role-based access control
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user role from Supabase
    const { supabaseAdmin } = await import('@/lib/supabase-server')
    const token = authHeader.replace('Bearer ', '')
    
    // Verify token and get user role
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    // Check user role
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Only admin and production can generate SKUs
    if (!['admin', 'production'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only admin and production roles can generate SKUs.' },
        { status: 403 }
      )
    }

    // Validation
    if (!productName || !category) {
      return NextResponse.json(
        { error: 'Product name and category are required' },
        { status: 400 }
      )
    }

    // Generate SKU
    let sku: string
    if (preview) {
      // Generate preview SKU without database check
      sku = generateSkuPreview(productName, category, materials || [])
    } else {
      // Generate unique SKU with collision detection
      sku = await generateUniqueSku(productName, category, materials || [])
      
      // Track analytics event (passive - doesn't affect main functionality)
      try {
        await trackSkuGenerated(
          user.id,
          '', // No product ID for SKU generation (product not created yet)
          sku,
          productName,
          category
        )
      } catch (analyticsError) {
        // Analytics failure should not affect the main response
        console.error('Analytics tracking failed:', analyticsError)
      }
    }

    return NextResponse.json({ sku })
  } catch (error) {
    console.error('Error generating SKU:', error)
    return NextResponse.json(
      { error: 'Failed to generate SKU' },
      { status: 500 }
    )
  }
}
