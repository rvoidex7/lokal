"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  MessageSquare,
  Send,
  Heart,
  Reply,
  MoreVertical,
  Edit,
  Trash2,
  Flag,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertTriangle
} from "lucide-react"
import { format, parseISO, formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"
import type { ActivityComment } from "@/lib/types"
import { cn } from "@/lib/utils"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface ActivityCommentsProps {
  activityId: string
  organizerId?: string
  activityDate: string
}

interface CommentWithReplies extends ActivityComment {
  replies: ActivityComment[]
  isLiked?: boolean
}

export function ActivityComments({ 
  activityId, 
  organizerId,
  activityDate
}: ActivityCommentsProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [comments, setComments] = useState<CommentWithReplies[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null)
  const [reportCommentId, setReportCommentId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({})
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "popular">("newest")
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    fetchComments()
    if (user) {
      fetchLikedComments()
    }
    
    // Setup realtime subscription
    const channel = supabase
      .channel(`activity-comments-${activityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_comments',
          filter: `activity_id=eq.${activityId}`
        },
        handleRealtimeUpdate
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [activityId, user])

  const fetchComments = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("activity_comments")
        .select("*")
        .eq("activity_id", activityId)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Organize comments into threads
      const rootComments: CommentWithReplies[] = []
      const replyMap = {} as { [key: string]: ActivityComment[] }

      (data || []).forEach((comment: ActivityComment) => {
        if (comment.parent_id) {
          if (!replyMap[comment.parent_id]) {
            replyMap[comment.parent_id] = []
          }
          replyMap[comment.parent_id].push(comment)
        } else {
          rootComments.push({
            ...comment,
            replies: []
          })
        }
      })

      // Attach replies to root comments
      rootComments.forEach(comment => {
        comment.replies = replyMap[comment.id] || []
        comment.replies.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      })

      setComments(rootComments)

    } catch (error) {
      errorHandler.logError('Error fetching comments', error)
      toast({
        title: "Hata",
        description: "Yorumlar yüklenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchLikedComments = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("comment_likes")
        .select("comment_id")
        .eq("user_id", user.id)
        .eq("activity_id", activityId)

      if (!error && data) {
        setLikedComments(new Set(data.map(item => item.comment_id)))
      }
    } catch (error) {
      errorHandler.logError('Error fetching liked comments', error)
    }
  }

  const handleRealtimeUpdate = (payload: any) => {
    if (payload.eventType === 'INSERT') {
      // Add new comment
      fetchComments()
      toast({
        title: "Yeni yorum",
        description: "Bu aktiviteye yeni bir yorum eklendi",
      })
    } else if (payload.eventType === 'UPDATE') {
      // Update existing comment
      fetchComments()
    } else if (payload.eventType === 'DELETE') {
      // Remove deleted comment
      fetchComments()
    }
  }

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from("activity_comments")
        .insert({
          activity_id: activityId,
          user_id: user.id,
          user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Kullanıcı',
          user_avatar: user.user_metadata?.avatar_url,
          content: newComment.trim(),
          is_organizer_response: user.id === organizerId
        })

      if (error) throw error

      setNewComment("")
      toast({
        title: "Başarılı",
        description: "Yorumunuz eklendi",
      })

    } catch (error) {
      errorHandler.logError('Error submitting comment', error)
      toast({
        title: "Hata",
        description: "Yorum eklenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!user || !replyContent.trim()) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from("activity_comments")
        .insert({
          activity_id: activityId,
          user_id: user.id,
          user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Kullanıcı',
          user_avatar: user.user_metadata?.avatar_url,
          content: replyContent.trim(),
          parent_id: parentId,
          is_organizer_response: user.id === organizerId
        })

      if (error) throw error

      setReplyContent("")
      setReplyTo(null)
      toast({
        title: "Başarılı",
        description: "Yanıtınız eklendi",
      })

    } catch (error) {
      errorHandler.logError('Error submitting reply', error)
      toast({
        title: "Hata",
        description: "Yanıt eklenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from("activity_comments")
        .update({
          content: editContent.trim(),
          is_edited: true,
          edited_at: new Date().toISOString()
        })
        .eq("id", commentId)
        .eq("user_id", user?.id)

      if (error) throw error

      setEditingComment(null)
      setEditContent("")
      toast({
        title: "Başarılı",
        description: "Yorumunuz güncellendi",
      })

    } catch (error) {
      errorHandler.logError('Error editing comment', error)
      toast({
        title: "Hata",
        description: "Yorum güncellenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("activity_comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user?.id)

      if (error) throw error

      toast({
        title: "Başarılı",
        description: "Yorumunuz silindi",
      })
      setDeleteCommentId(null)

    } catch (error) {
      errorHandler.logError('Error deleting comment', error)
      toast({
        title: "Hata",
        description: "Yorum silinirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const handleLikeComment = async (commentId: string) => {
    if (!user) return

    const isLiked = likedComments.has(commentId)

    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from("comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id)

        if (error) throw error

        setLikedComments(prev => {
          const newSet = new Set(prev)
          newSet.delete(commentId)
          return newSet
        })
      } else {
        // Like
        const { error } = await supabase
          .from("comment_likes")
          .insert({
            activity_id: activityId,
            comment_id: commentId,
            user_id: user.id
          })

        if (error) throw error

        setLikedComments(prev => new Set([...prev, commentId]))
      }

      // Update likes count
      const { error: updateError } = await supabase
        .from("activity_comments")
        .update({
          likes_count: isLiked 
            ? comments.find(c => c.id === commentId)?.likes_count! - 1 
            : (comments.find(c => c.id === commentId)?.likes_count || 0) + 1
        })
        .eq("id", commentId)

      if (updateError) throw updateError

      fetchComments()

    } catch (error) {
      errorHandler.logError('Error liking comment', error)
      toast({
        title: "Hata",
        description: "İşlem sırasında bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const handleReportComment = async (commentId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from("comment_reports")
        .insert({
          comment_id: commentId,
          reported_by: user.id,
          reason: "inappropriate_content",
          activity_id: activityId
        })

      if (error) throw error

      toast({
        title: "Başarılı",
        description: "Yorum bildirildi. İncelemeye alınacak.",
      })
      setReportCommentId(null)

    } catch (error) {
      errorHandler.logError('Error reporting comment', error)
      toast({
        title: "Hata",
        description: "Yorum bildirilemedi.",
        variant: "destructive",
      })
    }
  }

  const sortedComments = useMemo(() => {
    const sorted = [...comments]
    switch (sortBy) {
      case "newest":
        return sorted.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      case "oldest":
        return sorted.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      case "popular":
        return sorted.sort((a, b) => 
          (b.likes_count || 0) - (a.likes_count || 0)
        )
      default:
        return sorted
    }
  }, [comments, sortBy])

  const CommentItem = ({ comment, isReply = false }: { comment: ActivityComment, isReply?: boolean }) => {
    const isAuthor = user?.id === comment.user_id
    const isOrganizer = comment.user_id === organizerId
    const isLiked = likedComments.has(comment.id)
    const hasReplies = !isReply && (comment as CommentWithReplies).replies?.length > 0
    const replies = (comment as CommentWithReplies).replies || []

    return (
      <div className={cn("space-y-3", isReply && "ml-12 mt-3")}>
        <div className="flex gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={comment.user_avatar} />
            <AvatarFallback>
              {comment.user_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{comment.user_name}</p>
                {isOrganizer && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Organizatör
                  </Badge>
                )}
                {comment.is_organizer_response && (
                  <Badge className="text-xs bg-blue-600">
                    Resmi Yanıt
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(parseISO(comment.created_at), { 
                    locale: tr, 
                    addSuffix: true 
                  })}
                </span>
                {comment.is_edited && (
                  <span className="text-xs text-muted-foreground">(düzenlendi)</span>
                )}
              </div>

              {isAuthor && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingComment(comment.id)
                        setEditContent(comment.content)
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Düzenle
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeleteCommentId(comment.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Sil
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {!isAuthor && user && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setReportCommentId(comment.id)}
                >
                  <Flag className="w-4 h-4" />
                </Button>
              )}
            </div>

            {editingComment === comment.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[60px]"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleEditComment(comment.id)}
                    disabled={submitting || !editContent.trim()}
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Kaydet"}
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
              <p className="text-sm">{comment.content}</p>
            )}

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-2",
                  isLiked && "text-red-600"
                )}
                onClick={() => handleLikeComment(comment.id)}
                disabled={!user}
              >
                <Heart className={cn("w-4 h-4 mr-1", isLiked && "fill-current")} />
                {comment.likes_count || 0}
              </Button>

              {!isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => {
                    setReplyTo(replyTo === comment.id ? null : comment.id)
                    setReplyContent("")
                  }}
                  disabled={!user}
                >
                  <Reply className="w-4 h-4 mr-1" />
                  Yanıtla
                </Button>
              )}

              {hasReplies && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => setShowReplies(prev => ({
                    ...prev,
                    [comment.id]: !prev[comment.id]
                  }))}
                >
                  {showReplies[comment.id] ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-1" />
                      Yanıtları Gizle ({replies.length})
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-1" />
                      Yanıtları Göster ({replies.length})
                    </>
                  )}
                </Button>
              )}
            </div>

            {replyTo === comment.id && (
              <div className="space-y-2 mt-3">
                <Textarea
                  placeholder={`@${comment.user_name} kullanıcısına yanıt yaz...`}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[60px]"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSubmitReply(comment.id)}
                    disabled={submitting || !replyContent.trim()}
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Yanıtla
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setReplyTo(null)
                      setReplyContent("")
                    }}
                  >
                    İptal
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {hasReplies && showReplies[comment.id] && (
          <div className="space-y-3">
            {replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} isReply />
            ))}
          </div>
        )}
      </div>
    )
  }

  const isPastActivity = new Date(activityDate) < new Date()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Yorumlar ve Tartışmalar
            </CardTitle>
            <CardDescription>
              {isPastActivity ? "Aktivite hakkında yorumlar" : "Sorular ve tartışmalar"}
            </CardDescription>
          </div>
          <Badge variant="outline">
            {comments.length} yorum
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New Comment Form */}
        {user ? (
          <div className="space-y-3">
            <div className="flex gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback>
                  {(user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder={isPastActivity ? "Aktivite hakkında yorumunuzu paylaşın..." : "Soru sorun veya yorum yapın..."}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[80px]"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {organizerId === user.id && "Organizatör olarak yanıtınız işaretlenecek"}
                  </p>
                  <Button
                    onClick={handleSubmitComment}
                    disabled={submitting || !newComment.trim()}
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Gönder
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Yorum yapmak için giriş yapmalısınız
            </p>
          </div>
        )}

        {/* Sort Options */}
        {comments.length > 0 && (
          <div className="flex items-center justify-between border-t pt-4">
            <p className="text-sm font-medium">{comments.length} Yorum</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Sırala: {sortBy === "newest" ? "En Yeni" : sortBy === "oldest" ? "En Eski" : "Popüler"}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy("newest")}>
                  En Yeni
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("oldest")}>
                  En Eski
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("popular")}>
                  En Popüler
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Comments List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : sortedComments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-muted-foreground">Henüz yorum yok</p>
            <p className="text-sm text-muted-foreground">İlk yorumu siz yapın!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedComments.map(comment => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteCommentId} onOpenChange={() => setDeleteCommentId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Yorumu Sil</AlertDialogTitle>
              <AlertDialogDescription>
                Bu yorumu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>İptal</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteCommentId && handleDeleteComment(deleteCommentId)}
                className="bg-red-600 hover:bg-red-700"
              >
                Sil
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Report Confirmation Dialog */}
        <AlertDialog open={!!reportCommentId} onOpenChange={() => setReportCommentId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Yorumu Bildir</AlertDialogTitle>
              <AlertDialogDescription>
                Bu yorumu uygunsuz içerik nedeniyle bildirmek istediğinizden emin misiniz?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>İptal</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => reportCommentId && handleReportComment(reportCommentId)}
              >
                Bildir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}