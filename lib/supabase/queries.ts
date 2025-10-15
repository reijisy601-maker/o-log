import type { SupabaseClient } from "@supabase/supabase-js"
import type { User, Submission, MonthlyStats, AdminLog } from "@/lib/types"

export async function getCurrentUser(supabase: SupabaseClient): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()

  if (error) {
    console.error("Error fetching user profile:", error)
    return null
  }

  return data as User
}

export async function getUserSubmissions(supabase: SupabaseClient, userId: string): Promise<Submission[]> {
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching submissions:", error)
    return []
  }

  return data as Submission[]
}

export async function getMonthlyStats(supabase: SupabaseClient): Promise<MonthlyStats[]> {
  const { data, error } = await supabase
    .from("monthly_stats")
    .select("*")
    .order("month", { ascending: false })
    .limit(12)

  if (error) {
    console.error("Error fetching monthly stats:", error)
    return []
  }

  return data as MonthlyStats[]
}

export async function getNonSubmittedUsers(supabase: SupabaseClient, month: string) {
  const { data, error } = await supabase.rpc("get_non_submitted_users", { target_month: month })

  if (error) {
    console.error("Error fetching non-submitted users:", error)
    return []
  }

  return data
}

export async function getAdminLogs(supabase: SupabaseClient, limit = 50): Promise<AdminLog[]> {
  const { data, error } = await supabase
    .from("admin_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching admin logs:", error)
    return []
  }

  return data as AdminLog[]
}

export async function createAdminLog(
  supabase: SupabaseClient,
  action: string,
  targetUserId?: string,
  details?: Record<string, unknown>,
) {
  const user = await getCurrentUser(supabase)
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized")
  }

  const { error } = await supabase.from("admin_logs").insert({
    admin_id: user.id,
    action,
    target_user_id: targetUserId,
    details,
  })

  if (error) {
    console.error("Error creating admin log:", error)
    throw error
  }
}
