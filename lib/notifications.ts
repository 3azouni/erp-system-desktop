import { supabaseAdmin } from "./supabase-server"

export interface Notification {
  id: number
  user_id: number
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
  updated_at: string
}

export async function createNotification(
  userId: number,
  title: string,
  message: string,
  type: string = 'info'
): Promise<Notification | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        is_read: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error creating notification:', error)
    return null
  }
}

export async function getNotifications(userId: number): Promise<Notification[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching notifications:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return []
  }
}

export async function markNotificationAsRead(notificationId: number, userId: number): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true, updated_at: supabaseAdmin.rpc('update_timestamp') })
      .eq('id', notificationId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error marking notification as read:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return false
  }
}

// Auto-create notifications for common events
export async function createOrderNotification(userId: number, orderId: string, customerName: string): Promise<void> {
  await createNotification(
    userId,
    "New Order Received",
    `Order ${orderId} from ${customerName} has been created.`,
    'success'
  )
}

export async function createProductNotification(userId: number, productName: string, action: 'created' | 'updated' | 'deleted'): Promise<void> {
  const type = action === 'deleted' ? 'warning' : 'success'
  await createNotification(
    userId,
    `Product ${action.charAt(0).toUpperCase() + action.slice(1)}`,
    `Product "${productName}" has been ${action}.`,
    type
  )
}

export async function createInventoryNotification(userId: number, materialName: string, status: 'low' | 'out'): Promise<void> {
  const type = status === 'low' ? 'warning' : 'error'
  await createNotification(
    userId,
    `Inventory Alert`,
    `Material "${materialName}" is ${status === 'low' ? 'running low' : 'out of stock'}.`,
    type
  )
}

export async function createPrinterNotification(userId: number, printerName: string, action: 'maintenance_due' | 'maintenance_overdue' | 'status_changed'): Promise<void> {
  const type = action === 'maintenance_overdue' ? 'error' : 'warning'
  await createNotification(
    userId,
    `Printer ${action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
    `Printer "${printerName}" ${action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
    type
  )
}

export async function createComponentNotification(userId: number, componentName: string, action: 'created' | 'updated' | 'deleted' | 'low_stock' | 'out_of_stock'): Promise<void> {
  const type = action === 'deleted' ? 'warning' : action === 'low_stock' ? 'warning' : action === 'out_of_stock' ? 'error' : 'info'
  await createNotification(
    userId,
    `Component ${action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
    `Component "${componentName}" has been ${action}.`,
    type
  )
}

export async function createPrintJobNotification(
  userId: number,
  jobId: string,
  productName: string,
  type: 'started' | 'completed' | 'failed' | 'overdue'
): Promise<Notification | null> {
  const notifications = {
    started: {
      title: 'Print Job Started',
      message: `Print job for ${productName} has started`
    },
    completed: {
      title: 'Print Job Completed',
      message: `Print job for ${productName} has been completed successfully`
    },
    failed: {
      title: 'Print Job Failed',
      message: `Print job for ${productName} has failed`
    },
    overdue: {
      title: 'Print Job Overdue',
      message: `Print job for ${productName} is overdue and may need attention`
    }
  }

  const notification = notifications[type]
  return createNotification(userId, notification.title, notification.message, type)
}

export async function createMaintenanceNotification(
  userId: number,
  printerName: string,
  maintenanceType: string
): Promise<Notification | null> {
  const title = 'Printer Maintenance Required'
  const message = `${printerName} requires ${maintenanceType} maintenance`
  
  return createNotification(userId, title, message, 'maintenance')
}

export async function createLowStockNotification(
  userId: number,
  productName: string,
  currentStock: number,
  minimumThreshold: number
): Promise<Notification | null> {
  const title = 'Low Stock Alert'
  const message = `${productName} is running low on stock (${currentStock}/${minimumThreshold})`
  
  return createNotification(userId, title, message, 'low_stock')
} 