import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { PrismaClient, EggStatus, ResultType, TapType } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const TODAY = new Date(); TODAY.setHours(0, 0, 0, 0)

function daysAgo(n: number): Date {
  const d = new Date(TODAY)
  d.setDate(d.getDate() - n)
  return d
}

async function upsertUser(email: string, name: string) {
  return prisma.user.upsert({ where: { email }, update: {}, create: { email, name } })
}

async function upsertCreator(
  userId: string,
  data: { creatorName: string; slug: string; profileMessage?: string }
) {
  return prisma.creator.upsert({
    where: { userId },
    update: {},
    create: { userId, ...data },
  })
}

async function getOrCreateEgg(
  creatorId: string,
  eggNumber: number,
  data: {
    title: string
    status: EggStatus
    isPublic: boolean
    currentTapCount: number
    completedAt?: Date
  }
) {
  const existing = await prisma.egg.findFirst({ where: { creatorId, eggNumber } })
  if (existing) return existing
  return prisma.egg.create({ data: { creatorId, eggNumber, ...data } })
}

async function upsertFanProfile(userId: string, engravingName: string) {
  return prisma.fanProfile.upsert({
    where: { userId },
    update: {},
    create: { userId, engravingName, allowEngraving: true },
  })
}

async function upsertFanEggStats(
  eggId: string,
  userId: string,
  stats: { currentStreakDays: number; maxStreakDays: number; totalTapDays: number; lastTapDate: Date }
) {
  return prisma.fanEggStats.upsert({
    where: { eggId_userId: { eggId, userId } },
    update: {},
    create: { eggId, userId, ...stats, firstTapAt: daysAgo(stats.totalTapDays - 1) },
  })
}

async function upsertTap(eggId: string, userId: string, tapDate: Date, tapType: TapType = TapType.NORMAL) {
  return prisma.tap.upsert({
    where: { eggId_userId_tapDate_tapType: { eggId, userId, tapDate, tapType } },
    update: {},
    create: { eggId, userId, tapDate, tapType },
  })
}

async function upsertWatchList(userId: string, eggId: string) {
  return prisma.watchList.upsert({
    where: { userId_eggId: { userId, eggId } },
    update: {},
    create: { userId, eggId },
  })
}

