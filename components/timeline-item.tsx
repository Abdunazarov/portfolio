"use client"

import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"

interface TimelineItemProps {
  title: string
  role: string
  description: string
  details: string[]
  technologies: string[]
  year: string
  website: string
  index: number
}

export function TimelineItem({
  title,
  role,
  description,
  details,
  technologies,
  year,
  website,
  index,
}: TimelineItemProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const itemRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
          }
        })
      },
      { threshold: 0.2 },
    )

    if (itemRef.current) {
      observer.observe(itemRef.current)
    }

    return () => {
      if (itemRef.current) {
        observer.unobserve(itemRef.current)
      }
    }
  }, [])

  const isEven = index % 2 === 0

  return (
    <div ref={itemRef} className={`relative mb-24 flex items-start ${isEven ? "flex-row" : "flex-row-reverse"}`}>
      {/* Content */}
      <div
        className={`w-5/12 transition-all duration-700 delay-100 ${
          isVisible ? "translate-x-0 opacity-100" : isEven ? "-translate-x-12 opacity-0" : "translate-x-12 opacity-0"
        }`}
      >
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="group relative overflow-hidden rounded-xl border-2 border-border bg-white p-8 shadow-sm transition-all duration-500 hover:border-[oklch(0.45_0.25_250)] hover:shadow-2xl hover:-translate-y-2"
        >
          <div
            className={`absolute inset-0 bg-gradient-to-br from-[oklch(0.45_0.25_250)]/5 via-transparent to-[oklch(0.45_0.25_250)]/5 opacity-0 transition-opacity duration-500 ${
              isHovered ? "opacity-100" : ""
            }`}
          />

          <div
            className={`absolute -right-12 -top-12 h-24 w-24 rounded-full bg-[oklch(0.45_0.25_250)]/10 transition-all duration-700 ${
              isHovered ? "scale-150" : "scale-0"
            }`}
          />

          <div className="relative z-10">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="mb-1 font-sans text-2xl font-bold leading-tight transition-colors duration-300 group-hover:text-[oklch(0.45_0.25_250)]">
                  {title}
                </h3>
                <p className="text-sm font-semibold text-muted-foreground">{role}</p>
              </div>
              <Badge className="shrink-0 bg-[oklch(0.45_0.25_250)] text-white transition-transform duration-300 group-hover:scale-110">
                {year}
              </Badge>
            </div>

            <a
              href={`https://${website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-4 inline-flex items-center gap-1.5 text-sm text-[oklch(0.45_0.25_250)] transition-all duration-300 hover:gap-2 hover:underline"
            >
              <span>{website}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            <p className="mb-6 text-pretty leading-relaxed text-muted-foreground">{description}</p>

            <ul className="mb-6 space-y-3">
              {details.map((detail, idx) => (
                <li
                  key={idx}
                  className={`flex items-start gap-3 text-sm text-muted-foreground transition-all duration-500 delay-${(idx + 1) * 100} ${
                    isVisible ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"
                  }`}
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[oklch(0.45_0.25_250)] transition-transform duration-300 group-hover:scale-150" />
                  <span className="flex-1 leading-relaxed">{detail}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-2">
              {technologies.map((tech, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="border-border text-xs transition-all duration-300 hover:scale-105 hover:border-[oklch(0.45_0.25_250)] hover:bg-[oklch(0.45_0.25_250)] hover:text-white hover:shadow-lg"
                  style={{
                    transitionDelay: `${idx * 50}ms`,
                  }}
                >
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Center dot with enhanced animation */}
      <div className="absolute left-1/2 z-10 flex h-8 w-8 -translate-x-1/2 items-center justify-center">
        <div
          className={`h-5 w-5 rounded-full border-4 border-white bg-[oklch(0.45_0.25_250)] shadow-lg transition-all duration-700 ${
            isVisible ? "scale-100 opacity-100" : "scale-0 opacity-0"
          }`}
        >
          <div className="absolute inset-0 -z-10 animate-ping rounded-full bg-[oklch(0.45_0.25_250)] opacity-20" />
        </div>
      </div>

      {/* Spacer */}
      <div className="w-5/12" />
    </div>
  )
}
