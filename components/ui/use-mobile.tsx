import * as React from "react"
import { getMatchMedia, isBrowser } from "@/lib/ssr-safe-window"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    if (!isBrowser) return

    const mql = getMatchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    if (!mql) return

    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
