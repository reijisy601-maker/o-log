import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getMonthlyStats, getNonSubmittedUsers } from "@/lib/supabase/queries"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { MonthlyStatsChart } from "@/components/monthly-stats-chart"
import { NonSubmittedUsersList } from "@/components/non-submitted-users-list"
import { Users, TrendingUp, Award, AlertCircle } from "lucide-react"
import { redirect } from "next/navigation"

export default async function AdminDashboardPage() {
  const supabase = await getSupabaseServerClient()

  if (!supabase) {
    redirect("/")
  }

  const monthlyStats = await getMonthlyStats(supabase)

  const currentMonth = new Date().toISOString().slice(0, 7)
  const currentStats = monthlyStats.find((s) => s.month === currentMonth)
  const nonSubmittedUsers = await getNonSubmittedUsers(supabase, currentMonth)

  const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true })

  return (
    <div className="space-y-8">
      <PageHeader title="管理者ダッシュボード" description="システム全体の統計と管理" />

      <div className="grid gap-6 md:grid-cols-4">
        <StatCard title="総ユーザー数" value={totalUsers || 0} icon={Users} description="登録済みユーザー" />
        <StatCard
          title="今月の投稿率"
          value={`${currentStats?.submission_rate || 0}%`}
          icon={TrendingUp}
          description={`${currentStats?.submitted_users || 0}/${currentStats?.total_users || 0}人が投稿`}
        />
        <StatCard
          title="平均スコア"
          value={
            typeof currentStats?.average_score === "number"
              ? currentStats.average_score.toFixed(1)
              : "N/A"
          }
          icon={Award}
          description="今月の平均"
        />
        <StatCard
          title="未投稿ユーザー"
          value={nonSubmittedUsers.length}
          icon={AlertCircle}
          description="今月まだ投稿していない"
        />
      </div>

      <MonthlyStatsChart stats={monthlyStats} />

      <NonSubmittedUsersList users={nonSubmittedUsers} month={currentMonth} />
    </div>
  )
}
