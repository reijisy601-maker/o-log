import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { createAdminLog } from "@/lib/supabase/queries"

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const input = Array.isArray(payload.allowed_domains) ? payload.allowed_domains : []
    const normalized = input
      .map((domain: unknown) => (typeof domain === "string" ? domain.trim().toLowerCase() : ""))
      .filter((domain: string) => domain.length > 0)
    const uniqueDomains = Array.from(new Set(normalized))

    const supabase = await getSupabaseServerClient()
    if (!supabase) {
      return NextResponse.json({ message: "認証エラー" }, { status: 401 })
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ message: "認証エラー" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()

    if (profile?.role !== "admin") {
      return NextResponse.json({ message: "権限がありません" }, { status: 403 })
    }

    const { data: currentRows, error: listError } = await supabase.rpc("admin_list_allowed_domains")
    if (listError) {
      console.error("Failed to load current domains:", listError)
      return NextResponse.json({ message: "ドメイン一覧の取得に失敗しました" }, { status: 500 })
    }

    const current = new Set((currentRows ?? []).map((row: { domain: string }) => row.domain))
    const desired = new Set(uniqueDomains)

    const toAdd = [...desired].filter((domain) => !current.has(domain))
    const toRemove = [...current].filter((domain) => !desired.has(domain))

    for (const domain of toAdd) {
      const { error } = await supabase.rpc("admin_add_allowed_domain", { p_domain: domain })
      if (error) {
        console.error("Failed to add allowed domain:", domain, error)
        return NextResponse.json({ message: `ドメイン(${domain})の追加に失敗しました` }, { status: 500 })
      }
    }

    for (const domain of toRemove) {
      const { error } = await supabase.rpc("admin_remove_allowed_domain", { p_domain: domain })
      if (error) {
        console.error("Failed to remove allowed domain:", domain, error)
        return NextResponse.json({ message: `ドメイン(${domain})の削除に失敗しました` }, { status: 500 })
      }
    }

    await createAdminLog(supabase, "security_settings_updated", undefined, {
      allowed_domains: uniqueDomains,
    })

    return NextResponse.json({ message: "設定を保存しました" })
  } catch (error) {
    console.error("Security settings error:", error)
    return NextResponse.json({ message: "サーバーエラー" }, { status: 500 })
  }
}
