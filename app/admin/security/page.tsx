import { getSupabaseServerClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/page-header"
import { SecuritySettingsForm } from "@/components/security-settings-form"

export default async function AdminSecurityPage() {
  const supabase = await getSupabaseServerClient()

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
