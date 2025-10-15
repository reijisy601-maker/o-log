import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const { access_token, refresh_token } = await request.json()

    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: "トークンが見つかりません" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: "Supabase環境変数が設定されていません" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    })

    if (sessionError) {
      console.error("[v0] Session error:", sessionError)
      return NextResponse.json({ error: sessionError.message }, { status: 401 })
    }

    const user = sessionData.user
    if (!user) {
      return NextResponse.json({ error: "ユーザー情報が取得できませんでした" }, { status: 401 })
    }

    const cookieStore = await cookies()
    cookieStore.set("sb-access-token", access_token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1時間
    })
    cookieStore.set("sb-refresh-token", refresh_token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7日間
    })

    await supabase.from("user_profiles").upsert({
      id: user.id,
      email: user.email,
      last_login: new Date().toISOString(),
    })

    const isAdmin = user.user_metadata?.role === "admin"

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      isAdmin,
    })
  } catch (error) {
    console.error("[v0] Session API error:", error)
    return NextResponse.json({ error: "認証処理中にエラーが発生しました" }, { status: 500 })
  }
}
