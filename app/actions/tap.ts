"use server"

import { auth } from "@/auth"
import { prisma } from "@/app/lib/prisma"
import { Prisma } from "@/app/generated/prisma/client"
import { getJSTDate, getJSTDateString } from "@/app/lib/egg-state"
import { revalidatePath } from "next/cache"

const TARGET_TAP_COUNT = 1_000_000
const ENGRAVING_TOP_COUNT = 100

type TapResult =
  | { ok: true; broken: false; streakDays: number }
  | { ok: true; broken: true; resultId: string; streakDays: number }
  | { ok: false; reason: "not_authenticated" | "already_tapped" | "egg_completed" | "not_found" | "own_egg" }

export async function tapEgg(eggId: string): Promise<TapResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, reason: "not_authenticated" }
  }
  const userId = session.user.id

  const egg = await prisma.egg.findUnique({
    where: { id: eggId },
    include: { creator: { select: { userId: true } } },
  })
  if (!egg) return { ok: false, reason: "not_found" }
  if (egg.status === "COMPLETED") return { ok: false, reason: "egg_completed" }
  if (egg.creator.userId === userId) return { ok: false, reason: "own_egg" }

  const tapDate = getJSTDate()
  const tapDateStr = getJSTDateString()

  try {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // タップ記録（重複は unique constraint エラーになる）
      await tx.tap.create({
        data: { eggId, userId, tapDate, tapType: "NORMAL" },
      })

      // 今日この卵への最初のタップか判定（自分のタップが唯一なら1位）
      const todayTapCount = await tx.tap.count({ where: { eggId, tapDate } })
      const isFirstToday = todayTapCount === 1

      // 卵のカウント更新
      const updatedEgg = await tx.egg.update({
        where: { id: eggId },
        data: { currentTapCount: { increment: 1 } },
      })

      // ファンの統計更新
      const existingStats = await tx.fanEggStats.findUnique({
        where: { eggId_userId: { eggId, userId } },
      })

      let newStreakDays: number
      if (!existingStats) {
        newStreakDays = 1
        await tx.fanEggStats.create({
          data: {
            eggId,
            userId,
            currentStreakDays: 1,
            maxStreakDays: 1,
            totalTapDays: 1,
            firstTapCount: isFirstToday ? 1 : 0,
            lastTapDate: tapDate,
          },
        })
      } else {
        const yesterday = new Date(tapDate)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split("T")[0]
        const lastStr = existingStats.lastTapDate
          ? existingStats.lastTapDate.toISOString().split("T")[0]
          : null

        newStreakDays =
          lastStr === yesterdayStr
            ? existingStats.currentStreakDays + 1
            : 1

        const newMax = Math.max(existingStats.maxStreakDays, newStreakDays)

        await tx.fanEggStats.update({
          where: { eggId_userId: { eggId, userId } },
          data: {
            currentStreakDays: newStreakDays,
            maxStreakDays: newMax,
            totalTapDays: { increment: 1 },
            firstTapCount: isFirstToday ? { increment: 1 } : undefined,
            lastTapDate: tapDate,
          },
        })
      }

      // 100万回達成チェック
      if (updatedEgg.currentTapCount >= TARGET_TAP_COUNT) {
        // 割れる処理
        const uniqueFans = await tx.fanEggStats.count({ where: { eggId } })

        // 上位100名の連続応援者を取得（刻印対象）
        const topFans = await tx.fanEggStats.findMany({
          where: { eggId },
          include: { user: { select: { id: true, name: true } } },
          orderBy: [
            { maxStreakDays: "desc" },
            { totalTapDays: "desc" },
            { firstTapAt: "asc" },
          ],
          take: ENGRAVING_TOP_COUNT,
        })

        await tx.egg.update({
          where: { id: eggId },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
          },
        })

        const resultRecord = await tx.result.create({
          data: {
            eggId,
            creatorId: egg.creatorId,
            resultType: "SILVER_SHIELD",
            totalTaps: updatedEgg.currentTapCount,
            uniqueFans,
            finalTapUserId: userId,
            completedAt: new Date(),
            publicUrl: `/u/${(await tx.creator.findUnique({ where: { id: egg.creatorId } }))?.slug}/result`,
          },
        })

        await tx.resultEngraving.createMany({
          data: topFans.map((stat, index) => ({
            resultId: resultRecord.id,
            userId: stat.userId,
            engravingName: stat.user.name ?? "名無し",
            rank: index + 1,
            streakDays: stat.maxStreakDays,
            totalTapDays: stat.totalTapDays,
          })),
        })

        return { broken: true as const, resultId: resultRecord.id, streakDays: newStreakDays }
      }

      return { broken: false as const, streakDays: newStreakDays }
    })

    const slugRecord = await prisma.creator.findUnique({
      where: { id: egg.creatorId },
      select: { slug: true },
    })
    if (slugRecord) revalidatePath(`/u/${slugRecord.slug}`)

    if (result.broken) {
      return { ok: true, broken: true, resultId: result.resultId, streakDays: result.streakDays }
    }
    return { ok: true, broken: false, streakDays: result.streakDays }
  } catch (e: unknown) {
    // Prismaのユニーク制約違反 = 今日すでに叩いている
    if (
      e &&
      typeof e === "object" &&
      "code" in e &&
      (e as { code: string }).code === "P2002"
    ) {
      return { ok: false, reason: "already_tapped" }
    }
    throw e
  }
}
