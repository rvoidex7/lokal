"use client"

import React from "react"
import { motion } from "motion/react"
import { MenuItem } from "@/lib/menu-data"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface MenuCardProps {
  item: MenuItem
  index: number
}

export const MenuCard = React.memo(function MenuCard({ item, index }: MenuCardProps) {
  const [isHovered, setIsHovered] = React.useState(false)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.05,
        ease: [0.23, 1, 0.32, 1],
      }}
      whileHover={{ y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative"
    >
      <div
        className={cn(
          "group relative bg-card rounded-xl border shadow-sm transition-all duration-300",
          "hover:shadow-lg hover:border-primary/20",
          "overflow-hidden"
        )}
      >
        <div className="p-4 md:p-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-200">
                {item.title}
              </h3>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {item.isVegetarian && (
                  <Badge variant="outline" className="text-xs">
                    🌱 Vejetaryen
                  </Badge>
                )}
                {item.isVegan && (
                  <Badge variant="outline" className="text-xs">
                    🌿 Vegan
                  </Badge>
                )}
                {item.isGlutenFree && (
                  <Badge variant="outline" className="text-xs">
                    🌾 Glutensiz
                  </Badge>
                )}
                {item.isSpicy && (
                  <Badge variant="outline" className="text-xs">
                    🌶️ Acılı
                  </Badge>
                )}
              </div>
            </div>
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: isHovered ? 1.1 : 1 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary/10 rounded-lg blur-xl" />
                <div className="relative bg-gradient-to-br from-primary to-primary/80 text-primary-foreground px-3 py-1.5 rounded-lg font-bold text-sm md:text-base">
                  {formatPrice(item.price)}
                </div>
              </div>
            </motion.div>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {item.description}
          </p>

          <motion.div
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-primary/50 to-primary"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            style={{ transformOrigin: "left" }}
          />
        </div>

        {item.image && (
          <motion.div
            className="absolute -top-2 -right-2 w-16 h-16 opacity-5"
            animate={{
              rotate: isHovered ? 360 : 0,
            }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-primary/20 to-primary/5" />
          </motion.div>
        )}
      </div>
    </motion.div>
  )
})