"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { errorHandler } from "@/lib/error-handler"
import Link from "next/link"
import Image from "next/image"
import { 
  Users, 
  MessageCircle, 
  Calendar, 
  MapPin, 
  Clock,
  Bell,
  ExternalLink,
  UserMinus,
  Settings
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"
import type { SocialGroup, GroupMember, ClubComment } from "@/lib/types"

interface EnhancedSocialGroup extends SocialGroup {
  group_members?: GroupMember[]
  recent_comments?: ClubComment[]
  member_count: number
  unread_count: number
  user_role?: 'member' | 'admin'
  last_activity?: string
}

export function SocialGroupsNav() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [groups, setGroups] = useState<EnhancedSocialGroup[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  const fetchUserGroups = async () => {
    if (!user) return

    try {
      // Get user's group memberships
      const { data: memberships, error: membershipsError } = await supabase
        .from("group_members")
        .select(`
          group_id,
          role,
          joined_at,
          social_groups (
            id,
            name,
            description,
            category,
            recurring_day,
            time,
            location,
            max_members,
            image_url,
            is_active,
            created_at,
            updated_at
          )
        `)
        .eq("user_id", user.id)

      if (membershipsError) throw membershipsError

      if (!memberships || memberships.length === 0) {
        setGroups([])
        return
      }

      // Get member counts and recent activity for each group
      const groupIds = memberships.map(m => m.group_id)
      
      const { data: memberCounts, error: countsError } = await supabase
        .from("group_members")
        .select("group_id")
        .in("group_id", groupIds)

      if (countsError) throw countsError

      // Get recent comments for activity indicators
      const { data: recentComments, error: commentsError } = await supabase
        .from("club_comments")
        .select("group_id, created_at, user_name, content")
        .in("group_id", groupIds)
        .order("created_at", { ascending: false })
        .limit(50)

      if (commentsError) throw commentsError

      // Process the data
      const processedGroups = memberships.map(membership => {
        const group = (membership.social_groups as any) as SocialGroup
        const groupMemberCount = memberCounts?.filter(m => m.group_id === membership.group_id).length || 0
        const groupComments = recentComments?.filter(c => c.group_id === membership.group_id) || []
        
        // Calculate unread count (simplified - comments from last 7 days)
        const recentThreshold = new Date()
        recentThreshold.setDate(recentThreshold.getDate() - 7)
        const unreadCount = groupComments.filter(c => 
          new Date(c.created_at) > recentThreshold && c.user_name !== user.email?.split("@")[0]
        ).length

        const lastActivity = groupComments.length > 0 ? groupComments[0].created_at : group.updated_at

        return {
          ...group,
          member_count: groupMemberCount,
          unread_count: unreadCount,
          user_role: membership.role,
          last_activity: lastActivity,
          recent_comments: groupComments.slice(0, 3)
        }
      })

      setGroups(processedGroups as EnhancedSocialGroup[])

    } catch (error) {
      errorHandler.logError('Error fetching user groups', error)
      toast({
        title: "Hata",
        description: "Gruplar yüklenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserGroups()
  }, [user])

  const handleLeaveGroup = async (group: EnhancedSocialGroup) => {
    if (!user) return

    if (!confirm(`"${group.name}" grubundan ayrılmak istediğinizden emin misiniz?`)) return

    try {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", group.id)
        .eq("user_id", user.id)

      if (error) throw error

      toast({
        title: "Başarılı",
        description: `${group.name} grubundan ayrıldınız.`,
      })

      // Remove group from local state
      setGroups(prev => prev.filter(g => g.id !== group.id))

    } catch (error) {
      errorHandler.logError('Error leaving group', error)
      toast({
        title: "Hata",
        description: "Gruptan ayrılırken bir hata oluştu.",
        variant: "destructive",
      })
    }
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
    movie: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    yoga: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    book_club: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    art: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
    music: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    sports: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    cooking: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    technology: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
    language: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
    other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
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

  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="pt-8 pb-8">
          <div className="text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">Henüz grubunuz yok</h3>
            <p className="text-muted-foreground mb-4">
              İlgi alanlarınıza uygun gruplara katılarak toplulukla buluşun
            </p>
            <Button asChild>
              <Link href="/sosyal-gruplar">
                Grupları Keşfet
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-muted-foreground" />
          <div>
            <h2 className="text-xl font-semibold">Sosyal Gruplarım</h2>
            <p className="text-sm text-muted-foreground">
              Üye olduğunuz {groups.length} grup
            </p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href="/sosyal-gruplar">
            <ExternalLink className="w-4 h-4 mr-2" />
            Tüm Gruplar
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {groups.map(group => (
          <Card key={group.id} className="hover:shadow-md transition-shadow">
            {group.image_url && (
              <div className="relative h-32 w-full">
                <Image
                  src={group.image_url || "/placeholder.svg"}
                  alt={group.name}
                  fill
                  className="object-cover rounded-t-lg"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  {group.category && (
                    <Badge 
                      className={`${CATEGORY_COLORS[group.category] || CATEGORY_COLORS.other}`}
                    >
                      {CATEGORY_LABELS[group.category] || group.category}
                    </Badge>
                  )}
                  {group.user_role === 'admin' && (
                    <Badge variant="secondary">
                      <Settings className="w-3 h-3 mr-1" />
                      Yönetici
                    </Badge>
                  )}
                </div>
                {group.unread_count > 0 && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="destructive" className="px-2 py-1">
                      <Bell className="w-3 h-3 mr-1" />
                      {group.unread_count}
                    </Badge>
                  </div>
                )}
              </div>
            )}
            
            <CardHeader className={group.image_url ? "pb-3" : ""}>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-lg line-clamp-1">{group.name}</CardTitle>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {group.member_count} üye
                    </div>
                    {group.recurring_day && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {DAY_LABELS[group.recurring_day]}
                        {group.time && ` ${group.time}`}
                      </div>
                    )}
                    {group.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {group.location}
                      </div>
                    )}
                  </div>
                </div>
                {!group.image_url && (
                  <div className="flex flex-col items-end gap-2">
                    {group.category && (
                      <Badge 
                        className={`${CATEGORY_COLORS[group.category] || CATEGORY_COLORS.other}`}
                      >
                        {CATEGORY_LABELS[group.category] || group.category}
                      </Badge>
                    )}
                    {group.user_role === 'admin' && (
                      <Badge variant="secondary">
                        <Settings className="w-3 h-3 mr-1" />
                        Yönetici
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-gray-600 mb-4 line-clamp-2">{group.description}</p>
              
              {group.recent_comments && group.recent_comments.length > 0 && (
                <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    Son Aktivite
                  </h4>
                  <div className="space-y-1">
                    {group.recent_comments.slice(0, 2).map((comment, index) => (
                      <div key={index} className="text-xs text-muted-foreground">
                        <span className="font-medium">{comment.user_name}</span>: 
                        <span className="ml-1">
                          {comment.content.length > 50 
                            ? `${comment.content.substring(0, 50)}...` 
                            : comment.content
                          }
                        </span>
                      </div>
                    ))}
                    <div className="text-xs text-muted-foreground">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {formatDistanceToNow(new Date(group.last_activity || group.updated_at), {
                        addSuffix: true,
                        locale: tr,
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button asChild size="sm" className="flex-1">
                  <Link href={`/sosyal-gruplar/${group.id}`}>
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Grup Sayfası
                    {group.unread_count > 0 && (
                      <Badge variant="destructive" className="ml-2 px-1 py-0 text-xs">
                        {group.unread_count}
                      </Badge>
                    )}
                  </Link>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLeaveGroup(group)}
                  className="text-red-600 hover:text-red-700"
                >
                  <UserMinus className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}