"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/empty-state"
import type { Submission } from "@/lib/types"
import { History, ImageIcon } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface SubmissionHistoryProps {
  submissions: Submission[]
  currentMonth: string
}

export function SubmissionHistory({ submissions, currentMonth }: SubmissionHistoryProps) {
  if (submissions.length === 0) {
    return (
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-primary" />
            投稿履歴
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState icon={ImageIcon} title="まだ投稿がありません" description="最初の整理整頓記録を投稿しましょう" />
        </CardContent>
      </Card>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500/10 text-green-500 border-green-500/20"
    if (score >= 60) return "bg-blue-500/10 text-blue-500 border-blue-500/20"
    if (score >= 40) return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    return "bg-red-500/10 text-red-500 border-red-500/20"
  }

  return (
    <Card className="glass-effect">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5 text-primary" />
          投稿履歴
        </CardTitle>
        <CardDescription className="text-sm">過去の整理整頓記録</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {submissions.map((submission) => (
            <Dialog key={submission.id}>
              <DialogTrigger asChild>
                <div className="cursor-pointer group">
                  <div className="relative aspect-square overflow-hidden rounded-lg border border-border/50 hover-lift transition-all">
                    <img
                      src={submission.luggage_space_image_url || submission.image_url || "/placeholder.svg"}
                      alt={`${submission.month}の記録`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    {submission.month === currentMonth && (
                      <Badge className="absolute top-1 right-1 text-xs px-1.5 py-0.5 bg-primary">今月</Badge>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <p className="text-xs text-white font-medium">{submission.month}</p>
                      <Badge className={`${getScoreColor(submission.score)} text-xs px-1.5 py-0.5 mt-1`}>
                        {submission.score}点
                      </Badge>
                    </div>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{submission.month}の記録</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* 2枚の画像を表示 */}
                  <div className="grid gap-3 md:grid-cols-2">
                    {submission.luggage_space_image_url && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">ラゲッジスペース</p>
                        <div className="relative aspect-video overflow-hidden rounded-lg border border-border">
                          <img
                            src={submission.luggage_space_image_url || "/placeholder.svg"}
                            alt="ラゲッジスペース"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {submission.luggage_space_comment && (
                          <p className="text-xs text-muted-foreground mt-2">{submission.luggage_space_comment}</p>
                        )}
                      </div>
                    )}
                    {submission.tool_bag_image_url && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">ツールバッグ</p>
                        <div className="relative aspect-video overflow-hidden rounded-lg border border-border">
                          <img
                            src={submission.tool_bag_image_url || "/placeholder.svg"}
                            alt="ツールバッグ"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {submission.tool_bag_comment && (
                          <p className="text-xs text-muted-foreground mt-2">{submission.tool_bag_comment}</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-sm text-muted-foreground">総合スコア</p>
                      <p className="text-2xl font-bold gradient-text">{submission.score}点</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">投稿日</p>
                      <p className="text-sm font-medium">
                        {new Date(submission.created_at).toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
