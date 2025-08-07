import { getDatabase, initializeDatabase } from "./local-db"

export interface AvailabilityStatus {
  product_id: string
  product_name: string
  sku: string
  requested_quantity: number
  available_stock: number
  in_production: number
  total_available: number
  is_available: boolean
  has_production_in_progress: boolean
  earliest_completion: string | null
  production_jobs: any[]
  availability_status: 'available' | 'in_production' | 'out_of_stock'
}

export interface ProductionJob {
  job_id: string
  quantity: number
  status: string
  printer_name: string
  estimated_completion: string
  started_at: string | null
}

export class AvailabilityService {
  private static instance: AvailabilityService
  private cache: Map<string, { data: AvailabilityStatus; timestamp: number }> = new Map()
  private cacheTimeout = 30000 // 30 seconds

  private constructor() {}

  static getInstance(): AvailabilityService {
    if (!AvailabilityService.instance) {
      AvailabilityService.instance = new AvailabilityService()
    }
    return AvailabilityService.instance
  }

  async checkProductAvailability(productId: string, quantity: number): Promise<AvailabilityStatus> {
    const cacheKey = `${productId}-${quantity}`
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }

    try {
      await initializeDatabase()
      const database = getDatabase()

      // Get product details
      const product = await new Promise<any>((resolve, reject) => {
        database.get(
          'SELECT * FROM products WHERE id = ?',
          [productId],
          (err, row) => {
            if (err) {
              reject(err)
            } else {
              resolve(row)
            }
          }
        )
      })

      if (!product) {
        throw new Error("Product not found")
      }

      // Check current inventory for this product
      const availableStock = await this.getAvailableStock(productId)

      // Check if there are any print jobs for this product that are in progress
      const activePrintJobs = await this.getActivePrintJobs(productId)

      // Calculate total quantity in production
      const totalInProduction = activePrintJobs.reduce((sum, job) => sum + job.quantity, 0)

      // Calculate estimated completion times
      const productionJobs = activePrintJobs.map(job => {
        const startedAt = job.started_at ? new Date(job.started_at) : new Date()
        const estimatedCompletion = new Date(startedAt.getTime() + (job.estimated_print_time * 60 * 60 * 1000))
        
        return {
          job_id: job.id,
          quantity: job.quantity,
          status: job.status,
          printer_name: job.printer_name,
          estimated_completion: estimatedCompletion.toISOString(),
          started_at: job.started_at
        }
      })

      // Determine availability
      const isAvailable = availableStock >= quantity
      const hasProductionInProgress = totalInProduction > 0
      const totalAvailable = availableStock + totalInProduction

      // Find the earliest completion time for jobs that would satisfy the order
      let earliestCompletion = null
      let cumulativeQuantity = availableStock
      
      for (const job of productionJobs) {
        cumulativeQuantity += job.quantity
        if (cumulativeQuantity >= quantity && !earliestCompletion) {
          earliestCompletion = job.estimated_completion
        }
      }

      const availabilityStatus: AvailabilityStatus = {
        product_id: productId,
        product_name: product.product_name,
        sku: product.sku,
        requested_quantity: quantity,
        available_stock: availableStock,
        in_production: totalInProduction,
        total_available: totalAvailable,
        is_available: isAvailable,
        has_production_in_progress: hasProductionInProgress,
        earliest_completion: earliestCompletion,
        production_jobs: productionJobs,
        availability_status: isAvailable ? 'available' : hasProductionInProgress ? 'in_production' : 'out_of_stock'
      }

      // Cache the result
      this.cache.set(cacheKey, { data: availabilityStatus, timestamp: Date.now() })

      return availabilityStatus
    } catch (error) {
      console.error("Error checking product availability:", error)
      throw error
    }
  }

  private async getAvailableStock(productId: string): Promise<number> {
<<<<<<< HEAD
    try {
      const database = getDatabase()
      
      const result = await new Promise<any>((resolve, reject) => {
        database.get(
          'SELECT quantity_available FROM finished_goods_inventory WHERE product_id = ?',
          [productId],
          (err, row) => {
            if (err) {
              reject(err)
            } else {
              resolve(row)
            }
          }
        )
      })

      return result ? result.quantity_available : 0
    } catch (error) {
      console.error("Error getting finished goods inventory:", error)
      return 0
    }
=======
    // For now, return 0 as placeholder for finished goods inventory
    // In a real system, this would query a finished goods inventory table
    return 0
>>>>>>> a1c4a974a89eea540ea4d39390eeb0af1d36aed5
  }

  private async getActivePrintJobs(productId: string): Promise<any[]> {
    const database = getDatabase()
    
    return new Promise<any[]>((resolve, reject) => {
      database.all(
        `SELECT 
          pj.id,
          pj.quantity,
          pj.estimated_print_time,
          pj.status,
          pj.started_at,
          pj.completed_at,
          pj.created_at,
          pr.printer_name,
          pr.model
        FROM print_jobs pj
        LEFT JOIN printers pr ON pj.printer_id = pr.id
        WHERE pj.product_id = ? AND pj.status IN ('Pending', 'Printing')
        ORDER BY pj.created_at ASC`,
        [productId],
        (err, rows) => {
          if (err) {
            reject(err)
          } else {
            resolve(rows || [])
          }
        }
      )
    })
  }

  async getProductAvailabilitySummary(productId: string): Promise<{
    available_stock: number
    in_production: number
    total_available: number
    has_active_jobs: boolean
  }> {
    const availability = await this.checkProductAvailability(productId, 1)
    
    return {
      available_stock: availability.available_stock,
      in_production: availability.in_production,
      total_available: availability.total_available,
      has_active_jobs: availability.has_production_in_progress
    }
  }

  clearCache(): void {
    this.cache.clear()
  }

  clearCacheForProduct(productId: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => key.startsWith(`${productId}-`))
    keysToDelete.forEach(key => this.cache.delete(key))
  }
}

export const availabilityService = AvailabilityService.getInstance() 