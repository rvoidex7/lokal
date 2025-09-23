"use client"

import { motion } from "motion/react"
import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface BentoGridProps {
  children: ReactNode
  className?: string
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6",
        className
      )}
    >
      {children}
    </div>
  )
}

interface BentoCardProps {
  children: ReactNode
  className?: string
  size?: "small" | "medium" | "large"
  gradient?: boolean
  hover?: boolean
  delay?: number
}

export function BentoCard({
  children,
  className,
  size = "medium",
  gradient = false,
  hover = true,
  delay = 0,
}: BentoCardProps) {
  const sizeClasses = {
    small: "col-span-1 row-span-1",
    medium: "col-span-1 md:col-span-1 row-span-1",
    large: "col-span-1 md:col-span-2 lg:col-span-2 row-span-1 md:row-span-2",
  }

  return (
    <motion.div
      className={cn(
        "relative group",
        sizeClasses[size],
        "bg-white rounded-2xl p-6 md:p-8",
        "border border-gray-100",
        "overflow-hidden",
        hover && "hover:shadow-2xl transition-all duration-500",
        gradient && "bg-gradient-to-br from-white to-gray-50",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      whileHover={hover ? { scale: 1.02, rotateX: 2, rotateY: 2 } : {}}
      style={{
        transformStyle: "preserve-3d",
        transformPerspective: 1000,
      }}
    >
      {/* Gradient overlay on hover */}
      {hover && (
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[#0015ff]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      )}
      
      {/* Glass effect border */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/50 to-white/0 pointer-events-none" />
      
      {children}
    </motion.div>
  )
}

interface BentoIconProps {
  children: ReactNode
  className?: string
  color?: string
}

export function BentoIcon({ children, className, color = "#0015ff" }: BentoIconProps) {
  return (
    <div
      className={cn(
        "w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center mb-4",
        "bg-gradient-to-br",
        className
      )}
      style={{
        background: `linear-gradient(135deg, ${color}15 0%, ${color}25 100%)`,
      }}
    >
      <div style={{ color }}>{children}</div>
    </div>
  )
}

interface BentoTitleProps {
  children: ReactNode
  className?: string
}

export function BentoTitle({ children, className }: BentoTitleProps) {
  return (
    <h3 className={cn("text-xl md:text-2xl font-bold mb-2", className)}>
      {children}
    </h3>
  )
}

interface BentoDescriptionProps {
  children: ReactNode
  className?: string
}

export function BentoDescription({ children, className }: BentoDescriptionProps) {
  return (
    <p className={cn("text-gray-600 leading-relaxed", className)}>
      {children}
    </p>
  )
}