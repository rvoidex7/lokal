import type { Metadata } from "next"
import dynamic from "next/dynamic"

const AdminDashboard = dynamic(() => import("@/components/admin/admin-dashboard").then(mod => ({ default: mod.AdminDashboard })), {
  loading: () => <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
  </div>
})

export const metadata: Metadata = {
  title: "Admin Paneli",
  description: "Duyuruları yönetin ve katılımcıları görüntüleyin.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-16">
        <AdminDashboard />
      </div>
    </div>
  )
}
