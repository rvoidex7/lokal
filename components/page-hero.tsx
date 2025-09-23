"use client"

import { motion } from "motion/react"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { ReactNode } from "react"

interface PageHeroProps {
  title: string | ReactNode
  subtitle?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
  className?: string
  accentColor?: string
  showPattern?: boolean
  cta?: {
    label: string
    href: string
    variant?: "primary" | "secondary"
  }
}

export function PageHero({
  title,
  subtitle,
  breadcrumbs,
  className = "",
  accentColor = "#0015ff",
  showPattern = true,
  cta,
}: PageHeroProps) {
  return (
    <section className={`relative overflow-hidden ${className}`}>
      {/* Background with gradient and pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100">
        {showPattern && (
          <>
            {/* Noise texture overlay */}
            <div 
              className="absolute inset-0 opacity-[0.015]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              }}
            />
            
            {/* Animated gradient orbs */}
            <motion.div
              className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20"
              style={{
                background: `radial-gradient(circle, ${accentColor}40 0%, transparent 70%)`,
              }}
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <motion.div
              className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-20"
              style={{
                background: `radial-gradient(circle, ${accentColor}30 0%, transparent 70%)`,
              }}
              animate={{
                scale: [1.2, 1, 1.2],
                rotate: [0, -90, 0],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            
            {/* Floating SVG shapes */}
            <motion.img
              src="/1.svg"
              alt=""
              className="absolute top-20 left-1/4 w-20 h-20 opacity-20"
              animate={{
                y: [-20, 20, -20],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.img
              src="/2.svg"
              alt=""
              className="absolute bottom-20 right-1/3 w-16 h-16 opacity-20"
              animate={{
                y: [20, -20, 20],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20 md:py-28">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <motion.nav
            className="flex items-center space-x-2 text-sm text-gray-600 mb-8"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center space-x-2">
                {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-gray-900 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-gray-900 font-medium">{crumb.label}</span>
                )}
              </div>
            ))}
          </motion.nav>
        )}

        {/* Title */}
        <motion.div
          className="max-w-4xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {typeof title === "string" ? (
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              {title}
            </h1>
          ) : (
            <div className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              {title}
            </div>
          )}

          {/* Subtitle */}
          {subtitle && (
            <motion.p
              className="text-lg md:text-xl lg:text-2xl text-gray-600 leading-relaxed max-w-3xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {subtitle}
            </motion.p>
          )}

          {/* CTA Button */}
          {cta && (
            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Link
                href={cta.href}
                className={`inline-flex items-center px-6 py-3 rounded-full font-semibold transition-all transform hover:scale-105 ${
                  cta.variant === "secondary"
                    ? "bg-white text-gray-900 shadow-lg hover:shadow-xl"
                    : `text-white shadow-lg hover:shadow-xl`
                }`}
                style={{
                  backgroundColor: cta.variant !== "secondary" ? accentColor : undefined,
                }}
              >
                {cta.label}
                <ChevronRight className="ml-2 w-5 h-5" />
              </Link>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  )
}