"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddAnnouncementDialog } from "@/components/admin/add-announcement-dialog"
import { EditAnnouncementDialog } from "@/components/admin/edit-announcement-dialog"
import { ParticipantsDialog } from "@/components/admin/participants-dialog"
import { ActivityRequestsDialog } from "@/components/admin/activity-requests-dialog"
import { SocialGroupsManager } from "@/components/admin/social-groups-manager"
import { ProductsManager } from "@/components/admin/products-manager"
import { useToast } from "@/hooks/use-toast"
import { errorHandler } from "@/lib/error-handler"
import { Calendar, Users, Edit, Trash2, Megaphone, UsersRound, Package, Send, QrCode } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface Announcement {
  id: string
  title: string
  description: string
  image_url?: string
  created_at: string
  katilimcilar?: Array<{
    id: string
    user_name: string
    user_email: string
  }>
}

export function AdminDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from("duyurular")
        .select(`
          *,
          katilimcilar (
            id,
            user_name,
            user_email
          )
        `)
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setAnnouncements(data || [])
    } catch (error) {
      errorHandler.logError('Error fetching announcements', error)
      toast({
        title: "Hata",
        description: "Duyurular yüklenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu duyuruyu silmek istediğinizden emin misiniz?")) return

    try {
      const { error } = await supabase.from("duyurular").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "Başarılı",
        description: "Duyuru silindi.",
      })

      fetchAnnouncements()
    } catch (error) {
      toast({
        title: "Hata",
        description: "Duyuru silinirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Giriş Gerekli</h2>
        <p className="text-gray-600">Admin paneline erişmek için giriş yapmanız gerekiyor.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Paneli</h1>
          <p className="text-gray-600">Cafe aktivitelerini ve sosyal grupları yönetin</p>
        </div>
        <ActivityRequestsDialog />
      </div>

      <Tabs defaultValue="announcements" className="w-full">
        <TabsList className="grid w-full max-w-xl grid-cols-4">
          <TabsTrigger value="announcements" className="flex items-center gap-2">
            <Megaphone className="w-4 h-4" />
            Duyurular
          </TabsTrigger>
          <TabsTrigger value="social-groups" className="flex items-center gap-2">
            <UsersRound className="w-4 h-4" />
            Sosyal Gruplar
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Ürünler
          </TabsTrigger>
          <TabsTrigger value="vouchers" className="flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            Kuponlar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="announcements" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Duyurular & Etkinlikler</h2>
            <div className="flex gap-2">
              <AddAnnouncementDialog onSuccess={fetchAnnouncements} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {announcements.map((announcement) => (
              <Card key={announcement.id} className="overflow-hidden">
                {announcement.image_url && (
                  <div className="relative h-32 w-full">
                    <Image
                      src={announcement.image_url || "/placeholder.svg"}
                      alt={announcement.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-2">{announcement.title}</CardTitle>
                    <Badge variant="outline" className="ml-2 shrink-0">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(announcement.created_at).toLocaleDateString("tr-TR")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 line-clamp-2 text-sm">{announcement.description}</p>
                  <div className="flex items-center mt-3 text-sm text-gray-500">
                    <Users className="w-4 h-4 mr-1" />
                    <span>{announcement.katilimcilar?.length || 0} katılımcı</span>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <ParticipantsDialog
                    announcement={announcement}
                    trigger={
                      <Button variant="outline" size="sm" className="flex-1">
                        <Users className="w-4 h-4 mr-1" />
                        Katılımcılar
                      </Button>
                    }
                  />
                  <EditAnnouncementDialog
                    announcement={announcement}
                    onSuccess={fetchAnnouncements}
                    trigger={
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    }
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(announcement.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {announcements.length === 0 && !loading && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold mb-2">Henüz duyuru yok</h3>
              <p className="text-gray-600">İlk duyuruyu eklemek için yukarıdaki butonu kullanın.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="social-groups">
          <SocialGroupsManager />
        </TabsContent>

        <TabsContent value="products">
          <ProductsManager />
        </TabsContent>

        <TabsContent value="vouchers" className="space-y-4">
            <h2 className="text-xl font-semibold">Kupon İşlemleri</h2>
            <div className="flex gap-4">
                <Link href="/admin/send-voucher" passHref>
                    <Button>
                        <Send className="w-4 h-4 mr-2" />
                        Hediye Kuponu Gönder
                    </Button>
                </Link>
                <Link href="/admin/redeem-voucher" passHref>
                    <Button variant="outline">
                        <QrCode className="w-4 h-4 mr-2" />
                        Kupon Okut
                    </Button>
                </Link>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
