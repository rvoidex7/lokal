import { LoginForm } from "@/components/auth/login-form"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function AuthPage() {
  // Server-side guard: if already authenticated, redirect away from /auth
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-[#0015ff]">Lokal</span>'e Hoş Geldiniz
          </h1>
          <p className="text-gray-600">Yerel aktivitelere katılmak için giriş yapın veya hesap oluşturun</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
