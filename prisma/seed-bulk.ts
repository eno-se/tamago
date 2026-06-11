/**
 * ランキング動作確認用バルクデータ生成
 * クリエイター50人・ファン200人・FanEggStats ~800件
 */
import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { PrismaClient, EggStatus } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const TODAY = new Date(); TODAY.setHours(0, 0, 0, 0)
const CREATOR_COUNT = 200
const FAN_COUNT = 200

const EGG_TITLES = [
  "夢への挑戦", "一歩ずつ進もう", "未来を開く鍵", "可能性の扉", "新たな章の始まり",
  "希望の光", "前進あるのみ", "ともに歩もう", "輝く未来へ", "力を合わせて",
  "諦めない心", "積み重ねの力", "挑戦する勇気", "夢を追い続ける", "明日への架け橋",
]

function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

async function main() {
  console.log("🌱 Bulk seeding...")

  // 1. Users (createMany + skipDuplicates)
  const creatorEmails = Array.from({ length: CREATOR_COUNT }, (_, i) => ({
    email: `bulk-creator-${i + 1}@oshitama.test`,
    name: `バルクC${i + 1}`,
  }))
  const fanEmails = Array.from({ length: FAN_COUNT }, (_, i) => ({
    email: `bulk-fan-${i + 1}@oshitama.test`,
    name: `バルクF${i + 1}`,
  }))

  await prisma.user.createMany({ data: [...creatorEmails, ...fanEmails], skipDuplicates: true })
  console.log(`  users: ${CREATOR_COUNT + FAN_COUNT} (skip duplicates)`)

  // 2. Fetch user IDs
  const creatorUsers = await prisma.user.findMany({
    where: { email: { in: creatorEmails.map((c) => c.email) } },
    select: { id: true, email: true },
    orderBy: { email: "asc" },
  })
  const fanUsers = await prisma.user.findMany({
    where: { email: { in: fanEmails.map((f) => f.email) } },
    select: { id: true, email: true },
    orderBy: { email: "asc" },
  })

  // 3. Creators
  const existingCreatorSet = new Set(
    (
      await prisma.creator.findMany({
        where: { userId: { in: creatorUsers.map((u) => u.id) } },
        select: { userId: true },
      })
    ).map((c) => c.userId)
  )
  const newCreators = creatorUsers
    .filter((u) => !existingCreatorSet.has(u.id))
    .map((u) => {
      const num = u.email!.match(/(\d+)/)![1]
      return { userId: u.id, creatorName: `バルクC${num}`, slug: `bulk-c${num}` }
    })
  if (newCreators.length > 0) {
    await prisma.creator.createMany({ data: newCreators, skipDuplicates: true })
  }
  console.log(`  creators: ${newCreators.length} created`)

  // 4. Eggs
  const allCreators = await prisma.creator.findMany({
    where: { userId: { in: creatorUsers.map((u) => u.id) } },
    select: { id: true },
  })
  const existingEggSet = new Set(
    (
      await prisma.egg.findMany({
        where: { creatorId: { in: allCreators.map((c) => c.id) } },
        select: { creatorId: true },
      })
    ).map((e) => e.creatorId)
  )
  const newEggs = allCreators
    .filter((c) => !existingEggSet.has(c.id))
    .map((c, i) => {
      const r = rng(i * 7 + 1)
      // タップ数を偏らせる: 上位10%は50万〜100万, 中間40%は5万〜50万, 残り1万以下
      let tapCount: number
      const tier = r()
      if (tier > 0.9) tapCount = Math.floor(r() * 500_000) + 500_000
      else if (tier > 0.5) tapCount = Math.floor(r() * 450_000) + 50_000
      else tapCount = Math.floor(r() * 50_000) + 1_000
      return {
        creatorId: c.id,
        eggNumber: 1,
        title: EGG_TITLES[i % EGG_TITLES.length] + ` Vol.${Math.floor(i / EGG_TITLES.length) + 1}`,
        status: EggStatus.ACTIVE,
        isPublic: r() > 0.08, // 92% public
        currentTapCount: tapCount,
      }
    })
  if (newEggs.length > 0) {
    await prisma.egg.createMany({ data: newEggs })
  }
  console.log(`  eggs: ${newEggs.length} created`)

  // 5. Fan profiles
  await prisma.fanProfile.createMany({
    data: fanUsers.map((u) => ({
      userId: u.id,
      engravingName: u.email!.split("@")[0],
      allowEngraving: true,
    })),
    skipDuplicates: true,
  })
  console.log(`  fan profiles: ${fanUsers.length} (skip duplicates)`)

  // 6. FanEggStats: 各ファンがランダムに3〜5個の卵に参加
  const allEggs = await prisma.egg.findMany({
    where: { creatorId: { in: allCreators.map((c) => c.id) } },
    select: { id: true },
  })
  const eggIds = allEggs.map((e) => e.id)

  const existingStats = new Set(
    (
      await prisma.fanEggStats.findMany({
        where: { userId: { in: fanUsers.map((u) => u.id) } },
        select: { eggId: true, userId: true },
      })
    ).map((s) => `${s.eggId}:${s.userId}`)
  )

  const statsData: {
    eggId: string
    userId: string
    currentStreakDays: number
    maxStreakDays: number
    totalTapDays: number
    lastTapDate: Date
  }[] = []

  for (let fi = 0; fi < fanUsers.length; fi++) {
    const fan = fanUsers[fi]
    const r = rng(fi * 13 + 3)
    const count = 3 + Math.floor(r() * 3)
    // シャッフル (seeded)
    const shuffled = [...eggIds].sort(() => r() - 0.5).slice(0, count)
    for (const eggId of shuffled) {
      if (existingStats.has(`${eggId}:${fan.id}`)) continue
      const streak = Math.floor(r() * 30)
      const max = streak + Math.floor(r() * 15)
      const total = max + Math.floor(r() * 30) + 1
      const lastTap = streak > 0 ? TODAY : new Date(TODAY.getTime() - (2 + Math.floor(r() * 10)) * 86_400_000)
      statsData.push({ eggId, userId: fan.id, currentStreakDays: streak, maxStreakDays: max, totalTapDays: total, lastTapDate: lastTap })
    }
  }

  // 100件ずつバッチ挿入
  for (let i = 0; i < statsData.length; i += 100) {
    await prisma.fanEggStats.createMany({ data: statsData.slice(i, i + 100), skipDuplicates: true })
  }
  console.log(`  fanEggStats: ${statsData.length} created`)

  console.log("")
  console.log("✅ Bulk seed complete!")
  console.log(`  クリエイター合計: ~${CREATOR_COUNT + 6}人  ファン合計: ~${FAN_COUNT + 3}人`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
