import type { SupabaseClient } from "@supabase/supabase-js"
import type { User, Submission, MonthlyStats, AdminLog } from "@/lib/types"

export async function getCurrentUser(supabase: SupabaseClient): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role, first_name, last_name, notes, created_at, last_login")
    .eq("id", user.id)
    .maybeSingle()

  if (error) {
    console.error("Error fetching user profile:", error)
    return null
  }

  if (!data) {
    return {
      id: user.id,
      email: user.email ?? "",
      role: "user",
      created_at: user.created_at ?? new Date().toISOString(),
    }
  }

  const fullName = [data.last_name, data.first_name].filter(Boolean).join(" ").trim()

  return {
    id: data.id,
    email: data.email ?? user.email ?? "",
    name: fullName || undefined,
    role: data.role?.toLowerCase() === "admin" ? "admin" : "user",
    created_at: data.created_at ?? user.created_at ?? new Date().toISOString(),
    last_login: data.last_login ?? undefined,
    location_note: data.notes ?? undefined,
  }
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

  return (data ?? []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    image_url: row.image_url ?? null,
    luggage_space_image_url: row.luggage_space_image_url ?? row.image_url ?? null,
    tool_bag_image_url: row.tool_bag_image_url ?? null,
    score: row.score ?? 0,
    luggage_space_score: row.luggage_space_score ?? null,
    tool_bag_score: row.tool_bag_score ?? null,
    luggage_space_comment: row.luggage_space_comment ?? null,
    tool_bag_comment: row.tool_bag_comment ?? null,
    month: row.month ?? (row.created_at ? new Date(row.created_at).toISOString().slice(0, 7) : ""),
    created_at: row.created_at ?? new Date().toISOString(),
    analysis_result: row.analysis_result ?? null,
  }))
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

  return (data ?? []).map((row) => ({
    month: row.month,
    total_users: row.total_users ?? 0,
    submitted_users: row.submitted_users ?? 0,
    submission_rate: Number(row.submission_rate ?? 0),
    average_score: row.average_score ?? null,
  }))
}

export async function getNonSubmittedUsers(supabase: SupabaseClient, month: string) {
  const { data, error } = await supabase.rpc("get_non_submitted_users", { target_month: month })

  if (error) {
    console.error("Error fetching non-submitted users:", error)
    return []
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    last_login: row.last_login,
  }))
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
