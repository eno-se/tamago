import { config } from "dotenv"
import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

config({ path: ".env" })

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const stages = [
  { n: 1,  tapCount:   50_000 },  // 5%
  { n: 2,  tapCount:  150_000 },  // 15%
  { n: 3,  tapCount:  250_000 },  // 25%
  { n: 4,  tapCount:  350_000 },  // 35%
  { n: 5,  tapCount:  450_000 },  // 45%
  { n: 6,  tapCount:  550_000 },  // 55%
  { n: 7,  tapCount:  650_000 },  // 65%
  { n: 8,  tapCount:  750_000 },  // 75%
  { n: 9,  tapCount:  850_000 },  // 85%
  { n: 10, tapCount:  950_000 },  // 95%
]

async function main() {
  for (const { n, tapCount } of stages) {
    const slug = `crack-test-${n}`

    // 既存データがあればスキップ
    const existing = await prisma.creator.findUnique({ where: { slug } })
    if (existing) {
      console.log(`skip: ${slug}`)
      continue
    }

    const user = await prisma.user.create({
      data: { name: `ひびテスト${n}` },
    })

    const creator = await prisma.creator.create({
      data: {
        userId: user.id,
        creatorName: `ひびテスト${n}`,
        slug,
      },
    })

    await prisma.egg.create({
      data: {
        creatorId: creator.id,
        title: `ひびテスト${n}（${tapCount.toLocaleString()}回）`,
        status: "ACTIVE",
        isPublic: true,
        currentTapCount: tapCount,
      },
    })

    console.log(`created: /u/${slug}  tapCount=${tapCount}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
