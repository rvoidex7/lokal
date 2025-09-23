"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { errorHandler } from "@/lib/error-handler"
import { 
  Users, 
  UserPlus, 
  UserCheck,
  Search,
  Filter,
  Calendar,
  Activity,
  Heart,
  Eye,
  EyeOff,
  Clock,
  Star,
  ChevronDown,
  UserX
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { tr } from "date-fns/locale"
import type { ActivityParticipant, UserProfileExtended, PrivacySettings, UserConnection } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ParticipantWithProfile extends ActivityParticipant {
  profile?: UserProfileExtended
  privacy?: PrivacySettings
  connection?: UserConnection
  mutualActivitiesCount?: number
  isGoingWithFriends?: boolean
  friendsGoing?: string[]
}

interface ActivityParticipantsProps {
  activityId: string
  organizerId?: string
  maxParticipants?: number
  activityDate: string
}

export function ActivityParticipants({ 
  activityId, 
  organizerId,
  maxParticipants,
  activityDate
}: ActivityParticipantsProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [participants, setParticipants] = useState<ParticipantWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "date" | "friends">("date")
  const [showOnlyFriends, setShowOnlyFriends] = useState(false)
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantWithProfile | null>(null)
  const [followingUsers, setFollowingUsers] = useState<string[]>([])
  const [loadingConnection, setLoadingConnection] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    fetchParticipants()
    if (user) {
      fetchUserConnections()
    }
  }, [activityId, user])

  const fetchParticipants = async () => {
    try {
      setLoading(true)

      // Fetch participants with their profiles
      const { data: participantsData, error: participantsError } = await supabase
        .from("activity_attendance")
        .select(`
          *,
          user_profiles!user_id (
            *
          ),
          privacy_settings!user_id (
            *
          )
        `)
        .eq("activity_id", activityId)
        .order("created_at", { ascending: true })

      if (participantsError) throw participantsError

      // Process participants data
      const processedParticipants: ParticipantWithProfile[] = await Promise.all(
        (participantsData || []).map(async (participant) => {
          let mutualCount = 0
          let friendsGoing: string[] = []

          if (user) {
            // Fetch mutual activities count
            const { count } = await supabase
              .from("activity_attendance")
              .select("*", { count: 'exact', head: true })
              .eq("user_id", participant.user_id)
              .in("activity_id", await getUserActivities(user.id))

            mutualCount = count || 0

            // Check if going with friends
            if (participant.user_id === user.id) {
              const friends = await getFriendsInActivity(activityId)
              friendsGoing = friends
            }
          }

          return {
            id: participant.id,
            activity_id: participant.activity_id,
            user_id: participant.user_id,
            user_name: participant.user_name,
            user_avatar: participant.user_profiles?.avatar_url,
            registration_date: participant.created_at,
            attended: participant.attended,
            profile: participant.user_profiles,
            privacy: participant.privacy_settings,
            mutualActivitiesCount: mutualCount,
            isGoingWithFriends: friendsGoing.length > 0,
            friendsGoing
          }
        })
      )

      setParticipants(processedParticipants)

    } catch (error) {
      errorHandler.logError('Error fetching participants', error)
      toast({
        title: "Hata",
        description: "Katılımcılar yüklenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchUserConnections = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("user_connections")
        .select("following_id")
        .eq("follower_id", user.id)

      if (!error && data) {
        setFollowingUsers(data.map(c => c.following_id))
      }
    } catch (error) {
      errorHandler.logError('Error fetching connections', error)
    }
  }

  const getUserActivities = async (userId: string): Promise<string[]> => {
    const { data } = await supabase
      .from("activity_attendance")
      .select("activity_id")
      .eq("user_id", userId)

    return data?.map(a => a.activity_id) || []
  }

  const getFriendsInActivity = async (activityId: string): Promise<string[]> => {
    if (!user) return []

    const { data } = await supabase
      .from("activity_attendance")
      .select("user_name")
      .eq("activity_id", activityId)
      .in("user_id", followingUsers)

    return data?.map(a => a.user_name) || []
  }

  const handleFollowUser = async (targetUserId: string, currentlyFollowing: boolean) => {
    if (!user || targetUserId === user.id) return

    setLoadingConnection(targetUserId)
    try {
      if (currentlyFollowing) {
        // Unfollow
        const { error } = await supabase
          .from("user_connections")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId)

        if (error) throw error

        setFollowingUsers(prev => prev.filter(id => id !== targetUserId))
        toast({
          title: "Başarılı",
          description: "Takip bırakıldı",
        })
      } else {
        // Follow
        const { error } = await supabase
          .from("user_connections")
          .insert({
            follower_id: user.id,
            following_id: targetUserId,
            connection_type: 'follow'
          })

        if (error) throw error

        setFollowingUsers(prev => [...prev, targetUserId])
        toast({
          title: "Başarılı",
          description: "Takip edildi",
        })
      }
    } catch (error) {
      errorHandler.logError('Error updating connection', error)
      toast({
        title: "Hata",
        description: "İşlem sırasında bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setLoadingConnection(null)
    }
  }

  const sortedAndFilteredParticipants = useMemo(() => {
    let filtered = participants.filter(p => {
      // Check privacy settings
      if (p.privacy && !p.privacy.show_profile && p.user_id !== user?.id) {
        return false
      }

      // Search filter
      if (searchQuery) {
        return p.user_name.toLowerCase().includes(searchQuery.toLowerCase())
      }

      return true
    })

    // Friends filter
    if (showOnlyFriends && user) {
      filtered = filtered.filter(p => 
        followingUsers.includes(p.user_id) || p.user_id === user.id
      )
    }

    // Sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.user_name.localeCompare(b.user_name, 'tr')
        case "date":
          return new Date(a.registration_date).getTime() - new Date(b.registration_date).getTime()
        case "friends":
          const aIsFriend = followingUsers.includes(a.user_id)
          const bIsFriend = followingUsers.includes(b.user_id)
          if (aIsFriend && !bIsFriend) return -1
          if (!aIsFriend && bIsFriend) return 1
          return 0
        default:
          return 0
      }
    })
  }, [participants, searchQuery, sortBy, showOnlyFriends, followingUsers, user])

  const ParticipantCard = ({ participant }: { participant: ParticipantWithProfile }) => {
    const isCurrentUser = user?.id === participant.user_id
    const isOrganizer = organizerId === participant.user_id
    const isFollowing = followingUsers.includes(participant.user_id)
    const canViewProfile = participant.privacy?.show_profile !== false || isCurrentUser

    return (
      <div className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <HoverCard>
            <HoverCardTrigger asChild>
              <Avatar className="cursor-pointer">
                <AvatarImage src={participant.user_avatar} />
                <AvatarFallback>
                  {participant.user_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </HoverCardTrigger>
            {canViewProfile && (
              <HoverCardContent className="w-80">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={participant.user_avatar} />
                        <AvatarFallback>
                          {participant.user_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{participant.user_name}</p>
                        {participant.profile?.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {participant.profile.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {participant.mutualActivitiesCount && participant.mutualActivitiesCount > 0 && !isCurrentUser && (
                    <div className="flex items-center gap-2 text-sm">
                      <Activity className="w-4 h-4" />
                      <span>{participant.mutualActivitiesCount} ortak aktivite</span>
                    </div>
                  )}
                  
                  {participant.profile?.interests && participant.profile.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {participant.profile.interests.slice(0, 3).map(interest => (
                        <Badge key={interest} variant="outline" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                      {participant.profile.interests.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{participant.profile.interests.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {!isCurrentUser && user && (
                    <Button
                      size="sm"
                      variant={isFollowing ? "outline" : "default"}
                      onClick={() => handleFollowUser(participant.user_id, isFollowing)}
                      disabled={loadingConnection === participant.user_id}
                      className="w-full"
                    >
                      {loadingConnection === participant.user_id ? (
                        "İşleniyor..."
                      ) : isFollowing ? (
                        <>
                          <UserCheck className="w-4 h-4 mr-2" />
                          Takip Ediliyor
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Takip Et
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </HoverCardContent>
            )}
          </HoverCard>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium">{participant.user_name}</p>
              {isOrganizer && (
                <Badge variant="secondary" className="text-xs">
                  <Star className="w-3 h-3 mr-1" />
                  Organizatör
                </Badge>
              )}
              {isCurrentUser && (
                <Badge className="text-xs">Sen</Badge>
              )}
              {isFollowing && !isCurrentUser && (
                <Badge variant="outline" className="text-xs">
                  <Heart className="w-3 h-3 mr-1 fill-current" />
                  Arkadaş
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Kayıt: {format(parseISO(participant.registration_date), 'd MMMM yyyy', { locale: tr })}
            </p>
            {participant.isGoingWithFriends && participant.friendsGoing && participant.friendsGoing.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                <Users className="w-3 h-3 inline mr-1" />
                {participant.friendsGoing.slice(0, 2).join(', ')}
                {participant.friendsGoing.length > 2 && ` ve ${participant.friendsGoing.length - 2} kişi`} ile katılıyor
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {participant.attended && (
            <Badge className="bg-green-600">
              <UserCheck className="w-3 h-3 mr-1" />
              Katıldı
            </Badge>
          )}
          {participant.mutualActivitiesCount && participant.mutualActivitiesCount > 0 && !isCurrentUser && (
            <Badge variant="outline">
              {participant.mutualActivitiesCount} ortak
            </Badge>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Katılımcılar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const isPastActivity = new Date(activityDate) < new Date()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Katılımcılar
            </CardTitle>
            <CardDescription>
              {participants.length} kişi kayıtlı
              {maxParticipants && ` / ${maxParticipants} maksimum`}
              {isPastActivity && ` • ${participants.filter(p => p.attended).length} kişi katıldı`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOnlyFriends(!showOnlyFriends)}
                className={cn(showOnlyFriends && "bg-primary/10")}
              >
                <Heart className={cn("w-4 h-4", showOnlyFriends && "fill-current")} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Katılımcı ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sırala" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Kayıt Tarihi</SelectItem>
                <SelectItem value="name">İsim</SelectItem>
                <SelectItem value="friends">Arkadaşlar Önce</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Going with friends indicator */}
          {user && participants.find(p => p.user_id === user.id)?.isGoingWithFriends && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                {participants.find(p => p.user_id === user.id)?.friendsGoing?.length} arkadaşınla birlikte katılıyorsun!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {participants.find(p => p.user_id === user.id)?.friendsGoing?.join(', ')}
              </p>
            </div>
          )}

          {/* Participants List */}
          <div className="space-y-3">
            {sortedAndFilteredParticipants.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-muted-foreground">
                  {searchQuery ? "Katılımcı bulunamadı" : "Henüz katılımcı yok"}
                </p>
              </div>
            ) : (
              sortedAndFilteredParticipants.map(participant => (
                <ParticipantCard key={participant.id} participant={participant} />
              ))
            )}
          </div>

          {/* Privacy notice */}
          {participants.length > sortedAndFilteredParticipants.length && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center py-2">
              <EyeOff className="w-4 h-4" />
              <span>
                {participants.length - sortedAndFilteredParticipants.length} katılımcı gizlilik ayarları nedeniyle gösterilmiyor
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}