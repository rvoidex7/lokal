import { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ClubCommentWall } from "@/components/club-comment-wall"
import { MembershipRequestDialog } from "@/components/membership-request-dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, MapPin, Users, Info, MessageSquare } from "lucide-react"
import Image from "next/image"

interface PageProps {
  params: Promise<{ id: string }>
}

const CATEGORY_LABELS: Record<string, string> = {
  movie: "Film",
  yoga: "Yoga",
  book_club: "Kitap Kulübü",
  art: "Sanat",
  music: "Müzik",
  sports: "Spor",
  cooking: "Yemek",
  technology: "Teknoloji",
  language: "Dil",
  other: "Diğer",
}

const DAY_LABELS: Record<string, string> = {
  monday: "Pazartesi",
  tuesday: "Salı",
  wednesday: "Çarşamba",
  thursday: "Perşembe",
  friday: "Cuma",
  saturday: "Cumartesi",
  sunday: "Pazar",
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: group } = await supabase
    .from("social_groups")
    .select("name, description")
    .eq("id", id)
    .single()

  if (!group) {
    return {
      title: "Grup Bulunamadı",
    }
  }

  return {
    title: `${group.name} - Lokal Cafe`,
    description: group.description,
  }
}

export default async function SocialGroupPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch group details with member count
  const { data: group, error } = await supabase
    .from("social_groups")
    .select(`
      *,
      group_members (count)
    `)
    .eq("id", id)
    .single()

  if (error || !group) {
    notFound()
  }

  // Get current user's membership status
  const { data: { user } } = await supabase.auth.getUser()
  
  let isMember = false
  if (user) {
    const { data: membership } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", id)
      .eq("user_id", user.id)
      .single()
    
    isMember = !!membership
  }

  // Get member list
  const { data: members } = await supabase
    .from("group_members")
    .select("user_name, joined_at")
    .eq("group_id", id)
    .order("joined_at", { ascending: false })
    .limit(10)

  const memberCount = group.group_members?.[0]?.count || 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          {group.image_url && (
            <div className="relative h-64 w-full rounded-xl overflow-hidden mb-6">
              <Image
                src={group.image_url}
                alt={group.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h1 className="text-3xl font-bold mb-2">{group.name}</h1>
                <div className="flex flex-wrap items-center gap-4">
                  {group.category && (
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      {CATEGORY_LABELS[group.category] || group.category}
                    </Badge>
                  )}
                  <Badge variant={group.is_active ? "default" : "secondary"}>
                    {group.is_active ? "Aktif" : "Pasif"}
                  </Badge>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {memberCount} üye
                  </span>
                </div>
              </div>
            </div>
          )}

          {!group.image_url && (
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-4">{group.name}</h1>
              <div className="flex flex-wrap items-center gap-4">
                {group.category && (
                  <Badge variant="outline">
                    {CATEGORY_LABELS[group.category] || group.category}
                  </Badge>
                )}
                <Badge variant={group.is_active ? "default" : "secondary"}>
                  {group.is_active ? "Aktif" : "Pasif"}
                </Badge>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  {memberCount} üye
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!isMember && group.is_active && (
            <div className="mb-6">
              <MembershipRequestDialog group={group} />
            </div>
          )}
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="about" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="about">
              <Info className="w-4 h-4 mr-2" />
              Hakkında
            </TabsTrigger>
            <TabsTrigger value="wall">
              <MessageSquare className="w-4 h-4 mr-2" />
              Tartışma
            </TabsTrigger>
            <TabsTrigger value="members">
              <Users className="w-4 h-4 mr-2" />
              Üyeler
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Grup Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Açıklama</h3>
                    <p className="text-muted-foreground">{group.description}</p>
                  </div>

                  {(group.recurring_day || group.time) && (
                    <div>
                      <h3 className="font-medium mb-2">Toplanma Zamanı</h3>
                      <div className="space-y-2">
                        {group.recurring_day && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>{DAY_LABELS[group.recurring_day]}</span>
                          </div>
                        )}
                        {group.time && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>{group.time}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {group.location && (
                    <div>
                      <h3 className="font-medium mb-2">Lokasyon</h3>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{group.location}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="font-medium mb-2">Üye Kapasitesi</h3>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>
                        {memberCount} üye
                        {group.max_members && ` / ${group.max_members} maksimum`}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Son Katılan Üyeler</CardTitle>
                </CardHeader>
                <CardContent>
                  {members && members.length > 0 ? (
                    <div className="space-y-3">
                      {members.map((member, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between py-2 border-b last:border-0"
                        >
                          <span className="font-medium">{member.user_name}</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(member.joined_at).toLocaleDateString("tr-TR")}
                          </span>
                        </div>
                      ))}
                      {memberCount > 10 && (
                        <p className="text-sm text-muted-foreground text-center pt-2">
                          ve {memberCount - 10} kişi daha...
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Henüz üye yok.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="wall" className="mt-6">
            <ClubCommentWall groupId={id} groupName={group.name} />
          </TabsContent>

          <TabsContent value="members" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Grup Üyeleri ({memberCount})</CardTitle>
              </CardHeader>
              <CardContent>
                {members && members.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {members.map((member, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <span className="font-medium">{member.user_name}</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(member.joined_at).toLocaleDateString("tr-TR")}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Henüz üye yok.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}