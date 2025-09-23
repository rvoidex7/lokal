"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { SocialGroupCard } from "@/components/social-group-card"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Filter } from "lucide-react"
import { errorHandler } from "@/lib/error-handler"
import type { SocialGroup as SocialGroupType } from "@/lib/types"

interface SocialGroupWithMembers extends SocialGroupType {
  category?: string
  recurring_day?: string
  time?: string
  location?: string
  max_members?: number
  is_active: boolean
  group_members?: Array<{
    id: string
    user_id: string
  }>
}

const CATEGORIES = [
  { value: "all", label: "Tüm Kategoriler" },
  { value: "movie", label: "Film" },
  { value: "yoga", label: "Yoga" },
  { value: "book_club", label: "Kitap Kulübü" },
  { value: "art", label: "Sanat" },
  { value: "music", label: "Müzik" },
  { value: "sports", label: "Spor" },
  { value: "cooking", label: "Yemek" },
  { value: "technology", label: "Teknoloji" },
  { value: "language", label: "Dil" },
  { value: "other", label: "Diğer" },
]

const DAYS = [
  { value: "all", label: "Tüm Günler" },
  { value: "monday", label: "Pazartesi" },
  { value: "tuesday", label: "Salı" },
  { value: "wednesday", label: "Çarşamba" },
  { value: "thursday", label: "Perşembe" },
  { value: "friday", label: "Cuma" },
  { value: "saturday", label: "Cumartesi" },
  { value: "sunday", label: "Pazar" },
]

export function SocialGroupsGrid() {
  const { toast } = useToast()
  const [groups, setGroups] = useState<SocialGroupWithMembers[]>([])
  const [filteredGroups, setFilteredGroups] = useState<SocialGroupWithMembers[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedDay, setSelectedDay] = useState("all")
  const supabase = useMemo(() => createClient(), [])

  const fetchGroups = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("social_groups")
        .select(`
          *,
          group_members (
            id,
            user_id
          )
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setGroups(data || [])
      setFilteredGroups(data || [])
    } catch (error) {
      errorHandler.logError('Error fetching social groups', error)
      toast({
        title: "Hata",
        description: "Sosyal gruplar yüklenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [supabase, toast])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  useEffect(() => {
    let filtered = groups

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((group) =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((group) => group.category === selectedCategory)
    }

    // Filter by day
    if (selectedDay !== "all") {
      filtered = filtered.filter((group) => group.recurring_day === selectedDay)
    }

    setFilteredGroups(filtered)
  }, [searchTerm, selectedCategory, selectedDay, groups])

  const handleGroupUpdate = () => {
    fetchGroups()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Skeleton className="h-10 w-full md:w-64" />
          <Skeleton className="h-10 w-full md:w-48" />
          <Skeleton className="h-10 w-full md:w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Grup ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedDay} onValueChange={setSelectedDay}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Gün" />
          </SelectTrigger>
          <SelectContent>
            {DAYS.map((day) => (
              <SelectItem key={day.value} value={day.value}>
                {day.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredGroups.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">Grup bulunamadı</h3>
          <p className="text-gray-600">
            {searchTerm || selectedCategory !== "all" || selectedDay !== "all"
              ? "Filtreleme kriterlerinize uygun grup bulunamadı."
              : "Henüz aktif sosyal grup bulunmuyor."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <SocialGroupCard key={group.id} group={group} onUpdate={handleGroupUpdate} />
          ))}
        </div>
      )}
    </div>
  )
}