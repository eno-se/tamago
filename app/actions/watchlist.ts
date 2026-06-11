"use server"

import { auth } from "@/auth"
import { prisma } from "@/app/lib/prisma"
import { revalidatePath } from "next/cache"

const WATCHLIST_LIMIT = 5

export async function addToWatchList(eggId: string): Promise<{ ok: boolean; reason?: "limit" | "own" }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false }

  const egg = await prisma.egg.findUnique({ where: { id: eggId }, include: { creator: { select: { userId: true } } } })
  if (egg?.creator.userId === session.user.id) return { ok: false, reason: "own" }

  const count = await prisma.watchList.count({ where: { userId: session.user.id } })
  if (count >= WATCHLIST_LIMIT) return { ok: false, reason: "limit" }

  try {
    await prisma.watchList.create({ data: { userId: session.user.id, eggId } })
    revalidatePath("/watchlist")
    return { ok: true }
  } catch {
    return { ok: false }
  }
}

export async function removeFromWatchList(eggId: string): Promise<{ ok: boolean }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false }
  await prisma.watchList.deleteMany({
    where: { userId: session.user.id, eggId },
  })
  revalidatePath("/watchlist")
  return { ok: true }
}
