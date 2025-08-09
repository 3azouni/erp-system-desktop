"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useSettings } from "@/contexts/settings-context"
import { formatCurrency } from "@/lib/cost-calculator"
import { Package, Calculator, DollarSign, TrendingUp, FileText, Download, AlertCircle } from "lucide-react"

interface CostCalculation {
  materialCost: number
  electricityCost: number
  laborCost: number
  packagingCost: number
  shippingCost: number
  marketingCost: number
  platformFees: number
  miscBuffer: number
  totalCost: number
  suggestedPrice: number
  profitMargin: number
}

export function BOMPage() {
  const { toast } = useToast()
  const { settings } = useSettings()
  const [products, setProducts] = React.useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(true)

  // Form inputs - sync with settings
  const [inputs, setInputs] = React.useState({
    filamentCostPerKg: 25.0,
    filamentUsedGrams: 50,
    printTimeHours: 2.0,
    printerWattage: 200,
    electricityRate: settings?.electricity_cost_per_kwh || 0.12,
    laborRate: settings?.labor_rate_per_hour || 15.0,
    packagingCost: 2.0,
    shippingCost: 5.0,
    marketingPercentage: settings?.default_marketing_percentage || 10,
    platformFeePercentage: settings?.platform_fee_percentage || 5,
    miscBufferPercentage: settings?.misc_buffer_percentage || 5,
    markupMultiplier: 2.0,
  })

  // Load products
  React.useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/products")
        if (!response.ok) {
          throw new Error("Failed to fetch products")
        }
        
        const data = await response.json()
        setProducts(data.products || [])
      } catch (error) {
        console.error("Error loading products:", error)
        toast({
          title: "Error loading products",
          description: "Failed to load products from database.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [toast])

  // Auto-fill when product is selected
  React.useEffect(() => {
    if (selectedProduct) {
      setInputs((prev) => ({
        ...prev,
        filamentUsedGrams: selectedProduct.weight || prev.filamentUsedGrams,
        printTimeHours: selectedProduct.print_time || prev.printTimeHours,
      }))
    }
  }, [selectedProduct])

  // Sync inputs with settings when settings change
  React.useEffect(() => {
    if (settings) {
      setInputs((prev) => ({
        ...prev,
        electricityRate: settings.electricity_cost_per_kwh || prev.electricityRate,
        laborRate: settings.labor_rate_per_hour || prev.laborRate,
        marketingPercentage: settings.default_marketing_percentage || prev.marketingPercentage,
        platformFeePercentage: settings.platform_fee_percentage || prev.platformFeePercentage,
        miscBufferPercentage: settings.misc_buffer_percentage || prev.miscBufferPercentage,
      }))
    }
  }, [settings])

  // Calculate costs
  const calculation: CostCalculation = React.useMemo(() => {
    const materialCost = (inputs.filamentCostPerKg / 1000) * inputs.filamentUsedGrams
    const electricityCost = (inputs.printerWattage / 1000) * inputs.printTimeHours * inputs.electricityRate
    const laborCost = inputs.printTimeHours * inputs.laborRate
    const packagingCost = inputs.packagingCost
    const shippingCost = inputs.shippingCost

    const subtotal = materialCost + electricityCost + laborCost + packagingCost + shippingCost
    const marketingCost = (subtotal * inputs.marketingPercentage) / 100
    const platformFees = (subtotal * inputs.platformFeePercentage) / 100
    const miscBuffer = (subtotal * inputs.miscBufferPercentage) / 100

    const totalCost = subtotal + marketingCost + platformFees + miscBuffer
    const suggestedPrice = totalCost * inputs.markupMultiplier
    const profitMargin = ((suggestedPrice - totalCost) / suggestedPrice) * 100

    return {
      materialCost,
      electricityCost,
      laborCost,
      packagingCost,
      shippingCost,
      marketingCost,
      platformFees,
      miscBuffer,
      totalCost,
      suggestedPrice,
      profitMargin,
    }
  }, [inputs])

  // Use formatCurrency from settings context

  const savePricingToProduct = async () => {
    if (!selectedProduct) {
      toast({
        title: "No Product Selected",
        description: "Please select a product to save the pricing to.",
        variant: "destructive",
      })
      return
    }

    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to save pricing.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/products/${selectedProduct.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          print_time: inputs.printTimeHours,
          weight: inputs.filamentUsedGrams,
          // Add pricing fields if they exist in your product schema
          suggested_price: calculation.suggestedPrice,
          cost_price: calculation.totalCost,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update product")
      }

      toast({
        title: "Pricing Saved",
        description: `Pricing has been saved to ${selectedProduct.product_name}`,
      })
    } catch (error) {
      console.error("Error saving pricing:", error)
      toast({
        title: "Error",
        description: "Failed to save pricing to product.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">BOM & Cost Calculator</h1>
            <p className="text-muted-foreground">Calculate production costs and pricing</p>
          </div>
        </div>
        <div className="text-center py-8">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">BOM & Cost Calculator</h1>
          <p className="text-muted-foreground">Calculate production costs and pricing for your 3D printed products</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            Currency: {settings?.currency || "USD"}
            {settings?.currency === "LBP" && ` (1 USD = ${settings?.usd_to_lbp_rate || 89.5} LBP)`}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Cost Calculation Inputs
            </CardTitle>
            <CardDescription>Enter the parameters for your cost calculation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Product Selection */}
            <div className="space-y-2">
              <Label>Select Product (Optional)</Label>
              <Select
                value={selectedProduct ? selectedProduct.id.toString() : ""}
                onValueChange={(value) => {
                  const product = products.find((p) => p.id.toString() === value)
                  setSelectedProduct(product || null)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a product to auto-fill data" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.product_name} ({product.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProduct && (
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">{selectedProduct.category}</Badge>
                  <Badge variant="outline">{selectedProduct.weight}g</Badge>
                  <Badge variant="outline">{selectedProduct.print_time}h</Badge>
                </div>
              )}
            </div>

            <Separator />

            {/* Material Costs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filamentCost">Filament Cost ($/kg)</Label>
                <Input
                  id="filamentCost"
                  type="number"
                  step="0.01"
                  value={inputs.filamentCostPerKg}
                  onChange={(e) =>
                    setInputs((prev) => ({ ...prev, filamentCostPerKg: Number.parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filamentUsed">Filament Used (g)</Label>
                <Input
                  id="filamentUsed"
                  type="number"
                  value={inputs.filamentUsedGrams}
                  onChange={(e) =>
                    setInputs((prev) => ({ ...prev, filamentUsedGrams: Number.parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>

            {/* Print Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="printTime">Print Time (hours)</Label>
                <Input
                  id="printTime"
                  type="number"
                  step="0.1"
                  value={inputs.printTimeHours}
                  onChange={(e) =>
                    setInputs((prev) => ({ ...prev, printTimeHours: Number.parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="printerWattage">Printer Wattage (W)</Label>
                <Input
                  id="printerWattage"
                  type="number"
                  value={inputs.printerWattage}
                  onChange={(e) =>
                    setInputs((prev) => ({ ...prev, printerWattage: Number.parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>

            {/* Labor & Electricity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="electricityRate">Electricity Rate ($/kWh)</Label>
                <Input
                  id="electricityRate"
                  type="number"
                  step="0.01"
                  value={inputs.electricityRate}
                  onChange={(e) =>
                    setInputs((prev) => ({ ...prev, electricityRate: Number.parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="laborRate">Labor Rate ($/hour)</Label>
                <Input
                  id="laborRate"
                  type="number"
                  step="0.01"
                  value={inputs.laborRate}
                  onChange={(e) =>
                    setInputs((prev) => ({ ...prev, laborRate: Number.parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>

            {/* Additional Costs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="packaging">Packaging Cost ($)</Label>
                <Input
                  id="packaging"
                  type="number"
                  step="0.01"
                  value={inputs.packagingCost}
                  onChange={(e) =>
                    setInputs((prev) => ({ ...prev, packagingCost: Number.parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shipping">Shipping Cost ($)</Label>
                <Input
                  id="shipping"
                  type="number"
                  step="0.01"
                  value={inputs.shippingCost}
                  onChange={(e) =>
                    setInputs((prev) => ({ ...prev, shippingCost: Number.parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>

            {/* Percentages */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="marketing">Marketing (%)</Label>
                <Input
                  id="marketing"
                  type="number"
                  value={inputs.marketingPercentage}
                  onChange={(e) =>
                    setInputs((prev) => ({ ...prev, marketingPercentage: Number.parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="platformFee">Platform Fee (%)</Label>
                <Input
                  id="platformFee"
                  type="number"
                  value={inputs.platformFeePercentage}
                  onChange={(e) =>
                    setInputs((prev) => ({ ...prev, platformFeePercentage: Number.parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buffer">Misc Buffer (%)</Label>
                <Input
                  id="buffer"
                  type="number"
                  value={inputs.miscBufferPercentage}
                  onChange={(e) =>
                    setInputs((prev) => ({ ...prev, miscBufferPercentage: Number.parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>

            {/* Markup */}
            <div className="space-y-2">
              <Label htmlFor="markup">Markup Multiplier</Label>
              <Input
                id="markup"
                type="number"
                step="0.1"
                value={inputs.markupMultiplier}
                onChange={(e) =>
                  setInputs((prev) => ({ ...prev, markupMultiplier: Number.parseFloat(e.target.value) || 1 }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-6">
          {/* Cost Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Cost Breakdown
              </CardTitle>
              <CardDescription>Detailed breakdown of production costs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Material Cost:</span>
                <span className="font-mono">{formatCurrency(calculation.materialCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Electricity Cost:</span>
                <span className="font-mono">{formatCurrency(calculation.electricityCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Labor Cost:</span>
                <span className="font-mono">{formatCurrency(calculation.laborCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Packaging:</span>
                <span className="font-mono">{formatCurrency(calculation.packagingCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span className="font-mono">{formatCurrency(calculation.shippingCost)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span>Marketing ({inputs.marketingPercentage}%):</span>
                <span className="font-mono">{formatCurrency(calculation.marketingCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Fees ({inputs.platformFeePercentage}%):</span>
                <span className="font-mono">{formatCurrency(calculation.platformFees)}</span>
              </div>
              <div className="flex justify-between">
                <span>Misc Buffer ({inputs.miscBufferPercentage}%):</span>
                <span className="font-mono">{formatCurrency(calculation.miscBuffer)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total Cost:</span>
                <span className="font-mono">{formatCurrency(calculation.totalCost)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Recommendation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing Recommendation
              </CardTitle>
              <CardDescription>Suggested pricing based on your markup</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{formatCurrency(calculation.suggestedPrice)}</div>
                <p className="text-sm text-muted-foreground">Suggested Selling Price</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{calculation.profitMargin.toFixed(1)}%</div>
                  <p className="text-sm text-muted-foreground">Profit Margin</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">
                    {formatCurrency(calculation.suggestedPrice - calculation.totalCost)}
                  </div>
                  <p className="text-sm text-muted-foreground">Profit per Unit</p>
                </div>
              </div>

              {calculation.profitMargin < 20 && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm text-yellow-800">
                    Low profit margin. Consider increasing markup or reducing costs.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => setInputs((prev) => ({ ...prev, markupMultiplier: 1.5 }))}
              >
                Set 1.5x Markup (Conservative)
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => setInputs((prev) => ({ ...prev, markupMultiplier: 2.0 }))}
              >
                Set 2.0x Markup (Standard)
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => setInputs((prev) => ({ ...prev, markupMultiplier: 3.0 }))}
              >
                Set 3.0x Markup (Premium)
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={savePricingToProduct}
                disabled={!selectedProduct}
              >
                Save Pricing to Selected Product
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
