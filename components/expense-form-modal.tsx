"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
export interface Expense {
  id: number
  description: string
  amount: number
  expense_type: string
  date: string
  category: string
  payment_method: string
  vendor: string
  receipt_url: string
  notes: string
  created_at: string
  updated_at: string
}

interface ExpenseFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense?: Expense
  onSuccess: () => void
}

const EXPENSE_TYPES = [
  "Material",
  "Electricity",
  "Labor",
  "Software",
  "Marketing",
  "Maintenance",
  "Packaging",
  "Shipping",
  "Equipment",
  "Other",
]

export function ExpenseFormModal({ open, onOpenChange, expense, onSuccess }: ExpenseFormModalProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    expense_type: expense?.expense_type || "",
    amount: expense?.amount?.toString() || "",
    date: expense?.date || new Date().toISOString().split("T")[0],
    description: expense?.description || "",
    vendor: expense?.vendor || "",
    receipt_url: expense?.receipt_url || "",
    notes: expense?.notes || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.expense_type || !formData.amount || !formData.date || !formData.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const expenseData = {
        expense_type: formData.expense_type,
        amount: Number.parseFloat(formData.amount),
        date: formData.date,
        description: formData.description,
        vendor: formData.vendor || null,
        receipt_url: formData.receipt_url || null,
        notes: formData.notes || null,
      }

      if (expense?.id) {
        const response = await fetch(`/api/expenses/${expense.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(expenseData)
        })

        if (!response.ok) {
          throw new Error('Failed to update expense')
        }

        toast({
          title: "Success",
          description: "Expense updated successfully",
        })
      } else {
        const response = await fetch('/api/expenses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(expenseData)
        })

        if (!response.ok) {
          throw new Error('Failed to create expense')
        }

        toast({
          title: "Success",
          description: "Expense added successfully",
        })
      }

      onSuccess()
      onOpenChange(false)

      // Reset form
      setFormData({
        expense_type: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
        vendor: "",
        receipt_url: "",
        notes: "",
      })
    } catch (error) {
      console.error("Error saving expense:", error)
      toast({
        title: "Error",
        description: "Failed to save expense",
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
          <DialogTitle>{expense ? "Edit Expense" : "Add New Expense"}</DialogTitle>
          <DialogDescription>
            {expense ? "Update expense details" : "Enter expense information to track business costs"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expense_type">Expense Type *</Label>
              <Select
                value={formData.expense_type}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, expense_type: value }))}
                name="expense_type"
              >
                <SelectTrigger id="expense_type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              placeholder="Brief description of the expense"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor">Vendor/Supplier</Label>
            <Input
              id="vendor"
              placeholder="Company or person paid"
              value={formData.vendor}
              onChange={(e) => setFormData((prev) => ({ ...prev, vendor: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="receipt_url">Receipt URL</Label>
            <Input
              id="receipt_url"
              type="url"
              placeholder="https://..."
              value={formData.receipt_url}
              onChange={(e) => setFormData((prev) => ({ ...prev, receipt_url: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="receipt_file">Upload Receipt/Invoice</Label>
            <Input
              id="receipt_file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  // Handle file upload here
                  // For now, we'll just store the filename
                  setFormData((prev) => ({ 
                    ...prev, 
                    receipt_file: file.name,
                    receipt_url: file.name // Temporary storage
                  }))
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Supported formats: PDF, JPG, PNG, GIF, DOC, DOCX
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional details..."
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : expense ? "Update Expense" : "Add Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
