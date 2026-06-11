import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const formData = await req.formData()
  const email = (formData.get("email") as string)?.trim()
  const redirectTo = (formData.get("redirectTo") as string) || "/dashboard"

  if (!email) {
    return new NextResponse("email required", { status: 400 })
  }

  let user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    user = await prisma.user.create({
      data: { email, name: email.split("@")[0] },
    })
  }

  const sessionToken = crypto.randomUUID()
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  await prisma.session.create({
    data: { sessionToken, userId: user.id, expires },
  })

  const response = NextResponse.redirect(new URL(redirectTo, req.url))
  response.cookies.set("authjs.session-token", sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires,
  })

  return response
}
