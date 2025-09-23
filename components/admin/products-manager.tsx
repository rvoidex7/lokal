"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Product } from "@/lib/types"
import { AddProductDialog } from "./add-product-dialog"
import { EditProductDialog } from "./edit-product-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Trash2, Edit, Package, Eye, EyeOff } from "lucide-react"
import Image from "next/image"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function ProductsManager() {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProducts = async () => {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false })

      if (error) throw error

      setProducts(data || [])
    } catch (error: any) {
      console.error("Error fetching products:", error)
      toast({
        title: "Hata",
        description: error?.message || "Ürünler yüklenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("products").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "Başarılı",
        description: "Ürün silindi.",
      })

      fetchProducts()
    } catch (error: any) {
      console.error("Error deleting product:", error)
      toast({
        title: "Hata",
        description: error?.message || "Ürün silinirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const toggleAvailability = async (product: Product) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("products")
        .update({ is_available: !product.is_available })
        .eq("id", product.id)

      if (error) throw error

      toast({
        title: "Başarılı",
        description: product.is_available ? "Ürün stoktan kaldırıldı." : "Ürün stoğa eklendi.",
      })

      fetchProducts()
    } catch (error: any) {
      console.error("Error updating product availability:", error)
      toast({
        title: "Hata",
        description: error?.message || "Ürün durumu güncellenirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Ürünler ({products.length})</h2>
        <AddProductDialog onSuccess={fetchProducts} />
      </div>

      {products.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-3">
            <Package className="w-12 h-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold">Henüz ürün yok</h3>
            <p className="text-sm text-muted-foreground">
              İlk ürünü eklemek için yukarıdaki butonu kullanın.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <CardHeader className="p-0">
                <div className="relative h-40 bg-gradient-to-br from-gray-50 to-gray-100">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {getCategoryLabel(product.category)}
                    </Badge>
                    {!product.is_available && (
                      <Badge variant="destructive" className="text-xs">
                        Stokta Yok
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 space-y-1">
                <h3 className="font-medium text-sm line-clamp-1">{product.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {product.description}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Sıra: {product.display_order}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="p-3 pt-0 flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => toggleAvailability(product)}
                >
                  {product.is_available ? (
                    <>
                      <EyeOff className="w-3 h-3 mr-1" />
                      Stoktan Kaldır
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3 mr-1" />
                      Stoğa Ekle
                    </>
                  )}
                </Button>
                <EditProductDialog
                  product={product}
                  onSuccess={fetchProducts}
                  trigger={
                    <Button variant="outline" size="sm">
                      <Edit className="w-3 h-3" />
                    </Button>
                  }
                />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Ürünü Sil</AlertDialogTitle>
                      <AlertDialogDescription>
                        Bu ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>İptal</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(product.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Sil
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}