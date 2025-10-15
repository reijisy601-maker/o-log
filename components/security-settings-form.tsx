"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Save } from "lucide-react"

interface SecuritySettingsFormProps {
  initialSettings: {
    allowed_domains: string[]
  }
}

export function SecuritySettingsForm({ initialSettings }: SecuritySettingsFormProps) {
  const [domains, setDomains] = useState<string[]>(initialSettings.allowed_domains ?? [])
  const [input, setInput] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const normalizedDomains = domains.map((domain) => domain.trim()).filter((domain) => domain.length > 0)

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch("/api/admin/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowed_domains: normalizedDomains }),
      })

      if (!response.ok) {
        const { message } = await response.json()
        throw new Error(message || "保存に失敗しました")
      }

      setMessage({ type: "success", text: "設定を保存しました" })
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "エラーが発生しました" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="glass-effect">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          セキュリティ設定
        </CardTitle>
        <CardDescription>許可ドメインを管理</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="domains">許可ドメイン</Label>
          <div className="flex gap-2">
            <Input
              id="domains"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="example.com"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                const value = input.trim().toLowerCase()
                if (!value) return
                if (!domains.includes(value)) {
                  setDomains((prev) => [...prev, value])
                }
                setInput("")
              }}
            >
              追加
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">許可したいドメインを入力して追加します</p>
          {normalizedDomains.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-2">
              {normalizedDomains.map((domain) => (
                <span
                  key={domain}
                  className="inline-flex items-center rounded-full border border-border px-3 py-1 text-sm"
                >
                  {domain}
                  <button
                    type="button"
                    className="ml-2 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => setDomains((prev) => prev.filter((item) => item !== domain))}
                  >
                    削除
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground pt-2">現在登録されているドメインはありません</p>
          )}
        </div>

        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          {saving ? "保存中..." : "設定を保存"}
        </Button>
      </CardContent>
    </Card>
  )
}
