import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/app/lib/prisma"
import { getEggState } from "@/app/lib/egg-state"
import WatchListClient from "./WatchListClient"
import BottomNav from "@/app/components/BottomNav"

export default async function WatchListPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login?callbackUrl=/watchlist")

  const watchList = await prisma.watchList.findMany({
    where: { userId: session.user.id },
    include: {
      egg: {
        include: {
          creator: { select: { creatorName: true, slug: true, iconUrl: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const myCreator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
    select: { slug: true },
  })

  const items = watchList.map((w) => ({
    eggId: w.egg.id,
    creatorName: w.egg.creator.creatorName,
    slug: w.egg.creator.slug,
    iconUrl: w.egg.creator.iconUrl,
    stateMessage: getEggState(w.egg.currentTapCount).message,
    status: w.egg.status,
    pct: w.egg.currentTapCount / 1_000_000,
  }))

  return (
    <>
      <WatchListClient items={items} />
      <BottomNav mySlug={myCreator?.slug ?? null} />
    </>
  )
}
