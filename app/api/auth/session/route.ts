import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

function resolveCookieDomain() {
  if (process.env.NODE_ENV !== "production") {
    return undefined
  }

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL
    if (!siteUrl) return undefined
    const hostname = new URL(siteUrl).hostname
    return hostname && hostname !== "localhost" ? hostname : undefined
  } catch (error) {
    console.warn("[v0] Failed to resolve cookie domain", error)
    return undefined
  }
}

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

    let role: string | null = (user.user_metadata?.role as string | undefined) ?? null

    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

      if (profileError) {
        console.error("[v0] Session API: Profile fetch error", profileError)
      }

      if (profile?.role) {
        role = profile.role
      }
    } catch (error) {
      console.error("[v0] Session API: Unexpected profile fetch error", error)
    }

    const normalizedRole = role?.toLowerCase() ?? "user"
    const isAdmin = normalizedRole === "admin"
    const redirectTo = isAdmin ? "/admin" : "/dashboard"

    console.log("[v0] Session API: User authenticated:", user.email)
    console.log("[v0] Session API: User metadata:", user.user_metadata)

    console.log("[v0] Session API: Setting cookies")
    const cookieStore = await cookies()
    const cookieDomain = resolveCookieDomain()
    cookieStore.set("sb-access-token", access_token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60,
      domain: cookieDomain,
    })
    cookieStore.set("sb-refresh-token", refresh_token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      domain: cookieDomain,
    })

    console.log("[v0] Session API: Is admin:", isAdmin)

    console.log("[v0] Session API: Success, returning user data")
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      isAdmin,
      redirectTo,
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
