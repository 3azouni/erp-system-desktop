// =====================================================
// Deployment Mode Configuration
// =====================================================

export type AppEnvironment = 'local' | 'preview' | 'production'

/**
 * Deployment configuration based on NEXT_PUBLIC_APP_ENV
 * Provides safety controls for different environments
 */
export const deploymentConfig = {
  /**
   * Current environment from NEXT_PUBLIC_APP_ENV
   */
  get environment(): AppEnvironment {
    const env = process.env.NEXT_PUBLIC_APP_ENV as AppEnvironment
    return env || 'local'
  },

  /**
   * Check if current environment is production
   */
  get isProduction(): boolean {
    return this.environment === 'production'
  },

  /**
   * Check if current environment is preview (staging/development)
   */
  get isPreview(): boolean {
    return this.environment === 'preview'
  },

  /**
   * Check if current environment is local development
   */
  get isLocal(): boolean {
    return this.environment === 'local'
  },

  /**
   * Safety controls for different environments
   */
  safety: {
    /**
     * Allow destructive operations (delete, drop, etc.)
     * Blocked in preview, allowed in production/local
     */
    get allowDestructiveOperations(): boolean {
      const config = deploymentConfig
      return config.isProduction || config.isLocal
    },

    /**
     * Allow service role operations from UI
     * Blocked in preview, allowed in production/local
     */
    get allowServiceRoleFromUI(): boolean {
      const config = deploymentConfig
      return config.isProduction || config.isLocal
    },

    /**
     * Allow database schema changes
     * Blocked in preview, allowed in production/local
     */
    get allowSchemaChanges(): boolean {
      const config = deploymentConfig
      return config.isProduction || config.isLocal
    },

    /**
     * Allow admin user creation/modification
     * Blocked in preview, allowed in production/local
     */
    get allowAdminUserChanges(): boolean {
      const config = deploymentConfig
      return config.isProduction || config.isLocal
    },

    /**
     * Allow app settings modifications
     * Blocked in preview, allowed in production/local
     */
    get allowAppSettingsChanges(): boolean {
      const config = deploymentConfig
      return config.isProduction || config.isLocal
    },

    /**
     * Show debug information
     * Only in local development
     */
    get showDebugInfo(): boolean {
      return deploymentConfig.isLocal
    },

    /**
     * Enable detailed error logging
     * Only in local/preview, not in production
     */
    get enableDetailedLogging(): boolean {
      const config = deploymentConfig
      return config.isLocal || config.isPreview
    }
  },

  /**
   * Environment-specific warnings and messages
   */
  messages: {
    /**
     * Get warning message for blocked operations
     */
    getDestructiveOperationWarning(): string {
      const config = deploymentConfig
      if (config.isPreview) {
        return '⚠️ Destructive operations are disabled in preview environment for safety.'
      }
      return ''
    },

    /**
     * Get warning message for service role operations
     */
    getServiceRoleWarning(): string {
      const config = deploymentConfig
      if (config.isPreview) {
        return '⚠️ Service role operations are disabled in preview environment for safety.'
      }
      return ''
    },

    /**
     * Get environment indicator message
     */
    getEnvironmentIndicator(): string {
      const config = deploymentConfig
      switch (config.environment) {
        case 'production':
          return '🚀 Production Environment'
        case 'preview':
          return '🔍 Preview Environment (Safe Mode)'
        case 'local':
          return '🛠️ Local Development'
        default:
          return '❓ Unknown Environment'
      }
    }
  }
}

/**
 * Helper function to check if an operation is allowed
 * @param operationType - Type of operation to check
 * @returns boolean indicating if operation is allowed
 */
export function isOperationAllowed(operationType: 'destructive' | 'serviceRole' | 'schema' | 'admin' | 'settings'): boolean {
  switch (operationType) {
    case 'destructive':
      return deploymentConfig.safety.allowDestructiveOperations
    case 'serviceRole':
      return deploymentConfig.safety.allowServiceRoleFromUI
    case 'schema':
      return deploymentConfig.safety.allowSchemaChanges
    case 'admin':
      return deploymentConfig.safety.allowAdminUserChanges
    case 'settings':
      return deploymentConfig.safety.allowAppSettingsChanges
    default:
      return false
  }
}

/**
 * Helper function to get appropriate warning message
 * @param operationType - Type of operation that was blocked
 * @returns warning message string
 */
export function getOperationWarning(operationType: 'destructive' | 'serviceRole' | 'schema' | 'admin' | 'settings'): string {
  switch (operationType) {
    case 'destructive':
      return deploymentConfig.messages.getDestructiveOperationWarning()
    case 'serviceRole':
      return deploymentConfig.messages.getServiceRoleWarning()
    case 'schema':
      return '⚠️ Schema changes are disabled in preview environment for safety.'
    case 'admin':
      return '⚠️ Admin user changes are disabled in preview environment for safety.'
    case 'settings':
      return '⚠️ App settings changes are disabled in preview environment for safety.'
    default:
      return '⚠️ Operation is not allowed in current environment.'
  }
}

/**
 * Guard function that throws an error if operation is not allowed
 * @param operationType - Type of operation to check
 * @param customMessage - Optional custom error message
 */
export function guardOperation(operationType: 'destructive' | 'serviceRole' | 'schema' | 'admin' | 'settings', customMessage?: string): void {
  if (!isOperationAllowed(operationType)) {
    const message = customMessage || getOperationWarning(operationType)
    throw new Error(`Operation blocked: ${message}`)
  }
}

// Export individual getters for convenience
export const {
  environment,
  isProduction,
  isPreview,
  isLocal,
  safety,
  messages
} = deploymentConfig
