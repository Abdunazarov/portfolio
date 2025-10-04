"use client"

import { useEffect, useRef, useState } from "react"

export function AboutSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

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

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect()
        setMousePosition({
          x: (e.clientX - rect.left - rect.width / 2) / 50,
          y: (e.clientY - rect.top - rect.height / 2) / 50,
        })
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <section ref={sectionRef} className="relative overflow-hidden px-6 py-24">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div
          className="absolute left-[8%] top-[15%] font-mono text-xs text-[oklch(0.45_0.25_250)] animate-float"
          style={{
            transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`,
            transition: "transform 0.3s ease-out",
          }}
        >
          {"const build = () => {}"}
        </div>
        <div
          className="absolute right-[12%] top-[25%] font-mono text-xs text-[oklch(0.45_0.25_250)] animate-float-delayed"
          style={{
            transform: `translate(${mousePosition.x * -0.3}px, ${mousePosition.y * -0.3}px)`,
            transition: "transform 0.3s ease-out",
          }}
        >
          {"function design()"}
        </div>
        <div
          className="absolute left-[15%] bottom-[25%] font-mono text-xs text-[oklch(0.45_0.25_250)] animate-float-slow"
          style={{
            transform: `translate(${mousePosition.x * 0.4}px, ${mousePosition.y * 0.4}px)`,
            transition: "transform 0.3s ease-out",
          }}
        >
          {"=> code()"}
        </div>
        <div
          className="absolute right-[18%] bottom-[35%] font-mono text-xs text-[oklch(0.45_0.25_250)] animate-float"
          style={{
            transform: `translate(${mousePosition.x * -0.6}px, ${mousePosition.y * -0.6}px)`,
            transition: "transform 0.3s ease-out",
          }}
        >
          {"while (true) innovate()"}
        </div>
        <div
          className="absolute left-[25%] top-[40%] font-mono text-xs text-[oklch(0.55_0.25_280)] animate-float-delayed"
          style={{
            transform: `translate(${mousePosition.x * 0.7}px, ${mousePosition.y * 0.7}px)`,
            transition: "transform 0.3s ease-out",
          }}
        >
          {"if (idea) { execute() }"}
        </div>
        <div
          className="absolute right-[8%] bottom-[15%] font-mono text-xs text-[oklch(0.55_0.25_280)] animate-float-slow"
          style={{
            transform: `translate(${mousePosition.x * -0.5}px, ${mousePosition.y * -0.5}px)`,
            transition: "transform 0.3s ease-out",
          }}
        >
          {"return success"}
        </div>
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute left-[5%] top-[15%] h-24 w-24 rounded-lg border border-[oklch(0.45_0.25_250)]/10 animate-float rotate-12"
          style={{
            transform: `translate(${mousePosition.x * 1.5}px, ${mousePosition.y * 1.5}px) rotate(12deg)`,
            transition: "transform 0.3s ease-out",
          }}
        />
        <div
          className="absolute right-[10%] top-[25%] h-20 w-20 rounded-full border border-[oklch(0.55_0.25_280)]/10 animate-float-delayed"
          style={{
            transform: `translate(${mousePosition.x * -1.2}px, ${mousePosition.y * -1.2}px)`,
            transition: "transform 0.3s ease-out",
          }}
        />
        <div
          className="absolute left-[15%] bottom-[20%] h-16 w-16 border border-[oklch(0.45_0.25_250)]/10 animate-float-slow rotate-45"
          style={{
            transform: `translate(${mousePosition.x * 1}px, ${mousePosition.y * 1}px) rotate(45deg)`,
            transition: "transform 0.3s ease-out",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl">
        <h2
          className={`mb-12 text-center font-sans text-5xl font-bold transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          About Me
        </h2>

        {/* Main description */}
        <div className="space-y-6">
          <p
            className={`text-balance text-center text-xl leading-relaxed text-foreground transition-all delay-200 duration-700 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            From{" "}
            <span className="relative inline-block font-semibold text-[oklch(0.45_0.25_250)]">
              AI-powered platforms
              <span className="absolute -bottom-1 left-0 h-[2px] w-full bg-gradient-to-r from-[oklch(0.45_0.25_250)] to-[oklch(0.55_0.25_280)]" />
            </span>{" "}
            to{" "}
            <span className="relative inline-block font-semibold text-[oklch(0.45_0.25_250)]">
              automation tools
              <span className="absolute -bottom-1 left-0 h-[2px] w-full bg-gradient-to-r from-[oklch(0.55_0.25_280)] to-[oklch(0.45_0.25_250)]" />
            </span>
            , I create technology that makes a difference. Every line of code is an opportunity to innovate, optimize,
            and deliver exceptional user experiences.
          </p>
        </div>

        <div
          className={`mt-16 grid grid-cols-3 gap-6 transition-all delay-400 duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          {[
            { number: "20+", label: "Projects Delivered", color: "oklch(0.45_0.25_250)" },
            { number: "100%", label: "Client Satisfaction", color: "oklch(0.55_0.25_280)" },
            { number: "3x", label: "Performance Boost", color: "oklch(0.45_0.25_250)" },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className="group relative overflow-hidden rounded-xl border-2 border-border bg-white p-6 text-center transition-all duration-500 hover:border-[oklch(0.45_0.25_250)] hover:shadow-2xl hover:shadow-[oklch(0.45_0.25_250)]/20 hover:-translate-y-2"
              style={{ transitionDelay: `${400 + index * 100}ms` }}
            >
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[oklch(0.45_0.25_250)]/0 via-[oklch(0.55_0.25_280)]/0 to-[oklch(0.45_0.25_250)]/0 opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:from-[oklch(0.45_0.25_250)]/5 group-hover:via-[oklch(0.55_0.25_280)]/10 group-hover:to-[oklch(0.45_0.25_250)]/5" />

              <div className="absolute right-0 top-0 h-12 w-12 opacity-0 transition-all duration-500 group-hover:opacity-100">
                <div
                  className="absolute right-0 top-0 h-[2px] w-8 origin-right transition-all duration-500 group-hover:w-12"
                  style={{ backgroundColor: stat.color }}
                />
                <div
                  className="absolute right-0 top-0 h-8 w-[2px] origin-top transition-all duration-500 group-hover:h-12"
                  style={{ backgroundColor: stat.color }}
                />
              </div>

              <div
                className="text-4xl font-bold transition-all duration-500 group-hover:scale-110"
                style={{ color: stat.color }}
              >
                {stat.number}
              </div>
              <div className="mt-2 text-sm font-medium text-muted-foreground transition-colors duration-300 group-hover:text-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
