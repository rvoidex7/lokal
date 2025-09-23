"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  PenTool, 
  Save, 
  Send, 
  Eye, 
  FileText,
  Plus,
  X
} from "lucide-react"
import type { PersonalLetter } from "@/lib/types"

interface LetterEditorProps {
  letter?: PersonalLetter
  onSave?: (letter: PersonalLetter) => void
  onCancel?: () => void
}

export function LetterEditor({ letter, onSave, onCancel }: LetterEditorProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [title, setTitle] = useState(letter?.title || "")
  const [content, setContent] = useState(letter?.content || "")
  const [status, setStatus] = useState<'draft' | 'published'>(letter?.status || 'draft')
  const [loading, setLoading] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  const handleSave = async (saveStatus: 'draft' | 'published' = status) => {
    if (!user || !title.trim() || !content.trim()) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen başlık ve içerik alanlarını doldurun.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const letterData = {
        title: title.trim(),
        content: content.trim(),
        status: saveStatus,
        user_id: user.id
      }

      let result
      if (letter) {
        // Update existing letter
        const { data, error } = await supabase
          .from("personal_letters")
          .update(letterData)
          .eq("id", letter.id)
          .select()
          .single()
        
        result = { data, error }
      } else {
        // Create new letter
        const { data, error } = await supabase
          .from("personal_letters")
          .insert(letterData)
          .select()
          .single()
        
        result = { data, error }
      }

      if (result.error) throw result.error

      toast({
        title: "Başarılı",
        description: saveStatus === 'published' 
          ? "Mektubunuz yayınlandı!" 
          : "Mektubunuz taslak olarak kaydedildi.",
      })

      setStatus(saveStatus)
      onSave?.(result.data)

    } catch (error) {
      errorHandler.logError('Error saving letter', error)
      toast({
        title: "Hata",
        description: "Mektup kaydedilirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatPreviewContent = (text: string) => {
    // Simple text formatting - converts line breaks to paragraphs
    return text.split('\n\n').map((paragraph, index) => (
      <p key={index} className="mb-4 text-gray-700 leading-relaxed">
        {paragraph.split('\n').map((line, lineIndex) => (
          <span key={lineIndex}>
            {line}
            {lineIndex < paragraph.split('\n').length - 1 && <br />}
          </span>
        ))}
      </p>
    ))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PenTool className="w-6 h-6 text-muted-foreground" />
          <div>
            <h2 className="text-xl font-semibold">
              {letter ? "Mektubu Düzenle" : "Yeni Mektup Yaz"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Düşüncelerinizi ve deneyimlerinizi paylaşın
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={status === 'published' ? 'default' : 'secondary'}>
            {status === 'published' ? 'Yayınlandı' : 'Taslak'}
          </Badge>
          {onCancel && (
            <Button variant="outline" size="sm" onClick={onCancel}>
              <X className="w-4 h-4 mr-1" />
              İptal
            </Button>
          )}
        </div>
      </div>

      {/* Editor Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mektup Detayları</CardTitle>
          <CardDescription>
            Mektubunuza bir başlık verin ve içeriğini yazın
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Başlık</label>
            <Input
              placeholder="Mektubunuzun başlığını yazın..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg"
            />
          </div>

          {/* Content Textarea */}
          <div className="space-y-2">
            <label className="text-sm font-medium">İçerik</label>
            <Textarea
              placeholder="Mektubunuzun içeriğini yazın...

İpucu: Paragraflar arasında boş satır bırakarak metninizi düzenleyebilirsiniz."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[400px] font-serif text-base leading-relaxed"
            />
            <p className="text-xs text-muted-foreground">
              {content.length} karakter
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => handleSave('draft')}
              disabled={loading || (!title.trim() || !content.trim())}
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Kaydediliyor..." : "Taslak Olarak Kaydet"}
            </Button>

            <Button
              onClick={() => handleSave('published')}
              disabled={loading || (!title.trim() || !content.trim())}
              className="bg-gradient-to-r from-[#0015ff] to-[#2563eb] hover:from-[#0015ff]/90 hover:to-[#2563eb]/90"
            >
              <Send className="w-4 h-4 mr-2" />
              {loading ? "Yayınlanıyor..." : "Yayınla"}
            </Button>

            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost">
                  <Eye className="w-4 h-4 mr-2" />
                  Önizleme
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Mektup Önizlemesi
                  </DialogTitle>
                  <DialogDescription>
                    Mektubunuzun nasıl görüneceğini inceleyin
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  {/* Preview Header */}
                  <div className="border-b pb-4">
                    <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-[#0015ff] to-[#2563eb] bg-clip-text text-transparent">
                      {title || "Başlık yazılmamış"}
                    </h1>
                    <div className="text-sm text-muted-foreground">
                      Yazar: {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Kullanıcı"}
                    </div>
                  </div>
                  
                  {/* Preview Content */}
                  <div className="prose prose-lg max-w-none font-serif">
                    {content ? formatPreviewContent(content) : (
                      <p className="text-muted-foreground italic">İçerik yazılmamış</p>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Quick Letter Creator Component for dashboard
export function QuickLetterCreator({ onLetterCreated }: { onLetterCreated?: () => void }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full justify-start" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Mektup Yaz
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <LetterEditor 
          onSave={() => {
            setIsOpen(false)
            onLetterCreated?.()
          }}
          onCancel={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}