"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { TimelineItem } from "@/components/timeline-item"
import { SkillCard } from "@/components/skill-card"
import { AnimatedBackground } from "@/components/animated-background"
import { HeroParticles } from "@/components/hero-particles"
import { AboutSection } from "@/components/about-section"
import { SocialIcon } from "@/components/social-icon"
import { Send, MessageCircle, Linkedin } from "lucide-react"

export default function PortfolioPage() {
  const [isHeroVisible, setIsHeroVisible] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsHeroVisible(true)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const scrollToWork = () => {
    const workSection = document.getElementById("timeline")
    workSection?.scrollIntoView({ behavior: "smooth" })
  }

  const timelineData = [
    {
      title: "TopTalent Platform",
      role: "Full-Stack Engineer & AI Architect",
      description: "Built an AI-powered recruitment platform. Basically LinkedIn, but with a brain.",
      details: [
        "Architected scalable microservices handling 100k+ daily requests",
        "Implemented ML-powered candidate matching with 85% accuracy",
      ],
      technologies: ["React", "Node.js", "Python", "TensorFlow", "PostgreSQL"],
      year: "2024",
      website: "top-talent.ru",
    },
    {
      title: "Starpets Project",
      role: "Computer Vision Engineer",
      description: "Automated Roblox gameplay with CV/OCR. Yes, bots play better than humans now.",
      details: [
        "Developed real-time object detection system with 95% accuracy",
        "Achieved 24/7 autonomous gameplay with adaptive learning",
      ],
      technologies: ["Python", "OpenCV", "PyTorch", "Tesseract"],
      year: "2023",
      website: "starpets.gg",
    },
    {
      title: "Gabumas Ltd.",
      role: "Backend Engineer",
      description: "Kept APIs alive for 350k users. Reduced downtime, increased dev sanity.",
      details: ["Optimized API response times from 800ms to 120ms", "Achieved 99.9% uptime serving 350k+ active users"],
      technologies: ["Node.js", "Express", "Redis", "MongoDB", "AWS"],
      year: "2022",
      website: "movielab.one",
    },
  ]

  const skills = [
    "React",
    "Next.js",
    "TypeScript",
    "Node.js",
    "Python",
    "AI/ML",
    "Computer Vision",
    "API Design",
    "Cloud Architecture",
  ]

  const socialLinks = [
    {
      icon: <Send className="h-12 w-12" />,
      label: "Telegram",
      href: "https://t.me/D_Abdunazarov",
      color: "#0088cc",
    },
    {
      icon: <MessageCircle className="h-12 w-12" />,
      label: "WhatsApp",
      href: "https://wa.me/+601153770330",
      color: "#25D366",
    },
    {
      icon: <Linkedin className="h-12 w-12" />,
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/dior-abdunazarov-a06aa7209/",
      color: "#0077b5",
    },
  ]

  return (
    <div className="relative min-h-screen bg-white text-foreground">
      <AnimatedBackground />

      {/* All content needs relative positioning to appear above background */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section
          ref={heroRef}
          className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6"
        >
          {/* Animated particles background */}
          <div className="absolute inset-0 opacity-40">
            <HeroParticles />
          </div>

          {/* Gradient orbs that follow mouse */}
          <div
            className="pointer-events-none absolute h-96 w-96 rounded-full bg-[oklch(0.45_0.25_250)] opacity-20 blur-3xl transition-all duration-1000"
            style={{
              transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
              left: "20%",
              top: "30%",
            }}
          />
          <div
            className="pointer-events-none absolute h-96 w-96 rounded-full bg-[oklch(0.55_0.25_280)] opacity-20 blur-3xl transition-all duration-1000"
            style={{
              transform: `translate(${mousePosition.x * -0.02}px, ${mousePosition.y * -0.02}px)`,
              right: "20%",
              bottom: "30%",
            }}
          />

          {/* Floating geometric shapes */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute left-[10%] top-[20%] h-20 w-20 animate-float border-2 border-[oklch(0.45_0.25_250)] opacity-20" />
            <div className="absolute right-[15%] top-[40%] h-16 w-16 animate-float-delayed rounded-full border-2 border-[oklch(0.45_0.25_250)] opacity-20" />
            <div className="absolute bottom-[30%] left-[20%] h-12 w-12 animate-float-slow rotate-45 border-2 border-[oklch(0.45_0.25_250)] opacity-20" />
          </div>

          <div className="relative z-10 max-w-4xl text-center">
            <div className="mb-6 overflow-hidden">
              <h1
                className={`font-sans text-6xl font-bold leading-tight tracking-tight transition-all duration-1000 md:text-8xl ${
                  isHeroVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                }`}
              >
                <span className="inline-block bg-gradient-to-r from-foreground via-[oklch(0.45_0.25_250)] to-foreground bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                  Dior Abdunazarov
                </span>
              </h1>
            </div>
            <p
              className={`mb-12 text-balance text-xl text-muted-foreground transition-all delay-300 duration-1000 md:text-2xl ${
                isHeroVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}
            >
              Building digital experiences that matter
            </p>
            <Button
              onClick={scrollToWork}
              size="lg"
              className={`group relative overflow-hidden bg-[oklch(0.45_0.25_250)] text-white shadow-lg shadow-[oklch(0.45_0.25_250)]/20 transition-all delay-500 duration-1000 hover:bg-[oklch(0.40_0.25_250)] hover:shadow-xl hover:shadow-[oklch(0.45_0.25_250)]/30 ${
                isHeroVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}
            >
              <span className="relative z-10">Explore My Work</span>
              <span className="absolute inset-0 -translate-x-full bg-[oklch(0.35_0.25_250)] transition-transform duration-300 group-hover:translate-x-0" />
            </Button>
          </div>

          {/* Scroll indicator */}
          <div
            className={`absolute bottom-12 transition-all delay-700 duration-1000 ${
              isHeroVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm text-muted-foreground">Scroll to explore</span>
              <div className="h-8 w-5 rounded-full border-2 border-muted-foreground/30">
                <div className="mx-auto mt-2 h-2 w-1 animate-bounce rounded-full bg-[oklch(0.45_0.25_250)]" />
              </div>
            </div>
          </div>
        </section>

        {/* Timeline Section */}
        <section id="timeline" className="px-6 py-24">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-16 text-center font-sans text-5xl font-bold">Experience</h2>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-border" />

              {timelineData.map((item, index) => (
                <TimelineItem key={index} {...item} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* Skills Section */}
        <section className="bg-secondary/30 px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-16 text-center font-sans text-5xl font-bold">Skills</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {skills.map((skill, index) => (
                <SkillCard key={index} skill={skill} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <AboutSection />

        {/* Contact Section */}
        <section className="px-6 py-24">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-6 text-center font-sans text-5xl font-bold">Get In Touch</h2>
            <p className="mb-16 text-center text-xl text-muted-foreground">
              Let's connect and build something amazing together
            </p>

            <div className="flex flex-wrap items-center justify-center gap-8">
              {socialLinks.map((social, index) => (
                <SocialIcon key={index} {...social} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border px-6 py-12 text-center text-muted-foreground">
          <p>© 2025 Dior Abdunazarov</p>
        </footer>
      </div>
    </div>
  )
}
