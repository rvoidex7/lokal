"use client"

import React from "react"
import { motion, AnimatePresence, LayoutGroup } from "motion/react"
import { MenuCard } from "./menu-card"
import { MenuItem } from "@/lib/menu-data"

interface MenuGridProps {
  items: MenuItem[]
}

export function MenuGrid({ items }: MenuGridProps) {
  return (
    <div className="space-y-8">
      <LayoutGroup>
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6"
        >
          <AnimatePresence mode="popLayout">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  duration: 0.3,
                  layout: {
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  },
                }}
              >
                <MenuCard item={item} index={index} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>
    </div>
  )
}