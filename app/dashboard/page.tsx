"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { ensureUserProfile } from "@/lib/supabase/ensure-profile"
import { useAuth } from "@/components/auth/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CoffeeVoucherDisplay } from "@/components/coffee-voucher-display"
import { LoadingSpinner } from "@/components/loading-spinner"
import { DashboardWidgets } from "@/components/dashboard/dashboard-widgets"
import { SocialGroupsNav } from "@/components/dashboard/social-groups-nav"
import { ActivityTimeline } from "@/components/dashboard/activity-timeline"
import { LetterHistory } from "@/components/dashboard/personal-letters/letter-history"
import { ActivityManager } from "@/components/dashboard/activity-manager"
import { GroupManager } from "@/components/dashboard/group-manager"
import { DebugDatabase } from "@/components/dashboard/debug-database"
import { ActivityNotifications, NotificationBell } from "@/components/dashboard/activity-notifications"
import { useToast } from "@/hooks/use-toast"
import { 
  Users, 
  Calendar, 
  FileText, 
  Settings, 
  Activity,
  TrendingUp,
  Clock,
  Star,
  Bell
} from "lucide-react"
import type { UserProfile, SocialGroup, Activity as ActivityType, PersonalLetter } from "@/lib/types"

interface DashboardStats {
  totalGroups: number
  totalActivitiesAttended: number
  totalLettersWritten: number
  upcomingActivities: number
  unreadNotifications: number
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalGroups: 0,
    totalActivitiesAttended: 0,
    totalLettersWritten: 0,
    upcomingActivities: 0,
    unreadNotifications: 0
  })
  const [showNotifications, setShowNotifications] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  const fetchDashboardData = async () => {
    if (!user) return

    try {
      // Ensure user profile exists
      const { profile: profileData } = await ensureUserProfile(user)
      setProfile(profileData)

      // Fetch user's joined groups
      const { data: groupsData, error: groupsError } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id)

      if (groupsError) throw groupsError

      // Fetch upcoming activities user is registered for
      const { data: upcomingActivities, error: activitiesError } = await supabase
        .from("activities")
        .select("id")
        .eq("status", "upcoming")
        .gte("date_time", new Date().toISOString())

      if (activitiesError) throw activitiesError

      // Fetch user's personal letters
      const { data: lettersData, error: lettersError } = await supabase
        .from("personal_letters")
        .select("id")
        .eq("user_id", user.id)

      if (lettersError && lettersError.code !== 'PGRST116') {
        throw lettersError
      }

      // Fetch unread notifications count
      let unreadNotifications = 0
      try {
        const response = await fetch('/api/notifications/unread-count')
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            unreadNotifications = result.data.count
          }
        }
      } catch (notificationError) {
        console.warn('Could not fetch unread notifications:', notificationError)
      }

      setStats({
        totalGroups: groupsData?.length || 0,
        totalActivitiesAttended: profileData?.activity_attendance_count || 0,
        totalLettersWritten: lettersData?.length || 0,
        upcomingActivities: upcomingActivities?.length || 0,
        unreadNotifications
      })

    } catch (error: any) {
      console.error("Error fetching dashboard data:", error)
      console.error("Error details:", error?.message, error?.details, error?.hint)
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

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Giriş Gerekli</h1>
          <p>Kullanıcı panelinize erişmek için giriş yapmanız gerekiyor.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner />
      </div>
    )
  }

  const StatCard = ({ title, value, icon: Icon, description }: {
    title: string
    value: number
    icon: any
    description: string
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Hero Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#0015ff] to-[#2563eb] bg-clip-text text-transparent">
              Kullanıcı Paneli
            </h1>
            <p className="text-muted-foreground">
              Hoş geldiniz, {profile?.full_name || user.email?.split("@")[0] || "Kullanıcı"}! 
              Topluluk aktivitelerinizi ve kişisel deneyimlerinizi buradan yönetebilirsiniz.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell 
              unreadCount={stats.unreadNotifications}
              onClick={() => setShowNotifications(!showNotifications)}
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Katıldığım Gruplar"
          value={stats.totalGroups}
          icon={Users}
          description="Aktif grup üyelikleriniz"
        />
        <StatCard
          title="Katıldığım Etkinlikler"
          value={stats.totalActivitiesAttended}
          icon={Calendar}
          description="Toplam katılım sayınız"
        />
        <StatCard
          title="Yazılan Mektuplar"
          value={stats.totalLettersWritten}
          icon={FileText}
          description="Kişisel mektup sayınız"
        />
        <StatCard
          title="Yaklaşan Etkinlikler"
          value={stats.upcomingActivities}
          icon={Clock}
          description="Gelecek aktiviteler"
        />
      </div>

      {/* Coffee Vouchers Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Kahve Kuponlarım</h2>
        <CoffeeVoucherDisplay />
      </div>

      {/* Debug Component - TEMPORARY */}
      <div className="space-y-4 border-2 border-red-500 p-4 rounded-lg">
        <h2 className="text-xl font-semibold text-red-500">Debug Panel (Temporary)</h2>
        <DebugDatabase />
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <ActivityNotifications />
      )}

      {/* Main Dashboard Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="notifications">
            Bildirimler
            {stats.unreadNotifications > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1rem] h-4 flex items-center justify-center">
                {stats.unreadNotifications > 99 ? '99+' : stats.unreadNotifications}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="social-groups">Sosyal Gruplar</TabsTrigger>
          <TabsTrigger value="activities">Aktiviteler</TabsTrigger>
          <TabsTrigger value="letters">Mektuplarım</TabsTrigger>
          <TabsTrigger value="management">Yönetim</TabsTrigger>
          <TabsTrigger value="settings">Ayarlar</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <DashboardWidgets />
        </TabsContent>

        <TabsContent value="notifications">
          <ActivityNotifications />
        </TabsContent>

        <TabsContent value="social-groups">
          <SocialGroupsNav />
        </TabsContent>

        <TabsContent value="activities">
          <ActivityTimeline />
        </TabsContent>

        <TabsContent value="letters">
          <LetterHistory />
        </TabsContent>

        <TabsContent value="management">
          <div className="space-y-8">
            <ActivityManager />
            <GroupManager />
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Profil Ayarları</CardTitle>
              <CardDescription>
                Profil bilgilerinizi güncelleyin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Ayarlar paneli yükleniyor...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}