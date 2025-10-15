import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("sb-access-token")

  if (!accessToken?.value) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
}
