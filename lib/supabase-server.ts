import { createClient } from '@supabase/supabase-js'

// Server-only Supabase client
// Uses SERVICE_ROLE_KEY for admin access (bypasses RLS)
// No browser dependencies - safe for SSR and API routes

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for server client')
}

// Create server client with service role (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    // No localStorage or browser storage
    storage: undefined,
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
})

// Helper function to check if we're in server environment
export const isServer = typeof window === 'undefined'

// Server-safe database operations
export const serverDb = {
  // Users
  async getUsers() {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getUserById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async createUser(userData: any) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert(userData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateUser(id: string, updates: any) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteUser(id: string) {
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  },

  // Products
  async getProducts() {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getProductById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async createProduct(productData: any) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert(productData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateProduct(id: string, updates: any) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteProduct(id: string) {
    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  },

  // Inventory
  async getInventory() {
    const { data, error } = await supabaseAdmin
      .from('inventory')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getInventoryById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('inventory')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async createInventoryItem(itemData: any) {
    const { data, error } = await supabaseAdmin
      .from('inventory')
      .insert(itemData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateInventoryItem(id: string, updates: any) {
    const { data, error } = await supabaseAdmin
      .from('inventory')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteInventoryItem(id: string) {
    const { error } = await supabaseAdmin
      .from('inventory')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  },

  // Orders
  async getOrders() {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getOrderById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async createOrder(orderData: any) {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert(orderData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateOrder(id: string, updates: any) {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteOrder(id: string) {
    const { error } = await supabaseAdmin
      .from('orders')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  },

  // Printers
  async getPrinters() {
    const { data, error } = await supabaseAdmin
      .from('printers')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getPrinterById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('printers')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async createPrinter(printerData: any) {
    const { data, error } = await supabaseAdmin
      .from('printers')
      .insert(printerData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updatePrinter(id: string, updates: any) {
    const { data, error } = await supabaseAdmin
      .from('printers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deletePrinter(id: string) {
    const { error } = await supabaseAdmin
      .from('printers')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  },

  // Expenses
  async getExpenses() {
    const { data, error } = await supabaseAdmin
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getExpenseById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async createExpense(expenseData: any) {
    const { data, error } = await supabaseAdmin
      .from('expenses')
      .insert(expenseData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateExpense(id: string, updates: any) {
    const { data, error } = await supabaseAdmin
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteExpense(id: string) {
    const { error } = await supabaseAdmin
      .from('expenses')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  },

  // Components
  async getComponents() {
    const { data, error } = await supabaseAdmin
      .from('components')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getComponentById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('components')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async createComponent(componentData: any) {
    const { data, error } = await supabaseAdmin
      .from('components')
      .insert(componentData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateComponent(id: string, updates: any) {
    const { data, error } = await supabaseAdmin
      .from('components')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteComponent(id: string) {
    const { error } = await supabaseAdmin
      .from('components')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  },

  // Print Jobs
  async getPrintJobs() {
    const { data, error } = await supabaseAdmin
      .from('print_jobs')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getPrintJobById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('print_jobs')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async createPrintJob(printJobData: any) {
    const { data, error } = await supabaseAdmin
      .from('print_jobs')
      .insert(printJobData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updatePrintJob(id: string, updates: any) {
    const { data, error } = await supabaseAdmin
      .from('print_jobs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deletePrintJob(id: string) {
    const { error } = await supabaseAdmin
      .from('print_jobs')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  },

  // App Settings
  async getAppSettings() {
    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .select('*')
      .single()
    
    if (error) throw error
    return data
  },

  async updateAppSettings(updates: any) {
    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .update(updates)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}
