"use client"

import { useState, useMemo } from "react"
import { Product } from "@/lib/types"
import { ProductCard } from "./product-card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Package } from "lucide-react"

interface ProductGridProps {
  products: Product[]
}

const categories = [
  { value: "all", label: "Tümü" },
  { value: "cup", label: "Fincanlar" },
  { value: "glass", label: "Bardaklar" },
  { value: "ceramic", label: "Seramikler" },
  { value: "accessory", label: "Aksesuarlar" },
  { value: "other", label: "Diğer" },
]

export function ProductGrid({ products }: ProductGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "all") {
      return products
    }
    return products.filter(product => product.category === selectedCategory)
  }, [products, selectedCategory])

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      // First sort by availability (available first)
      if (a.is_available !== b.is_available) {
        return a.is_available ? -1 : 1
      }
      // Then by display order
      if (a.display_order !== b.display_order) {
        return a.display_order - b.display_order
      }
      // Finally by creation date (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [filteredProducts])

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((category) => (
          <Button
            key={category.value}
            variant={selectedCategory === category.value ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.value)}
            className={cn(
              "transition-all",
              selectedCategory === category.value && "shadow-md"
            )}
          >
            {category.label}
            {category.value === "all" && (
              <span className="ml-1 text-xs opacity-70">
                ({products.length})
              </span>
            )}
            {category.value !== "all" && (
              <span className="ml-1 text-xs opacity-70">
                ({products.filter(p => p.category === category.value).length})
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Products Grid */}
      {sortedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Ürün Bulunamadı</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {selectedCategory === "all" 
              ? "Henüz ürün eklenmemiş."
              : "Bu kategoride henüz ürün bulunmuyor."}
          </p>
        </div>
      )}
    </div>
  )
}