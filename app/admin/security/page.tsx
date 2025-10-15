import { getSupabaseServerClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/page-header"
import { SecuritySettingsForm } from "@/components/security-settings-form"

export default async function AdminSecurityPage() {
  const supabase = await getSupabaseServerClient()

  if (!supabase) {
    return (
      <div className="space-y-8">
        <PageHeader title="セキュリティ設定" description="環境変数の設定が必要です" />
        <p className="text-sm text-muted-foreground">
          Supabase の環境変数が未設定のためデータを取得できませんでした。NEXT_PUBLIC_SUPABASE_URL と
          NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してください。
        </p>
      </div>
    )
  }

  const { data, error } = await supabase.rpc("admin_list_allowed_domains")
  if (error) {
    console.error("Failed to load allowed domains:", error)
  }

  const allowedDomains = (data ?? []).map((row: { domain: string }) => row.domain)

  return (
    <div className="space-y-8">
      <PageHeader title="セキュリティ設定" description="システムのセキュリティ設定を管理" />
      <SecuritySettingsForm
        initialSettings={{
          allowed_domains: allowedDomains,
        }}
      />
    </div>
  )
}
