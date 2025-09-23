import { Metadata } from "next"
import { ActivityBrowser } from "@/components/activities/activity-browser"
import { PageHero } from "@/components/page-hero"

export const metadata: Metadata = {
  title: "Aktiviteler | Lokal Cafe",
  description: "Cafe'mizde düzenlenen aktiviteleri keşfedin ve katılın. Yeni deneyimler, yeni arkadaşlar!",
}

export default function AktivitelerPage() {
  return (
    <div className="min-h-screen">
      <PageHero
        title={
          <>
            Tüm <span className="text-[#0015ff]">Aktiviteler</span>
          </>
        }
        subtitle="Cafe'mizde düzenlenen atölye çalışmaları, etkinlikler ve sosyal aktivitelere katılarak unutulmaz anlar yaşayın. Yeni beceriler edinin, ilgi alanlarınızı keşfedin ve benzer düşünen insanlarla tanışın."
        breadcrumbs={[
          { label: "Ana Sayfa", href: "/" },
          { label: "Aktiviteler" },
        ]}
      />
      
      <div className="container mx-auto px-4 py-16">
        <ActivityBrowser />
      </div>
    </div>
  )
}