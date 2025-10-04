"use client"

import { useEffect, useRef } from "react"

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = document.documentElement.scrollHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Grid configuration
    const gridSize = 60
    const dotRadius = 1.5
    const lineWidth = 0.5

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Get scroll position for parallax effect
      const scrollY = window.scrollY * 0.3

      // Draw grid
      ctx.strokeStyle = "rgba(0, 0, 0, 0.03)"
      ctx.lineWidth = lineWidth

      // Vertical lines
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }

      // Horizontal lines with parallax
      for (let y = -scrollY % gridSize; y < canvas.height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Draw dots at intersections with subtle animation
      ctx.fillStyle = "rgba(0, 0, 0, 0.08)"
      for (let x = 0; x < canvas.width; x += gridSize) {
        for (let y = -scrollY % gridSize; y < canvas.height; y += gridSize) {
          // Add subtle pulse based on position
          const distance = Math.sqrt(Math.pow(x - canvas.width / 2, 2) + Math.pow(y - scrollY, 2))
          const pulse = Math.sin(distance * 0.01 + Date.now() * 0.001) * 0.3 + 0.7

          ctx.beginPath()
          ctx.arc(x, y, dotRadius * pulse, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Draw accent lines that follow scroll
      ctx.strokeStyle = "rgba(0, 100, 255, 0.05)"
      ctx.lineWidth = 2

      const accentY = (scrollY * 0.5) % (gridSize * 4)
      ctx.beginPath()
      ctx.moveTo(0, accentY)
      ctx.lineTo(canvas.width, accentY)
      ctx.stroke()
    }

    // Initial draw
    draw()

    // Redraw on scroll
    const handleScroll = () => {
      requestAnimationFrame(draw)
    }

    window.addEventListener("scroll", handleScroll)

    // Animation loop for subtle pulse
    const animate = () => {
      draw()
      requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      window.removeEventListener("scroll", handleScroll)
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
