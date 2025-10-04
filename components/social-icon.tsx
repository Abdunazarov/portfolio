"use client"

import type React from "react"

import { useState } from "react"
import { ExternalLink } from "lucide-react"

interface SocialIconProps {
  icon: React.ReactNode
  label: string
  href: string
  color: string
  index: number
}

export function SocialIcon({ icon, label, href, color, index }: SocialIconProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        animationDelay: `${index * 150}ms`,
      }}
    >
      {/* Animated background glow */}
      <div
        className="absolute inset-0 -z-10 rounded-2xl opacity-0 blur-xl transition-all duration-500 group-hover:opacity-30"
        style={{ backgroundColor: color }}
      />

      {/* Rotating border effect */}
      <div
        className="absolute -inset-1 -z-10 rounded-2xl bg-gradient-to-r opacity-0 transition-opacity duration-500 group-hover:animate-spin-slow group-hover:opacity-100"
        style={{
          backgroundImage: `linear-gradient(45deg, ${color}, transparent, ${color})`,
        }}
      />

      {/* Main card */}
      <div className="relative flex h-32 w-32 sm:h-40 sm:w-40 lg:h-48 lg:w-48 flex-col items-center justify-center gap-3 sm:gap-4 rounded-2xl border-2 border-border bg-white p-6 sm:p-8 shadow-lg transition-all duration-500 group-hover:-translate-y-2 group-hover:border-transparent group-hover:shadow-2xl">
        {/* Floating particles on hover - responsive sizes */}
        {isHovered && (
          <>
            <div
              className="absolute left-2 sm:left-4 top-2 sm:top-4 h-1.5 w-1.5 sm:h-2 sm:w-2 animate-float rounded-full"
              style={{ backgroundColor: color, opacity: 0.6 }}
            />
            <div
              className="absolute right-3 sm:right-6 top-4 sm:top-8 h-1 w-1 sm:h-1.5 sm:w-1.5 animate-float-delayed rounded-full"
              style={{ backgroundColor: color, opacity: 0.6 }}
            />
            <div
              className="absolute bottom-3 sm:bottom-6 left-4 sm:left-8 h-0.5 w-0.5 sm:h-1 sm:w-1 animate-float-slow rounded-full"
              style={{ backgroundColor: color, opacity: 0.6 }}
            />
          </>
        )}

        {/* Icon container with scale animation */}
        <div className="relative transition-all duration-500 group-hover:scale-110 text-xl sm:text-2xl lg:text-3xl" style={{ color }}>
          {icon}

          {/* Pulsing ring effect */}
          <div
            className="absolute inset-0 -z-10 rounded-full opacity-0 transition-all duration-500 group-hover:scale-150 group-hover:opacity-20"
            style={{ backgroundColor: color }}
          />
        </div>

        {/* Label with slide-up animation */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-hidden">
          <span
            className="font-sans text-sm sm:text-base lg:text-lg font-semibold transition-all duration-500 group-hover:translate-x-0 text-center"
            style={{ color: isHovered ? color : "inherit" }}
          >
            {label}
          </span>
          <ExternalLink
            className="h-3 w-3 sm:h-4 sm:w-4 translate-x-2 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100"
            style={{ color }}
          />
        </div>

        {/* Animated corner accents - smaller on mobile */}
        <div
          className="absolute left-0 top-0 h-4 w-4 sm:h-6 sm:w-6 lg:h-8 lg:w-8 border-l-2 border-t-2 opacity-0 transition-all duration-500 group-hover:opacity-100"
          style={{ borderColor: color }}
        />
        <div
          className="absolute bottom-0 right-0 h-4 w-4 sm:h-6 sm:w-6 lg:h-8 lg:w-8 border-b-2 border-r-2 opacity-0 transition-all duration-500 group-hover:opacity-100"
          style={{ borderColor: color }}
        />
      </div>
    </a>
  )
}
