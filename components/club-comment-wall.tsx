"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { 
  MessageSquare, 
  Send, 
  Heart, 
  ThumbsUp,
  Smile,
  Star,
  MoreVertical,
  Edit2,
  Trash2,
  Pin,
  Clock
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"
import type { ClubComment, CommentReaction } from "@/lib/types"

interface ClubCommentWallProps {
  groupId: string
  groupName: string
}

const reactionIcons = {
  like: ThumbsUp,
  heart: Heart,
  applause: Star,
  thinking: Smile,
}

export function ClubCommentWall({ groupId, groupName }: ClubCommentWallProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [comments, setComments] = useState<ClubComment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [isMember, setIsMember] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const supabase = useMemo(() => createClient(), [])

  // Check if user is a member of the group
  const checkMembership = useCallback(async () => {
    if (!user) {
      setIsMember(false)
      return
    }

    try {
      // Check group membership
      const { data: membership } = await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .single()

      setIsMember(!!membership)

      // Check admin status
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("user_id", user.id)
        .single()

      setIsAdmin(profile?.role === 'admin')
    } catch (error) {
      console.error("Error checking membership:", error)
    }
  }, [user, groupId, supabase])

  // Fetch comments with reactions
  const fetchComments = useCallback(async () => {
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from("club_comments")
        .select("*")
        .eq("group_id", groupId)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })

      if (commentsError) throw commentsError

      // Fetch reactions for all comments
      if (commentsData && commentsData.length > 0) {
        const commentIds = commentsData.map(c => c.id)
        const { data: reactionsData } = await supabase
          .from("comment_reactions")
          .select("*")
          .in("comment_id", commentIds)

        // Group reactions by comment
        const reactionsByComment = reactionsData?.reduce((acc, reaction) => {
          if (!acc[reaction.comment_id]) {
            acc[reaction.comment_id] = []
          }
          acc[reaction.comment_id].push(reaction)
          return acc
        }, {} as Record<string, CommentReaction[]>) || {}

        // Add reactions to comments
        const commentsWithReactions = commentsData.map(comment => ({
          ...comment,
          reactions: reactionsByComment[comment.id] || []
        }))

        setComments(commentsWithReactions)
      } else {
        setComments([])
      }
    } catch (error) {
      console.error("Error fetching comments:", error)
      toast({
        title: "Hata",
        description: "Yorumlar yüklenirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }, [groupId, supabase, toast])

  // Submit new comment
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user) return

    setLoading(true)
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("full_name, avatar_url")
        .eq("user_id", user.id)
        .single()

      const { error } = await supabase.from("club_comments").insert({
        group_id: groupId,
        user_id: user.id,
        user_name: profile?.full_name || user.email?.split('@')[0] || 'Unknown',
        user_avatar: profile?.avatar_url,
        content: newComment.trim(),
      })

      if (error) throw error

      setNewComment("")
      fetchComments()
      
      toast({
        title: "Başarılı",
        description: "Yorumunuz eklendi.",
      })
    } catch (error) {
      console.error("Error posting comment:", error)
      toast({
        title: "Hata",
        description: "Yorum eklenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Add reaction to comment
  const handleReaction = async (commentId: string, reactionType: keyof typeof reactionIcons) => {
    if (!user) return

    try {
      // Check if user already reacted
      const { data: existing } = await supabase
        .from("comment_reactions")
        .select("id, reaction_type")
        .eq("comment_id", commentId)
        .eq("user_id", user.id)
        .single()

      if (existing) {
        if (existing.reaction_type === reactionType) {
          // Remove reaction
          await supabase
            .from("comment_reactions")
            .delete()
            .eq("id", existing.id)
        } else {
          // Update reaction type
          await supabase
            .from("comment_reactions")
            .update({ reaction_type: reactionType })
            .eq("id", existing.id)
        }
      } else {
        // Add new reaction
        await supabase.from("comment_reactions").insert({
          comment_id: commentId,
          user_id: user.id,
          reaction_type: reactionType,
        })
      }

      fetchComments()
    } catch (error) {
      console.error("Error handling reaction:", error)
    }
  }

  // Edit comment
  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return

    try {
      const { error } = await supabase
        .from("club_comments")
        .update({
          content: editContent.trim(),
          is_edited: true,
          edited_at: new Date().toISOString(),
        })
        .eq("id", commentId)

      if (error) throw error

      setEditingComment(null)
      setEditContent("")
      fetchComments()

      toast({
        title: "Başarılı",
        description: "Yorum güncellendi.",
      })
    } catch (error) {
      console.error("Error editing comment:", error)
      toast({
        title: "Hata",
        description: "Yorum güncellenirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Bu yorumu silmek istediğinizden emin misiniz?")) return

    try {
      const { error } = await supabase
        .from("club_comments")
        .delete()
        .eq("id", commentId)

      if (error) throw error

      fetchComments()
      
      toast({
        title: "Başarılı",
        description: "Yorum silindi.",
      })
    } catch (error) {
      console.error("Error deleting comment:", error)
      toast({
        title: "Hata",
        description: "Yorum silinirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  // Toggle pin status
  const handleTogglePin = async (commentId: string, currentPinStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("club_comments")
        .update({ is_pinned: !currentPinStatus })
        .eq("id", commentId)

      if (error) throw error

      fetchComments()
      
      toast({
        title: "Başarılı",
        description: currentPinStatus ? "Sabitleme kaldırıldı." : "Yorum sabitlendi.",
      })
    } catch (error) {
      console.error("Error toggling pin:", error)
      toast({
        title: "Hata",
        description: "İşlem sırasında bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  // Subscribe to real-time updates
  useEffect(() => {
    checkMembership()
    fetchComments()

    // Subscribe to comment changes
    const channel = supabase
      .channel(`comments-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'club_comments',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          fetchComments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId, checkMembership, fetchComments, supabase])

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          {groupName} - Tartışma Duvarı
        </h3>
        <Badge variant="outline">
          {comments.length} Yorum
        </Badge>
      </div>

      {/* Comment Input */}
      {isMember ? (
        <div className="space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Düşüncelerinizi paylaşın..."
            rows={3}
            disabled={loading}
          />
          <Button
            onClick={handleSubmitComment}
            disabled={loading || !newComment.trim()}
            className="w-full sm:w-auto"
          >
            <Send className="w-4 h-4 mr-2" />
            Gönder
          </Button>
        </div>
      ) : user ? (
        <div className="p-4 bg-muted/50 rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            Yorum yapabilmek için gruba üye olmanız gerekiyor.
          </p>
        </div>
      ) : (
        <div className="p-4 bg-muted/50 rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            Yorum yapabilmek için giriş yapmanız gerekiyor.
          </p>
        </div>
      )}

      {/* Comments List */}
      <ScrollArea className="h-[500px] w-full">
        <div className="space-y-4 pr-4">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div
                key={comment.id}
                className={`p-4 rounded-lg border ${
                  comment.is_pinned ? 'border-primary bg-primary/5' : ''
                }`}
              >
                {/* Comment Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={comment.user_avatar} />
                      <AvatarFallback>
                        {comment.user_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{comment.user_name}</span>
                        {comment.is_pinned && (
                          <Badge variant="secondary" className="text-xs">
                            <Pin className="w-3 h-3 mr-1" />
                            Sabitlenmiş
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>
                          {formatDistanceToNow(new Date(comment.created_at), {
                            addSuffix: true,
                            locale: tr,
                          })}
                        </span>
                        {comment.is_edited && (
                          <span className="italic">(düzenlendi)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Menu */}
                  {(user?.id === comment.user_id || isAdmin) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {user?.id === comment.user_id && (
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingComment(comment.id)
                              setEditContent(comment.content)
                            }}
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Düzenle
                          </DropdownMenuItem>
                        )}
                        {isAdmin && (
                          <DropdownMenuItem
                            onClick={() => handleTogglePin(comment.id, comment.is_pinned || false)}
                          >
                            <Pin className="w-4 h-4 mr-2" />
                            {comment.is_pinned ? 'Sabitlemeyi Kaldır' : 'Sabitle'}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* Comment Content */}
                {editingComment === comment.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleEditComment(comment.id)}
                      >
                        Kaydet
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingComment(null)
                          setEditContent("")
                        }}
                      >
                        İptal
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                )}

                {/* Reactions */}
                <div className="flex items-center gap-2 mt-3">
                  {Object.entries(reactionIcons).map(([type, Icon]) => {
                    const reactionCount = comment.reactions?.filter(
                      r => r.reaction_type === type
                    ).length || 0
                    const userReacted = comment.reactions?.some(
                      r => r.reaction_type === type && r.user_id === user?.id
                    )

                    return (
                      <Button
                        key={type}
                        variant={userReacted ? "default" : "outline"}
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => handleReaction(comment.id, type as keyof typeof reactionIcons)}
                        disabled={!isMember}
                      >
                        <Icon className="w-4 h-4" />
                        {reactionCount > 0 && (
                          <span className="ml-1 text-xs">{reactionCount}</span>
                        )}
                      </Button>
                    )
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Henüz yorum yok.</p>
              {isMember && <p className="text-sm mt-2">İlk yorumu siz yapın!</p>}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}