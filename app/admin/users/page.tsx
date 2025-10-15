import { getSupabaseServerClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/page-header"
import { UsersTable } from "@/components/users-table"

export default async function AdminUsersPage() {
  const supabase = await getSupabaseServerClient()

  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, email, role, first_name, last_name, notes, created_at, last_login")
    .order("notes", { ascending: true, nullsLast: true })
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching profiles:", error)
  }

  return (
    <div className="space-y-8">
      <PageHeader title="ユーザー管理" description="全ユーザーの一覧と管理" />
      <UsersTable
        users={
          users?.map((profile) => ({
            id: profile.id,
            email: profile.email ?? "",
            name: [profile.last_name, profile.first_name].filter(Boolean).join(" ").trim() || undefined,
            role: profile.role === "admin" ? "admin" : "user",
            created_at: profile.created_at ?? new Date().toISOString(),
            last_login: profile.last_login ?? undefined,
            location_note: profile.notes ?? undefined,
          })) || []
        }
      />
    </div>
  )
}
