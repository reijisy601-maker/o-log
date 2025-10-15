import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { createAdminLog } from "@/lib/supabase/queries"

export async function POST(request: Request) {
  try {
    const { userId, location } = await request.json()

    if (!userId) {
      return NextResponse.json({ message: "ユーザーIDが必要です" }, { status: 400 })
    }

    const supabase = await getSupabaseServerClient()
    if (!supabase) {
      return NextResponse.json({ message: "認証エラー" }, { status: 401 })
    }

    const trimmed = typeof location === "string" ? location.trim() : ""

    const { error } = await supabase
      .from("profiles")
      .update({ notes: trimmed || null })
      .eq("id", userId)

    if (error) {
      console.error("Failed to update location note:", error)
      return NextResponse.json({ message: "拠点メモの更新に失敗しました" }, { status: 500 })
    }

    await createAdminLog(supabase, "update_location_note", userId, {
      location_note: trimmed,
    })

    return NextResponse.json({ message: "拠点メモを更新しました" })
  } catch (error) {
    console.error("Location note API error:", error)
    return NextResponse.json({ message: "サーバーエラー" }, { status: 500 })
  }
}
