"use client"

import React from "react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Category {
  id: string
  name: string
  icon: string
}

interface MenuCategoriesProps {
  categories: Category[]
  selectedCategory: string
  onCategoryChange: (category: string) => void
  itemCounts: Record<string, number>
}

export function MenuCategories({
  categories,
  selectedCategory,
  onCategoryChange,
  itemCounts,
}: MenuCategoriesProps) {
  const totalItems = Object.values(itemCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-4">
      <motion.h2
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="text-lg font-semibold text-foreground mb-4"
      >
        Kategoriler
      </motion.h2>

      <ScrollArea className="h-[70vh] lg:h-auto pr-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2">
          {categories.map((category, index) => {
            const isSelected = selectedCategory === category.id
            const count = category.id === "all" ? totalItems : itemCounts[category.id] || 0

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.05,
                }}
              >
                <Button
                  variant={isSelected ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 relative overflow-hidden transition-all duration-300",
                    "hover:pl-6 group",
                    isSelected && "shadow-lg"
                  )}
                  onClick={() => onCategoryChange(category.id)}
                >
                  <AnimatePresence mode="wait">
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-0 top-0 bottom-0 w-1 bg-primary"
                      />
                    )}
                  </AnimatePresence>

                  <motion.span
                    animate={{
                      rotate: isSelected ? [0, -10, 10, -10, 10, 0] : 0,
                    }}
                    transition={{ duration: 0.5 }}
                    className="text-xl"
                  >
                    {category.icon}
                  </motion.span>

                  <span className="flex-1 text-left text-sm lg:text-base">
                    {category.name}
                  </span>

                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.05 + 0.2,
                    }}
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      isSelected
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {count}
                  </motion.span>

                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0"
                    initial={{ x: "-100%" }}
                    animate={{
                      x: isSelected ? "100%" : "-100%",
                    }}
                    transition={{
                      duration: 1,
                      repeat: isSelected ? Infinity : 0,
                      repeatDelay: 2,
                    }}
                  />
                </Button>
              </motion.div>
            )
          })}
        </div>
      </ScrollArea>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="hidden lg:block p-4 bg-muted/50 rounded-lg border"
      >
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold">💡 İpucu:</span> Diyet tercihlerinize uygun yemekleri bulmak için 
          vejetaryen, vegan veya glutensiz etiketlerine sahip ürünleri arayabilirsiniz.
        </p>
      </motion.div>
    </div>
  )
}