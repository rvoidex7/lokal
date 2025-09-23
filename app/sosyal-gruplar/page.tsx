import { Metadata } from "next"
import { SocialGroupsGrid } from "@/components/social-groups-grid"
import { PageHero } from "@/components/page-hero"

export const metadata: Metadata = {
  title: "Sosyal Gruplar | Lokal Cafe",
  description: "Cafe'deki sosyal aktivite gruplarına katılın ve yeni insanlarla tanışın",
}

export default function SosyalGruplarPage() {
  return (
    <div className="min-h-screen">
      <PageHero
        title={
          <>
            Sosyal <span className="text-[#0015ff]">Gruplar</span>
          </>
        }
        subtitle="Cafe'mizde düzenlenen sosyal aktivite gruplarına katılarak ortak ilgi alanlarına sahip insanlarla tanışabilir, yeni hobiler edinebilir ve keyifli vakit geçirebilirsiniz."
        breadcrumbs={[
          { label: "Ana Sayfa", href: "/" },
          { label: "Sosyal Gruplar" },
        ]}
      />
      
      <div className="container mx-auto px-4 py-16">
        <SocialGroupsGrid />
      </div>
    </div>
  )
}