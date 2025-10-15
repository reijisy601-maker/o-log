import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const error_description = requestUrl.searchParams.get("error_description")

  console.log("[v0] Auth callback - code:", code ? "present" : "missing")
  console.log("[v0] Auth callback - error:", error)
  console.log("[v0] Auth callback - error_description:", error_description)

  if (error) {
    const errorMessage = error_description || "認証エラーが発生しました"
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(errorMessage)}`, request.url))
  }

  if (code) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error("[v0] Supabase環境変数が設定されていません")
        return NextResponse.redirect(new URL("/?error=設定エラー", request.url))
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey)

      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error("[v0] Code exchange error:", exchangeError)
        return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(exchangeError.message)}`, request.url))
      }

      console.log("[v0] Auth successful, user:", data.user?.email)

      if (data.user) {
        await supabase.from("user_profiles").update({ last_login: new Date().toISOString() }).eq("id", data.user.id)
      }

      return NextResponse.redirect(new URL("/dashboard", request.url))
    } catch (error) {
      console.error("[v0] Auth callback error:", error)
      return NextResponse.redirect(new URL("/?error=認証処理中にエラーが発生しました", request.url))
    }
  }

  return NextResponse.redirect(new URL("/", request.url))
}
