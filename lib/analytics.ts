import { supabaseAdmin } from '@/lib/supabase-server'

export interface AnalyticsEvent {
  user_id: string
  type: string
  entity: string
  entity_id?: string
  metadata?: Record<string, any>
}

/**
 * Track an analytics event
 * This is a passive hook that doesn't affect the main functionality
 */
export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('events')
      .insert({
        user_id: event.user_id,
        type: event.type,
        entity: event.entity,
        entity_id: event.entity_id,
        metadata: event.metadata || {}
      })

    if (error) {
      console.error('Analytics event tracking failed:', error)
    }
  } catch (error) {
    // Silently fail - analytics should never break main functionality
    console.error('Analytics event tracking error:', error)
  }
}

/**
 * Track barcode generation event
 */
export async function trackBarcodeGenerated(
  userId: string, 
  productId: string, 
  barcodeType: string,
  barcodeValue: string
): Promise<void> {
  await trackEvent({
    user_id: userId,
    type: 'barcode_generated',
    entity: 'product',
    entity_id: productId,
    metadata: {
      barcode_type: barcodeType,
      barcode_value: barcodeValue,
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * Track SKU generation event
 */
export async function trackSkuGenerated(
  userId: string,
  productId: string,
  sku: string,
  productName: string,
  category: string
): Promise<void> {
  await trackEvent({
    user_id: userId,
    type: 'sku_generated',
    entity: 'product',
    entity_id: productId,
    metadata: {
      sku: sku,
      product_name: productName,
      category: category,
      timestamp: new Date().toISOString()
    }
  })
}
