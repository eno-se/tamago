/**
 * テストデータをリセットして100件のクリーンなファンデータを生成する
 * 削除対象: @oshitama.test ユーザー / crack-test-* / bulk-c* / bulk-f* クリエイター
 * 生成対象: taiga の卵に対してファン100人 + FanEggStats + 今日のTap
 */
import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const TODAY = new Date()
TODAY.setHours(0, 0, 0, 0)

function daysAgo(n: number): Date {
  const d = new Date(TODAY)
  d.setDate(d.getDate() - n)
  return d
}

function seededRng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

const PLATFORMS = ["X", "Instagram", "TikTok", "YouTube", "Twitch", "SHOWROOM", "17LIVE", "Pococha", "note", "Threads"]

function dummyUrl(platform: string, slug: string): string {
  switch (platform) {
    case "X":         return `https://x.com/${slug}`
    case "Instagram": return `https://instagram.com/${slug}`
    case "TikTok":    return `https://tiktok.com/@${slug}`
    case "YouTube":   return `https://youtube.com/@${slug}`
    case "Twitch":    return `https://twitch.tv/${slug}`
    case "SHOWROOM":  return `https://showroom-live.com/r/${slug}`
    case "17LIVE":    return `https://17.live/ja/profile/${slug}`
    case "Pococha":   return `https://www.pococha.com/app/users/${slug}`
    case "note":      return `https://note.com/${slug}`
    case "Threads":   return `https://threads.net/@${slug}`
    default:          return `https://example.com/${slug}`
  }
}

const FAN_NAMES = [
  "さくら", "ゆき", "はな", "あおい", "みどり", "そら", "ひかり", "なつ", "ふゆ", "しろ",
  "くも", "かぜ", "うみ", "やま", "もり", "ほし", "つき", "たいよう", "かわ", "みずほ",
  "れい", "みき", "えり", "かな", "まい", "のぞみ", "あい", "ゆい", "りな", "せな",
  "ともき", "ゆうき", "たくや", "けんた", "しょう", "だいき", "まさと", "ひろ", "けい", "りょう",
  "あやか", "かおり", "ちさと", "まゆ", "ゆか", "みほ", "さとこ", "のりこ", "ふみ", "あきこ",
  "こうき", "しんや", "のぶ", "まさき", "とおる", "たける", "ひでき", "かつや", "よしき", "みつき",
  "るな", "もも", "ここ", "ここみ", "なな", "りり", "めい", "ほのか", "すず", "ことは",
  "はると", "そうた", "れん", "ゆうと", "りく", "はやと", "しゅん", "ゆうた", "いつき", "こうせい",
  "あんな", "みな", "えな", "りか", "まな", "ゆな", "ひな", "あかね", "しいな", "みお",
  "こうた", "りょうた", "かいと", "たいが", "しょうた", "ゆうせい", "はるま", "けんと", "なおき", "あきら",
]

