import { NextRequest, NextResponse } from 'next/server'
import { generateBarcode, createProductUrl, validateBarcodeValue } from '@/lib/barcode-generator'
import { supabaseAdmin } from '@/lib/supabase-server'
import { trackBarcodeGenerated } from '@/lib/analytics'

export async function POST(request: NextRequest) {
  try {
    const { productId, barcodeType, barcodeValue, sku } = await request.json()

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

    // Only admin and production can generate barcodes
    if (!['admin', 'production'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only admin and production roles can generate barcodes.' },
        { status: 403 }
      )
    }

    // Validation
    if (!productId || !barcodeType) {
      return NextResponse.json(
        { error: 'Product ID and barcode type are required' },
        { status: 400 }
      )
    }

    if (!['EAN13', 'CODE128', 'QR'].includes(barcodeType)) {
      return NextResponse.json(
        { error: 'Invalid barcode type. Must be EAN13, CODE128, or QR' },
        { status: 400 }
      )
    }

    // Determine the value to encode
    let valueToEncode = barcodeValue || sku
    if (!valueToEncode) {
      return NextResponse.json(
        { error: 'Either barcode value or SKU must be provided' },
        { status: 400 }
      )
    }

    // Validate the value for the barcode type
    if (!validateBarcodeValue(valueToEncode, barcodeType)) {
      return NextResponse.json(
        { error: `Invalid value for ${barcodeType} barcode` },
        { status: 400 }
      )
    }

    // Generate barcode image
    let barcodeBuffer: Buffer
    if (barcodeType === 'QR') {
      // For QR codes, use product URL if SKU is available
      const productUrl = sku ? createProductUrl(sku) : valueToEncode
      barcodeBuffer = await generateBarcode(valueToEncode, 'QR', productUrl)
    } else {
      barcodeBuffer = await generateBarcode(valueToEncode, barcodeType)
    }

    // Upload to Supabase Storage
    const fileName = `barcodes/${productId}.png`
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('product-assets')
      .upload(fileName, barcodeBuffer, {
        contentType: 'image/png',
        upsert: true
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload barcode image' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('product-assets')
      .getPublicUrl(fileName)

    const barcodeImageUrl = urlData.publicUrl

    // Update product with barcode information
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('products')
      .update({
        barcode_type: barcodeType,
        barcode_value: valueToEncode,
        barcode_image_url: barcodeImageUrl
      })
      .eq('id', productId)
      .select()
      .single()

    if (updateError) {
      console.error('Product update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update product with barcode information' },
        { status: 500 }
      )
    }

    // Track analytics event (passive - doesn't affect main functionality)
    try {
      await trackBarcodeGenerated(
        user.id,
        productId,
        barcodeType,
        valueToEncode
      )
    } catch (analyticsError) {
      // Analytics failure should not affect the main response
      console.error('Analytics tracking failed:', analyticsError)
    }

    return NextResponse.json({
      success: true,
      barcodeImageUrl,
      barcodeType,
      barcodeValue: valueToEncode,
      product: updateData
    })

  } catch (error) {
    console.error('Barcode generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate barcode' },
      { status: 500 }
    )
  }
}
