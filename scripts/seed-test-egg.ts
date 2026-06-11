import * as dotenv from "dotenv"
import * as path from "path"

dotenv.config({ path: path.resolve(__dirname, "../.env.local") })

import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL
  if (!DATABASE_URL) throw new Error("DATABASE_URL is not set")

  const adapter = new PrismaPg({ connectionString: DATABASE_URL })
  const prisma = new PrismaClient({ adapter } as never)

  try {
    // テスト用クリエイターユーザー
    const creatorUser = await prisma.user.upsert({
      where: { email: "test-creator@oshitama.test" },
      update: {},
      create: { email: "test-creator@oshitama.test", name: "テストクリエイター" },
    })

    const creator = await prisma.creator.upsert({
      where: { slug: "test" },
      update: {},
      create: {
        userId: creatorUser.id,
        creatorName: "テストクリエイター",
        slug: "test",
      },
    })

    // 既存のACTIVE卵を更新、なければ作成
    let egg = await prisma.egg.findFirst({ where: { creatorId: creator.id, status: "ACTIVE" } })
    if (egg) {
      egg = await prisma.egg.update({
        where: { id: egg.id },
        data: { currentTapCount: 900000 },
      })
    } else {
      egg = await prisma.egg.create({
        data: {
          creatorId: creator.id,
          title: "テスト卵",
          currentTapCount: 900000,
        },
      })
    }

    // テストファン 15人
    for (let i = 1; i <= 15; i++) {
      const fan = await prisma.user.upsert({
        where: { email: `fan${i}@oshitama.test` },
        update: {},
        create: { email: `fan${i}@oshitama.test`, name: `ファン${i}` },
      })

      await prisma.fanProfile.upsert({
        where: { userId: fan.id },
        update: {},
        create: {
          userId: fan.id,
          engravingName: `推しファン${i}号`,
          allowEngraving: true,
        },
      })

      const streakDays = Math.max(1, 120 - i * 7)
      await prisma.fanEggStats.upsert({
        where: { eggId_userId: { eggId: egg.id, userId: fan.id } },
        update: {},
        create: {
          eggId: egg.id,
          userId: fan.id,
          currentStreakDays: streakDays,
          maxStreakDays: streakDays,
          totalTapDays: streakDays,
        },
      })
    }

    console.log("✅ テストデータ作成完了")
    console.log(`   slug: test  →  http://localhost:3000/u/test`)
    console.log(`   currentTapCount: ${egg.currentTapCount.toLocaleString()}  (ALMOST 状態)`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
