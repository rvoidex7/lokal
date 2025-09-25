"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, Heart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { errorHandler } from "@/lib/error-handler"

interface AnnouncementCardProps {
  announcement: {
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
  onParticipationChange?: () => void
}

export function AnnouncementCard({ announcement, onParticipationChange }: AnnouncementCardProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [imageError, setImageError] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  const isParticipating = announcement.katilimcilar?.some((participant) => participant.user_email === user?.email)
  const participantCount = announcement.katilimcilar?.length || 0

  const handleParticipation = async () => {
    if (!user) {
      toast({
        title: "Giriş Gerekli",
        description: "Katılım için giriş yapmanız gerekiyor.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      if (isParticipating) {
        // Remove participation
        const { error } = await supabase
          .from("katilimcilar")
          .delete()
          .eq("duyuru_id", announcement.id)
          .eq("user_id", user.id)

        if (error) throw error

        toast({
          title: "Katılım İptal Edildi",
          description: "Etkinlikten katılımınız iptal edildi.",
        })
      } else {
        // Add participation
        const { error } = await supabase.from("katilimcilar").insert([
          {
            duyuru_id: announcement.id,
            user_id: user.id,
            user_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Anonim",
            user_email: user.email || "",
          },
        ])

        if (error) {
          if (error.code === "23505") {
            toast({
              title: "Zaten Katılıyorsunuz",
              description: "Bu etkinliğe zaten katılım gösterdiniz.",
              variant: "destructive",
            })
          } else {
            throw error
          }
        } else {
          toast({
            title: "Katılım Onaylandı",
            description: "Etkinliğe katılımınız onaylandı!",
          })
        }
      }

      onParticipationChange?.()
    } catch (error) {
      errorHandler.logError('Participation error', error)
      toast({
        title: "Hata",
        description: "Bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
      {announcement.image_url && !imageError && (
        <div className="relative h-48 w-full">
          <Image
            src={announcement.image_url || "/placeholder.svg"}
            alt={announcement.title}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      <CardHeader className="flex-none">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xl font-bold line-clamp-2 flex-1">
            <Link href={`/duyurular/${announcement.id}`} className="hover:underline">
              {announcement.title}
            </Link>
          </CardTitle>
          <Badge variant="outline" className="shrink-0 text-xs">
            <Calendar className="w-3 h-3 mr-1" />
            {new Date(announcement.created_at).toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "short",
            })}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-gray-600 line-clamp-3 text-sm leading-relaxed">{announcement.description}</p>
        <div className="flex items-center mt-4 text-sm text-gray-500">
          <Users className="w-4 h-4 mr-1" />
          <span>{participantCount} kişi katılıyor</span>
        </div>
      </CardContent>
      <CardFooter className="flex-none">
        <div className="flex w-full gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/duyurular/${announcement.id}`)}
            className="w-1/2"
          >
            Detaylı Bilgi
          </Button>
          <Button
            onClick={handleParticipation}
            disabled={loading}
            variant={isParticipating ? "outline" : "default"}
            className={`w-1/2 transition-all duration-200 ${
              isParticipating
                ? "border-[#0015ff] text-[#0015ff] hover:bg-[#0015ff] hover:text-white"
                : "bg-[#0015ff] hover:bg-[#0015ff]/90 text-white"
            }`}
          >
            <Heart className={`w-4 h-4 mr-2 ${isParticipating ? "fill-current" : ""}`} />
            {loading ? "İşleniyor..." : isParticipating ? "Katılımı İptal Et" : "Katılacağım"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
