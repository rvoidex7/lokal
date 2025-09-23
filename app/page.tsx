"use client"

import { useState, useEffect } from "react"
import { LandingHero } from "@/components/landing-hero"
import { FeatureSection } from "@/components/feature-section"
import Lokal from "@/components/lokal"

export default function HomePage() {
  const [showSplash, setShowSplash] = useState(false)

  useEffect(() => {
    // Check if splash has been shown this session
    const hasShownSplash = sessionStorage.getItem("hasShownSplash")
    
    if (!hasShownSplash) {
      setShowSplash(true)
      sessionStorage.setItem("hasShownSplash", "true")
      
      // Show splash screen for 2 seconds
      const timer = setTimeout(() => {
        setShowSplash(false)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [])

  if (showSplash) {
    return <Lokal />
  }

  return (
    <div className="min-h-screen">
      <LandingHero />
      <FeatureSection />
    </div>
  )
}
