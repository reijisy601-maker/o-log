import { getSupabaseServerClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/page-header"
import { UsersTable } from "@/components/users-table"

export default async function AdminUsersPage() {
  const supabase = await getSupabaseServerClient()

  const { data: users } = await supabase.from("user_profiles").select("*").order("created_at", { ascending: false })

  return (
    <div className="space-y-8">
      <PageHeader title="ユーザー管理" description="全ユーザーの一覧と管理" />
      <UsersTable users={users || []} />
    </div>
  )
}
