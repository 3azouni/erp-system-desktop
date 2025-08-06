export interface CostInputs {
  filament_cost_per_kg: number
  weight_per_unit: number
  printer_kwh: number
  electricity_rate: number
  print_time: number
  labor_rate: number
  marketing_percentage: number
  packaging_cost: number
  shipping_cost: number
  platform_fee_percentage: number
  misc_buffer_percentage: number
  markup_multiplier: number
}

export interface CostBreakdown {
  material_cost: number
  electricity_cost: number
  labor_cost: number
  base_cost: number
  marketing_cost: number
  platform_fee: number
  misc_buffer: number
  total_unit_cost: number
  suggested_sell_price: number
  profit_margin: number
  profit_amount: number
}

export function calculateProductCosts(inputs: CostInputs): CostBreakdown {
  // Calculate material cost (filament)
  const material_cost = (inputs.filament_cost_per_kg * inputs.weight_per_unit) / 1000

  // Calculate electricity cost
  const electricity_cost = inputs.printer_kwh * inputs.print_time * inputs.electricity_rate

  // Calculate labor cost
  const labor_cost = inputs.labor_rate * inputs.print_time

  // Calculate base cost
  const base_cost = material_cost + electricity_cost + labor_cost + inputs.packaging_cost + inputs.shipping_cost

  // Calculate additional fees
  const marketing_cost = base_cost * (inputs.marketing_percentage / 100)
  const platform_fee = base_cost * (inputs.platform_fee_percentage / 100)
  const misc_buffer = base_cost * (inputs.misc_buffer_percentage / 100)

  // Calculate total unit cost
  const total_unit_cost = base_cost + marketing_cost + platform_fee + misc_buffer

  // Calculate suggested sell price
  const suggested_sell_price = total_unit_cost * inputs.markup_multiplier

  // Calculate profit
  const profit_amount = suggested_sell_price - total_unit_cost
  const profit_margin = total_unit_cost > 0 ? (profit_amount / suggested_sell_price) * 100 : 0

  return {
    material_cost,
    electricity_cost,
    labor_cost,
    base_cost,
    marketing_cost,
    platform_fee,
    misc_buffer,
    total_unit_cost,
    suggested_sell_price,
    profit_margin,
    profit_amount,
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

export function formatPercentage(percentage: number): string {
  return `${percentage.toFixed(1)}%`
}
