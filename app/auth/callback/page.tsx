"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/loading-spinner"

async function ensureSessionCookies(maxAttempts = 10, delayMs = 100) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const res = await fetch("/api/auth/verify", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      })

      if (res.ok) {
        return true
      }
    } catch (error) {
      console.warn("[v0] Cookie verification attempt failed", error)
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }

  return false
}

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  useEffect(() => {
    const handleCallback = async () => {
      const logs: string[] = []

      try {
        logs.push("1. Starting auth callback")
        console.log("[v0] 1. Starting auth callback")

        logs.push(`2. Full URL: ${window.location.href}`)
        console.log("[v0] 2. Full URL:", window.location.href)

        logs.push(`3. Hash: ${window.location.hash}`)
        console.log("[v0] 3. Hash:", window.location.hash)

        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get("access_token")
        const refreshToken = hashParams.get("refresh_token")
        const errorParam = hashParams.get("error")
        const errorDescription = hashParams.get("error_description")

        logs.push(`4. Access token: ${accessToken ? "present (" + accessToken.substring(0, 20) + "...)" : "MISSING"}`)
        logs.push(`5. Refresh token: ${refreshToken ? "present" : "MISSING"}`)
        console.log("[v0] 4. Access token:", accessToken ? "present" : "MISSING")
        console.log("[v0] 5. Refresh token:", refreshToken ? "present" : "MISSING")

        if (errorParam) {
          const errorMessage = errorDescription || "認証エラーが発生しました"
          logs.push(`6. Error detected: ${errorMessage}`)
          console.error("[v0] 6. Auth error:", errorMessage)
          setDebugInfo(logs)
          setTimeout(() => router.push(`/?error=${encodeURIComponent(errorMessage)}`), 3000)
          return
        }

        if (!accessToken || !refreshToken) {
          logs.push("6. ERROR: Missing tokens")
          console.error("[v0] 6. ERROR: Missing tokens")
          setDebugInfo(logs)
          setError("認証トークンが見つかりません")
          setTimeout(() => router.push("/?error=認証トークンが見つかりません"), 3000)
          return
        }

        logs.push("7. Calling /api/auth/session")
        console.log("[v0] 7. Calling /api/auth/session")

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

        logs.push(`8. API response status: ${response.status}`)
        console.log("[v0] 8. API response status:", response.status)

        if (!response.ok) {
          const errorData = await response.json()
          logs.push(`9. API error: ${JSON.stringify(errorData)}`)
          console.error("[v0] 9. Session API error:", errorData)
          setDebugInfo(logs)
          setError(`セッション設定エラー: ${errorData.error}`)
          setTimeout(
            () => router.push(`/?error=${encodeURIComponent(errorData.error || "セッション設定エラー")}`),
            3000,
          )
          return
        }

        const { user, isAdmin, redirectTo } = await response.json()
        logs.push(`10. Auth successful - User: ${user.email}, Admin: ${isAdmin}`)
        console.log("[v0] 10. Auth successful, user:", user.email, "isAdmin:", isAdmin)

        const destination = typeof redirectTo === "string" ? redirectTo : isAdmin ? "/admin" : "/dashboard"
        logs.push(`11. Redirecting to: ${destination}`)
        console.log("[v0] 11. Redirecting to:", destination)

        setDebugInfo(logs)

        await ensureSessionCookies()

        console.log("[v0] 12. Executing redirect...")
        window.location.assign(destination)
        return
      } catch (error) {
        logs.push(`ERROR: ${error instanceof Error ? error.message : String(error)}`)
        console.error("[v0] Auth callback error:", error)
        setDebugInfo(logs)
        setError("認証処理中にエラーが発生しました")
        setTimeout(() => {
          router.push("/?error=認証処理中にエラーが発生しました")
        }, 3000)
      }
    }

    handleCallback()
  }, [router])

  if (error || debugInfo.length > 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-card border rounded-lg p-6">
            {error && (
              <div className="mb-4">
                <p className="text-destructive font-semibold mb-2">{error}</p>
                <p className="text-muted-foreground text-sm">3秒後にログインページにリダイレクトします...</p>
              </div>
            )}

            {debugInfo.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold mb-2">デバッグ情報:</p>
                <div className="bg-muted p-3 rounded text-xs font-mono space-y-1 max-h-96 overflow-y-auto">
                  {debugInfo.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
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
