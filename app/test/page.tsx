"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestPage() {
  const [dbStatus, setDbStatus] = useState<any>(null)
  const [apiStatus, setApiStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkDatabase = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/local-db/status')
      const data = await response.json()
      setDbStatus(data)
    } catch (error) {
      console.error('Database check error:', error)
      setDbStatus({ error: 'Failed to check database' })
    } finally {
      setLoading(false)
    }
  }

  const checkAPIs = async () => {
    setLoading(true)
    try {
      const [orders, products, expenses, printers] = await Promise.all([
        fetch('/api/orders').then(r => r.json()),
        fetch('/api/products').then(r => r.json()),
        fetch('/api/expenses').then(r => r.json()),
        fetch('/api/printers').then(r => r.json())
      ])
      
      setApiStatus({
        orders: orders.orders?.length || 0,
        products: products.products?.length || 0,
        expenses: expenses.expenses?.length || 0,
        printers: printers.printers?.length || 0
      })
    } catch (error) {
      console.error('API check error:', error)
      setApiStatus({ error: 'Failed to check APIs' })
    } finally {
      setLoading(false)
    }
  }

  const addSampleData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/local-db/sample-data', { method: 'POST' })
      const data = await response.json()
      alert(data.message || 'Sample data added')
    } catch (error) {
      console.error('Sample data error:', error)
      alert('Failed to add sample data')
    } finally {
      setLoading(false)
    }
  }

  const runMigration = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/local-db/migrate', { method: 'POST' })
      const data = await response.json()
      alert(data.message || 'Migration completed')
    } catch (error) {
      console.error('Migration error:', error)
      alert('Failed to run migration')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Database and API Test</h1>
      
      <div className="grid gap-4 md:grid-cols-4">
        <Button onClick={checkDatabase} disabled={loading}>
          Check Database
        </Button>
        <Button onClick={checkAPIs} disabled={loading}>
          Check APIs
        </Button>
        <Button onClick={addSampleData} disabled={loading}>
          Add Sample Data
        </Button>
        <Button onClick={runMigration} disabled={loading}>
          Run Migration
        </Button>
      </div>

      {dbStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Database Status</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-gray-100 p-4 rounded">
              {JSON.stringify(dbStatus, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {apiStatus && (
        <Card>
          <CardHeader>
            <CardTitle>API Status</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-gray-100 p-4 rounded">
              {JSON.stringify(apiStatus, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 