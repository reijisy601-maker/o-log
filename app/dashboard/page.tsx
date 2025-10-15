import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUser, getUserSubmissions } from "@/lib/supabase/queries"
import { UploadCard } from "@/components/upload-card"
import { SubmissionHistory } from "@/components/submission-history"
import { UserNav } from "@/components/user-nav"
import { Calendar, TrendingUp, Award, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient()

  if (!supabase) {
    redirect("/")
  }

  const user = await getCurrentUser(supabase)

  if (!user) {
    redirect("/")
  }

  const submissions = await getUserSubmissions(supabase, user.id)

  const currentMonth = new Date().toISOString().slice(0, 7)
  const currentSubmission = submissions.find((s) => s.month === currentMonth)

  const recentSubmissions = submissions.slice(0, 3)
  const averageScore =
    recentSubmissions.length > 0 ? recentSubmissions.reduce((acc, s) => acc + s.score, 0) / recentSubmissions.length : 0

  const bestScore = submissions.length > 0 ? Math.max(...submissions.map((s) => s.score)) : 0

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 glass-effect sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl font-bold gradient-text">OrderLog</h1>
          </div>
          <UserNav user={user} />
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl">
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">ようこそ、{user.name || "ユーザー"}さん</h2>
          <p className="text-sm text-muted-foreground">今月の整理整頓記録を投稿しましょう</p>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="p-3 sm:p-4 rounded-lg glass-effect border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">今月</p>
            </div>
            <p className="text-lg sm:text-xl font-bold">{currentSubmission ? "完了" : "未投稿"}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {currentSubmission ? `${currentSubmission.score}点` : "要投稿"}
            </p>
          </div>
          <div className="p-3 sm:p-4 rounded-lg glass-effect border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">平均</p>
            </div>
            <p className="text-lg sm:text-xl font-bold">{averageScore.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground mt-1">過去3ヶ月</p>
          </div>
          <div className="p-3 sm:p-4 rounded-lg glass-effect border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">最高</p>
            </div>
            <p className="text-lg sm:text-xl font-bold">{bestScore}</p>
            <p className="text-xs text-muted-foreground mt-1">ベスト</p>
          </div>
        </div>

        {!currentSubmission && (
          <Alert className="mb-6 border-primary/20 bg-primary/5">
            <AlertCircle className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              今月の記録をまだ投稿していません。下記から画像をアップロードしてください。
            </AlertDescription>
          </Alert>
        )}

        {!currentSubmission && (
          <div className="mb-6">
            <UploadCard month={currentMonth} userId={user.id} />
          </div>
        )}

        <SubmissionHistory submissions={submissions} currentMonth={currentMonth} />
      </main>
    </div>
  )
}
