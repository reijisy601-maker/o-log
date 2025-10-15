import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    console.log("[v0] Session API: Starting")

    const { access_token, refresh_token } = await request.json()
    console.log("[v0] Session API: Tokens received:", {
      access_token: access_token ? "present" : "missing",
      refresh_token: refresh_token ? "present" : "missing",
    })

    if (!access_token || !refresh_token) {
      console.error("[v0] Session API: Missing tokens")
      return NextResponse.json({ error: "トークンが見つかりません" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log("[v0] Session API: Environment variables:", {
      supabaseUrl: supabaseUrl ? "present" : "MISSING",
      supabaseAnonKey: supabaseAnonKey ? "present" : "MISSING",
    })

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[v0] Session API: Missing environment variables")
      return NextResponse.json({ error: "Supabase環境変数が設定されていません" }, { status: 500 })
    }

    console.log("[v0] Session API: Creating Supabase client")
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log("[v0] Session API: Setting session")
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    })

    if (sessionError) {
      console.error("[v0] Session API: Session error:", sessionError)
      return NextResponse.json({ error: sessionError.message }, { status: 401 })
    }

    const user = sessionData.user
    if (!user) {
      console.error("[v0] Session API: No user in session data")
      return NextResponse.json({ error: "ユーザー情報が取得できませんでした" }, { status: 401 })
    }

    console.log("[v0] Session API: User authenticated:", user.email)
    console.log("[v0] Session API: User metadata:", user.user_metadata)

    console.log("[v0] Session API: Setting cookies")
    const cookieStore = await cookies()
    cookieStore.set("sb-access-token", access_token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60,
    })
    cookieStore.set("sb-refresh-token", refresh_token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    })

    const isAdmin = user.user_metadata?.role === "admin"
    console.log("[v0] Session API: Is admin:", isAdmin)

    console.log("[v0] Session API: Success, returning user data")
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      isAdmin,
    })
  } catch (error) {
    console.error("[v0] Session API: Unexpected error:", error)
    return NextResponse.json(
      {
        error: "認証処理中にエラーが発生しました",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
