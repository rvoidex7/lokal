"use client"

import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Product } from "@/lib/types"
import { ShoppingBag, Store } from "lucide-react"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const getCategoryLabel = (category: Product['category']) => {
    const labels = {
      cup: "Fincan",
      glass: "Bardak",
      ceramic: "Seramik",
      accessory: "Aksesuar",
      other: "Diğer"
    }
    return labels[category] || category
  }

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300">
      <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-16 h-16 text-gray-300" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
            {getCategoryLabel(product.category)}
          </Badge>
        </div>
        {!product.is_available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="destructive" className="text-lg px-3 py-1">
              Stokta Yok
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4 space-y-2">
        <h3 className="font-semibold text-lg line-clamp-1">{product.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {product.description}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div className="text-2xl font-bold text-primary">
          {formatPrice(product.price)}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Store className="w-3 h-3" />
          <span>Mağazada</span>
        </div>
      </CardFooter>
    </Card>
  )
}