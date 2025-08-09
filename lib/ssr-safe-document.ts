/**
 * SSR-Safe Document Utilities
 * Prevents crashes during server-side rendering by checking for browser environment
 */

export const isBrowser = typeof window !== 'undefined'

export const createElement = (tagName: string): HTMLElement | null => {
  if (isBrowser) {
    return document.createElement(tagName)
  }
  return null
}

export const createDownloadLink = (url: string, filename: string): void => {
  if (isBrowser) {
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
}

export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (isBrowser && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      return false
    }
  }
  return false
}

export const getElementById = (id: string): HTMLElement | null => {
  if (isBrowser) {
    return document.getElementById(id)
  }
  return null
}

export const addEventListener = (
  element: HTMLElement | null,
  event: string,
  handler: EventListener
): void => {
  if (isBrowser && element) {
    element.addEventListener(event, handler)
  }
}

export const removeEventListener = (
  element: HTMLElement | null,
  event: string,
  handler: EventListener
): void => {
  if (isBrowser && element) {
    element.removeEventListener(event, handler)
  }
}
