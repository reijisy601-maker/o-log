import { getSupabaseServerClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/page-header"
import { SecuritySettingsForm } from "@/components/security-settings-form"

export default async function AdminSecurityPage() {
  const supabase = await getSupabaseServerClient()

  const { data: settings } = await supabase.from("security_settings").select("*")

  const settingsMap = settings?.reduce(
    (acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    },
    {} as Record<string, unknown>,
  )

  return (
    <div className="space-y-8">
      <PageHeader title="セキュリティ設定" description="システムのセキュリティ設定を管理" />
      <SecuritySettingsForm initialSettings={settingsMap || {}} />
    </div>
  )
}
