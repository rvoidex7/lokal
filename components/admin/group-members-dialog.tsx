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
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Users, UserMinus, Mail, Calendar, Crown } from "lucide-react"

interface GroupMember {
  id: string
  user_id: string
  user_name: string
  user_email: string
  role: "member" | "organizer"
  joined_at: string
}

interface SocialGroup {
  id: string
  name: string
  max_members?: number
}

interface GroupMembersDialogProps {
  group: SocialGroup
  trigger?: React.ReactNode
}

export function GroupMembersDialog({ group, trigger }: GroupMembersDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [members, setMembers] = useState<GroupMember[]>([])
  const supabase = useMemo(() => createClient(), [])

  const fetchMembers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("group_members")
        .select("*")
        .eq("group_id", group.id)
        .order("joined_at", { ascending: true })

      if (error) throw error

      setMembers(data || [])
    } catch (error) {
      console.error("Error fetching members:", error)
      toast({
        title: "Hata",
        description: "Üyeler yüklenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string, userName: string) => {
    if (!confirm(`${userName} adlı üyeyi gruptan çıkarmak istediğinizden emin misiniz?`)) return

    try {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("id", memberId)

      if (error) throw error

      toast({
        title: "Başarılı",
        description: "Üye gruptan çıkarıldı.",
      })

      fetchMembers()
    } catch (error) {
      console.error("Error removing member:", error)
      toast({
        title: "Hata",
        description: "Üye çıkarılırken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const handleChangeRole = async (memberId: string, newRole: "member" | "organizer") => {
    try {
      const { error } = await supabase
        .from("group_members")
        .update({ role: newRole })
        .eq("id", memberId)

      if (error) throw error

      toast({
        title: "Başarılı",
        description: "Üye rolü güncellendi.",
      })

      fetchMembers()
    } catch (error) {
      console.error("Error updating member role:", error)
      toast({
        title: "Hata",
        description: "Rol güncellenirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (open) {
      fetchMembers()
    }
  }, [open, group.id])

  const getRoleBadge = (role: string) => {
    if (role === "organizer") {
      return (
        <Badge variant="default" className="ml-2">
          <Crown className="w-3 h-3 mr-1" />
          Organizatör
        </Badge>
      )
    }
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Users className="w-4 h-4 mr-1" />
            Üyeler ({members.length})
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{group.name} - Grup Üyeleri</DialogTitle>
          <DialogDescription>
            {members.length} üye
            {group.max_members && ` / ${group.max_members} maksimum`}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Yükleniyor...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">Henüz üye yok</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="font-medium">{member.user_name}</span>
                      {getRoleBadge(member.role)}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {member.user_email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(member.joined_at).toLocaleDateString("tr-TR")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleChangeRole(member.id, member.role === "member" ? "organizer" : "member")}
                      title={member.role === "member" ? "Organizatör yap" : "Üye yap"}
                    >
                      <Crown className={`w-4 h-4 ${member.role === "organizer" ? "text-yellow-500" : "text-gray-400"}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id, member.user_name)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}