import { auth } from "@/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const protectedRoutes = ["/setup", "/dashboard", "/onboarding"]

export default auth(function proxy(req: NextRequest & { auth: { user?: { id?: string } } | null }) {
  const path = req.nextUrl.pathname

  if (
    protectedRoutes.some((r) => path.startsWith(r)) &&
    !req.auth?.user?.id
  ) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
}
