import type { Metadata } from "next"
import { AnnouncementGrid } from "@/components/announcement-grid"
import { PageHero } from "@/components/page-hero"

export const metadata: Metadata = {
  title: "Duyurular",
  description: "Yaklaşan etkinlikleri keşfedin ve katılmak istediğinizi işaretleyin. Yeni arkadaşlıklar kurun!",
}

export default function AnnouncementsPage() {
  return (
    <div className="min-h-screen">
      <PageHero
        title={
          <>
            Etkinlik <span className="text-[#0015ff]">Duyuruları</span>
          </>
        }
        subtitle="Yaklaşan etkinlikleri keşfedin ve katılmak istediğinizi işaretleyin. Yeni arkadaşlıklar kurmak ve güzel anılar biriktirmek için hemen katılın!"
        breadcrumbs={[
          { label: "Ana Sayfa", href: "/" },
          { label: "Duyurular" },
        ]}
      />

      <div className="container mx-auto px-4 py-16">
        <AnnouncementGrid />
      </div>
    </div>
  )
}