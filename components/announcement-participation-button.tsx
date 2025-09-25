"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-context"
import { useToast } from "@/hooks/use-toast"
import { errorHandler } from "@/lib/error-handler"

interface Props {
  announcementId: string
}

export function AnnouncementParticipationButton({ announcementId }: Props) {
  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = useMemo(() => createClient(), [])
  const [loading, setLoading] = useState(false)
  const [isParticipating, setIsParticipating] = useState<boolean>(false)

  const loadState = useCallback(async () => {
    if (!user) {
      setIsParticipating(false)
      return
    }
    try {
      const { data, error } = await supabase
        .from("katilimcilar")
        .select("id")
        .eq("duyuru_id", announcementId)
        .eq("user_id", user.id)
        .maybeSingle()
      if (error) throw error
      setIsParticipating(Boolean(data))
    } catch (error) {
      errorHandler.logError('Load participation state error', error)
    }
  }, [announcementId, supabase, user])

  useEffect(() => {
    loadState()
  }, [loadState])

  const handleClick = async () => {
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
        const { error } = await supabase
          .from("katilimcilar")
          .delete()
          .eq("duyuru_id", announcementId)
          .eq("user_id", user.id)
        if (error) throw error
        setIsParticipating(false)
        toast({ title: "Katılım İptal Edildi", description: "Etkinlikten katılımınız iptal edildi." })
      } else {
        const { error } = await supabase.from("katilimcilar").insert([
          {
            duyuru_id: announcementId,
            user_id: user.id,
            user_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Anonim",
            user_email: user.email || "",
          },
        ])
        if (error) {
          // unique violation
          if ((error as any).code === "23505") {
            toast({
              title: "Zaten Katılıyorsunuz",
              description: "Bu etkinliğe zaten katılım gösterdiniz.",
              variant: "destructive",
            })
          } else {
            throw error
          }
        } else {
          setIsParticipating(true)
          toast({ title: "Katılım Onaylandı", description: "Etkinliğe katılımınız onaylandı!" })
        }
      }
    } catch (error) {
      errorHandler.logError('Participation toggle error', error)
      toast({ title: "Hata", description: "Bir hata oluştu. Lütfen tekrar deneyin.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      variant={isParticipating ? "outline" : "default"}
      className={`w-full transition-all duration-200 ${
        isParticipating
          ? "border-[#0015ff] text-[#0015ff] hover:bg-[#0015ff] hover:text-white"
          : "bg-[#0015ff] hover:bg-[#0015ff]/90 text-white"
      }`}
    >
      <Heart className={`w-4 h-4 mr-2 ${isParticipating ? "fill-current" : ""}`} />
      {loading ? "İşleniyor..." : isParticipating ? "Katılımı İptal Et" : "Katılacağım"}
    </Button>
  )
}
