"use client"

import { deploymentConfig, isOperationAllowed } from '@/lib/deployment-config'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Shield, Settings } from 'lucide-react'

export function DeploymentIndicator() {
  const environment = deploymentConfig.environment
  const indicator = deploymentConfig.messages.getEnvironmentIndicator()
  
  // Check various operation permissions
  const canDelete = isOperationAllowed('destructive')
  const canUseServiceRole = isOperationAllowed('serviceRole')
  const canModifySettings = isOperationAllowed('settings')
  const canModifyAdmins = isOperationAllowed('admin')
  
  // Get warning messages
  const destructiveWarning = deploymentConfig.messages.getDestructiveOperationWarning()
  const serviceRoleWarning = deploymentConfig.messages.getServiceRoleWarning()
  
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
      {/* Environment Badge */}
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4" />
        <Badge 
          variant={environment === 'production' ? 'default' : environment === 'preview' ? 'secondary' : 'outline'}
        >
          {indicator}
        </Badge>
      </div>
      
      {/* Safety Status */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2">
          <span>Delete Operations:</span>
          <Badge variant={canDelete ? 'default' : 'destructive'} className="text-xs">
            {canDelete ? 'Allowed' : 'Blocked'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <span>Service Role:</span>
          <Badge variant={canUseServiceRole ? 'default' : 'destructive'} className="text-xs">
            {canUseServiceRole ? 'Allowed' : 'Blocked'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <span>Settings Changes:</span>
          <Badge variant={canModifySettings ? 'default' : 'destructive'} className="text-xs">
            {canModifySettings ? 'Allowed' : 'Blocked'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <span>Admin Changes:</span>
          <Badge variant={canModifyAdmins ? 'default' : 'destructive'} className="text-xs">
            {canModifyAdmins ? 'Allowed' : 'Blocked'}
          </Badge>
        </div>
      </div>
      
      {/* Warnings for Preview Environment */}
      {environment === 'preview' && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Preview Environment - Safe Mode Active</p>
              <p className="text-sm text-muted-foreground">
                Destructive operations are disabled for safety. This includes:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Delete operations</li>
                <li>Service role operations from UI</li>
                <li>Database schema changes</li>
                <li>Admin user modifications</li>
                <li>App settings changes</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Debug Information (Local Only) */}
      {deploymentConfig.safety.showDebugInfo && (
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Debug Info:</strong></p>
          <p>Environment: {environment}</p>
          <p>Allow Destructive: {deploymentConfig.safety.allowDestructiveOperations.toString()}</p>
          <p>Allow Service Role: {deploymentConfig.safety.allowServiceRoleFromUI.toString()}</p>
          <p>Allow Schema Changes: {deploymentConfig.safety.allowSchemaChanges.toString()}</p>
          <p>Allow Admin Changes: {deploymentConfig.safety.allowAdminUserChanges.toString()}</p>
          <p>Allow Settings Changes: {deploymentConfig.safety.allowAppSettingsChanges.toString()}</p>
          <p>Show Debug Info: {deploymentConfig.safety.showDebugInfo.toString()}</p>
          <p>Detailed Logging: {deploymentConfig.safety.enableDetailedLogging.toString()}</p>
        </div>
      )}
    </div>
  )
}

export function SafetyGuard({ 
  operation, 
  children, 
  fallback 
}: { 
  operation: 'destructive' | 'serviceRole' | 'schema' | 'admin' | 'settings'
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const isAllowed = isOperationAllowed(operation)
  
  if (!isAllowed) {
    return fallback || (
      <div className="p-2 text-sm text-muted-foreground border rounded">
        ⚠️ This operation is disabled in the current environment
      </div>
    )
  }
  
  return <>{children}</>
}

export function EnvironmentBadge() {
  const indicator = deploymentConfig.messages.getEnvironmentIndicator()
  
  return (
    <Badge 
      variant={deploymentConfig.isProduction ? 'default' : deploymentConfig.isPreview ? 'secondary' : 'outline'}
      className="text-xs"
    >
      {indicator}
    </Badge>
  )
}
