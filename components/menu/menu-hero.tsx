"use client"

import React from "react"
import { motion, useScroll, useTransform } from "motion/react"

export function MenuHero() {
  const { scrollY } = useScroll()
  const opacity = useTransform(scrollY, [0, 300], [1, 0])
  const scale = useTransform(scrollY, [0, 300], [1, 0.95])
  const y = useTransform(scrollY, [0, 300], [0, -50])

  const floatingItems = [
    { emoji: "🍕", delay: 0, x: "10%", y: "20%" },
    { emoji: "🍔", delay: 0.2, x: "80%", y: "15%" },
    { emoji: "🥗", delay: 0.4, x: "15%", y: "70%" },
    { emoji: "🍝", delay: 0.6, x: "75%", y: "65%" },
    { emoji: "🍰", delay: 0.8, x: "45%", y: "10%" },
    { emoji: "☕", delay: 1, x: "90%", y: "40%" },
    { emoji: "🍹", delay: 1.2, x: "5%", y: "45%" },
    { emoji: "🥘", delay: 1.4, x: "60%", y: "80%" },
  ]

  return (
    <motion.section
      style={{ opacity, scale, y }}
      className="relative h-[40vh] sm:h-[50vh] md:h-[60vh] overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10"
    >
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        
        {floatingItems.map((item, index) => (
          <motion.div
            key={index}
            className="absolute text-3xl sm:text-4xl md:text-5xl select-none"
            style={{ left: item.x, top: item.y }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.4, 0.5, 0.4],
              scale: [0.95, 1.05, 0.95],
              y: [0, -5, 0],
            }}
            transition={{
              duration: 8,
              delay: item.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {item.emoji}
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="text-center space-y-4"
        >
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Menümüz
          </motion.h1>

          <motion.p
            className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Özenle hazırlanan lezzetlerimizi keşfedin
          </motion.p>
        </motion.div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 1,
            delay: 1.2,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          <svg
            className="w-6 h-6 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </motion.section>
  )
}