import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) })
async function main() {
  const total = await prisma.egg.count()
  const active = await prisma.egg.count({ where: { status: "ACTIVE" } })
  const pub = await prisma.egg.count({ where: { status: "ACTIVE", isPublic: true } })
  console.log("total eggs:", total)
  console.log("ACTIVE eggs:", active)
  console.log("ACTIVE + public:", pub)
}
main().catch(console.error).finally(() => prisma.$disconnect())
