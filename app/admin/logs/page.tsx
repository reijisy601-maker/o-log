import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getAdminLogs } from "@/lib/supabase/queries"
import { PageHeader } from "@/components/page-header"
import { AdminLogsTable } from "@/components/admin-logs-table"

export default async function AdminLogsPage() {
  const supabase = await getSupabaseServerClient()

  if (!supabase) {
    return (
      <div className="space-y-8">
        <PageHeader title="運用ログ" description="環境変数の設定が必要です" />
        <p className="text-sm text-muted-foreground">
          Supabase の環境変数が未設定のためログを取得できませんでした。NEXT_PUBLIC_SUPABASE_URL と
          NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してください。
        </p>
      </div>
    )
  }

  const logs = await getAdminLogs(supabase, 100)

  return (
    <div className="space-y-8">
      <PageHeader title="運用ログ" description="管理者の操作履歴" />
      <AdminLogsTable logs={logs} />
    </div>
  )
}
