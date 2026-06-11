import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const creator = await prisma.creator.findUnique({
    where: { slug: "test-a" },
    include: { eggs: { where: { status: "ACTIVE" } } },
  })

  if (!creator || !creator.eggs[0]) {
    console.log("test-a のアクティブな卵が見つかりません")
    process.exit(1)
  }

  const egg = creator.eggs[0]
  await prisma.egg.update({
    where: { id: egg.id },
    data: { currentTapCount: 999999, isPublic: true },
  })

  console.log(`✓ ${creator.creatorName} (${creator.slug}) の卵を 999,999 に設定しました`)
  console.log(`  URL: /u/test-a`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
