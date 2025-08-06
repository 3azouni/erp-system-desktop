import { getDatabase, initializeDatabase } from "./local-db"

export interface Notification {
  id: number
  user_id: number
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  data?: any
  created_at: string
  updated_at: string
}

export async function createNotification(
  userId: number,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  data?: any
): Promise<Notification | null> {
  try {
    await initializeDatabase()
    const database = getDatabase()
    
    return new Promise((resolve, reject) => {
      database.run(
        `INSERT INTO notifications (user_id, title, message, type, data, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [userId, title, message, type, data ? JSON.stringify(data) : null],
        function(err) {
          if (err) {
            console.error("Error creating notification:", err)
            resolve(null)
          } else {
            // Get the created notification
            database.get(
              'SELECT * FROM notifications WHERE id = ?',
              [this.lastID],
              (err, notification) => {
                if (err) {
                  console.error("Error fetching created notification:", err)
                  resolve(null)
                } else {
                  resolve(notification as Notification)
                }
              }
            )
          }
        }
      )
    })
  } catch (error) {
    console.error("Error creating notification:", error)
    return null
  }
}

export async function getNotifications(userId: number): Promise<Notification[]> {
  try {
    await initializeDatabase()
    const database = getDatabase()
    
    return new Promise((resolve, reject) => {
      database.all(
        'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
        [userId],
        (err, rows: any[]) => {
          if (err) {
            console.error("Error fetching notifications:", err)
            resolve([])
          } else {
            resolve(rows || [])
          }
        }
      )
    })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return []
  }
}

export async function markNotificationAsRead(notificationId: number, userId: number): Promise<boolean> {
  try {
    await initializeDatabase()
    const database = getDatabase()
    
    return new Promise((resolve, reject) => {
      database.run(
        `UPDATE notifications SET read = 1, updated_at = datetime('now') 
         WHERE id = ? AND user_id = ?`,
        [notificationId, userId],
        function(err) {
          if (err) {
            console.error("Error marking notification as read:", err)
            resolve(false)
          } else {
            resolve(this.changes > 0)
          }
        }
      )
    })
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return false
  }
}

// Auto-create notifications for common events
export async function createOrderNotification(userId: number, orderId: string, customerName: string): Promise<void> {
  await createNotification(
    userId,
    "New Order Received",
    `Order ${orderId} from ${customerName} has been created.`,
    'success',
    { orderId, customerName }
  )
}

export async function createProductNotification(userId: number, productName: string, action: 'created' | 'updated' | 'deleted'): Promise<void> {
  await createNotification(
    userId,
    `Product ${action.charAt(0).toUpperCase() + action.slice(1)}`,
    `Product "${productName}" has been ${action}.`,
    action === 'deleted' ? 'warning' : 'success',
    { productName, action }
  )
}

export async function createInventoryNotification(userId: number, materialName: string, status: 'low' | 'out'): Promise<void> {
  await createNotification(
    userId,
    `Inventory Alert`,
    `Material "${materialName}" is ${status === 'low' ? 'running low' : 'out of stock'}.`,
    'warning',
    { materialName, status }
  )
}

export async function createPrinterNotification(userId: number, printerName: string, action: 'maintenance_due' | 'maintenance_overdue' | 'status_changed'): Promise<void> {
  const messages = {
    maintenance_due: `Printer "${printerName}" is due for maintenance.`,
    maintenance_overdue: `Printer "${printerName}" is overdue for maintenance!`,
    status_changed: `Printer "${printerName}" status has been updated.`
  }
  
  await createNotification(
    userId,
    `Printer ${action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
    messages[action],
    action === 'maintenance_overdue' ? 'error' : 'warning',
    { printerName, action }
  )
}

export async function createComponentNotification(userId: number, componentName: string, action: 'created' | 'updated' | 'deleted' | 'low_stock' | 'out_of_stock'): Promise<void> {
  const messages = {
    created: `Component "${componentName}" has been added to inventory.`,
    updated: `Component "${componentName}" has been updated.`,
    deleted: `Component "${componentName}" has been removed from inventory.`,
    low_stock: `Component "${componentName}" is running low on stock.`,
    out_of_stock: `Component "${componentName}" is out of stock!`
  }
  
  const types = {
    created: 'success',
    updated: 'info',
    deleted: 'warning',
    low_stock: 'warning',
    out_of_stock: 'error'
  }
  
  await createNotification(
    userId,
    `Component ${action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
    messages[action],
    types[action] as 'info' | 'success' | 'warning' | 'error',
    { componentName, action }
  )
} 