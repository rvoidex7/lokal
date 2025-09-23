"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { LetterEditor, QuickLetterCreator } from "./letter-editor"
import { 
  FileText, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  Filter,
  SortDesc
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"
import type { PersonalLetter } from "@/lib/types"

interface LetterHistoryProps {
  showCreateButton?: boolean
}

export function LetterHistory({ showCreateButton = true }: LetterHistoryProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [letters, setLetters] = useState<PersonalLetter[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all')
  const [selectedLetter, setSelectedLetter] = useState<PersonalLetter | null>(null)
  const [editingLetter, setEditingLetter] = useState<PersonalLetter | null>(null)
  const [deletingLetter, setDeletingLetter] = useState<PersonalLetter | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  const fetchLetters = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("personal_letters")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })

      if (error) throw error
      setLetters(data || [])
    } catch (error) {
      errorHandler.logError('Error fetching letters', error)
      toast({
        title: "Hata",
        description: "Mektuplar yüklenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLetters()
  }, [user])

  const handleDelete = async (letter: PersonalLetter) => {
    try {
      const { error } = await supabase
        .from("personal_letters")
        .delete()
        .eq("id", letter.id)

      if (error) throw error

      toast({
        title: "Başarılı",
        description: "Mektup silindi.",
      })

      setLetters(prev => prev.filter(l => l.id !== letter.id))
      setDeletingLetter(null)
    } catch (error) {
      errorHandler.logError('Error deleting letter', error)
      toast({
        title: "Hata",
        description: "Mektup silinirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const handleLetterSaved = (updatedLetter: PersonalLetter) => {
    setLetters(prev => {
      const existing = prev.find(l => l.id === updatedLetter.id)
      if (existing) {
        return prev.map(l => l.id === updatedLetter.id ? updatedLetter : l)
      } else {
        return [updatedLetter, ...prev]
      }
    })
    setEditingLetter(null)
    setIsEditDialogOpen(false)
  }

  const filteredLetters = letters.filter(letter => {
    const matchesSearch = letter.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         letter.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || letter.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatContent = (content: string, maxLength: number = 120) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + "..."
  }

  const StatusBadge = ({ status }: { status: 'draft' | 'published' }) => (
    <Badge variant={status === 'published' ? 'default' : 'secondary'}>
      {status === 'published' ? 'Yayınlandı' : 'Taslak'}
    </Badge>
  )

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Kişisel Mektuplarım
          </h2>
          <p className="text-sm text-muted-foreground">
            Toplam {letters.length} mektup
          </p>
        </div>
        {showCreateButton && <QuickLetterCreator onLetterCreated={fetchLetters} />}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Mektuplarda ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                Tümü
              </Button>
              <Button
                variant={statusFilter === 'draft' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('draft')}
              >
                Taslaklar
              </Button>
              <Button
                variant={statusFilter === 'published' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('published')}
              >
                Yayınlananlar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Letters List */}
      {filteredLetters.length === 0 ? (
        <Card>
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery || statusFilter !== 'all' ? 'Sonuç bulunamadı' : 'Henüz mektup yok'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Arama kriterlerinizi değiştirip tekrar deneyin'
                  : 'İlk mektubunuzu yazmaya başlayın'
                }
              </p>
              {showCreateButton && !searchQuery && statusFilter === 'all' && (
                <QuickLetterCreator onLetterCreated={fetchLetters} />
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredLetters.map(letter => (
            <Card key={letter.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg line-clamp-1">
                      {letter.title}
                    </CardTitle>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDistanceToNow(new Date(letter.updated_at), {
                          addSuffix: true,
                          locale: tr,
                        })}
                      </div>
                      <StatusBadge status={letter.status} />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {formatContent(letter.content)}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedLetter(letter)
                      setIsViewDialogOpen(true)
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Görüntüle
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingLetter(letter)
                      setIsEditDialogOpen(true)
                    }}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Düzenle
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingLetter(letter)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Sil
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Letter Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedLetter && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl bg-gradient-to-r from-[#0015ff] to-[#2563eb] bg-clip-text text-transparent">
                  {selectedLetter.title}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-3">
                  <span>
                    {formatDistanceToNow(new Date(selectedLetter.updated_at), {
                      addSuffix: true,
                      locale: tr,
                    })}
                  </span>
                  <StatusBadge status={selectedLetter.status} />
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="prose prose-lg max-w-none font-serif">
                  {selectedLetter.content.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                      {paragraph.split('\n').map((line, lineIndex) => (
                        <span key={lineIndex}>
                          {line}
                          {lineIndex < paragraph.split('\n').length - 1 && <br />}
                        </span>
                      ))}
                    </p>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Letter Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          {editingLetter && (
            <LetterEditor 
              letter={editingLetter}
              onSave={handleLetterSaved}
              onCancel={() => {
                setEditingLetter(null)
                setIsEditDialogOpen(false)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingLetter} onOpenChange={() => setDeletingLetter(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mektubu Sil</AlertDialogTitle>
            <AlertDialogDescription>
              "{deletingLetter?.title}" başlıklı mektubu silmek istediğinizden emin misiniz? 
              Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingLetter && handleDelete(deletingLetter)}
              className="bg-red-600 hover:bg-red-700"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}