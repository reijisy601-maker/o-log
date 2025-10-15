"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { User } from "@/lib/types"
import { Users, MoreHorizontal, CheckCircle2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface UsersTableProps {
  users: User[]
}

export function UsersTable({ users }: UsersTableProps) {
  return (
    <Card className="glass-effect">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          ユーザー一覧
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>メールアドレス</TableHead>
              <TableHead>名前</TableHead>
              <TableHead>拠点メモ</TableHead>
              <TableHead>役割</TableHead>
              <TableHead>登録日</TableHead>
              <TableHead>最終ログイン</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <UserRow key={user.id} user={user} />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

type SaveState = "idle" | "saving" | "saved" | "error"

function UserRow({ user }: { user: User }) {
  const [location, setLocation] = useState(user.location_note ?? "")
  const [status, setStatus] = useState<SaveState>("idle")
  const [isPending, startTransition] = useTransition()

  const handleSave = () => {
    startTransition(async () => {
      setStatus("saving")
      try {
        const response = await fetch("/api/admin/users/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            location,
          }),
        })

        if (!response.ok) {
          setStatus("error")
          return
        }

        setStatus("saved")
        setTimeout(() => setStatus("idle"), 1500)
      } catch (error) {
        console.error("Failed to save location note:", error)
        setStatus("error")
      }
    })
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{user.email}</TableCell>
      <TableCell>{user.name || "-"}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Input
            value={location}
            onChange={(e) => {
              setLocation(e.target.value)
              if (status === "saved") setStatus("idle")
            }}
            placeholder="拠点メモを入力"
            className="max-w-[200px]"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleSave}
            disabled={isPending}
            className={cn(
              status === "saved" ? "border-green-500 text-green-600" : "",
              status === "error" ? "border-destructive text-destructive" : "",
            )}
          >
            {status === "saving" ? "保存中..." : status === "saved" ? "保存済み" : "保存"}
          </Button>
          {status === "saved" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={user.role === "admin" ? "destructive" : "secondary"}>
          {user.role === "admin" ? "管理者" : "ユーザー"}
        </Badge>
      </TableCell>
      <TableCell>{new Date(user.created_at).toLocaleDateString("ja-JP")}</TableCell>
      <TableCell>{user.last_login ? new Date(user.last_login).toLocaleDateString("ja-JP") : "未ログイン"}</TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>詳細を表示</DropdownMenuItem>
            <DropdownMenuItem>投稿履歴</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">削除</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}
