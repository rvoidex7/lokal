"use client"

import { motion, useMotionValue, useTransform, animate } from "motion/react"
import { useEffect, useRef, useState } from "react"

interface AnimatedCounterProps {
  from?: number
  to: number
  duration?: number
  suffix?: string
  prefix?: string
  className?: string
  decimals?: number
  startOnView?: boolean
}

export function AnimatedCounter({
  from = 0,
  to,
  duration = 2,
  suffix = "",
  prefix = "",
  className = "",
  decimals = 0,
  startOnView = true,
}: AnimatedCounterProps) {
  const count = useMotionValue(from)
  const rounded = useTransform(count, (latest) => {
    if (decimals > 0) {
      return latest.toFixed(decimals)
    }
    return Math.round(latest).toLocaleString()
  })
  
  const [hasStarted, setHasStarted] = useState(!startOnView)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!startOnView || hasStarted) {
      const controls = animate(count, to, { duration })
      return controls.stop
    }
  }, [count, to, duration, hasStarted, startOnView])

  useEffect(() => {
    if (!startOnView) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasStarted) {
            setHasStarted(true)
          }
        })
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [startOnView, hasStarted])

  return (
    <motion.span ref={ref} className={className}>
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </motion.span>
  )
}