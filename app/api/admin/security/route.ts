import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { createAdminLog } from "@/lib/supabase/queries"

export async function POST(request: Request) {
  try {
    const { allowed_domains, max_file_size } = await request.json()

    const supabase = await getSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ message: "認証エラー" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ message: "権限がありません" }, { status: 403 })
    }

    await supabase
      .from("security_settings")
      .upsert({ key: "allowed_domains", value: allowed_domains, updated_by: user.id })

    await supabase.from("security_settings").upsert({ key: "max_file_size", value: max_file_size, updated_by: user.id })

    await createAdminLog(supabase, "security_settings_updated", undefined, {
      allowed_domains,
      max_file_size,
    })

    return NextResponse.json({ message: "設定を保存しました" })
  } catch (error) {
    console.error("Security settings error:", error)
    return NextResponse.json({ message: "サーバーエラー" }, { status: 500 })
  }
}
