"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { LoadingSpinner } from "@/components/loading-spinner"

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log("[v0] Auth callback - processing hash fragment")

        // ハッシュフラグメントからトークンを取得
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get("access_token")
        const refreshToken = hashParams.get("refresh_token")
        const errorParam = hashParams.get("error")
        const errorDescription = hashParams.get("error_description")

        console.log("[v0] Access token:", accessToken ? "present" : "missing")
        console.log("[v0] Error:", errorParam)

        if (errorParam) {
          const errorMessage = errorDescription || "認証エラーが発生しました"
          console.error("[v0] Auth error:", errorMessage)
          router.push(`/?error=${encodeURIComponent(errorMessage)}`)
          return
        }

        if (!accessToken || !refreshToken) {
          console.error("[v0] Missing tokens")
          router.push("/?error=認証トークンが見つかりません")
          return
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseAnonKey) {
          console.error("[v0] Supabase環境変数が設定されていません")
          router.push("/?error=設定エラー")
          return
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        // セッションを設定
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (sessionError) {
          console.error("[v0] Session error:", sessionError)
          router.push(`/?error=${encodeURIComponent(sessionError.message)}`)
          return
        }

        console.log("[v0] Auth successful, user:", sessionData.user?.email)

        // ユーザー情報を取得
        const user = sessionData.user
        if (!user) {
          router.push("/?error=ユーザー情報が取得できませんでした")
          return
        }

        // 最終ログイン時刻を更新
        await supabase.from("user_profiles").upsert({
          id: user.id,
          email: user.email,
          last_login: new Date().toISOString(),
        })

        // 管理者権限を確認
        const isAdmin = user.user_metadata?.role === "admin"
        console.log("[v0] User role:", user.user_metadata?.role, "isAdmin:", isAdmin)

        // 適切なページにリダイレクト
        if (isAdmin) {
          console.log("[v0] Redirecting to admin dashboard")
          router.push("/admin")
        } else {
          console.log("[v0] Redirecting to user dashboard")
          router.push("/dashboard")
        }
      } catch (error) {
        console.error("[v0] Auth callback error:", error)
        setError("認証処理中にエラーが発生しました")
        setTimeout(() => {
          router.push("/?error=認証処理中にエラーが発生しました")
        }, 2000)
      }
    }

    handleCallback()
  }, [router])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <p className="text-muted-foreground text-sm">ログインページにリダイレクトしています...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <LoadingSpinner />
        <p className="text-muted-foreground mt-4">認証処理中...</p>
      </div>
    </div>
  )
}
