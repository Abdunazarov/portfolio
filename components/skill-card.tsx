"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"

interface SkillCardProps {
  skill: string
  index: number
}

export function SkillCard({ skill, index }: SkillCardProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
          }
        })
      },
      { threshold: 0.3 },
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current)
      }
    }
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setMousePosition({ x, y })
  }

  const handleMouseLeave = () => {
    setMousePosition({ x: 0.5, y: 0.5 })
  }

  const rotateX = (mousePosition.y - 0.5) * -20
  const rotateY = (mousePosition.x - 0.5) * 20

  return (
    <div
      ref={cardRef}
      className={`group transition-all duration-500`}
      style={{
        transitionDelay: `${index * 50}ms`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`relative overflow-hidden rounded-lg border-2 border-border bg-white p-4 sm:p-6 text-center transition-all duration-300 hover:border-[oklch(0.45_0.25_250)] hover:shadow-2xl hover:shadow-[oklch(0.45_0.25_250)]/20 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
        style={{
          transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`,
          transition: "transform 0.2s ease-out",
        }}
      >
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[oklch(0.45_0.25_250)]/0 via-[oklch(0.55_0.25_280)]/0 to-[oklch(0.45_0.25_250)]/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        <div
          className="absolute inset-0 -z-20 rounded-lg bg-gradient-to-r from-[oklch(0.45_0.25_250)] via-[oklch(0.55_0.25_280)] to-[oklch(0.45_0.25_250)] opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-30"
          style={{
            backgroundSize: "200% 200%",
            animation: "gradient 3s ease infinite",
          }}
        />

        <div className="absolute inset-0 overflow-hidden opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <div className="absolute left-1/4 top-1/4 h-1 w-1 animate-float rounded-full bg-[oklch(0.45_0.25_250)]" />
          <div className="absolute right-1/4 top-1/3 h-1 w-1 animate-float-delayed rounded-full bg-[oklch(0.55_0.25_280)]" />
          <div className="absolute bottom-1/4 left-1/3 h-1 w-1 animate-float-slow rounded-full bg-[oklch(0.45_0.25_250)]" />
        </div>

        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />

        <p className="relative z-10 font-sans text-base sm:text-lg font-semibold transition-all duration-300 group-hover:scale-110 group-hover:text-[oklch(0.45_0.25_250)]">
          {skill}
        </p>
      </div>
    </div>
  )
}
