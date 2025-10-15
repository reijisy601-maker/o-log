"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/loading-spinner"

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log("[v0] Auth callback - processing hash fragment")

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

        const response = await fetch("/api/auth/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            access_token: accessToken,
            refresh_token: refreshToken,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error("[v0] Session API error:", errorData)
          router.push(`/?error=${encodeURIComponent(errorData.error || "セッション設定エラー")}`)
          return
        }

        const { user, isAdmin } = await response.json()
        console.log("[v0] Auth successful, user:", user.email, "isAdmin:", isAdmin)

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
