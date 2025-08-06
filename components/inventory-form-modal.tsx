"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { type InventoryItem } from "@/lib/local-db"

interface InventoryFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: InventoryItem | null
  onSuccess: () => void
}

async function createInventoryItem(data: any) {
  try {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch('/api/inventory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create inventory item')
    }

    const result = await response.json()
    return result.item
  } catch (error) {
    console.error('Error creating inventory item:', error)
    throw error
  }
}

async function updateInventoryItem(id: number | string, data: any) {
  try {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`/api/inventory/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update inventory item')
    }

    const result = await response.json()
    return result.item
  } catch (error) {
    console.error('Error updating inventory item:', error)
    throw error
  }
}

const MATERIAL_TYPES = [
  "PLA",
  "ABS",
  "PETG",
  "TPU",
  "PETG-CF",
  "Wood Fill",
  "Metal Fill",
  "Support Material",
  "Resin",
  "Flexible Resin",
]

const COLORS = [
  "Black",
  "White",
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Orange",
  "Purple",
  "Gray",
  "Clear",
  "Natural",
  "Silver",
  "Gold",
]

export function InventoryFormModal({ open, onOpenChange, item, onSuccess }: InventoryFormModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)

  const [formData, setFormData] = React.useState({
    material_name: "",
    material_type: "",
    color: "",
    price_per_kg: 0,
    quantity_available: 0,
    supplier: "",
    minimum_threshold: 0,
    status: "Normal" as "Normal" | "Low" | "Out",
    notes: "",
  })

  React.useEffect(() => {
    if (open) {
      if (item) {
        setFormData({
          material_name: item.material_name || "",
          material_type: item.material_type || "",
          color: item.color || "",
          price_per_kg: item.price_per_kg || 0,
          quantity_available: item.quantity_available || 0,
          supplier: item.supplier || "",
          minimum_threshold: item.minimum_threshold || 0,
          status: item.status || "Normal",
          notes: item.notes || "",
        })
      } else {
        setFormData({
          material_name: "",
          material_type: "",
          color: "",
          price_per_kg: 0,
          quantity_available: 0,
          supplier: "",
          minimum_threshold: 0,
          status: "Normal",
          notes: "",
        })
      }
    }
  }, [open, item])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.material_name.trim() || !formData.material_type || !formData.color || !formData.supplier.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const inventoryData = {
        material_name: formData.material_name.trim(),
        material_type: formData.material_type,
        color: formData.color,
        price_per_kg: Number(formData.price_per_kg),
        quantity_available: Number(formData.quantity_available),
        supplier: formData.supplier.trim(),
        minimum_threshold: Number(formData.minimum_threshold),
        status: formData.status,
        notes: formData.notes.trim() || null,
      }

      let result
      if (item) {
        result = await updateInventoryItem(item.id, inventoryData)
      } else {
        result = await createInventoryItem(inventoryData)
      }

      if (result) {
        toast({
          title: item ? "Material updated" : "Material added",
          description: `${inventoryData.material_name} has been ${item ? "updated" : "added"} successfully.`,
        })
        onSuccess()
        onOpenChange(false)
      } else {
        throw new Error("Failed to save inventory item")
      }
    } catch (error: any) {
      console.error("Error saving inventory item:", error)
      toast({
        title: "Error saving material",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Material" : "Add New Material"}</DialogTitle>
          <DialogDescription>
            {item ? "Update the material information below." : "Enter the details for your new material."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="material_name">Material Name *</Label>
            <Input
              id="material_name"
              value={formData.material_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, material_name: e.target.value }))}
              placeholder="e.g., Premium PLA Black"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="material_type">Material Type *</Label>
              <Select
                value={formData.material_type}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, material_type: value }))}
                name="material_type"
              >
                <SelectTrigger id="material_type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {MATERIAL_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color *</Label>
              <Select
                value={formData.color}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, color: value }))}
                name="color"
              >
                <SelectTrigger id="color">
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  {COLORS.map((color) => (
                    <SelectItem key={color} value={color}>
                      {color}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price_per_kg">Price per kg ($)</Label>
              <Input
                id="price_per_kg"
                type="number"
                step="0.01"
                min="0"
                value={formData.price_per_kg}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, price_per_kg: Number.parseFloat(e.target.value) || 0 }))
                }
                placeholder="25.99"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity_available">Quantity Available (g)</Label>
              <Input
                id="quantity_available"
                type="number"
                min="0"
                value={formData.quantity_available}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, quantity_available: Number.parseInt(e.target.value) || 0 }))
                }
                placeholder="1000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier *</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => setFormData((prev) => ({ ...prev, supplier: e.target.value }))}
                placeholder="e.g., Hatchbox"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minimum_threshold">Min Threshold (g)</Label>
              <Input
                id="minimum_threshold"
                type="number"
                min="0"
                value={formData.minimum_threshold}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, minimum_threshold: Number.parseInt(e.target.value) || 0 }))
                }
                placeholder="200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: "Normal" | "Low" | "Out") => setFormData((prev) => ({ ...prev, status: value }))}
              name="status"
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="Low">Low Stock</SelectItem>
                <SelectItem value="Out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about this material..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : item ? "Update Material" : "Add Material"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
