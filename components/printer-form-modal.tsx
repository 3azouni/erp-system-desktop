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

interface Printer {
  id: number
  printer_name: string
  model: string
  status: "Idle" | "Printing" | "Maintenance" | "Offline"
  power_consumption: number
  hours_printed: number
  last_maintenance_date: string
  job_queue: number
  location?: string | null
  notes?: string | null
}

interface PrinterFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  printer?: Printer | null
  onSuccess: () => void
}

const PRINTER_MODELS = [
  "Prusa i3 MK3S+",
  "Ender 3 V2",
  "Bambu Lab X1 Carbon",
  "Ultimaker S3",
  "Formlabs Form 3",
  "Elegoo Mars 3",
  "Anycubic Photon Mono X",
  "Creality CR-10",
  "Artillery Sidewinder X2",
  "Custom/Other",
]

const STATUS_OPTIONS = [
  { value: "Idle", label: "Idle" },
  { value: "Printing", label: "Printing" },
  { value: "Maintenance", label: "Maintenance" },
  { value: "Offline", label: "Offline" },
]

export function PrinterFormModal({ open, onOpenChange, printer, onSuccess }: PrinterFormModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [components, setComponents] = React.useState<any[]>([])
  const [selectedComponents, setSelectedComponents] = React.useState<{[key: number]: number}>({})
  const [showComponentSelection, setShowComponentSelection] = React.useState(false)

  const createPrinter = async (printerData: any) => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("Authentication required")
      }

      const response = await fetch("/api/printers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(printerData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create printer")
      }

      const result = await response.json()
      return result.printer
    } catch (error) {
      console.error("Error creating printer:", error)
      throw error
    }
  }

  const loadComponents = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) return

      const response = await fetch("/api/components", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setComponents(data.components || [])
      }
    } catch (error) {
      console.error("Error loading components:", error)
    }
  }

  const updatePrinter = async (printerId: number, printerData: any) => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("Authentication required")
      }

      const response = await fetch(`/api/printers/${printerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(printerData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update printer")
      }

      const result = await response.json()
      return result.printer
    } catch (error) {
      console.error("Error updating printer:", error)
      throw error
    }
  }

  const handleMaintenanceDone = async () => {
    if (!printer) return

    try {
      setLoading(true)
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("Authentication required")
      }

      // Check if components were used
      const usedComponents = Object.entries(selectedComponents)
        .filter(([_, quantity]) => quantity > 0)
        .map(([componentId, quantity]) => ({ componentId: parseInt(componentId), quantity }))

      // Reset maintenance record to current date and reset hours printed to 0
      const today = new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
      const maintenanceData = {
        ...formData,
        last_maintenance_date: today,
        hours_printed: 0 // Reset hours printed to 0 after maintenance
      }

      const response = await fetch(`/api/printers/${printer.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(maintenanceData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to reset maintenance")
      }

      // Deduct used components from stock
      if (usedComponents.length > 0) {
        for (const { componentId, quantity } of usedComponents) {
          try {
            await fetch(`/api/components/${componentId}/use`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ quantity }),
            })
          } catch (error) {
            console.error(`Error deducting component ${componentId}:`, error)
          }
        }
      }

      // Update form data to reflect the change
      setFormData(prev => ({
        ...prev,
        last_maintenance_date: today,
        hours_printed: 0
      }))

      const componentMessage = usedComponents.length > 0 
        ? ` Used ${usedComponents.length} component(s) in maintenance.`
        : ""

      toast({
        title: "Maintenance Reset",
        description: `Maintenance record for ${printer.printer_name} has been reset to today.${componentMessage}`,
      })

      // Close the modal and refresh the data
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error resetting maintenance:", error)
      toast({
        title: "Error resetting maintenance",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const [formData, setFormData] = React.useState({
    printer_name: "",
    model: "",
    status: "Idle" as "Idle" | "Printing" | "Maintenance" | "Offline",
    power_consumption: 0,
    hours_printed: 0,
    last_maintenance_date: "",
    job_queue: 0,
    location: "",
    notes: "",
  })

  React.useEffect(() => {
    if (open) {
      if (printer) {
        setFormData({
          printer_name: printer.printer_name || "",
          model: printer.model || "",
          status: printer.status || "Idle",
          power_consumption: printer.power_consumption || 0,
          hours_printed: printer.hours_printed || 0,
          last_maintenance_date: printer.last_maintenance_date || "",
          job_queue: printer.job_queue || 0,
          location: printer.location || "",
          notes: printer.notes || "",
        })
      } else {
        setFormData({
          printer_name: "",
          model: "",
          status: "Idle",
          power_consumption: 0,
          hours_printed: 0,
          last_maintenance_date: "",
          job_queue: 0,
          location: "",
          notes: "",
        })
      }
    }
  }, [open, printer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.printer_name.trim() || !formData.model.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const printerData = {
        printer_name: formData.printer_name.trim(),
        model: formData.model.trim(),
        status: formData.status,
        power_consumption: Number(formData.power_consumption),
        hours_printed: Number(formData.hours_printed),
        last_maintenance_date: formData.last_maintenance_date || new Date().toISOString().split("T")[0],
        job_queue: Number(formData.job_queue),
        location: formData.location.trim() || null,
        notes: formData.notes.trim() || null,
      }

      let result
      if (printer) {
        result = await updatePrinter(printer.id, printerData)
      } else {
        result = await createPrinter(printerData)
      }

      if (result) {
        toast({
          title: printer ? "Printer updated" : "Printer added",
          description: `${printerData.printer_name} has been ${printer ? "updated" : "added"} successfully.`,
        })
        onSuccess()
        onOpenChange(false)
      } else {
        throw new Error("Failed to save printer")
      }
    } catch (error: any) {
      console.error("Error saving printer:", error)
      toast({
        title: "Error saving printer",
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
          <DialogTitle>{printer ? "Edit Printer" : "Add New Printer"}</DialogTitle>
          <DialogDescription>
            {printer ? "Update the printer information below." : "Enter the details for your new 3D printer."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="printer_name">Printer Name *</Label>
              <Input
                id="printer_name"
                value={formData.printer_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, printer_name: e.target.value }))}
                placeholder="e.g., Printer Alpha"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model *</Label>
              <Select
                value={formData.model}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, model: value }))}
                name="model"
              >
                <SelectTrigger id="model">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {PRINTER_MODELS.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "Idle" | "Printing" | "Maintenance" | "Offline") =>
                  setFormData((prev) => ({ ...prev, status: value }))
                }
                name="status"
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Workshop A"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="power_consumption">Power Consumption (W)</Label>
              <Input
                id="power_consumption"
                type="number"
                min="0"
                value={formData.power_consumption}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, power_consumption: Number.parseFloat(e.target.value) || 0 }))
                }
                placeholder="200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours_printed">Hours Printed</Label>
              <Input
                id="hours_printed"
                type="number"
                step="0.1"
                min="0"
                value={formData.hours_printed}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, hours_printed: Number.parseFloat(e.target.value) || 0 }))
                }
                placeholder="245.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="last_maintenance_date">Last Maintenance</Label>
              <Input
                id="last_maintenance_date"
                type="date"
                value={formData.last_maintenance_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, last_maintenance_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_queue">Job Queue</Label>
              <Input
                id="job_queue"
                type="number"
                min="0"
                value={formData.job_queue}
                onChange={(e) => setFormData((prev) => ({ ...prev, job_queue: Number.parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about this printer..."
              rows={3}
            />
          </div>

          {printer && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Maintenance Components</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (showComponentSelection) {
                      setShowComponentSelection(false)
                    } else {
                      loadComponents()
                      setShowComponentSelection(true)
                    }
                  }}
                >
                  {showComponentSelection ? "Hide Components" : "Add Components"}
                </Button>
              </div>
              
              {showComponentSelection && (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {components.map((component) => {
                    const availableStock = component.current_stock - component.reserved_stock
                    return (
                      <div key={component.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{component.component_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {component.category} • Available: {availableStock}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max={availableStock}
                            placeholder="0"
                            value={selectedComponents[component.id] || ""}
                            onChange={(e) => {
                              const quantity = parseInt(e.target.value) || 0
                              setSelectedComponents(prev => ({
                                ...prev,
                                [component.id]: quantity
                              }))
                            }}
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">used</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {printer && (
              <Button 
                type="button" 
                variant="secondary" 
                onClick={handleMaintenanceDone}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Maintenance Done
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : printer ? "Update Printer" : "Add Printer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
