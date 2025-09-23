"use client"

import { useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { errorHandler } from "@/lib/error-handler"
import { Calendar, Clock, MapPin, Users, UserPlus, UserMinus, Info } from "lucide-react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface SocialGroup {
  id: string
  name: string
  description: string
  category?: string
  recurring_day?: string
  time?: string
  location?: string
  max_members?: number
  image_url?: string
  is_active: boolean
  created_at: string
  group_members?: Array<{
    id: string
    user_id: string
  }>
}

interface SocialGroupCardProps {
  group: SocialGroup
  onUpdate?: () => void
}

const CATEGORY_LABELS: Record<string, string> = {
  movie: "Film",
  yoga: "Yoga",
  book_club: "Kitap Kulübü",
  art: "Sanat",
  music: "Müzik",
  sports: "Spor",
  cooking: "Yemek",
  technology: "Teknoloji",
  language: "Dil",
  other: "Diğer",
}

const DAY_LABELS: Record<string, string> = {
  monday: "Pazartesi",
  tuesday: "Salı",
  wednesday: "Çarşamba",
  thursday: "Perşembe",
  friday: "Cuma",
  saturday: "Cumartesi",
  sunday: "Pazar",
}

const CATEGORY_COLORS: Record<string, string> = {
  movie: "bg-purple-100 text-purple-800",
  yoga: "bg-green-100 text-green-800",
  book_club: "bg-yellow-100 text-yellow-800",
  art: "bg-pink-100 text-pink-800",
  music: "bg-blue-100 text-blue-800",
  sports: "bg-red-100 text-red-800",
  cooking: "bg-orange-100 text-orange-800",
  technology: "bg-indigo-100 text-indigo-800",
  language: "bg-teal-100 text-teal-800",
  other: "bg-gray-100 text-gray-800",
}

export function SocialGroupCard({ group, onUpdate }: SocialGroupCardProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  const isMember = user && group.group_members?.some((member) => member.user_id === user.id)
  const memberCount = group.group_members?.length || 0
  const isFull = group.max_members ? memberCount >= group.max_members : false

  const handleJoinGroup = async () => {
    if (!user) {
      toast({
        title: "Giriş Gerekli",
        description: "Gruba katılmak için giriş yapmanız gerekiyor.",
        variant: "destructive",
      })
      return
    }

    if (isFull) {
      toast({
        title: "Grup Dolu",
        description: "Bu grup maksimum üye sayısına ulaşmış.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const { data: userData } = await supabase.auth.getUser()
      
      const { error } = await supabase.from("group_members").insert({
        group_id: group.id,
        user_id: user.id,
        user_name: userData?.user?.email?.split("@")[0] || "Kullanıcı",
        user_email: userData?.user?.email || "",
        role: "member",
      })

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Zaten Üyesiniz",
            description: "Bu gruba zaten üyesiniz.",
            variant: "destructive",
          })
        } else {
          throw error
        }
      } else {
        toast({
          title: "Başarılı",
          description: "Gruba başarıyla katıldınız.",
        })
        onUpdate?.()
      }
    } catch (error) {
      errorHandler.logError('Error joining group', error)
      toast({
        title: "Hata",
        description: "Gruba katılırken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLeaveGroup = async () => {
    if (!user) return

    if (!confirm("Gruptan ayrılmak istediğinizden emin misiniz?")) return

    setLoading(true)

    try {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", group.id)
        .eq("user_id", user.id)

      if (error) throw error

      toast({
        title: "Başarılı",
        description: "Gruptan ayrıldınız.",
      })
      onUpdate?.()
    } catch (error) {
      errorHandler.logError('Error leaving group', error)
      toast({
        title: "Hata",
        description: "Gruptan ayrılırken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {group.image_url && (
        <div className="relative h-48 w-full">
          <Image
            src={group.image_url || "/placeholder.svg"}
            alt={group.name}
            fill
            className="object-cover"
          />
          {group.category && (
            <Badge 
              className={`absolute top-2 right-2 ${CATEGORY_COLORS[group.category] || CATEGORY_COLORS.other}`}
            >
              {CATEGORY_LABELS[group.category] || group.category}
            </Badge>
          )}
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-xl">{group.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-gray-600 line-clamp-2">{group.description}</p>
        
        <div className="space-y-2 text-sm">
          {group.recurring_day && (
            <div className="flex items-center text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              <span>{DAY_LABELS[group.recurring_day]}</span>
              {group.time && (
                <>
                  <Clock className="w-4 h-4 ml-3 mr-2" />
                  <span>{group.time}</span>
                </>
              )}
            </div>
          )}
          {group.location && (
            <div className="flex items-center text-gray-600">
              <MapPin className="w-4 h-4 mr-2" />
              <span>{group.location}</span>
            </div>
          )}
          <div className="flex items-center text-gray-600">
            <Users className="w-4 h-4 mr-2" />
            <span>
              {memberCount} üye
              {group.max_members && ` / ${group.max_members} maksimum`}
            </span>
            {isFull && (
              <Badge variant="secondary" className="ml-2 text-xs">
                Dolu
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1">
              <Info className="w-4 h-4 mr-1" />
              Detaylar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{group.name}</DialogTitle>
              {group.category && (
                <Badge 
                  className={`w-fit ${CATEGORY_COLORS[group.category] || CATEGORY_COLORS.other}`}
                >
                  {CATEGORY_LABELS[group.category] || group.category}
                </Badge>
              )}
            </DialogHeader>
            <div className="space-y-4">
              {group.image_url && (
                <div className="relative h-64 w-full rounded-lg overflow-hidden">
                  <Image
                    src={group.image_url}
                    alt={group.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <h3 className="font-semibold mb-2">Hakkında</h3>
                <p className="text-gray-600">{group.description}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.recurring_day && (
                  <div>
                    <h4 className="font-semibold mb-1">Gün & Saat</h4>
                    <p className="text-gray-600">
                      {DAY_LABELS[group.recurring_day]}
                      {group.time && ` - ${group.time}`}
                    </p>
                  </div>
                )}
                {group.location && (
                  <div>
                    <h4 className="font-semibold mb-1">Mekan</h4>
                    <p className="text-gray-600">{group.location}</p>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold mb-1">Üye Sayısı</h4>
                  <p className="text-gray-600">
                    {memberCount} üye
                    {group.max_members && ` (Maksimum: ${group.max_members})`}
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {user ? (
          isMember ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLeaveGroup}
              disabled={loading}
              className="flex-1 text-red-600 hover:text-red-700"
            >
              <UserMinus className="w-4 h-4 mr-1" />
              {loading ? "İşleniyor..." : "Ayrıl"}
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={handleJoinGroup}
              disabled={loading || isFull}
              className="flex-1"
            >
              <UserPlus className="w-4 h-4 mr-1" />
              {loading ? "İşleniyor..." : isFull ? "Grup Dolu" : "Katıl"}
            </Button>
          )
        ) : (
          <Button variant="outline" size="sm" disabled className="flex-1">
            <UserPlus className="w-4 h-4 mr-1" />
            Giriş Yapın
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}