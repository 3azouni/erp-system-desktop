// =====================================================
// Server-Side SKU Generator
// =====================================================

// Material code mapping
const MATERIAL_CODES: Record<string, string> = {
  'PLA': 'PL',
  'PLA+': 'PP',
  'ABS': 'AB',
  'PETG': 'PE',
  'TPU': 'TP',
  'ASA': 'AS',
  'PC': 'PC',
  'Nylon': 'NY',
  'Wood Fill': 'WF',
  'Metal Fill': 'MF',
  'Carbon Fiber': 'CF',
  'Resin': 'RE',
  'PETG-CF': 'PF',
  'PLA-CF': 'PC',
  'ABS-CF': 'AC',
  'Nylon-CF': 'NC',
  'TPU-CF': 'TC',
  'ASA-CF': 'SC',
  'PC-CF': 'CC',
  'Wood Fill-CF': 'WC',
  'Metal Fill-CF': 'MC',
  'Resin-CF': 'RC',
}

// Category prefix mapping (first 3 consonants)
const CATEGORY_PREFIXES: Record<string, string> = {
  'Miniatures': 'MNT',
  'Functional Parts': 'FNC',
  'Prototypes': 'PRT',
  'Decorative Items': 'DCR',
  'Tools & Accessories': 'TLS',
  'Educational Models': 'EDC',
  'Custom Parts': 'CST',
}

/**
 * Extract first 3 consonants from a string
 */
function extractConsonants(str: string): string {
  const consonants = str.replace(/[^BCDFGHJKLMNPQRSTVWXYZ]/gi, '').toUpperCase()
  return consonants.slice(0, 3).padEnd(3, 'X')
}

/**
 * Get material code from material name
 */
function getMaterialCode(material: string): string {
  // Try exact match first
  if (MATERIAL_CODES[material]) {
    return MATERIAL_CODES[material]
  }
  
  // Try partial matches
  for (const [key, code] of Object.entries(MATERIAL_CODES)) {
    if (material.toUpperCase().includes(key.toUpperCase())) {
      return code
    }
  }
  
  // Default to first 2 letters if no match
  return material.slice(0, 2).toUpperCase().padEnd(2, 'X')
}

/**
 * Get primary material code from materials array
 */
function getPrimaryMaterialCode(materials: string[]): string {
  if (!materials || materials.length === 0) {
    return 'XX'
  }
  
  // Sort materials by priority (PLA first, then others)
  const sortedMaterials = materials.sort((a, b) => {
    const aPriority = a.toUpperCase().includes('PLA') ? 0 : 1
    const bPriority = b.toUpperCase().includes('PLA') ? 0 : 1
    return aPriority - bPriority
  })
  
  return getMaterialCode(sortedMaterials[0])
}

/**
 * Generate base SKU components
 */
function generateSkuComponents(productName: string, category: string, materials: string[]): {
  prefix: string
  middle: string
  materialCode: string
} {
  const prefix = CATEGORY_PREFIXES[category] || extractConsonants(category)
  const middle = extractConsonants(productName)
  const materialCode = getPrimaryMaterialCode(materials)
  
  return { prefix, middle, materialCode }
}

/**
 * Check if SKU exists in database
 */
async function checkSkuExists(sku: string): Promise<boolean> {
  try {
    // Import here to avoid circular dependencies
    const { supabaseAdmin } = await import('./supabase-server')
    
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('sku', sku)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error
    }
    
    return !!data
  } catch (error) {
    console.error('Error checking SKU existence:', error)
    return false
  }
}

/**
 * Generate unique SKU with collision detection
 */
export async function generateUniqueSku(
  productName: string, 
  category: string, 
  materials: string[] = []
): Promise<string> {
  const { prefix, middle, materialCode } = generateSkuComponents(productName, category, materials)
  
  // Try sequence numbers from 001 to 999
  for (let sequence = 1; sequence <= 999; sequence++) {
    const sku = `${prefix}-${middle}-${materialCode}-${sequence.toString().padStart(3, '0')}`
    
    const exists = await checkSkuExists(sku)
    if (!exists) {
      return sku
    }
  }
  
  // If all sequences are taken, add timestamp suffix
  const timestamp = Date.now().toString().slice(-3)
  return `${prefix}-${middle}-${materialCode}-${timestamp}`
}

/**
 * Generate SKU without database check (for preview/validation)
 */
export function generateSkuPreview(
  productName: string, 
  category: string, 
  materials: string[] = []
): string {
  const { prefix, middle, materialCode } = generateSkuComponents(productName, category, materials)
  return `${prefix}-${middle}-${materialCode}-001`
}

/**
 * Validate SKU format
 */
export function validateSkuFormat(sku: string): boolean {
  const skuPattern = /^[A-Z]{3}-[A-Z]{3}-[A-Z]{2}-\d{3}$/
  return skuPattern.test(sku)
}

/**
 * Parse SKU components
 */
export function parseSku(sku: string): {
  prefix: string
  middle: string
  materialCode: string
  sequence: string
} | null {
  if (!validateSkuFormat(sku)) {
    return null
  }
  
  const parts = sku.split('-')
  return {
    prefix: parts[0],
    middle: parts[1],
    materialCode: parts[2],
    sequence: parts[3]
  }
}

// Export material codes for reference
export { MATERIAL_CODES, CATEGORY_PREFIXES }
