"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { errorHandler } from "@/lib/error-handler"
import { Send } from "lucide-react"

interface User {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
}

export default function SendVoucherPage() {
  const { toast } = useToast()
  const supabase = createClient()
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [voucherType, setVoucherType] = useState("free_coffee")
  const [customMessage, setCustomMessage] = useState(
    "Afiyet olsun! Bizden bir kahve hediyeniz."
  )
  const [sendEmail, setSendEmail] = useState(true)
  const [sendSms, setSendSms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id:user_id, full_name, email, phone")
        .order("full_name")
      if (error) {
        errorHandler.logError("Error fetching users", error)
        toast({
          title: "Hata",
          description: "Kullanıcılar getirilirken bir hata oluştu.",
          variant: "destructive",
        })
      } else {
        setUsers(data as User[])
      }
    }
    fetchUsers()
  }, [supabase, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId) {
      toast({
        title: "Hata",
        description: "Lütfen bir kullanıcı seçin.",
        variant: "destructive",
      })
      return
    }
    setIsLoading(true)

    const selectedUser = users.find((u) => u.id === selectedUserId)
    if (!selectedUser) return

    try {
      // 1. Generate Voucher
      const { data: voucherData, error: voucherError } = await supabase
        .from("vouchers")
        .insert({
          user_id: selectedUserId,
          voucher_type: voucherType,
          expires_at: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(), // 30 days expiry
        })
        .select()
        .single()

      if (voucherError) throw voucherError

      // 2. Send Notifications
      if (sendEmail && selectedUser.email) {
        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: selectedUser.email,
            subject: "Lokal'den Hediye Kuponunuz Var!",
            html: `<p>Merhaba ${selectedUser.full_name},</p><p>${customMessage}</p><p>Kupon Kodunuz: <strong>${voucherData.code}</strong></p>`,
          }),
        })
      }

      if (sendSms && selectedUser.phone) {
        await fetch("/api/send-sms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: selectedUser.phone,
            message: `Merhaba ${selectedUser.full_name}, ${customMessage} Kupon Kodunuz: ${voucherData.code}`,
          }),
        })
      }

      toast({
        title: "Başarılı!",
        description: `${selectedUser.full_name} adlı kullanıcıya kupon gönderildi.`,
      })
      setSelectedUserId("")
    } catch (error) {
      errorHandler.logError("Error sending voucher", error)
      toast({
        title: "Hata",
        description:
          "Kupon gönderilirken bir hata oluştu: " +
          (error instanceof Error ? error.message : "Bilinmeyen Hata"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send />
            Hediye Kuponu Gönder
          </CardTitle>
          <CardDescription>
            Belirli bir kullanıcıya hediye kuponu gönderin ve isteğe bağlı
            olarak bildirim yollayın.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="user-select">Kullanıcı</Label>
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
                required
              >
                <SelectTrigger id="user-select">
                  <SelectValue placeholder="Bir kullanıcı seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="voucher-type">Kupon Türü</Label>
              <Select
                value={voucherType}
                onValueChange={setVoucherType}
                required
              >
                <SelectTrigger id="voucher-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free_coffee">Ücretsiz Kahve</SelectItem>
                  <SelectItem value="10_percent_discount">
                    %10 İndirim
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-message">Özel Mesaj</Label>
              <Input
                id="custom-message"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Örn: Doğum günün kutlu olsun!"
              />
            </div>

            <div className="space-y-3">
              <Label>Bildirim Seçenekleri</Label>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="send-email"
                  checked={sendEmail}
                  onCheckedChange={(checked) => setSendEmail(!!checked)}
                />
                <Label htmlFor="send-email">E-posta Gönder</Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="send-sms"
                  checked={sendSms}
                  onCheckedChange={(checked) => setSendSms(!!checked)}
                />
                <Label htmlFor="send-sms">SMS Gönder</Label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !selectedUserId}
            >
              {isLoading ? "Gönderiliyor..." : "Kuponu Gönder"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