async function main() {
  console.log("🌱 Seeding test data...")

  // =====================================================
  // CREATORS
  // =====================================================

  // A: ACTIVE・公開・多タップ (ランキング上位想定)
  const userA = await upsertUser("test-a@oshitama.test", "テストA")
  const creatorA = await upsertCreator(userA.id, {
    creatorName: "テストA",
    slug: "test-a",
    profileMessage: "毎日コツコツ頑張ります！",
  })
  const eggA = await getOrCreateEgg(creatorA.id, 1, {
    title: "未来への一歩",
    status: EggStatus.ACTIVE,
    isPublic: true,
    currentTapCount: 750_000,
  })

  // B: ACTIVE・公開・中程度
  const userB = await upsertUser("test-b@oshitama.test", "テストB")
  const creatorB = await upsertCreator(userB.id, {
    creatorName: "テストB",
    slug: "test-b",
    profileMessage: "夢に向かって進んでいます。",
  })
  const eggB = await getOrCreateEgg(creatorB.id, 1, {
    title: "夢を追いかけて",
    status: EggStatus.ACTIVE,
    isPublic: true,
    currentTapCount: 120_000,
  })

  // C: ACTIVE・公開・始まったばかり
  const userC = await upsertUser("test-c@oshitama.test", "テストC")
  const creatorC = await upsertCreator(userC.id, {
    creatorName: "テストC",
    slug: "test-c",
  })
  const eggC = await getOrCreateEgg(creatorC.id, 1, {
    title: "はじめの一歩",
    status: EggStatus.ACTIVE,
    isPublic: true,
    currentTapCount: 3_200,
  })

  // D: ACTIVE・非公開
  const userD = await upsertUser("test-d@oshitama.test", "テストD")
  const creatorD = await upsertCreator(userD.id, {
    creatorName: "テストD",
    slug: "test-d",
  })
  const eggD = await getOrCreateEgg(creatorD.id, 1, {
    title: "秘密の計画",
    status: EggStatus.ACTIVE,
    isPublic: false,
    currentTapCount: 50_000,
  })

  // E: COMPLETED（割れた卵あり）
  const userE = await upsertUser("test-e@oshitama.test", "テストE")
  const creatorE = await upsertCreator(userE.id, {
    creatorName: "テストE",
    slug: "test-e",
    profileMessage: "卵が割れました！ありがとうございました。",
  })
  const eggE = await getOrCreateEgg(creatorE.id, 1, {
    title: "大きな夢",
    status: EggStatus.COMPLETED,
    isPublic: true,
    currentTapCount: 1_000_000,
    completedAt: daysAgo(7),
  })

  // F: Creator登録済み・卵なし
  const userF = await upsertUser("test-f@oshitama.test", "テストF")
  await upsertCreator(userF.id, {
    creatorName: "テストF",
    slug: "test-f",
  })

  // =====================================================
  // FAN USERS
  // =====================================================

  const fan1 = await upsertUser("fan-1@oshitama.test", "ファン1")
  await upsertFanProfile(fan1.id, "匿名ねこ")

  const fan2 = await upsertUser("fan-2@oshitama.test", "ファン2")
  await upsertFanProfile(fan2.id, "匿名いぬ")

  const fan3 = await upsertUser("fan-3@oshitama.test", "ファン3")
  await upsertFanProfile(fan3.id, "匿名うさぎ")

  // =====================================================
  // FAN EGG STATS (streak data)
  // =====================================================

  // fan1: eggA streak 15日, eggB streak 3日
  await upsertFanEggStats(eggA.id, fan1.id, {
    currentStreakDays: 15,
    maxStreakDays: 20,
    totalTapDays: 30,
    lastTapDate: TODAY,
  })
  await upsertFanEggStats(eggB.id, fan1.id, {
    currentStreakDays: 3,
    maxStreakDays: 10,
    totalTapDays: 15,
    lastTapDate: TODAY,
  })

  // fan2: eggA streak 5日
  await upsertFanEggStats(eggA.id, fan2.id, {
    currentStreakDays: 5,
    maxStreakDays: 5,
    totalTapDays: 10,
    lastTapDate: TODAY,
  })

  // fan3: eggA streak 1日, eggC streak 1日
  await upsertFanEggStats(eggA.id, fan3.id, {
    currentStreakDays: 1,
    maxStreakDays: 3,
    totalTapDays: 5,
    lastTapDate: TODAY,
  })
  await upsertFanEggStats(eggC.id, fan3.id, {
    currentStreakDays: 1,
    maxStreakDays: 1,
    totalTapDays: 2,
    lastTapDate: TODAY,
  })

  // =====================================================
  // TAPS (今日分 + 数日分)
  // =====================================================

  for (const d of [0, 1, 2]) {
    await upsertTap(eggA.id, fan1.id, daysAgo(d))
  }
  await upsertTap(eggA.id, fan2.id, TODAY)
  await upsertTap(eggA.id, fan3.id, TODAY)
  await upsertTap(eggB.id, fan1.id, TODAY)
  await upsertTap(eggC.id, fan3.id, TODAY)

  // =====================================================
  // WATCHLIST
  // =====================================================

  await upsertWatchList(fan1.id, eggA.id)
  await upsertWatchList(fan1.id, eggB.id)
  await upsertWatchList(fan1.id, eggC.id)
  await upsertWatchList(fan2.id, eggA.id)

  // =====================================================
  // RESULT for completed egg (test-e)
  // =====================================================

  const existingResult = await prisma.result.findUnique({ where: { eggId: eggE.id } })
  if (!existingResult) {
    const result = await prisma.result.create({
      data: {
        eggId: eggE.id,
        creatorId: creatorE.id,
        resultType: ResultType.GOLD_SHIELD,
        totalTaps: 1_000_000,
        uniqueFans: 30,
        finalTapUserId: fan1.id,
        completedAt: daysAgo(7),
      },
    })
    await prisma.resultEngraving.createMany({
      data: [
        { resultId: result.id, userId: fan1.id, engravingName: "匿名ねこ", rank: 1, streakDays: 20, totalTapDays: 30 },
        { resultId: result.id, userId: fan2.id, engravingName: "匿名いぬ", rank: 2, streakDays: 5, totalTapDays: 10 },
        { resultId: result.id, userId: fan3.id, engravingName: "匿名うさぎ", rank: 3, streakDays: 3, totalTapDays: 5 },
      ],
    })
  }

  console.log("✅ Done!")
  console.log("")
  console.log("===== テストアカウント一覧 =====")
  console.log("【クリエイター】")
  console.log("  test-a@oshitama.test  — ACTIVE・公開・750,000タップ  /u/test-a")
  console.log("  test-b@oshitama.test  — ACTIVE・公開・120,000タップ  /u/test-b")
  console.log("  test-c@oshitama.test  — ACTIVE・公開・3,200タップ    /u/test-c")
  console.log("  test-d@oshitama.test  — ACTIVE・非公開               /u/test-d")
  console.log("  test-e@oshitama.test  — COMPLETED（卵が割れた）       /u/test-e/result")
  console.log("  test-f@oshitama.test  — 卵なし（登録のみ）")
  console.log("")
  console.log("【ファン】")
  console.log("  fan-1@oshitama.test   — streak 15日・ウォッチリスト3件")
  console.log("  fan-2@oshitama.test   — streak 5日・ウォッチリスト1件")
  console.log("  fan-3@oshitama.test   — streak 1日")
}

main().catch(console.error).finally(() => prisma.$disconnect())
