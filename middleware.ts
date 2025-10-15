import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  console.log("[v0] Middleware: Request path:", path, "at", new Date().toISOString())

  const accessToken = request.cookies.get("sb-access-token")
  console.log("[v0] Middleware: sb-access-token present:", Boolean(accessToken?.value))

  if (!accessToken?.value) {
    console.log("[v0] Middleware: Missing auth cookie, redirecting to /")
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
}
