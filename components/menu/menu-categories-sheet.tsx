"use client"

import React from "react"
import { motion } from "motion/react"
import { SlidersHorizontal } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
  icon: string
}

interface MenuCategoriesSheetProps {
  categories: Category[]
  selectedCategory: string
  onCategoryChange: (category: string) => void
  itemCounts: Record<string, number>
}

export function MenuCategoriesSheet({
  categories,
  selectedCategory,
  onCategoryChange,
  itemCounts,
}: MenuCategoriesSheetProps) {
  const [open, setOpen] = React.useState(false)
  const totalItems = Object.values(itemCounts).reduce((a, b) => a + b, 0)
  
  const selectedCategoryName = categories.find(c => c.id === selectedCategory)?.name || "Tüm Menü"
  const activeFiltersCount = selectedCategory !== "all" ? 1 : 0

  const handleCategorySelect = (categoryId: string) => {
    onCategoryChange(categoryId)
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="default"
          className="relative flex items-center gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Kategoriler</span>
          <span className="sm:hidden">Filtre</span>
          {activeFiltersCount > 0 && (
            <Badge 
              variant="default" 
              className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[85%] sm:w-[350px] p-0">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle>Kategoriler</SheetTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Seçili: <span className="font-medium">{selectedCategoryName}</span>
          </p>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-120px)]">
          <div className="px-6 pb-6 space-y-2">
            {categories.map((category, index) => {
              const isSelected = selectedCategory === category.id
              const count = category.id === "all" ? totalItems : itemCounts[category.id] || 0

              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.03,
                  }}
                >
                  <Button
                    variant={isSelected ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 relative overflow-hidden transition-all",
                      "hover:pl-6 group h-auto py-3",
                      isSelected && "shadow-sm"
                    )}
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-0 top-0 bottom-0 w-1 bg-primary-foreground/30"
                      />
                    )}

                    <span className="text-xl">{category.icon}</span>
                    
                    <span className="flex-1 text-left">{category.name}</span>
                    
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        isSelected
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {count}
                    </span>
                  </Button>
                </motion.div>
              )
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}