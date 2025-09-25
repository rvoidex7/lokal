"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { ensureUserProfile } from "@/lib/supabase/ensure-profile"
import { useAuth } from "@/components/auth/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { errorHandler } from "@/lib/error-handler"
import Link from "next/link"
import { 
  Calendar, 
  Clock, 
  Users, 
  FileText, 
  Gift,
  Activity,
  Star,
  ArrowRight,
  MapPin,
  MessageCircle,
  Coffee,
  Target,
  Trophy
} from "lucide-react"
import { format, formatDistanceToNow, isToday, isTomorrow } from "date-fns"
import { tr } from "date-fns/locale"
import type { Activity as ActivityType, SocialGroup, PersonalLetter, UserProfile } from "@/lib/types"
import { CoffeeVoucherDisplay } from "@/components/coffee-voucher-display"

interface DashboardData {
  upcomingActivities: ActivityType[]
  recentGroupActivity: Array<{
    group_name: string
    group_id: string
    last_comment: string
    comment_user: string
    comment_time: string
  }>
  recentLetters: PersonalLetter[]
  profile?: UserProfile
  birthdayReminder?: boolean
}

export function DashboardWidgets() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [data, setData] = useState<DashboardData>({
    upcomingActivities: [],
    recentGroupActivity: [],
    recentLetters: []
  })
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  const fetchDashboardData = async () => {
    if (!user) return

    try {
      // Fetch user profile
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single()

      // Fetch upcoming activities user is registered for
      const { data: attendanceData } = await supabase
        .from("activity_attendance")
        .select("activity_id")
        .eq("user_id", user.id)

      let upcomingActivities: ActivityType[] = []
      if (attendanceData && attendanceData.length > 0) {
        const activityIds = attendanceData.map(a => a.activity_id)
        const { data: activitiesData } = await supabase
          .from("activities")
          .select("*")
          .in("id", activityIds)
          .eq("status", "upcoming")
          .gte("date_time", new Date().toISOString())
          .order("date_time", { ascending: true })
          .limit(3)
        
        upcomingActivities = (activitiesData || []) as ActivityType[]
      }

      // Fetch recent group activity
      const { data: userGroups } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id)

      const groupIds = userGroups?.map(ug => ug.group_id) || []
      
      let recentGroupActivity: Array<{
        group_name: string
        group_id: string
        last_comment: string
        comment_user: string
        comment_time: string
      }> = []
      if (groupIds.length > 0) {
        const { data: recentComments } = await supabase
          .from("club_comments")
          .select(`
            id,
            content,
            user_name,
            created_at,
            group_id,
            social_groups!inner (name)
          `)
          .in("group_id", groupIds)
          .neq("user_id", user.id) // Exclude user's own comments
          .order("created_at", { ascending: false })
          .limit(5)

        recentGroupActivity = recentComments?.map(comment => ({
          group_name: (comment.social_groups as any)?.name || "Bilinmeyen Grup",
          group_id: comment.group_id,
          last_comment: comment.content,
          comment_user: comment.user_name,
          comment_time: comment.created_at
        })) || []
      }

      // Fetch recent personal letters
      const { data: recentLetters } = await supabase
        .from("personal_letters")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(3)

      // Check for birthday reminder (within 7 days)
      const birthdayReminder = profileData?.birthday ? (() => {
        const today = new Date()
        const birthday = new Date(today.getFullYear(), 
          new Date(profileData.birthday).getMonth(), 
          new Date(profileData.birthday).getDate()
        )
        const daysUntilBirthday = Math.ceil((birthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        return daysUntilBirthday >= 0 && daysUntilBirthday <= 7
      })() : false

      setData({
        upcomingActivities,
        recentGroupActivity,
        recentLetters: recentLetters || [],
        profile: profileData,
        birthdayReminder
      })

    } catch (error: any) {
      errorHandler.logError('Error fetching dashboard data', error)
      console.error("Dashboard widgets error details:", error?.message, error?.details)
      toast({
        title: "Hata",
        description: error?.message || "Panel verileri yüklenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [user])

  const formatActivityTime = (dateTime: string) => {
    const date = new Date(dateTime)
    if (isToday(date)) {
      return `Bugün ${format(date, "HH:mm")}`
    } else if (isTomorrow(date)) {
      return `Yarın ${format(date, "HH:mm")}`
    } else {
      return format(date, "d MMM HH:mm", { locale: tr })
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Birthday Reminder */}
      {data.birthdayReminder && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Gift className="w-6 h-6 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                  Doğum gününüz yaklaşıyor! 🎉
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Özel doğum günü kuponunuzu almayı unutmayın
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Yaklaşan Aktiviteler
            </CardTitle>
            <CardDescription>
              Kayıt olduğunuz gelecek etkinlikler
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.upcomingActivities.length > 0 ? (
              <div className="space-y-3">
                {data.upcomingActivities.map(activity => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="p-2 rounded bg-blue-100 dark:bg-blue-900">
                      <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium line-clamp-1">{activity.title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{formatActivityTime(activity.date_time)}</span>
                        {activity.location && (
                          <>
                            <MapPin className="w-3 h-3 ml-2" />
                            <span className="truncate">{activity.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/dashboard?tab=activities">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Tüm Aktiviteler
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground text-sm">Yaklaşan aktivite yok</p>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link href="/duyurular">Aktiviteleri Keşfet</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Group Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Grup Aktiviteleri
            </CardTitle>
            <CardDescription>
              Gruplarınızdan son aktiviteler
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentGroupActivity.length > 0 ? (
              <div className="space-y-3">
                {data.recentGroupActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="p-2 rounded bg-green-100 dark:bg-green-900">
                      <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium line-clamp-1">{activity.group_name}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        <span className="font-medium">{activity.comment_user}:</span> {activity.last_comment}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(activity.comment_time), {
                          addSuffix: true,
                          locale: tr
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/dashboard?tab=social-groups">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Tüm Gruplar
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground text-sm">Grup aktivitesi yok</p>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link href="/sosyal-gruplar">Gruplara Katıl</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Personal Letters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Son Mektuplarım
            </CardTitle>
            <CardDescription>
              Yakın zamanda yazdığınız mektuplar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentLetters.length > 0 ? (
              <div className="space-y-3">
                {data.recentLetters.map(letter => (
                  <div key={letter.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="p-2 rounded bg-purple-100 dark:bg-purple-900">
                      <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium line-clamp-1 flex-1">{letter.title}</h4>
                        <Badge variant={letter.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                          {letter.status === 'published' ? 'Yayınlandı' : 'Taslak'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {letter.content.substring(0, 80)}...
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(letter.updated_at), {
                          addSuffix: true,
                          locale: tr
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/dashboard?tab=letters">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Tüm Mektuplar
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground text-sm">Henüz mektup yazmadınız</p>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link href="/dashboard?tab=letters">İlk Mektubunuzu Yazın</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Kahve Kuponlarım + Sadakat Programı (Merged) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coffee className="w-5 h-5" />
              Kahve & Sadakat
            </CardTitle>
            <CardDescription>
              Aktif kuponlarınız ve sadakat ilerlemeniz
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Compact variant merges vouchers + loyalty into single card content */}
            <CoffeeVoucherDisplay variant="compact" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}