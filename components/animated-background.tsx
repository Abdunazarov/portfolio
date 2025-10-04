"use client"

import { useEffect, useRef } from "react"

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Check if device is mobile or has reduced motion preference
    const isMobile = window.innerWidth < 768
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = document.documentElement.scrollHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Grid configuration - simplified for mobile
    const gridSize = isMobile ? 80 : 60 // Larger grid on mobile for better performance
    const dotRadius = isMobile ? 1 : 1.5
    const lineWidth = isMobile ? 0.3 : 0.5

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Get scroll position for parallax effect - reduced on mobile
      const scrollY = window.scrollY * (isMobile ? 0.1 : 0.3)

      // Draw grid with reduced opacity on mobile
      ctx.strokeStyle = isMobile ? "rgba(0, 0, 0, 0.02)" : "rgba(0, 0, 0, 0.03)"
      ctx.lineWidth = lineWidth

      // Vertical lines - every other line on mobile for performance
      const verticalStep = isMobile ? gridSize * 2 : gridSize
      for (let x = 0; x < canvas.width; x += verticalStep) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }

      // Horizontal lines with parallax - every other line on mobile
      const horizontalStep = isMobile ? gridSize * 2 : gridSize
      for (let y = -scrollY % horizontalStep; y < canvas.height; y += horizontalStep) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Draw dots at intersections with subtle animation - simplified on mobile
      if (!isMobile || !prefersReducedMotion) {
        ctx.fillStyle = isMobile ? "rgba(0, 0, 0, 0.04)" : "rgba(0, 0, 0, 0.08)"
        const dotStep = isMobile ? gridSize * 2 : gridSize
        for (let x = 0; x < canvas.width; x += dotStep) {
          for (let y = -scrollY % dotStep; y < canvas.height; y += dotStep) {
            // Add subtle pulse based on position - reduced on mobile
            if (!prefersReducedMotion) {
              const distance = Math.sqrt(Math.pow(x - canvas.width / 2, 2) + Math.pow(y - scrollY, 2))
              const pulse = Math.sin(distance * 0.01 + Date.now() * 0.001) * (isMobile ? 0.1 : 0.3) + 0.7

              ctx.beginPath()
              ctx.arc(x, y, dotRadius * pulse, 0, Math.PI * 2)
              ctx.fill()
            } else {
              // Static dots if reduced motion is preferred
              ctx.beginPath()
              ctx.arc(x, y, dotRadius, 0, Math.PI * 2)
              ctx.fill()
            }
          }
        }
      }

      // Draw accent lines that follow scroll - skip on mobile with reduced motion
      if (!isMobile || !prefersReducedMotion) {
        ctx.strokeStyle = isMobile ? "rgba(0, 100, 255, 0.02)" : "rgba(0, 100, 255, 0.05)"
        ctx.lineWidth = isMobile ? 1 : 2

        const accentY = (scrollY * 0.5) % (gridSize * 4)
        ctx.beginPath()
        ctx.moveTo(0, accentY)
        ctx.lineTo(canvas.width, accentY)
        ctx.stroke()
      }
    }

    // Initial draw
    draw()

    // Redraw on scroll - throttled for mobile
    let scrollTimeout: NodeJS.Timeout
    const handleScroll = () => {
      if (isMobile) {
        // Throttle scroll updates on mobile for better performance
        clearTimeout(scrollTimeout)
        scrollTimeout = setTimeout(() => {
          requestAnimationFrame(draw)
        }, 16) // ~60fps
      } else {
        requestAnimationFrame(draw)
      }
    }

    window.addEventListener("scroll", handleScroll)

    // Animation loop for subtle pulse - disabled on mobile with reduced motion
    if (!prefersReducedMotion && !isMobile) {
      const animate = () => {
        draw()
        requestAnimationFrame(animate)
      }
      animate()
    }

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      window.removeEventListener("scroll", handleScroll)
      if (scrollTimeout) clearTimeout(scrollTimeout)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed left-0 top-0 z-0"
      style={{ width: "100%", height: "100%" }}
    />
  )
}