async function main() {
  // ====================================
  // 1. テストデータを削除
  // ====================================
  console.log("🧹 テストデータを削除中...")

  // @oshitama.test メールのユーザー (CASCADE で関連データも消える)
  const { count: deletedByEmail } = await prisma.user.deleteMany({
    where: { email: { endsWith: "@oshitama.test" } },
  })
  console.log(`  @oshitama.test ユーザー: ${deletedByEmail}件 削除`)

  // crack-test-* / bulk-c* / bulk-f* クリエイターとそのユーザー
  const testCreators = await prisma.creator.findMany({
    where: {
      slug: {
        in: [
          ...Array.from({ length: 10 }, (_, i) => `crack-test-${i + 1}`),
          ...Array.from({ length: 200 }, (_, i) => `bulk-c${i + 1}`),
        ],
      },
    },
    select: { userId: true },
  })
  if (testCreators.length > 0) {
    const { count: deletedBySlug } = await prisma.user.deleteMany({
      where: { id: { in: testCreators.map((c) => c.userId) } },
    })
    console.log(`  crack-test / bulk クリエイター: ${deletedBySlug}件 削除`)
  }

  // ====================================
  // 2. taiga の卵を取得
  // ====================================
  const taigaCreator = await prisma.creator.findUnique({
    where: { slug: "taiga" },
    include: { eggs: { orderBy: { eggNumber: "asc" } } },
  })

  if (!taigaCreator) {
    console.error("❌ taiga クリエイターが見つかりません")
    return
  }

  const egg = taigaCreator.eggs[0]
  if (!egg) {
    console.error("❌ taiga の卵が見つかりません")
    return
  }

  console.log(`\n🥚 対象の卵: 「${egg.title}」 (${egg.status})`)

  // ====================================
  // 3. 100人のファンを作成
  // ====================================
  console.log("\n👥 ファン100人を作成中...")

  await prisma.user.createMany({
    data: FAN_NAMES.map((name, i) => ({
      email: `fan-${String(i + 1).padStart(3, "0")}@oshitama.test`,
      name,
    })),
    skipDuplicates: true,
  })

  const fans = await prisma.user.findMany({
    where: { email: { endsWith: "@oshitama.test" } },
    select: { id: true },
    orderBy: { email: "asc" },
  })
  console.log(`  ${fans.length}人 作成完了`)

  // ====================================
  // 4. FanEggStats を作成
  // ====================================
  console.log("\n📊 FanEggStats を作成中...")

  // ランキングのバリエーションが出るよう分布設計:
  //   上位 15人: 高streak (20-90日)
  //   次  35人: 中程度   (5-25日)
  //   残り50人: 低め     (1-8日)
  const statsData = fans.map((fan, i) => {
    const r = seededRng(i * 17 + 5)

    let currentStreakDays: number
    let maxStreakDays: number
    let totalTapDays: number
    let firstTapCount: number

    if (i < 15) {
      currentStreakDays = Math.floor(r() * 70) + 20
      maxStreakDays = currentStreakDays + Math.floor(r() * 30)
      totalTapDays = maxStreakDays + Math.floor(r() * 60) + 10
      firstTapCount = Math.floor(r() * 8) + 3
    } else if (i < 50) {
      currentStreakDays = Math.floor(r() * 20) + 5
      maxStreakDays = currentStreakDays + Math.floor(r() * 20)
      totalTapDays = maxStreakDays + Math.floor(r() * 40) + 5
      firstTapCount = Math.floor(r() * 5) + 1
    } else {
      currentStreakDays = Math.floor(r() * 7) + 1
      maxStreakDays = currentStreakDays + Math.floor(r() * 10)
      totalTapDays = maxStreakDays + Math.floor(r() * 20) + 1
      firstTapCount = Math.floor(r() * 3)
    }

    const lastTapDate = currentStreakDays > 0 ? TODAY : daysAgo(2 + Math.floor(r() * 5))

    return {
      eggId: egg.id,
      userId: fan.id,
      currentStreakDays,
      maxStreakDays,
      totalTapDays,
      firstTapCount,
      lastTapDate,
      firstTapAt: daysAgo(totalTapDays),
    }
  })

  await prisma.fanEggStats.createMany({ data: statsData, skipDuplicates: true })
  console.log(`  ${statsData.length}件 作成完了`)

  // ====================================
  // 5. 今日のTapを作成 (streak中のファン)
  // ====================================
  console.log("\n👆 今日のTapを作成中...")

  const todayTappers = fans.filter((_, i) => statsData[i].currentStreakDays > 0)

  if (todayTappers.length > 0) {
    await prisma.tap.createMany({
      data: todayTappers.map((fan) => ({
        eggId: egg.id,
        userId: fan.id,
        tapDate: TODAY,
      })),
      skipDuplicates: true,
    })
    console.log(`  ${todayTappers.length}件 作成完了`)
  }

  // ====================================
  // 6. ファンに Creator + SocialLink を追加
  // ====================================
  console.log("\n🎨 Creator + SocialLink を作成中...")

  // 既存の Creator を確認
  const existingCreatorSet = new Set(
    (await prisma.creator.findMany({
      where: { userId: { in: fans.map((f) => f.id) } },
      select: { userId: true },
    })).map((c) => c.userId)
  )

  const newCreators = fans
    .filter((f) => !existingCreatorSet.has(f.id))
    .map((fan, i) => {
      const padded = String(i + 1).padStart(3, "0")
      return {
        userId: fan.id,
        creatorName: FAN_NAMES[i],
        slug: `fan-${padded}`,
      }
    })

  if (newCreators.length > 0) {
    await prisma.creator.createMany({ data: newCreators, skipDuplicates: true })
  }

  // Creator ID を取得
  const creatorRecords = await prisma.creator.findMany({
    where: { userId: { in: fans.map((f) => f.id) } },
    select: { id: true, slug: true },
  })

  // Egg を作成 (まだ持っていない Creator のみ)
  const existingEggSet = new Set(
    (await prisma.egg.findMany({
      where: { creatorId: { in: creatorRecords.map((c) => c.id) } },
      select: { creatorId: true },
    })).map((e) => e.creatorId)
  )
  const newEggs = creatorRecords
    .filter((c) => !existingEggSet.has(c.id))
    .map((c, i) => {
      const r = seededRng(i * 11 + 3)
      const tapCount = Math.floor(r() * 200_000) + 1_000
      return {
        creatorId: c.id,
        eggNumber: 1,
        title: `${FAN_NAMES[i]}のたまご`,
        status: "ACTIVE" as const,
        isPublic: true,
        currentTapCount: tapCount,
      }
    })
  if (newEggs.length > 0) {
    await prisma.egg.createMany({ data: newEggs })
  }
  console.log(`  Egg: ${newEggs.length}件 作成完了`)

  // 既存の SocialLink を削除してから再生成
  await prisma.socialLink.deleteMany({
    where: { creatorId: { in: creatorRecords.map((c) => c.id) } },
  })

  const socialLinksData = creatorRecords.flatMap((creator, i) => {
    const r = seededRng(i * 31 + 7)
    // 1〜3個のプラットフォームをランダムに選ぶ
    const count = 1 + Math.floor(r() * 3)
    const shuffled = [...PLATFORMS].sort(() => r() - 0.5).slice(0, count)
    return shuffled.map((platform, order) => ({
      creatorId: creator.id,
      platform,
      url: dummyUrl(platform, creator.slug),
      order,
    }))
  })

  await prisma.socialLink.createMany({ data: socialLinksData })
  console.log(`  Creator: ${newCreators.length}件 / SocialLink: ${socialLinksData.length}件 作成完了`)

  // ====================================
  // 完了
  // ====================================
  console.log("\n✅ 完了!")
  console.log(`  対象: ${taigaCreator.creatorName} (@${taigaCreator.slug})`)
  console.log(`  ファン: 100人 / 今日タップ: ${todayTappers.length}人`)
  console.log("\n  → http://localhost:3000/u/taiga/ranking")
}

main().catch(console.error).finally(() => prisma.$disconnect())
