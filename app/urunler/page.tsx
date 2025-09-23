"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Product } from "@/lib/types"
import { ProductGrid } from "@/components/products/product-grid"
import { PageHero } from "@/components/page-hero"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Store, Info } from "lucide-react"

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const supabase = createClient()
        
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("is_available", true)
          .order("display_order", { ascending: true })
          .order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        setProducts(data || [])
      } catch (error) {
        console.error("Error fetching products:", error)
        setError("Ürünler yüklenirken bir hata oluştu.")
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <PageHero
        title="El Yapımı Ürünler"
        subtitle="Özenle hazırlanan, tamamen el yapımı ürünlerimizi keşfedin"
      />

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Info Alert */}
        <Alert className="mb-8 border-primary/20 bg-primary/5">
          <Store className="h-4 w-4" />
          <AlertDescription className="ml-2">
            <strong>Mağazada Satış:</strong> Tüm ürünlerimiz kafemizde satılmaktadır. 
            Online sipariş verilememektedir. Detaylı bilgi ve stok durumu için kafemizi ziyaret edebilirsiniz.
          </AlertDescription>
        </Alert>

        {/* Products Section */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-8 w-1/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <ProductGrid products={products} />
        )}

        {/* Additional Info */}
        {!loading && !error && products.length > 0 && (
          <div className="mt-12 p-6 bg-muted/50 rounded-lg border">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong>Ziyaret Saatleri:</strong> Pazartesi - Cumartesi: 09:00 - 20:00, 
                  Pazar: 10:00 - 18:00
                </p>
                <p>
                  <strong>İletişim:</strong> Ürünler hakkında detaylı bilgi almak veya 
                  özel sipariş vermek için kafemizi ziyaret edebilir veya sosyal medya 
                  hesaplarımızdan bize ulaşabilirsiniz.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}