/**
 * SSR-Safe Storage Utilities
 * Prevents crashes during server-side rendering by checking for browser environment
 */

export const isBrowser = typeof window !== 'undefined'

export const getLocalStorage = (key: string): string | null => {
  if (isBrowser) {
    return window.localStorage.getItem(key)
  }
  return null
}

export const setLocalStorage = (key: string, value: string): void => {
  if (isBrowser) {
    window.localStorage.setItem(key, value)
  }
}

export const removeLocalStorage = (key: string): void => {
  if (isBrowser) {
    window.localStorage.removeItem(key)
  }
}

export const clearLocalStorage = (): void => {
  if (isBrowser) {
    window.localStorage.clear()
  }
}

// Common auth token key
export const AUTH_TOKEN_KEY = 'auth_token'

// Convenience functions for auth token
export const getAuthToken = (): string | null => {
  return getLocalStorage(AUTH_TOKEN_KEY)
}

export const setAuthToken = (token: string): void => {
  setLocalStorage(AUTH_TOKEN_KEY, token)
}

export const removeAuthToken = (): void => {
  removeLocalStorage(AUTH_TOKEN_KEY)
}
