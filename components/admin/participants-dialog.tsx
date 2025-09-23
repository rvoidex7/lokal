"use client"

import type React from "react"

import { useState } from "react"
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
import { Users } from "lucide-react"

interface ParticipantsDialogProps {
  announcement: {
    id: string
    title: string
    katilimcilar?: Array<{
      id: string
      user_name: string
      user_email: string
    }>
  }
  trigger: React.ReactNode
}

export function ParticipantsDialog({ announcement, trigger }: ParticipantsDialogProps) {
  const [open, setOpen] = useState(false)
  const participants = announcement.katilimcilar || []

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Katılımcılar
          </DialogTitle>
          <DialogDescription>"{announcement.title}" etkinliğine katılan kişiler</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Toplam Katılımcı:</span>
            <Badge variant="secondary">{participants.length}</Badge>
          </div>

          {participants.length > 0 ? (
            <ScrollArea className="h-[300px] w-full">
              <div className="space-y-2">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{participant.user_name}</p>
                      <p className="text-sm text-gray-600">{participant.user_email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Henüz katılımcı yok</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
