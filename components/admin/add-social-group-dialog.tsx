"use client"

import { useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { errorHandler } from "@/lib/error-handler"
import { Plus, Upload } from "lucide-react"
import { useAuth } from "@/components/auth/auth-context"

interface AddSocialGroupDialogProps {
  onSuccess?: () => void
}

const CATEGORIES = [
  { value: "movie", label: "Film" },
  { value: "yoga", label: "Yoga" },
  { value: "book_club", label: "Kitap Kulübü" },
  { value: "art", label: "Sanat" },
  { value: "music", label: "Müzik" },
  { value: "sports", label: "Spor" },
  { value: "cooking", label: "Yemek" },
  { value: "technology", label: "Teknoloji" },
  { value: "language", label: "Dil" },
  { value: "other", label: "Diğer" },
]

const DAYS = [
  { value: "monday", label: "Pazartesi" },
  { value: "tuesday", label: "Salı" },
  { value: "wednesday", label: "Çarşamba" },
  { value: "thursday", label: "Perşembe" },
  { value: "friday", label: "Cuma" },
  { value: "saturday", label: "Cumartesi" },
  { value: "sunday", label: "Pazar" },
]

export function AddSocialGroupDialog({ onSuccess }: AddSocialGroupDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    recurring_day: "",
    time: "",
    location: "",
    max_members: "",
    image_url: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({
        title: "Hata",
        description: "Grup oluşturmak için giriş yapmalısınız.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.from("social_groups").insert({
        name: formData.name,
        description: formData.description,
        category: formData.category || null,
        recurring_day: formData.recurring_day || null,
        time: formData.time || null,
        location: formData.location || null,
        max_members: formData.max_members ? parseInt(formData.max_members) : null,
        image_url: formData.image_url || null,
        created_by: user.id,
        is_active: true,
      })

      if (error) throw error

      toast({
        title: "Başarılı",
        description: "Sosyal grup başarıyla oluşturuldu.",
      })

      setOpen(false)
      setFormData({
        name: "",
        description: "",
        category: "",
        recurring_day: "",
        time: "",
        location: "",
        max_members: "",
        image_url: "",
      })

      onSuccess?.()
    } catch (error: any) {
      errorHandler.logError('Error creating social group', error)
      
      // Provide more specific error message to user
      let errorMessage = "Grup oluşturulurken bir hata oluştu."
      
      if (error?.message) {
        errorMessage = error.message
      } else if (error?.code === 'PGRST301') {
        errorMessage = "Veritabanı izinleri ayarlanmamış. Lütfen setup-complete.sql dosyasını çalıştırın."
      } else if (error?.code === '42501') {
        errorMessage = "Yetkilendirme hatası. Lütfen giriş yaptığınızdan emin olun."
      }
      
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Hata",
        description: "Lütfen bir resim dosyası seçin.",
        variant: "destructive",
      })
      return
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast({
        title: "Hata",
        description: "Dosya boyutu 5MB'dan küçük olmalıdır.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `social-groups/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from("uploads")
        .getPublicUrl(filePath)

      setFormData({ ...formData, image_url: publicUrl })

      toast({
        title: "Başarılı",
        description: "Resim yüklendi.",
      })
    } catch (error: any) {
      errorHandler.logError('Error uploading image', error)
      
      let errorMessage = "Resim yüklenirken bir hata oluştu."
      if (error?.message?.includes('storage/bucket/not-found')) {
        errorMessage = "Storage bucket 'uploads' bulunamadı. Lütfen setup-complete.sql dosyasını çalıştırın."
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Sosyal Grup
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Yeni Sosyal Grup Oluştur</DialogTitle>
            <DialogDescription>
              Cafe'de düzenlenecek sosyal aktivite grubu oluşturun.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Grup Adı</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Örn: Pazartesi Sinema"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Grup hakkında detaylı bilgi..."
                required
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recurring_day">Tekrar Eden Gün</Label>
                <Select value={formData.recurring_day} onValueChange={(value) => setFormData({ ...formData, recurring_day: value })}>
                  <SelectTrigger id="recurring_day">
                    <SelectValue placeholder="Gün seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Saat</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  placeholder="19:00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Mekan</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Örn: 2. Kat Etkinlik Salonu"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_members">Maksimum Üye Sayısı</Label>
                <Input
                  id="max_members"
                  type="number"
                  value={formData.max_members}
                  onChange={(e) => setFormData({ ...formData, max_members: e.target.value })}
                  placeholder="Sınırsız için boş bırakın"
                  min="1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Grup Görseli</Label>
              <div className="flex gap-2">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={loading}
                  className="flex-1"
                />
                {formData.image_url && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setFormData({ ...formData, image_url: "" })}>
                    Kaldır
                  </Button>
                )}
              </div>
              {formData.image_url && (
                <img src={formData.image_url} alt="Preview" className="mt-2 h-32 object-cover rounded" />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Oluşturuluyor..." : "Grup Oluştur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}