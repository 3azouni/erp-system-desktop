"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Save, Settings, DollarSign, Palette, Printer, Download } from "lucide-react"
import { useSettings } from "@/contexts/settings-context"
import { useToast } from "@/hooks/use-toast"
import type { PrinterProfile } from "@/lib/local-db"

export function SettingsPage() {
  const { settings, updateSettings, loading } = useSettings()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    electricity_cost_per_kwh: 0.12,
    labor_rate_per_hour: 25.0,
    default_marketing_percentage: 10.0,
    platform_fee_percentage: 3.0,
    misc_buffer_percentage: 5.0,
    currency: "USD",
    app_name: "3DP Commander",
    app_logo_url: "",
    footer_text: "Powered by 3DP Commander - 3D Printing Business Management",
    printer_profiles: [] as PrinterProfile[],
  })

  useEffect(() => {
    if (settings && !loading) {
      setFormData({
        electricity_cost_per_kwh: settings.electricity_cost_per_kwh || 0.12,
        labor_rate_per_hour: settings.labor_rate_per_hour || 25.0,
        default_marketing_percentage: settings.default_marketing_percentage || 10.0,
        platform_fee_percentage: settings.platform_fee_percentage || 3.0,
        misc_buffer_percentage: settings.misc_buffer_percentage || 5.0,
        currency: settings.currency || "USD",
        app_name: settings.app_name || "3DP Commander",
        app_logo_url: settings.app_logo_url || "",
        footer_text: settings.footer_text || "Powered by 3DP Commander - 3D Printing Business Management",
        printer_profiles: settings.printer_profiles || [], // TODO: Replace with local-db logic
      })
    }
  }, [settings, loading])

  const handleSave = async () => {
    try {
      setSaving(true)
      await updateSettings(formData)
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const addPrinterProfile = () => {
    const newProfile: PrinterProfile = {
      id: `printer-${Date.now()}`,
      name: "New Printer",
      power_draw_watts: 200,
      default_print_speed: 50,
    }
    setFormData({
      ...formData,
      printer_profiles: [...formData.printer_profiles, newProfile],
    })
  }

  const removePrinterProfile = (id: string) => {
    setFormData({
      ...formData,
      printer_profiles: formData.printer_profiles.filter((profile) => profile.id !== id),
    })
  }

  const updatePrinterProfile = (id: string, updates: Partial<PrinterProfile>) => {
    setFormData({
      ...formData,
      printer_profiles: formData.printer_profiles.map((profile) =>
        profile.id === id ? { ...profile, ...updates } : profile,
      ),
    })
  }

  const handleExportData = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication required for data export.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tables: ["users", "products", "inventory", "printers", "orders", "expenses", "print_jobs", "app_settings"]
        }),
      })

      if (!response.ok) {
        throw new Error("Export failed")
      }

      const result = await response.json()
      
      // Create and download CSV files
      for (const [tableName, csvContent] of Object.entries(result.data)) {
        if (csvContent) {
          const blob = new Blob([csvContent as string], { type: "text/csv" })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `${tableName}_${new Date().toISOString().split('T')[0]}.csv`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }
      }

      toast({
        title: "Export successful",
        description: "Data has been exported to CSV files.",
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Configure your application preferences</p>
        </div>
        <div className="animate-pulse">
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Configure your application preferences</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportData} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="cost-defaults" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cost-defaults" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Cost Defaults
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            App Branding
          </TabsTrigger>
          <TabsTrigger value="printers" className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Printer Profiles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cost-defaults" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cost Calculation Defaults</CardTitle>
              <CardDescription>
                Set default values used in product cost calculations across the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="electricity-cost">Electricity Cost per kWh</Label>
                  <Input
                    id="electricity-cost"
                    type="number"
                    step="0.01"
                    value={formData.electricity_cost_per_kwh.toString()}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        electricity_cost_per_kwh: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="labor-rate">Labor Rate per Hour</Label>
                  <Input
                    id="labor-rate"
                    type="number"
                    step="0.01"
                    value={formData.labor_rate_per_hour.toString()}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        labor_rate_per_hour: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="marketing-percentage">Default Marketing %</Label>
                  <Input
                    id="marketing-percentage"
                    type="number"
                    step="0.1"
                    value={formData.default_marketing_percentage.toString()}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        default_marketing_percentage: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform-fee">Platform Fee %</Label>
                  <Input
                    id="platform-fee"
                    type="number"
                    step="0.1"
                    value={formData.platform_fee_percentage.toString()}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        platform_fee_percentage: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="misc-buffer">Misc Buffer %</Label>
                  <Input
                    id="misc-buffer"
                    type="number"
                    step="0.1"
                    value={formData.misc_buffer_percentage.toString()}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        misc_buffer_percentage: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        currency: value,
                      })
                    }
                  >
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                      <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Branding</CardTitle>
              <CardDescription>Customize the appearance and branding of your application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="app-name">Application Name</Label>
                  <Input
                    id="app-name"
                    value={formData.app_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        app_name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="app-logo">Logo URL</Label>
                  <Input
                    id="app-logo"
                    value={formData.app_logo_url}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        app_logo_url: e.target.value,
                      })
                    }
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="footer-text">Footer Text</Label>
                <Textarea
                  id="footer-text"
                  value={formData.footer_text}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      footer_text: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4">Preview</h3>
                <div className="border rounded-lg p-4 bg-muted/50">
                  <div className="flex items-center gap-3 mb-4">
                    {formData.app_logo_url ? (
                      <img src={formData.app_logo_url || "/placeholder.svg"} alt="Logo" className="h-8 w-8 rounded" />
                    ) : (
                      <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                        <Settings className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold">{formData.app_name}</h4>
                      <p className="text-xs text-muted-foreground">Business Management</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground border-t pt-2">{formData.footer_text}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="printers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Printer Profiles</CardTitle>
              <CardDescription>
                Configure default printer profiles for cost calculations and job scheduling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Configured Printers</h3>
                <Button onClick={addPrinterProfile} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Printer
                </Button>
              </div>
              <div className="space-y-4">
                {formData.printer_profiles.map((profile) => (
                  <div key={profile.id} className="border rounded-lg p-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Printer Name</Label>
                        <Input
                          id={`printer-name-${profile.id}`}
                          name={`printer-name-${profile.id}`}
                          value={profile.name || ""}
                          onChange={(e) => updatePrinterProfile(profile.id, { name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Power Draw (Watts)</Label>
                        <Input
                          id={`power-draw-${profile.id}`}
                          name={`power-draw-${profile.id}`}
                          type="number"
                          value={profile.power_draw_watts?.toString() || "200"}
                          onChange={(e) =>
                            updatePrinterProfile(profile.id, {
                              power_draw_watts: Number.parseInt(e.target.value) || 200,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Default Speed (mm/s)</Label>
                        <div className="flex gap-2">
                          <Input
                            id={`print-speed-${profile.id}`}
                            name={`print-speed-${profile.id}`}
                            type="number"
                            value={profile.default_print_speed?.toString() || "50"}
                            onChange={(e) =>
                              updatePrinterProfile(profile.id, {
                                default_print_speed: Number.parseInt(e.target.value) || 50,
                              })
                            }
                          />
                          <Button variant="outline" size="icon" onClick={() => removePrinterProfile(profile.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {formData.printer_profiles.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Printer className="mx-auto h-8 w-8 mb-2" />
                    <p>No printer profiles configured</p>
                    <p className="text-sm">Add a printer profile to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
