"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { 
  UserPlus, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Mail,
  Calendar,
  MessageSquare
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"

interface MembershipRequest {
  id: string
  group_id: string
  user_id: string
  user_name: string
  user_email: string
  request_message?: string
  status: 'pending' | 'approved' | 'rejected'
  admin_notes?: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  social_groups?: {
    name: string
  }
}

export function MembershipRequestsManager() {
  const [open, setOpen] = useState(false)
  const [requests, setRequests] = useState<MembershipRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({})
  const { toast } = useToast()
  const supabase = useMemo(() => createClient(), [])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("membership_requests")
        .select(`
          *,
          social_groups (
            name
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      setRequests(data || [])
    } catch (error) {
      console.error("Error fetching membership requests:", error)
      toast({
        title: "Hata",
        description: "Üyelik talepleri yüklenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (request: MembershipRequest) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      // Update request status
      const { error: updateError } = await supabase
        .from("membership_requests")
        .update({
          status: 'approved',
          admin_notes: adminNotes[request.id] || null,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", request.id)

      if (updateError) throw updateError

      // Add user to group members
      const { error: memberError } = await supabase
        .from("group_members")
        .insert({
          group_id: request.group_id,
          user_id: request.user_id,
          user_name: request.user_name,
          user_email: request.user_email,
          role: 'member',
        })

      if (memberError) {
        // If member already exists, it's okay
        if (!memberError.message.includes('duplicate')) {
          throw memberError
        }
      }

      toast({
        title: "Başarılı",
        description: `${request.user_name} gruba eklendi.`,
      })

      fetchRequests()
    } catch (error) {
      console.error("Error approving request:", error)
      toast({
        title: "Hata",
        description: "Talep onaylanırken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const handleReject = async (request: MembershipRequest) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const { error } = await supabase
        .from("membership_requests")
        .update({
          status: 'rejected',
          admin_notes: adminNotes[request.id] || null,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", request.id)

      if (error) throw error

      toast({
        title: "Başarılı",
        description: "Üyelik talebi reddedildi.",
      })

      fetchRequests()
    } catch (error) {
      console.error("Error rejecting request:", error)
      toast({
        title: "Hata",
        description: "Talep reddedilirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (open) {
      fetchRequests()
    }
  }, [open])

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const processedRequests = requests.filter(r => r.status !== 'pending')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="relative">
          <UserPlus className="w-4 h-4 mr-2" />
          Üyelik Talepleri
          {pendingRequests.length > 0 && (
            <Badge className="absolute -top-2 -right-2 px-2 py-0.5 text-xs">
              {pendingRequests.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Üyelik Talepleri</DialogTitle>
          <DialogDescription>
            Kullanıcıların grup üyelik taleplerini yönetin
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {pendingRequests.length > 0 ? (
            <>
              <h3 className="font-medium text-sm text-muted-foreground">
                Bekleyen Talepler ({pendingRequests.length})
              </h3>
              <ScrollArea className="h-[300px] w-full">
                <div className="space-y-3 pr-4">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-4 border rounded-lg space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{request.user_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {request.social_groups?.name}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {request.user_email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDistanceToNow(new Date(request.created_at), {
                                addSuffix: true,
                                locale: tr,
                              })}
                            </span>
                          </div>
                        </div>
                        <Badge variant="secondary">
                          <Clock className="w-3 h-3 mr-1" />
                          Bekliyor
                        </Badge>
                      </div>

                      {request.request_message && (
                        <div className="p-3 bg-muted/50 rounded-md">
                          <p className="text-sm flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{request.request_message}</span>
                          </p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Textarea
                          placeholder="Yönetici notu (opsiyonel)..."
                          value={adminNotes[request.id] || ""}
                          onChange={(e) =>
                            setAdminNotes({ ...adminNotes, [request.id]: e.target.value })
                          }
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(request)}
                            className="flex-1"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Onayla
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(request)}
                            className="flex-1"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reddet
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Bekleyen üyelik talebi bulunmuyor.</p>
            </div>
          )}

          {processedRequests.length > 0 && (
            <>
              <h3 className="font-medium text-sm text-muted-foreground">
                İşlenmiş Talepler ({processedRequests.length})
              </h3>
              <ScrollArea className="h-[200px] w-full">
                <div className="space-y-2 pr-4">
                  {processedRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-3 border rounded-lg flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{request.user_name}</span>
                          <Badge variant="outline" className="text-xs">
                            {request.social_groups?.name}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {request.reviewed_at &&
                            formatDistanceToNow(new Date(request.reviewed_at), {
                              addSuffix: true,
                              locale: tr,
                            })}
                        </p>
                      </div>
                      <Badge
                        variant={request.status === 'approved' ? 'default' : 'destructive'}
                      >
                        {request.status === 'approved' ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Onaylandı
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Reddedildi
                          </>
                        )}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}