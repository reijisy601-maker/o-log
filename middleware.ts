import { createClient } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next()
  }

  const response = NextResponse.next()

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
    },
  })

  // 認証が必要なパスをチェック
  const protectedPaths = ["/dashboard", "/admin"]
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  if (isProtectedPath) {
    const accessToken = request.cookies.get("sb-access-token")?.value

    if (!accessToken) {
      return NextResponse.redirect(new URL("/", request.url))
    }

    // 管理者エリアの場合は、管理者権限をチェック
    if (request.nextUrl.pathname.startsWith("/admin")) {
      // TODO: 管理者権限チェックを実装
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
