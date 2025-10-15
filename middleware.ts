import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  console.log("[v0] Middleware: Request path:", request.nextUrl.pathname)

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log("[v0] Middleware: No Supabase env vars, allowing request")
    return NextResponse.next()
  }

  const response = NextResponse.next()

  const protectedPaths = ["/dashboard", "/admin"]
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  console.log("[v0] Middleware: Is protected path:", isProtectedPath)

  if (isProtectedPath) {
    const accessToken = request.cookies.get("sb-access-token")?.value
    console.log("[v0] Middleware: Access token:", accessToken ? "present" : "MISSING")

    if (!accessToken) {
      console.log("[v0] Middleware: No access token, redirecting to /")
      return NextResponse.redirect(new URL("/", request.url))
    }

    console.log("[v0] Middleware: Access token found, allowing request")
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
