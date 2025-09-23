"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { errorHandler } from "@/lib/error-handler"
import { 
  Activity,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  TrendingUp,
  Award,
  Download,
  Filter,
  Search,
  Star,
  Target,
  Flame,
  Trophy,
  Heart,
  Coffee,
  ChevronRight,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react"
import { format, parseISO, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns"
import { tr } from "date-fns/locale"
import type { Activity as ActivityType, ActivityAttendance, UserAchievement, ActivityStatistics, MonthlyActivityData } from "@/lib/types"
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from "recharts"
import { cn } from "@/lib/utils"

interface ActivityWithDetails extends ActivityType {
  attendance?: ActivityAttendance
  rating?: number
}

const ACHIEVEMENT_CONFIG = {
  first_activity: {
    name: "İlk Adım",
    description: "İlk aktiviteye katıldınız",
    icon: Star,
    color: "text-yellow-500"
  },
  ten_activities: {
    name: "Aktif Üye",
    description: "10+ aktiviteye katıldınız",
    icon: Trophy,
    color: "text-blue-500"
  },
  regular_attendee: {
    name: "Düzenli Katılımcı",
    description: "Her ay en az 3 aktiviteye katıldınız",
    icon: Target,
    color: "text-green-500"
  },
  social_butterfly: {
    name: "Sosyal Kelebek",
    description: "5+ farklı grupla aktiviteye katıldınız",
    icon: Users,
    color: "text-purple-500"
  },
  activity_streak: {
    name: "Ateşli Seri",
    description: "7 gün üst üste aktiviteye katıldınız",
    icon: Flame,
    color: "text-orange-500"
  }
}

const CHART_COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444']

export function UserActivityHistory() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [activities, setActivities] = useState<ActivityWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())
  const [statistics, setStatistics] = useState<ActivityStatistics | null>(null)
  const [achievements, setAchievements] = useState<UserAchievement[]>([])
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (user) {
      fetchActivityHistory()
      fetchAchievements()
    }
  }, [user])

  const fetchActivityHistory = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Fetch user's activity attendance with activity details
      const { data, error } = await supabase
        .from("activity_attendance")
        .select(`
          *,
          activities (
            id,
            title,
            description,
            activity_type,
            date_time,
            duration_hours,
            location,
            status,
            group_id
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      const processedActivities = (data || []).map(item => ({
        ...item.activities,
        attendance: {
          id: item.id,
          activity_id: item.activity_id,
          user_id: item.user_id,
          user_name: item.user_name,
          attended: item.attended,
          checked_in_at: item.checked_in_at,
          created_at: item.created_at
        }
      }))

      setActivities(processedActivities)
      calculateStatistics(processedActivities)

    } catch (error) {
      errorHandler.logError('Error fetching activity history', error)
      toast({
        title: "Hata",
        description: "Aktivite geçmişi yüklenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAchievements = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", user.id)

      if (error) throw error
      setAchievements(data || [])

    } catch (error) {
      errorHandler.logError('Error fetching achievements', error)
    }
  }

  const calculateStatistics = (activityList: ActivityWithDetails[]) => {
    const attendedActivities = activityList.filter(a => a.attendance?.attended)
    
    // Calculate category distribution
    const categoryCount: Record<string, number> = {}
    attendedActivities.forEach(activity => {
      const category = activity.activity_type || 'Diğer'
      categoryCount[category] = (categoryCount[category] || 0) + 1
    })

    // Calculate monthly trend
    const monthlyData: Record<string, MonthlyActivityData> = {}
    attendedActivities.forEach(activity => {
      const month = format(parseISO(activity.date_time), 'yyyy-MM')
      if (!monthlyData[month]) {
        monthlyData[month] = { month, count: 0, hours: 0 }
      }
      monthlyData[month].count++
      monthlyData[month].hours += activity.duration_hours || 2
    })

    // Get favorite types (top 3)
    const sortedCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category)

    // Calculate streak
    let currentStreak = 0
    let maxStreak = 0
    const sortedDates = attendedActivities
      .map(a => parseISO(a.date_time))
      .sort((a, b) => a.getTime() - b.getTime())

    for (let i = 1; i < sortedDates.length; i++) {
      const daysDiff = differenceInDays(sortedDates[i], sortedDates[i-1])
      if (daysDiff <= 1) {
        currentStreak++
        maxStreak = Math.max(maxStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    }

    const stats: ActivityStatistics = {
      total_activities: attendedActivities.length,
      activities_by_category: categoryCount,
      monthly_trend: Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month)),
      favorite_types: sortedCategories,
      streak_days: maxStreak,
      total_hours: attendedActivities.reduce((sum, a) => sum + (a.duration_hours || 2), 0)
    }

    setStatistics(stats)
    checkForNewAchievements(stats, attendedActivities)
  }

  const checkForNewAchievements = async (stats: ActivityStatistics, activities: ActivityWithDetails[]) => {
    if (!user) return

    const newAchievements: Partial<UserAchievement>[] = []

    // Check for first activity
    if (stats.total_activities === 1 && !achievements.find(a => a.achievement_type === 'first_activity')) {
      newAchievements.push({
        user_id: user.id,
        achievement_type: 'first_activity',
        earned_at: new Date().toISOString()
      })
    }

    // Check for 10+ activities
    if (stats.total_activities >= 10 && !achievements.find(a => a.achievement_type === 'ten_activities')) {
      newAchievements.push({
        user_id: user.id,
        achievement_type: 'ten_activities',
        earned_at: new Date().toISOString()
      })
    }

    // Check for social butterfly (5+ different groups)
    const uniqueGroups = new Set(activities.filter(a => a.group_id).map(a => a.group_id))
    if (uniqueGroups.size >= 5 && !achievements.find(a => a.achievement_type === 'social_butterfly')) {
      newAchievements.push({
        user_id: user.id,
        achievement_type: 'social_butterfly',
        earned_at: new Date().toISOString()
      })
    }

    // Check for activity streak
    if (stats.streak_days >= 7 && !achievements.find(a => a.achievement_type === 'activity_streak')) {
      newAchievements.push({
        user_id: user.id,
        achievement_type: 'activity_streak',
        earned_at: new Date().toISOString()
      })
    }

    // Save new achievements
    if (newAchievements.length > 0) {
      try {
        const { error } = await supabase
          .from("user_achievements")
          .insert(newAchievements)

        if (!error) {
          toast({
            title: "Yeni Başarı!",
            description: `${newAchievements.length} yeni başarı kazandınız!`,
          })
          fetchAchievements()
        }
      } catch (error) {
        errorHandler.logError('Error saving achievements', error)
      }
    }
  }


  const exportToCSV = () => {
    const headers = ['Tarih', 'Aktivite', 'Kategori', 'Konum', 'Süre', 'Katılım']
    const data = activities.map(activity => [
      format(parseISO(activity.date_time), 'dd.MM.yyyy HH:mm'),
      activity.title,
      activity.activity_type || 'Diğer',
      activity.location || '-',
      activity.duration_hours ? `${activity.duration_hours}` : '2',
      activity.attendance?.attended ? 'Katıldı' : 'Katılmadı'
    ])

    const csvContent = [
      headers.join(','),
      ...data.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'aktivite-gecmisi.csv'
    link.click()

    toast({
      title: "Başarılı",
      description: "CSV dosyası indirildi",
    })
  }

  const filteredActivities = activities.filter(activity => {
    const matchesCategory = filterCategory === "all" || activity.activity_type === filterCategory
    const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         activity.description?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const calendarActivities = activities.filter(activity => {
    const activityDate = parseISO(activity.date_time)
    return activityDate.getMonth() === selectedMonth.getMonth() &&
           activityDate.getFullYear() === selectedMonth.getFullYear()
  })

  const uniqueCategories = Array.from(new Set(activities.map(a => a.activity_type).filter(Boolean)))

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="h-20 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-muted-foreground" />
          <div>
            <h2 className="text-xl font-semibold">Aktivite Geçmişi</h2>
            <p className="text-sm text-muted-foreground">
              Toplam {statistics?.total_activities || 0} aktiviteye katıldınız
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Toplam Aktivite</p>
                  <p className="text-2xl font-bold">{statistics.total_activities}</p>
                </div>
                <Activity className="w-8 h-8 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Toplam Saat</p>
                  <p className="text-2xl font-bold">{statistics.total_hours}</p>
                </div>
                <Clock className="w-8 h-8 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">En Uzun Seri</p>
                  <p className="text-2xl font-bold">{statistics.streak_days} gün</p>
                </div>
                <Flame className="w-8 h-8 text-orange-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Başarılar</p>
                  <p className="text-2xl font-bold">{achievements.length}</p>
                </div>
                <Trophy className="w-8 h-8 text-yellow-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Başarılarınız
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {achievements.map(achievement => {
                const config = ACHIEVEMENT_CONFIG[achievement.achievement_type]
                const Icon = config.icon
                return (
                  <div
                    key={achievement.id}
                    className="flex flex-col items-center text-center p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <Icon className={cn("w-12 h-12 mb-2", config.color)} />
                    <p className="font-medium text-sm">{config.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {config.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(parseISO(achievement.earned_at), 'd MMM yyyy', { locale: tr })}
                    </p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      {statistics && statistics.total_activities > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5" />
                Kategori Dağılımı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(statistics.activities_by_category).map(([category, count]) => ({
                      name: category,
                      value: count
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.entries(statistics.activities_by_category).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Aylık Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={statistics.monthly_trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={(value) => {
                      const [year, month] = value.split('-')
                      return format(new Date(year, parseInt(month) - 1), 'MMM', { locale: tr })
                    }}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => {
                      const [year, month] = value.split('-')
                      return format(new Date(year, parseInt(month) - 1), 'MMMM yyyy', { locale: tr })
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#8B5CF6" 
                    name="Aktivite Sayısı"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="hours" 
                    stroke="#EC4899" 
                    name="Toplam Saat"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activity List/Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Aktiviteler</CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-40"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Kategoriler</SelectItem>
                  {uniqueCategories.map(category => (
                    <SelectItem key={category} value={category || ''}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "calendar")}>
                <TabsList>
                  <TabsTrigger value="list">Liste</TabsTrigger>
                  <TabsTrigger value="calendar">Takvim</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "list" ? (
            <div className="space-y-4">
              {filteredActivities.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-muted-foreground">Aktivite bulunamadı</p>
                </div>
              ) : (
                filteredActivities.map(activity => (
                  <div
                    key={activity.id}
                    className={cn(
                      "flex items-center justify-between p-4 border rounded-lg",
                      activity.attendance?.attended && "bg-green-50 border-green-200"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "p-2 rounded-lg",
                        activity.attendance?.attended ? "bg-green-100" : "bg-gray-100"
                      )}>
                        <CalendarIcon className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">{activity.title}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" />
                            {format(parseISO(activity.date_time), 'd MMMM yyyy', { locale: tr })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(parseISO(activity.date_time), 'HH:mm')}
                          </span>
                          {activity.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {activity.location}
                            </span>
                          )}
                        </div>
                        {activity.activity_type && (
                          <Badge variant="outline" className="mt-1">
                            {activity.activity_type}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {activity.attendance?.attended ? (
                        <Badge className="bg-green-600">
                          <Trophy className="w-3 h-3 mr-1" />
                          Katıldı
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Kayıtlı</Badge>
                      )}
                      {activity.duration_hours && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {activity.duration_hours} saat
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
                >
                  &larr;
                </Button>
                <h3 className="mx-4 font-medium">
                  {format(selectedMonth, 'MMMM yyyy', { locale: tr })}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
                >
                  &rarr;
                </Button>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
                {eachDayOfInterval({
                  start: startOfMonth(selectedMonth),
                  end: endOfMonth(selectedMonth)
                }).map(day => {
                  const dayActivities = calendarActivities.filter(a => 
                    isSameDay(parseISO(a.date_time), day)
                  )
                  const hasAttended = dayActivities.some(a => a.attendance?.attended)
                  
                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "aspect-square border rounded-lg p-2 relative",
                        dayActivities.length > 0 && "bg-primary/5 border-primary/20",
                        hasAttended && "bg-green-50 border-green-200"
                      )}
                    >
                      <span className="text-sm">{format(day, 'd')}</span>
                      {dayActivities.length > 0 && (
                        <div className="absolute bottom-1 right-1">
                          <Badge variant="secondary" className="text-xs px-1">
                            {dayActivities.length}
                          </Badge>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Bu Aydaki Aktiviteler</h4>
                <div className="space-y-2">
                  {calendarActivities.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Bu ayda aktivite yok</p>
                  ) : (
                    calendarActivities.map(activity => (
                      <div key={activity.id} className="flex items-center gap-2 text-sm">
                        <span className="font-medium">
                          {format(parseISO(activity.date_time), 'd')}
                        </span>
                        <span>{activity.title}</span>
                        {activity.attendance?.attended && (
                          <Badge variant="outline" className="text-xs">Katıldı</Badge>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}