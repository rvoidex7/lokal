"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { 
  Bell, 
  BellRing,
  Calendar, 
  Users, 
  MessageSquare, 
  Heart,
  Check,
  X,
  Trash2,
  Filter,
  MoreVertical,
  ExternalLink
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import type { Notification } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"

interface NotificationWithActions extends Notification {
  loading?: boolean
}

interface NotificationBellProps {
  unreadCount: number
  onClick: () => void
}

export function NotificationBell({ unreadCount, onClick }: NotificationBellProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      onClick={onClick}
    >
      {unreadCount > 0 ? (
        <BellRing className="h-5 w-5" />
      ) : (
        <Bell className="h-5 w-5" />
      )}
      {unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs font-bold flex items-center justify-center"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  )
}

export function ActivityNotifications() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<NotificationWithActions[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'activity' | 'social'>('all')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  
  const supabase = createClient()

  const fetchNotifications = useCallback(async (pageNum = 1, currentFilter = filter, append = false) => {
    if (!user) return

    try {
      if (!append) setLoading(true)
      else setLoadingMore(true)

      const response = await fetch(
        `/api/notifications?page=${pageNum}&limit=20&filter=${currentFilter}&orderBy=created_at`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }

      const result = await response.json()
      
      if (result.success) {
        const newNotifications = result.data.notifications
        
        if (append) {
          setNotifications(prev => [...prev, ...newNotifications])
        } else {
          setNotifications(newNotifications)
        }
        
        setHasMore(result.data.pagination.hasMore)
        setPage(pageNum)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast({
        title: "Hata",
        description: "Bildirimler yüklenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [user, filter, toast])

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return

    try {
      const response = await fetch('/api/notifications/unread-count')
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setUnreadCount(result.data.count)
        }
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }, [user])

  const markAsRead = useCallback(async (notificationIds: string[]) => {
    if (!user || notificationIds.length === 0) return

    // Optimistic update
    setNotifications(prev => 
      prev.map(notif => 
        notificationIds.includes(notif.id) 
          ? { ...notif, is_read: true, loading: true }
          : notif
      )
    )

    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds,
          action: 'read'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to mark notifications as read')
      }

      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length))
      
      // Remove loading state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, loading: false }))
      )

    } catch (error) {
      console.error('Error marking as read:', error)
      // Revert optimistic update
      setNotifications(prev => 
        prev.map(notif => 
          notificationIds.includes(notif.id) 
            ? { ...notif, is_read: false, loading: false }
            : notif
        )
      )
      toast({
        title: "Hata",
        description: "Bildirimler okundu olarak işaretlenirken hata oluştu.",
        variant: "destructive",
      })
    }
  }, [user, toast])

  const deleteNotifications = useCallback(async (notificationIds: string[]) => {
    if (!user || notificationIds.length === 0) return

    // Optimistic update
    setNotifications(prev => 
      prev.map(notif => 
        notificationIds.includes(notif.id) 
          ? { ...notif, loading: true }
          : notif
      )
    )

    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds })
      })

      if (!response.ok) {
        throw new Error('Failed to delete notifications')
      }

      // Remove deleted notifications
      setNotifications(prev => 
        prev.filter(notif => !notificationIds.includes(notif.id))
      )

      // Update unread count
      const deletedUnreadCount = notifications
        .filter(n => notificationIds.includes(n.id) && !n.is_read)
        .length
      setUnreadCount(prev => Math.max(0, prev - deletedUnreadCount))

      toast({
        title: "Başarılı",
        description: `${notificationIds.length} bildirim silindi.`,
      })

    } catch (error) {
      console.error('Error deleting notifications:', error)
      // Revert optimistic update
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, loading: false }))
      )
      toast({
        title: "Hata",
        description: "Bildirimler silinirken hata oluştu.",
        variant: "destructive",
      })
    }
  }, [user, notifications, toast])

  const markAllAsRead = useCallback(async () => {
    const unreadNotifications = notifications.filter(n => !n.is_read)
    if (unreadNotifications.length === 0) return

    await markAsRead(unreadNotifications.map(n => n.id))
  }, [notifications, markAsRead])

  const handleFilterChange = useCallback((value: string) => {
    const newFilter = value as 'all' | 'unread' | 'activity' | 'social'
    setFilter(newFilter)
    setPage(1)
    fetchNotifications(1, newFilter, false)
  }, [fetchNotifications])

  const loadMore = useCallback(() => {
    if (hasMore && !loadingMore) {
      fetchNotifications(page + 1, filter, true)
    }
  }, [hasMore, loadingMore, page, filter, fetchNotifications])

  // Initial load
  useEffect(() => {
    if (user) {
      fetchNotifications()
      fetchUnreadCount()
    }
  }, [user, fetchNotifications, fetchUnreadCount])

  // Real-time updates
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new as Notification, ...prev])
            setUnreadCount(prev => prev + 1)
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev => 
              prev.map(notif => 
                notif.id === payload.new.id 
                  ? { ...notif, ...(payload.new as Notification) }
                  : notif
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => 
              prev.filter(notif => notif.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'activity_reminder_24h':
      case 'activity_reminder_1h':
      case 'new_activity':
      case 'activity_update':
        return <Calendar className="h-4 w-4" />
      case 'activity_cancelled':
        return <X className="h-4 w-4" />
      case 'social_interaction':
        return <Users className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'activity_reminder_24h':
      case 'activity_reminder_1h':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'new_activity':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'activity_cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'activity_update':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'social_interaction':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const getTypeLabel = (type: Notification['type']) => {
    switch (type) {
      case 'activity_reminder_24h':
        return '24h Hatırlatma'
      case 'activity_reminder_1h':
        return '1h Hatırlatma'
      case 'new_activity':
        return 'Yeni Etkinlik'
      case 'activity_cancelled':
        return 'İptal Edildi'
      case 'activity_update':
        return 'Güncellendi'
      case 'social_interaction':
        return 'Sosyal'
      default:
        return 'Sistem'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Bildirimler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Bildirimler</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
              >
                <Check className="h-4 w-4 mr-2" />
                Hepsini Okundu İşaretle
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={filter} onValueChange={handleFilterChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Tümü</TabsTrigger>
            <TabsTrigger value="unread">Okunmamış</TabsTrigger>
            <TabsTrigger value="activity">Etkinlik</TabsTrigger>
            <TabsTrigger value="social">Sosyal</TabsTrigger>
          </TabsList>
          
          <TabsContent value={filter} className="mt-4">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Henüz bildirim bulunmuyor</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                        !notification.is_read 
                          ? 'bg-muted/50 border-primary/20' 
                          : 'hover:bg-muted/30'
                      } ${notification.loading ? 'opacity-50' : ''}`}
                    >
                      <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-medium leading-none">
                                {notification.title}
                              </h4>
                              <Badge 
                                variant="secondary" 
                                className={`text-xs ${getNotificationColor(notification.type)}`}
                              >
                                {getTypeLabel(notification.type)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>
                                {formatDistanceToNow(new Date(notification.created_at), {
                                  addSuffix: true,
                                  locale: tr
                                })}
                              </span>
                              {!notification.is_read && (
                                <Badge variant="destructive" className="h-2 w-2 p-0 rounded-full" />
                              )}
                            </div>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8 w-8 p-0"
                                disabled={notification.loading}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!notification.is_read && (
                                <DropdownMenuItem
                                  onClick={() => markAsRead([notification.id])}
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Okundu İşaretle
                                </DropdownMenuItem>
                              )}
                              {notification.action_url && (
                                <DropdownMenuItem asChild>
                                  <a 
                                    href={notification.action_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Detaya Git
                                  </a>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => deleteNotifications([notification.id])}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Sil
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {hasMore && (
                    <div className="text-center pt-4">
                      <Button
                        variant="outline"
                        onClick={loadMore}
                        disabled={loadingMore}
                      >
                        {loadingMore ? (
                          <>Yükleniyor...</>
                        ) : (
                          <>Daha Fazla Yükle</>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}