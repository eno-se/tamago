"use server"

import { auth } from "@/auth"
import { prisma } from "@/app/lib/prisma"
import { revalidatePath } from "next/cache"

export async function addSocialLink(platform: string, url: string) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false }

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
    select: { id: true, slug: true },
  })
  if (!creator) return { ok: false }

  const count = await prisma.socialLink.count({ where: { creatorId: creator.id } })
  if (count >= 12) return { ok: false, reason: "limit" }

  await prisma.socialLink.create({
    data: { creatorId: creator.id, platform, url, order: count },
  })

  revalidatePath(`/u/${creator.slug}`)
  revalidatePath("/dashboard")
  return { ok: true }
}

export async function updateSocialLink(id: string, url: string) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false }

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
    select: { id: true, slug: true },
  })
  if (!creator) return { ok: false }

  await prisma.socialLink.updateMany({
    where: { id, creatorId: creator.id },
    data: { url },
  })

  revalidatePath(`/u/${creator.slug}`)
  revalidatePath("/dashboard")
  return { ok: true }
}

export async function removeSocialLink(id: string) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false }

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
    select: { id: true, slug: true },
  })
  if (!creator) return { ok: false }

  await prisma.socialLink.deleteMany({
    where: { id, creatorId: creator.id },
  })

  revalidatePath(`/u/${creator.slug}`)
  revalidatePath("/dashboard")
  return { ok: true }
}
