import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getAdminLogs } from "@/lib/supabase/queries"
import { PageHeader } from "@/components/page-header"
import { AdminLogsTable } from "@/components/admin-logs-table"

export default async function AdminLogsPage() {
  const supabase = await getSupabaseServerClient()
  const logs = await getAdminLogs(supabase, 100)

  return (
    <div className="space-y-8">
      <PageHeader title="運用ログ" description="管理者の操作履歴" />
      <AdminLogsTable logs={logs} />
    </div>
  )
}
