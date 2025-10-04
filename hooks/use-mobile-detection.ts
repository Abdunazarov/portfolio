"use client"

import { useState, useEffect } from "react"

export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    const checkReducedMotion = () => {
      setPrefersReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    }

    // Initial checks
    checkMobile()
    checkReducedMotion()

    // Listen for changes
    window.addEventListener("resize", checkMobile)
    
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    mediaQuery.addEventListener("change", checkReducedMotion)

    return () => {
      window.removeEventListener("resize", checkMobile)
      mediaQuery.removeEventListener("change", checkReducedMotion)
    }
  }, [])

  return { isMobile, prefersReducedMotion }
}