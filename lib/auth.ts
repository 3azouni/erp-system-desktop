import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { getDatabase } from "./local-db"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

export interface User {
  id: string
  email: string
  full_name: string
  role: string
  department: string
  phone?: string
  bio?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  created_at: string
  updated_at: string
  is_active?: boolean
}

export interface UserPermission {
  id: string
  user_id: string
  module: string
  can_view: boolean
  can_create: boolean
  can_edit: boolean
  can_delete: boolean
}

export interface TokenPayload {
  userId: string
  email: string
  role: string
  iat?: number
  exp?: number
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(user: User): string {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  }

  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload
    return decoded
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}

export async function createUser(userData: {
  email: string
  password: string
  full_name: string
  role: string
  department: string
}): Promise<User | null> {
  return new Promise(async (resolve, reject) => {
    try {
      const database = getDatabase()
      const hashedPassword = await hashPassword(userData.password)

      database.run(
        `INSERT INTO users (email, password_hash, full_name, role, department, is_active, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [userData.email, hashedPassword, userData.full_name, userData.role, userData.department, 1],
        function(err) {
          if (err) {
            console.error("User creation error:", err)
            resolve(null)
          } else {
            // Get the created user
            database.get(
              'SELECT * FROM users WHERE id = ?',
              [this.lastID],
              (err, user) => {
                if (err) {
                  console.error("Error fetching created user:", err)
                  resolve(null)
                } else {
                  resolve(user as User)
                }
              }
            )
          }
        }
      )
    } catch (error) {
      console.error("User creation error:", error)
      resolve(null)
    }
  })
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  return new Promise((resolve) => {
    try {
      const database = getDatabase()

      database.get(
        'SELECT * FROM users WHERE email = ? AND is_active = 1',
        [email],
        async (err, user: any) => {
          if (err) {
            console.error("Database error:", err)
            resolve(null)
            return
          }

          if (!user) {
            console.error("User not found")
            resolve(null)
            return
          }

          const isValidPassword = await verifyPassword(password, user.password_hash)
          if (!isValidPassword) {
            console.error("Invalid password")
            resolve(null)
            return
          }

          resolve(user as User)
        }
      )
    } catch (error) {
      console.error("Authentication error:", error)
      resolve(null)
    }
  })
}

export async function getUserPermissions(userId: string): Promise<UserPermission[]> {
  // TODO: Implement permissions from local database
  // For now, return empty array - admin users have all permissions
  return []
}

export async function getAllUsers(): Promise<User[]> {
  return new Promise((resolve, reject) => {
    try {
      const database = getDatabase()

      database.all(
        'SELECT id, email, full_name, role, department, is_active, created_at, updated_at FROM users ORDER BY created_at DESC',
        (err, users: any[]) => {
          if (err) {
            console.error("Get all users error:", err)
            resolve([])
          } else {
            resolve(users || [])
          }
        }
      )
    } catch (error) {
      console.error("Get all users error:", error)
      resolve([])
    }
  })
}

export async function updateUser(userId: string, updates: Partial<User> & { password?: string }): Promise<User | null> {
  try {
    const database = getDatabase()
    
    // Build update query dynamically
    const updateFields: string[] = []
    const values: any[] = []
    
    if (updates.full_name !== undefined) {
      updateFields.push('full_name = ?')
      values.push(updates.full_name)
    }
    if (updates.role !== undefined) {
      updateFields.push('role = ?')
      values.push(updates.role)
    }
    if (updates.department !== undefined) {
      updateFields.push('department = ?')
      values.push(updates.department)
    }
    if (updates.is_active !== undefined) {
      updateFields.push('is_active = ?')
      values.push(updates.is_active ? 1 : 0)
    }
    
    // Add password update if provided
    if (updates.password && updates.password.trim() !== '') {
      updateFields.push('password_hash = ?')
      // Hash the password before storing
      const hashedPassword = await hashPassword(updates.password)
      values.push(hashedPassword)
    }
    
    if (updateFields.length === 0) {
      return null
    }
    
    updateFields.push('updated_at = datetime("now")')
    values.push(userId)
    
    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`
    
    return new Promise((resolve, reject) => {
      database.run(query, values, function(err) {
        if (err) {
          console.error("Update user error:", err)
          resolve(null)
        } else {
          // Fetch the updated user
          database.get(
            'SELECT id, email, full_name, role, department, is_active, created_at, updated_at FROM users WHERE id = ?',
            [userId],
            (err, user: any) => {
              if (err) {
                console.error("Get updated user error:", err)
                resolve(null)
              } else {
                resolve(user as User)
              }
            }
          )
        }
      })
    })
  } catch (error) {
    console.error("Update user error:", error)
    return null
  }
}

export async function deleteUser(userId: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      const database = getDatabase()
      
      database.run(
        'DELETE FROM users WHERE id = ?',
        [userId],
        function(err) {
          if (err) {
            console.error("Delete user error:", err)
            resolve(false)
          } else {
            resolve(this.changes > 0)
          }
        }
      )
    } catch (error) {
      console.error("Delete user error:", error)
      resolve(false)
    }
  })
}
