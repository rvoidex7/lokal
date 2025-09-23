"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { useToast } from "@/hooks/use-toast"
import { errorHandler } from "@/lib/error-handler"
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Settings
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { tr } from "date-fns/locale"
import type { Activity, ActivityAttendance } from "@/lib/types"

interface ActivityWithAttendance extends Activity {
  attendance_list?: ActivityAttendance[]
  participant_count: number
}

export function ActivityManager() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [managedActivities, setManagedActivities] = useState<ActivityWithAttendance[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedActivity, setSelectedActivity] = useState<ActivityWithAttendance | null>(null)
  const [editingActivity, setEditingActivity] = useState<ActivityWithAttendance | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isParticipantsDialogOpen, setIsParticipantsDialogOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  const fetchManagedActivities = async () => {
    if (!user) return

    try {
      // Fetch activities managed by the user
      const { data, error } = await supabase
        .from("activities")
        .select(`
          *,
          activity_attendance (
            id,
            user_id,
            user_name,
            attended,
            checked_in_at,
            created_at
          )
        `)
        .eq("managed_by", user.id)
        .order("date_time", { ascending: true })

      if (error) throw error

      const processedActivities = (data || []).map(activity => ({
        ...activity,
        attendance_list: activity.activity_attendance,
        participant_count: activity.activity_attendance?.length || 0
      }))

      setManagedActivities(processedActivities)

    } catch (error) {
      errorHandler.logError('Error fetching managed activities', error)
      toast({
        title: "Hata",
        description: "Yönetilen aktiviteler yüklenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchManagedActivities()
  }, [user])

  const handleUpdateActivity = async (updatedData: Partial<Activity>) => {
    if (!editingActivity) return

    setActionLoading('update')
    try {
      const { error } = await supabase
        .from("activities")
        .update(updatedData)
        .eq("id", editingActivity.id)

      if (error) throw error

      toast({
        title: "Başarılı",
        description: "Aktivite güncellendi.",
      })

      fetchManagedActivities()
      setIsEditDialogOpen(false)
      setEditingActivity(null)

    } catch (error) {
      errorHandler.logError('Error updating activity', error)
      toast({
        title: "Hata",
        description: "Aktivite güncellenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleMarkAttendance = async (attendanceId: string, attended: boolean) => {
    setActionLoading(attendanceId)
    try {
      const { error } = await supabase
        .from("activity_attendance")
        .update({ 
          attended, 
          checked_in_at: attended ? new Date().toISOString() : null 
        })
        .eq("id", attendanceId)

      if (error) throw error

      toast({
        title: "Başarılı",
        description: `Katılım durumu ${attended ? 'onaylandı' : 'iptal edildi'}.`,
      })

      fetchManagedActivities()

    } catch (error) {
      errorHandler.logError('Error updating attendance', error)
      toast({
        title: "Hata",
        description: "Katılım durumu güncellenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelActivity = async (activity: ActivityWithAttendance) => {
    setActionLoading('cancel')
    try {
      const { error } = await supabase
        .from("activities")
        .update({ status: 'cancelled' })
        .eq("id", activity.id)

      if (error) throw error

      toast({
        title: "Başarılı",
        description: "Aktivite iptal edildi.",
      })

      fetchManagedActivities()

    } catch (error) {
      errorHandler.logError('Error cancelling activity', error)
      toast({
        title: "Hata",
        description: "Aktivite iptal edilirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const EditActivityDialog = () => {
    const [title, setTitle] = useState(editingActivity?.title || "")
    const [description, setDescription] = useState(editingActivity?.description || "")
    const [location, setLocation] = useState(editingActivity?.location || "")
    const [maxParticipants, setMaxParticipants] = useState(editingActivity?.max_participants?.toString() || "")
    const [dateTime, setDateTime] = useState(
      editingActivity ? format(parseISO(editingActivity.date_time), "yyyy-MM-dd'T'HH:mm") : ""
    )

    return (
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Aktiviteyi Düzenle</DialogTitle>
            <DialogDescription>
              Aktivite bilgilerini güncelleyin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Başlık</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Aktivite başlığı"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Açıklama</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Aktivite açıklaması"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Tarih & Saat</label>
                <Input
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Max Katılımcı</label>
                <Input
                  type="number"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                  placeholder="Sınır yok"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Konum</label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Aktivite konumu"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => handleUpdateActivity({
                  title,
                  description,
                  location: location || undefined,
                  date_time: new Date(dateTime).toISOString(),
                  max_participants: maxParticipants ? parseInt(maxParticipants) : undefined
                })}
                disabled={actionLoading === 'update' || !title.trim() || !description.trim() || !dateTime}
              >
                {actionLoading === 'update' ? "Güncelleniyor..." : "Güncelle"}
              </Button>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                İptal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const ParticipantsDialog = () => (
    <Dialog open={isParticipantsDialogOpen} onOpenChange={setIsParticipantsDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Katılımcılar</DialogTitle>
          <DialogDescription>
            {selectedActivity?.title} - Katılımcı listesi ve katılım durumu
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {selectedActivity?.attendance_list && selectedActivity.attendance_list.length > 0 ? (
            <div className="space-y-3">
              {selectedActivity.attendance_list.map(attendance => (
                <div key={attendance.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{attendance.user_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Kayıt: {format(parseISO(attendance.created_at), "d MMM yyyy", { locale: tr })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={attendance.attended ? 'default' : 'secondary'}>
                      {attendance.attended ? 'Katıldı' : 'Bekleniyor'}
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAttendance(attendance.id, true)}
                        disabled={actionLoading === attendance.id || attendance.attended}
                        className="text-green-600 hover:text-green-700"
                      >
                        <UserCheck className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAttendance(attendance.id, false)}
                        disabled={actionLoading === attendance.id || !attendance.attended}
                        className="text-red-600 hover:text-red-700"
                      >
                        <UserX className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-muted-foreground">Henüz katılımcı yok</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )

  const ActivityCard = ({ activity }: { activity: ActivityWithAttendance }) => {
    const activityDate = parseISO(activity.date_time)
    const isPastActivity = activityDate < new Date()
    const attendedCount = activity.attendance_list?.filter(a => a.attended).length || 0

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <CardTitle className="text-lg line-clamp-1">{activity.title}</CardTitle>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(activityDate, "d MMMM yyyy", { locale: tr })}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(activityDate, "HH:mm")}
                </div>
                {activity.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {activity.location}
                  </div>
                )}
              </div>
            </div>
            <Badge variant={
              activity.status === 'cancelled' ? 'destructive' : 
              isPastActivity ? 'secondary' : 'default'
            }>
              {activity.status === 'upcoming' && 'Yaklaşan'}
              {activity.status === 'completed' && 'Tamamlandı'}
              {activity.status === 'cancelled' && 'İptal Edildi'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4 line-clamp-2">{activity.description}</p>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>
                  {activity.participant_count} kayıtlı
                  {activity.max_participants && ` / ${activity.max_participants}`}
                </span>
              </div>
              {isPastActivity && (
                <div className="flex items-center gap-1 text-green-600">
                  <UserCheck className="w-4 h-4" />
                  <span>{attendedCount} katıldı</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedActivity(activity)
                setIsParticipantsDialogOpen(true)
              }}
            >
              <Users className="w-4 h-4 mr-1" />
              Katılımcılar ({activity.participant_count})
            </Button>

            {activity.status !== 'cancelled' && !isPastActivity && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingActivity(activity)
                    setIsEditDialogOpen(true)
                  }}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Düzenle
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4 mr-1" />
                      İptal Et
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Aktiviteyi İptal Et</AlertDialogTitle>
                      <AlertDialogDescription>
                        "{activity.title}" aktivitesini iptal etmek istediğinizden emin misiniz? 
                        Kayıtlı katılımcılara bildirim gönderilecek.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleCancelActivity(activity)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        İptal Et
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
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
      </div>
    )
  }

  const upcomingActivities = managedActivities.filter(a => 
    a.status === 'upcoming' && parseISO(a.date_time) > new Date()
  )
  const pastActivities = managedActivities.filter(a => 
    a.status === 'completed' || a.status === 'cancelled' || parseISO(a.date_time) <= new Date()
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-muted-foreground" />
        <div>
          <h2 className="text-xl font-semibold">Etkinlik Yönetimi</h2>
          <p className="text-sm text-muted-foreground">
            Yönettiğiniz {managedActivities.length} aktivite
          </p>
        </div>
      </div>

      {managedActivities.length === 0 ? (
        <Card>
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Yönettiğiniz aktivite yok</h3>
              <p className="text-muted-foreground">
                Size atanmış aktiviteler burada görünecek
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList>
            <TabsTrigger value="upcoming">
              Yaklaşan Aktiviteler ({upcomingActivities.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Geçmiş Aktiviteler ({pastActivities.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingActivities.length === 0 ? (
              <Card>
                <CardContent className="pt-8 pb-8">
                  <div className="text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">Yaklaşan aktivite yok</h3>
                    <p className="text-muted-foreground">
                      Yeni aktiviteler size atandığında burada görünecek
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {upcomingActivities.map(activity => (
                  <ActivityCard key={activity.id} activity={activity} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastActivities.length === 0 ? (
              <Card>
                <CardContent className="pt-8 pb-8">
                  <div className="text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">Geçmiş aktivite yok</h3>
                    <p className="text-muted-foreground">
                      Tamamlanan aktiviteleriniz burada görünecek
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pastActivities.map(activity => (
                  <ActivityCard key={activity.id} activity={activity} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <EditActivityDialog />
      <ParticipantsDialog />
    </div>
  )
}