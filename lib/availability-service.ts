import { supabaseAdmin } from "./supabase-server"

interface AvailabilityResult {
  available_stock: number
  in_production: number
  total_available: number
  has_production_in_progress: boolean
}

class AvailabilityService {
  private cache = new Map<string, { data: AvailabilityResult; timestamp: number }>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  async getProductAvailability(productId: number, quantity: number = 1): Promise<AvailabilityResult> {
    const cacheKey = `${productId}-${quantity}`
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }

    try {
      // Get current inventory
      const { data: inventoryData } = await supabaseAdmin
        .from('inventory')
        .select('quantity')
        .eq('product_id', productId)
        .single()

      const availableStock = inventoryData?.quantity || 0

      // Get in-production quantity
      const { data: productionData } = await supabaseAdmin
        .from('print_jobs')
        .select('quantity')
        .eq('product_id', productId)
        .in('status', ['Pending', 'Printing'])

      const inProduction = productionData?.reduce((sum, job) => sum + job.quantity, 0) || 0
      const totalAvailable = availableStock + inProduction
      const hasProductionInProgress = inProduction > 0

      const result: AvailabilityResult = {
        available_stock: availableStock,
        in_production: inProduction,
        total_available: totalAvailable,
        has_production_in_progress: hasProductionInProgress
      }

      this.cache.set(cacheKey, { data: result, timestamp: Date.now() })
      return result
    } catch (error) {
      console.error('Error getting product availability:', error)
      return {
        available_stock: 0,
        in_production: 0,
        total_available: 0,
        has_production_in_progress: false
      }
    }
  }

  clearCacheForProduct(productId: number) {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => key.startsWith(`${productId}-`))
    keysToDelete.forEach(key => this.cache.delete(key))
  }

  clearAllCache() {
    this.cache.clear()
  }
}

export const availabilityService = new AvailabilityService() 