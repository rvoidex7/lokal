"use client"

import { motion } from "motion/react"

export function StackedCircularFooter() {
  return (
    <footer className="relative bg-[#0015ff] text-white py-16 overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-20 -left-20 w-40 h-40 bg-white/10 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-10 -right-10 w-32 h-32 bg-white/10 rounded-full"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.6, 0.3, 0.6],
          }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        <motion.div
          className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 w-48 h-48 bg-white/5 rounded-full"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 2,
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-4 font-quicksand">Lokal</h3>
            <p className="text-white/80">Yerel aktiviteler ve etkinlikler için buluşma noktanız.</p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Hızlı Linkler</h4>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-white/80 hover:text-white transition-colors">
                  Giriş
                </a>
              </li>
              <li>
                <a href="/hakkimizda" className="text-white/80 hover:text-white transition-colors">
                  Hakkımızda
                </a>
              </li>
              <li>
                <a href="/duyurular" className="text-white/80 hover:text-white transition-colors">
                  Duyurular
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">İletişim</h4>
            <div className="space-y-2 text-white/80">
              <p>lokalkahvesi@gmail.com</p>
              <p>+90 533 437 02 66</p>
              <div className="flex space-x-4 mt-4">
                <a href="#" className="hover:text-white transition-colors">
                  Twitter
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  Instagram
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  Facebook
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 mt-12 pt-8 text-center text-white/60">
          <p>&copy; 2025 Lokal. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </footer>
  )
}
