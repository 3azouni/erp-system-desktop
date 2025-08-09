/**
 * SSR-Safe Window Utilities
 * Prevents crashes during server-side rendering by checking for browser environment
 */

export const isBrowser = typeof window !== 'undefined'

export const getWindowSize = () => {
  if (isBrowser) {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    }
  }
  return { width: 0, height: 0 }
}

export const createObjectURL = (blob: Blob): string | null => {
  if (isBrowser) {
    return window.URL.createObjectURL(blob)
  }
  return null
}

export const revokeObjectURL = (url: string): void => {
  if (isBrowser) {
    window.URL.revokeObjectURL(url)
  }
}

export const getMatchMedia = (query: string): MediaQueryList | null => {
  if (isBrowser) {
    return window.matchMedia(query)
  }
  return null
}

export const scrollToTop = (): void => {
  if (isBrowser) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

export const openNewTab = (url: string): void => {
  if (isBrowser) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}
