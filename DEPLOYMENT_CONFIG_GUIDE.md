# 🔧 Deployment Configuration Guide

## 📋 **Overview**

The deployment configuration system provides environment-specific safety controls based on `NEXT_PUBLIC_APP_ENV`. This prevents accidental destructive operations in preview/staging environments while allowing full functionality in production and local development.

## 🌍 **Environment Types**

| Environment | Value | Description | Safety Level |
|-------------|-------|-------------|--------------|
| **Local** | `local` | Development environment | Full access |
| **Preview** | `preview` | Staging/Preview environment | **Safe Mode** |
| **Production** | `production` | Live production environment | Full access |

## 🚀 **Quick Start**

### **1. Import the Configuration**

```typescript
import { 
  deploymentConfig, 
  isOperationAllowed, 
  guardOperation,
  isProduction,
  isPreview,
  isLocal 
} from '@/lib/deployment-config'
```

### **2. Check Current Environment**

```typescript
// Get current environment
console.log(deploymentConfig.environment) // 'local' | 'preview' | 'production'

// Check specific environment
if (isProduction) {
  console.log('Running in production mode')
}

if (isPreview) {
  console.log('Running in preview mode (safe)')
}

if (isLocal) {
  console.log('Running in local development')
}
```

## 🛡️ **Safety Controls**

### **Available Safety Checks**

| Operation Type | Description | Blocked In |
|----------------|-------------|------------|
| `destructive` | Delete operations, data drops | Preview |
| `serviceRole` | Service role operations from UI | Preview |
| `schema` | Database schema changes | Preview |
| `admin` | Admin user modifications | Preview |
| `settings` | App settings changes | Preview |

### **Using Safety Checks**

#### **Method 1: Boolean Check**
```typescript
import { isOperationAllowed } from '@/lib/deployment-config'

// Check if destructive operations are allowed
if (isOperationAllowed('destructive')) {
  // Proceed with delete operation
  await deleteUser(userId)
} else {
  // Show warning or disable UI
  showWarning('Delete operations disabled in preview environment')
}
```

#### **Method 2: Guard Function**
```typescript
import { guardOperation } from '@/lib/deployment-config'

try {
  // This will throw an error if operation is not allowed
  guardOperation('destructive')
  
  // Proceed with operation
  await deleteUser(userId)
} catch (error) {
  // Handle blocked operation
  console.error(error.message)
  showError('Operation blocked for safety')
}
```

#### **Method 3: Direct Safety Properties**
```typescript
import { deploymentConfig } from '@/lib/deployment-config'

// Check specific safety controls
if (deploymentConfig.safety.allowDestructiveOperations) {
  // Enable delete buttons
  setDeleteEnabled(true)
}

if (deploymentConfig.safety.allowServiceRoleFromUI) {
  // Allow admin operations
  setAdminFeaturesEnabled(true)
}
```

## 📝 **Usage Examples**

### **1. Delete Operations**

```typescript
// In a delete handler
async function handleDeleteUser(userId: string) {
  try {
    guardOperation('destructive')
    
    await deleteUser(userId)
    showSuccess('User deleted successfully')
  } catch (error) {
    showError(error.message)
  }
}
```

### **2. Admin User Management**

```typescript
// In admin user creation
async function handleCreateAdmin(userData: any) {
  try {
    guardOperation('admin')
    
    await createAdminUser(userData)
    showSuccess('Admin user created')
  } catch (error) {
    showError(error.message)
  }
}
```

### **3. App Settings Changes**

```typescript
// In settings form
async function handleUpdateSettings(settings: any) {
  try {
    guardOperation('settings')
    
    await updateAppSettings(settings)
    showSuccess('Settings updated')
  } catch (error) {
    showError(error.message)
  }
}
```

### **4. UI Component Guards**

