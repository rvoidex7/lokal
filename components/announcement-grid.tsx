"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { AnnouncementCard } from "@/components/announcement-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { RefreshCw, AlertCircle, Calendar } from "lucide-react"
import { errorHandler } from "@/lib/error-handler"

interface Announcement {
  id: string
  title: string
  description: string
  image_url?: string
  created_at: string
  katilimcilar?: Array<{
    id: string
    user_name: string
    user_email: string
  }>
}

export function AnnouncementGrid() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  const fetchAnnouncements = useCallback(async () => {
    try {
      setError(null)
      const { data, error } = await supabase
        .from("duyurular")
        .select(`
          *,
          katilimcilar (
            id,
            user_name,
            user_email
          )
        `)
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setAnnouncements(data || [])
    } catch (error) {
      errorHandler.logError('Error fetching announcements', error)
      setError("Duyurular yüklenirken bir hata oluştu.")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

  if (loading) {
    return (
      <>
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          Duyurular yükleniyor...
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-label="Duyurular yükleniyor">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-48 w-full rounded-lg" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full mt-4" />
              </div>
            </div>
          ))}
        </div>
      </>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12" role="alert" aria-live="assertive">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" aria-hidden="true" />
        <h3 className="text-xl font-semibold mb-2">Bir Hata Oluştu</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchAnnouncements} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Tekrar Dene
        </Button>
      </div>
    )
  }

  if (announcements.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <Calendar className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Henüz Duyuru Yok</h3>
        <p className="text-gray-600">İlk duyuru eklendiğinde burada görünecek.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {announcements.map((announcement) => (
        <AnnouncementCard
          key={announcement.id}
          announcement={announcement}
          onParticipationChange={fetchAnnouncements}
        />
      ))}
    </div>
  )
}
