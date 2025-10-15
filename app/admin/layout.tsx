import type React from "react"
import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/supabase/queries"
import { UserNav } from "@/components/user-nav"
import { AdminNav } from "@/components/admin-nav"
import { Shield } from "lucide-react"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServerClient()

  if (!supabase) {
    const mockUser = {
      id: "test-admin",
      email: "admin@test.com",
      full_name: "テスト管理者",
      role: "admin" as const,
    }

    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/50 glass-effect sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-destructive" />
              </div>
              <h1 className="text-xl font-bold gradient-text">管理者エリア</h1>
            </div>
            <UserNav user={mockUser} />
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <AdminNav />
          <div className="mt-6">{children}</div>
        </div>
      </div>
    )
  }

  const user = await getCurrentUser(supabase)

  if (!user || user.role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 glass-effect sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-destructive" />
            </div>
            <h1 className="text-xl font-bold gradient-text">管理者エリア</h1>
          </div>
          <UserNav user={user} />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <AdminNav />
        <div className="mt-6">{children}</div>
      </div>
    </div>
  )
}
