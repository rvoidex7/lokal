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
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { errorHandler } from "@/lib/error-handler"
import { 
  Users, 
  Settings, 
  UserMinus,
  UserPlus,
  MessageCircle,
  Pin,
  PinOff,
  Edit,
  Crown,
  Shield
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"
import type { SocialGroup, GroupMember, ClubComment, MembershipRequest } from "@/lib/types"

interface ManagedGroup extends SocialGroup {
  group_members?: GroupMember[]
  member_count: number
  pending_requests?: MembershipRequest[]
  recent_comments?: ClubComment[]
}

export function GroupManager() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [managedGroups, setManagedGroups] = useState<ManagedGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState<ManagedGroup | null>(null)
  const [selectedComment, setSelectedComment] = useState<ClubComment | null>(null)
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false)
  const [isRequestsDialogOpen, setIsRequestsDialogOpen] = useState(false)
  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  const fetchManagedGroups = async () => {
    if (!user) return

    try {
      // Get groups where user is admin
      const { data: groupMemberships, error: membershipError } = await supabase
        .from("group_members")
        .select(`
          group_id,
          role,
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
        .eq("role", "admin")

      if (membershipError) throw membershipError

      if (!groupMemberships || groupMemberships.length === 0) {
        setManagedGroups([])
        return
      }

      const groupIds = groupMemberships.map(m => m.group_id)

      // Get all members for these groups
      const { data: allMembers, error: membersError } = await supabase
        .from("group_members")
        .select("*")
        .in("group_id", groupIds)
        .order("joined_at", { ascending: false })

      if (membersError) throw membersError

      // Get pending membership requests
      const { data: pendingRequests, error: requestsError } = await supabase
        .from("membership_requests")
        .select("*")
        .in("group_id", groupIds)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      if (requestsError) throw requestsError

      // Get recent comments
      const { data: recentComments, error: commentsError } = await supabase
        .from("club_comments")
        .select("*")
        .in("group_id", groupIds)
        .order("created_at", { ascending: false })
        .limit(100)

      if (commentsError) throw commentsError

      // Process the data
      const processedGroups = groupMemberships.map(membership => {
        const group = (membership.social_groups as any) as SocialGroup
        const groupMembers = allMembers?.filter(m => m.group_id === group.id) || []
        const groupRequests = pendingRequests?.filter(r => r.group_id === group.id) || []
        const groupComments = recentComments?.filter(c => c.group_id === group.id) || []

        return {
          ...group,
          group_members: groupMembers,
          member_count: groupMembers.length,
          pending_requests: groupRequests,
          recent_comments: groupComments.slice(0, 10)
        }
      })

      setManagedGroups(processedGroups)

    } catch (error) {
      errorHandler.logError('Error fetching managed groups', error)
      toast({
        title: "Hata",
        description: "Yönetilen gruplar yüklenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchManagedGroups()
  }, [user])

  const handleApproveRequest = async (request: MembershipRequest) => {
    setActionLoading(request.id)
    try {
      // Update request status
      const { error: requestError } = await supabase
        .from("membership_requests")
        .update({ 
          status: 'approved',
          reviewed_by: user!.id,
          reviewed_at: new Date().toISOString()
        })
        .eq("id", request.id)

      if (requestError) throw requestError

      // Add user to group
      const { error: memberError } = await supabase
        .from("group_members")
        .insert({
          group_id: request.group_id,
          user_id: request.user_id,
          user_name: request.user_name,
          user_email: request.user_email,
          role: 'member'
        })

      if (memberError) throw memberError

      toast({
        title: "Başarılı",
        description: `${request.user_name} gruba eklendi.`,
      })

      fetchManagedGroups()

    } catch (error) {
      errorHandler.logError('Error approving request', error)
      toast({
        title: "Hata",
        description: "Üyelik talebi onaylanırken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectRequest = async (request: MembershipRequest) => {
    setActionLoading(request.id)
    try {
      const { error } = await supabase
        .from("membership_requests")
        .update({ 
          status: 'rejected',
          reviewed_by: user!.id,
          reviewed_at: new Date().toISOString()
        })
        .eq("id", request.id)

      if (error) throw error

      toast({
        title: "Başarılı",
        description: "Üyelik talebi reddedildi.",
      })

      fetchManagedGroups()

    } catch (error) {
      errorHandler.logError('Error rejecting request', error)
      toast({
        title: "Hata",
        description: "Üyelik talebi reddedilirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemoveMember = async (member: GroupMember) => {
    if (!confirm(`${member.user_name} kullanıcısını gruptan çıkarmak istediğinizden emin misiniz?`)) return

    setActionLoading(member.id)
    try {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("id", member.id)

      if (error) throw error

      toast({
        title: "Başarılı",
        description: `${member.user_name} gruptan çıkarıldı.`,
      })

      fetchManagedGroups()

    } catch (error) {
      errorHandler.logError('Error removing member', error)
      toast({
        title: "Hata",
        description: "Üye çıkarılırken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handlePinComment = async (comment: ClubComment, pinned: boolean) => {
    setActionLoading(comment.id)
    try {
      const { error } = await supabase
        .from("club_comments")
        .update({ is_pinned: pinned })
        .eq("id", comment.id)

      if (error) throw error

      toast({
        title: "Başarılı",
        description: pinned ? "Yorum sabitlendi." : "Yorum sabitleme kaldırıldı.",
      })

      fetchManagedGroups()

    } catch (error) {
      errorHandler.logError('Error updating comment pin status', error)
      toast({
        title: "Hata",
        description: "Yorum durumu güncellenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const MembersDialog = () => (
    <Dialog open={isMembersDialogOpen} onOpenChange={setIsMembersDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Grup Üyeleri</DialogTitle>
          <DialogDescription>
            {selectedGroup?.name} - {selectedGroup?.member_count} üye
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {selectedGroup?.group_members && selectedGroup.group_members.length > 0 ? (
            <div className="space-y-3">
              {selectedGroup.group_members.map(member => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {member.user_name}
                        {member.role === 'admin' && (
                          <Badge variant="secondary">
                            <Crown className="w-3 h-3 mr-1" />
                            Yönetici
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{member.user_email}</p>
                      <p className="text-xs text-muted-foreground">
                        Katıldı: {formatDistanceToNow(new Date(member.joined_at), {
                          addSuffix: true,
                          locale: tr
                        })}
                      </p>
                    </div>
                  </div>
                  {member.user_id !== user?.id && member.role !== 'admin' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveMember(member)}
                      disabled={actionLoading === member.id}
                      className="text-red-600 hover:text-red-700"
                    >
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-muted-foreground">Henüz üye yok</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )

  const RequestsDialog = () => (
    <Dialog open={isRequestsDialogOpen} onOpenChange={setIsRequestsDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Üyelik Talepleri</DialogTitle>
          <DialogDescription>
            {selectedGroup?.name} - Bekleyen {selectedGroup?.pending_requests?.length || 0} talep
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {selectedGroup?.pending_requests && selectedGroup.pending_requests.length > 0 ? (
            <div className="space-y-3">
              {selectedGroup.pending_requests.map(request => (
                <div key={request.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium">{request.user_name}</p>
                      <p className="text-xs text-muted-foreground">{request.user_email}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(request.created_at), {
                          addSuffix: true,
                          locale: tr
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproveRequest(request)}
                        disabled={actionLoading === request.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Onayla
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectRequest(request)}
                        disabled={actionLoading === request.id}
                        className="text-red-600 hover:text-red-700"
                      >
                        Reddet
                      </Button>
                    </div>
                  </div>
                  {request.request_message && (
                    <div className="p-2 bg-muted/50 rounded text-sm">
                      <p className="font-medium mb-1">Mesaj:</p>
                      <p>{request.request_message}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <UserPlus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-muted-foreground">Bekleyen talep yok</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )

  const CommentsDialog = () => (
    <Dialog open={isCommentsDialogOpen} onOpenChange={setIsCommentsDialogOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Yorum Yönetimi</DialogTitle>
          <DialogDescription>
            {selectedGroup?.name} - Son yorumlar ve moderasyon
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {selectedGroup?.recent_comments && selectedGroup.recent_comments.length > 0 ? (
            <div className="space-y-3">
              {selectedGroup.recent_comments.map(comment => (
                <div key={comment.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{comment.user_name}</p>
                      {comment.is_pinned && (
                        <Badge variant="secondary">
                          <Pin className="w-3 h-3 mr-1" />
                          Sabitlenmiş
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePinComment(comment, !comment.is_pinned)}
                        disabled={actionLoading === comment.id}
                      >
                        {comment.is_pinned ? (
                          <>
                            <PinOff className="w-4 h-4 mr-1" />
                            Sabitlemeyi Kaldır
                          </>
                        ) : (
                          <>
                            <Pin className="w-4 h-4 mr-1" />
                            Sabitle
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-2">{comment.content}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                      locale: tr
                    })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-muted-foreground">Henüz yorum yok</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          {[1, 2].map(i => (
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

  if (managedGroups.length === 0) {
    return (
      <Card>
        <CardContent className="pt-8 pb-8">
          <div className="text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">Yönettiğiniz grup yok</h3>
            <p className="text-muted-foreground">
              Grup yöneticisi olduğunuz gruplar burada görünecek
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-muted-foreground" />
        <div>
          <h2 className="text-xl font-semibold">Grup Yönetimi</h2>
          <p className="text-sm text-muted-foreground">
            Yönettiğiniz {managedGroups.length} grup
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {managedGroups.map(group => (
          <Card key={group.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {group.name}
                    <Badge variant="secondary">
                      <Crown className="w-3 h-3 mr-1" />
                      Yönetici
                    </Badge>
                  </CardTitle>
                  <CardDescription>{group.description}</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    {group.member_count} üye
                  </p>
                  {group.pending_requests && group.pending_requests.length > 0 && (
                    <Badge variant="destructive">
                      {group.pending_requests.length} talep
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedGroup(group)
                    setIsMembersDialogOpen(true)
                  }}
                  className="flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Üyeler ({group.member_count})
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedGroup(group)
                    setIsRequestsDialogOpen(true)
                  }}
                  className="flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Talepler ({group.pending_requests?.length || 0})
                  {group.pending_requests && group.pending_requests.length > 0 && (
                    <Badge variant="destructive" className="ml-1">
                      {group.pending_requests.length}
                    </Badge>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedGroup(group)
                    setIsCommentsDialogOpen(true)
                  }}
                  className="flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Yorumlar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <MembersDialog />
      <RequestsDialog />
      <CommentsDialog />
    </div>
  )
}