"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Download, Calendar, Receipt, DollarSign, Edit, Trash2 } from "lucide-react"
import { useSettings } from "@/contexts/settings-context"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { getAuthToken } from "@/lib/ssr-safe-storage"
import { createObjectURL, revokeObjectURL } from "@/lib/ssr-safe-window"
import { createDownloadLink } from "@/lib/ssr-safe-document"

export function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<any | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    expense_name: "",
    expense_type: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  })
  const { formatCurrency } = useSettings()
  const { toast } = useToast()
  const { user, hasPermission } = useAuth()

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      
      const response = await fetch("/api/expenses")
      if (!response.ok) {
        throw new Error("Failed to fetch expenses")
      }
      
      const data = await response.json()
      setExpenses(data.expenses || [])
    } catch (error) {
      console.error("Error fetching expenses:", error)
      toast({
        title: "Error",
        description: "Failed to load expenses",
        variant: "destructive",
      })
      // Set empty array as fallback
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.expense_name || !formData.expense_type || !formData.amount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    try {
      const token = getAuthToken()
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication required for saving expenses.",
          variant: "destructive",
        })
        return
      }

      const expenseData = {
        expense_type: formData.expense_type,
        amount: parseFloat(formData.amount) || 0,
        date: formData.date,
        description: formData.expense_name,
        vendor: null,
        receipt_url: null,
        notes: formData.notes || null,
      }

      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(expenseData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save expense")
      }

      const result = await response.json()

      toast({
        title: "Expense added",
        description: `${expenseData.description} has been added successfully.`,
      })

      setFormData({
        expense_name: "",
        expense_type: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      })
      setIsAddModalOpen(false)
      fetchExpenses()
    } catch (error: any) {
      console.error("Error adding expense:", error)
      toast({
        title: "Error adding expense",
        description: error.message || "Failed to add expense. Please try again.",
        variant: "destructive",
      })
    }
  }

  const exportExpenses = () => {
    const csvContent = [
      ["Date", "Name", "Type", "Amount", "Notes"],
      ...expenses.map((expense) => [
        expense.date,
        expense.expense_name,
        expense.expense_type,
        expense.amount.toString(),
        expense.notes || "",
      ]),
    ]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = createObjectURL(blob)
    if (url) {
      createDownloadLink(url, `expenses-${new Date().toISOString().split("T")[0]}.csv`)
      revokeObjectURL(url)
    }

    toast({
      title: "Export Complete",
      description: "Expenses exported to CSV file",
    })
  }

  const handleEdit = (expense: any) => {
    setEditingExpense(expense)
    setFormData({
      expense_name: expense.description || "",
      expense_type: expense.expense_type || "",
      amount: expense.amount?.toString() || "",
      date: expense.date || new Date().toISOString().split("T")[0],
      notes: expense.notes || "",
    })
    setIsEditModalOpen(true)
  }

  const handleDelete = async (expense: any) => {
    if (!hasPermission("expenses", "delete")) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to delete expenses",
        variant: "destructive",
      })
      return
    }

    if (!confirm(`Are you sure you want to delete "${expense.description}"?`)) {
      return
    }

    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication required",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete expense")
      }

      toast({
        title: "Expense deleted",
        description: `${expense.description} has been deleted successfully.`,
      })

      fetchExpenses()
    } catch (error: any) {
      console.error("Error deleting expense:", error)
      toast({
        title: "Error deleting expense",
        description: error.message || "Failed to delete expense. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.expense_name || !formData.expense_type || !formData.amount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication required for updating expenses.",
          variant: "destructive",
        })
        return
      }

      const expenseData = {
        expense_type: formData.expense_type,
        amount: parseFloat(formData.amount) || 0,
        date: formData.date,
        description: formData.expense_name,
        vendor: null,
        receipt_url: null,
        notes: formData.notes || null,
      }

      const response = await fetch(`/api/expenses/${editingExpense.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(expenseData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update expense")
      }

      toast({
        title: "Expense updated",
        description: `${expenseData.description} has been updated successfully.`,
      })

      setEditingExpense(null)
      setIsEditModalOpen(false)
      fetchExpenses()
    } catch (error: any) {
      console.error("Error updating expense:", error)
      toast({
        title: "Error updating expense",
        description: error.message || "Failed to update expense. Please try again.",
        variant: "destructive",
      })
    }
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount as number || 0), 0)
  const thisMonthExpenses = expenses
    .filter((expense) => {
      const expenseDate = new Date(expense.date)
      const now = new Date()
      return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, expense) => sum + (expense.amount as number || 0), 0)

  const expensesByType = expenses.reduce(
    (acc, expense) => {
      acc[expense.expense_type] = (acc[expense.expense_type] || 0) + (expense.amount as number || 0)
      return acc
    },
    {} as Record<string, number>,
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">Track and manage business expenses</p>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="h-24 bg-muted rounded-lg" />
            <div className="h-24 bg-muted rounded-lg" />
            <div className="h-24 bg-muted rounded-lg" />
          </div>
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">Track and manage business expenses</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportExpenses}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
                <DialogDescription>Record a new business expense</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="expense-name">Expense Name</Label>
                    <Input
                      id="expense-name"
                      value={formData.expense_name}
                      onChange={(e) => setFormData({ ...formData, expense_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expense-type">Type</Label>
                    <Select
                      value={formData.expense_type}
                      onValueChange={(value) => setFormData({ ...formData, expense_type: value })}
                      name="expense_type"
                    >
                      <SelectTrigger id="expense_type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Filament Purchase">Filament Purchase</SelectItem>
                        <SelectItem value="Software">Software</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Labor">Labor</SelectItem>
                        <SelectItem value="Electricity">Electricity</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Expense</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          
          {/* Edit Expense Modal */}
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Expense</DialogTitle>
                <DialogDescription>Update the expense details</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-expense-name">Expense Name</Label>
                    <Input
                      id="edit-expense-name"
                      value={formData.expense_name}
                      onChange={(e) => setFormData({ ...formData, expense_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-expense-type">Type</Label>
                    <Select
                      value={formData.expense_type}
                      onValueChange={(value) => setFormData({ ...formData, expense_type: value })}
                      name="edit_expense_type"
                    >
                      <SelectTrigger id="edit_expense_type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Filament Purchase">Filament Purchase</SelectItem>
                        <SelectItem value="Software">Software</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Labor">Labor</SelectItem>
                        <SelectItem value="Electricity">Electricity</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-amount">Amount</Label>
                    <Input
                      id="edit-amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-date">Date</Label>
                    <Input
                      id="edit-date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Update Expense</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(thisMonthExpenses)}</div>
            <p className="text-xs text-muted-foreground">Current month expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expenses.length}</div>
            <p className="text-xs text-muted-foreground">Expense entries</p>
          </CardContent>
        </Card>
      </div>

      {/* Expenses by Type */}
      {Object.keys(expensesByType).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
            <CardDescription>Breakdown of expenses by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(expensesByType).map(([type, amount]) => (
                <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">{type}</span>
                  <Badge variant="outline">{formatCurrency(amount as number)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
          <CardDescription>All recorded business expenses</CardDescription>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No expenses recorded yet</p>
              <p className="text-sm text-muted-foreground">Add your first expense to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Notes</TableHead>
                  {hasPermission("expenses", "edit") || hasPermission("expenses", "delete") ? (
                    <TableHead className="text-right">Actions</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{expense.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{expense.expense_type}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{formatCurrency(expense.amount as number || 0)}</TableCell>
                    <TableCell className="max-w-xs truncate">{expense.notes}</TableCell>
                    {(hasPermission("expenses", "edit") || hasPermission("expenses", "delete")) && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {hasPermission("expenses", "edit") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(expense)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                          )}
                          {hasPermission("expenses", "delete") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(expense)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