```typescript
// In React component
import { isOperationAllowed } from '@/lib/deployment-config'

function UserManagementPage() {
  const canDeleteUsers = isOperationAllowed('destructive')
  const canCreateAdmins = isOperationAllowed('admin')
  
  return (
    <div>
      <h1>User Management</h1>
      
      {/* Only show delete button if allowed */}
      {canDeleteUsers && (
        <button onClick={handleDeleteUser}>
          Delete User
        </button>
      )}
      
      {/* Only show admin creation if allowed */}
      {canCreateAdmins && (
        <button onClick={handleCreateAdmin}>
          Create Admin
        </button>
      )}
      
      {/* Show warning if operations are disabled */}
      {!canDeleteUsers && (
        <div className="warning">
          ⚠️ Delete operations disabled in preview environment
        </div>
      )}
    </div>
  )
}
```

### **5. API Route Guards**

```typescript
// In API route
import { guardOperation } from '@/lib/deployment-config'

export async function DELETE(request: Request) {
  try {
    guardOperation('destructive')
    
    // Proceed with delete logic
    const { id } = await request.json()
    await deleteUser(id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error.message }, 
      { status: 403 }
    )
  }
}
```

## 🔍 **Environment Indicators**

### **Display Current Environment**

```typescript
import { deploymentConfig } from '@/lib/deployment-config'

function EnvironmentIndicator() {
  const indicator = deploymentConfig.messages.getEnvironmentIndicator()
  
  return (
    <div className="env-indicator">
      {indicator}
    </div>
  )
}
```

### **Debug Information (Local Only)**

```typescript
import { deploymentConfig } from '@/lib/deployment-config'

function DebugPanel() {
  if (!deploymentConfig.safety.showDebugInfo) {
    return null
  }
  
  return (
    <div className="debug-panel">
      <h3>Debug Information</h3>
      <p>Environment: {deploymentConfig.environment}</p>
      <p>Allow Destructive: {deploymentConfig.safety.allowDestructiveOperations.toString()}</p>
      <p>Allow Service Role: {deploymentConfig.safety.allowServiceRoleFromUI.toString()}</p>
    </div>
  )
}
```

## ⚙️ **Configuration**

### **Environment Variables**

Set `NEXT_PUBLIC_APP_ENV` in your environment:

```bash
# .env.local
NEXT_PUBLIC_APP_ENV=local

# Vercel Preview
NEXT_PUBLIC_APP_ENV=preview

# Vercel Production
NEXT_PUBLIC_APP_ENV=production
```

### **Vercel Configuration**

In your Vercel project settings:

1. **Production Environment**:
   - Variable: `NEXT_PUBLIC_APP_ENV`
   - Value: `production`

2. **Preview Environment**:
   - Variable: `NEXT_PUBLIC_APP_ENV`
   - Value: `preview`

## 🚨 **Error Handling**

### **Custom Error Messages**

```typescript
import { guardOperation } from '@/lib/deployment-config'

try {
  guardOperation('destructive', 'Custom error message for this specific operation')
} catch (error) {
  console.error(error.message)
}
```

### **Graceful Degradation**

```typescript
import { isOperationAllowed } from '@/lib/deployment-config'

function handleOperation() {
  if (!isOperationAllowed('destructive')) {
    // Show alternative action or disable feature
    showAlternativeAction()
    return
  }
  
  // Proceed with operation
  performDestructiveOperation()
}
```

## 📊 **Safety Matrix**

| Environment | Destructive | Service Role | Schema | Admin | Settings | Debug |
|-------------|-------------|--------------|--------|-------|----------|-------|
| **Local** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Preview** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Production** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

## 🔧 **Best Practices**

1. **Always check before destructive operations**
2. **Use guard functions in API routes**
3. **Disable UI elements when operations are blocked**
4. **Show clear warnings to users**
5. **Test in all environments before deployment**
6. **Use environment indicators for clarity**

## 🎯 **Migration Checklist**

- [ ] Import deployment configuration in components
- [ ] Add safety checks to delete operations
- [ ] Add safety checks to admin operations
- [ ] Add safety checks to settings operations
- [ ] Update UI to show/hide features based on environment
- [ ] Test in preview environment
- [ ] Test in production environment
- [ ] Add environment indicators to UI

The deployment configuration system ensures your application is safe to deploy to preview environments while maintaining full functionality in production.
