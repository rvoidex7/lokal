import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(req: Request) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 })
  }
  
  // Check if the user is an admin
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile || profile.role !== 'admin') {
    return NextResponse.json({ error: "Bu işlemi yapmaya yetkiniz yok." }, { status: 403 })
  }

  const { voucherCode } = await req.json()

  if (!voucherCode) {
    return NextResponse.json({ error: "Kupon kodu gerekli." }, { status: 400 })
  }

  try {
    // Fetch the voucher
    const { data: voucher, error: fetchError } = await supabase
      .from("coffee_vouchers")
      .select("*")
      .eq("voucher_code", voucherCode)
      .single()

    if (fetchError || !voucher) {
      return NextResponse.json({ error: "Geçersiz kupon kodu." }, { status: 404 })
    }

    if (voucher.is_used) {
      return NextResponse.json({ error: "Bu kupon zaten kullanılmış." }, { status: 400 })
    }

    if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
      return NextResponse.json({ error: "Bu kuponun süresi dolmuş." }, { status: 400 })
    }

    // Mark voucher as used
    const { error: updateError } = await supabase
      .from("coffee_vouchers")
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq("id", voucher.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ message: "Kupon başarıyla kullanıldı.", voucherCode: voucher.voucher_code })
  } catch (error: any) {
    console.error("Redemption error:", error)
    return NextResponse.json({ error: "Kupon kullanılırken bir hata oluştu." }, { status: 500 })
  }
}
