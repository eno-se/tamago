import { notFound } from "next/navigation"
import { prisma } from "@/app/lib/prisma"
import { auth } from "@/auth"
import { getEggState, getJSTDate } from "@/app/lib/egg-state"
import EggClient from "./EggClient"
import BottomNav from "@/app/components/BottomNav"
import SocialLinks from "@/app/components/SocialLinks"
import AccountActions from "@/app/components/AccountActions"
import { logout } from "@/app/actions/dashboard"

interface Props {
  params: Promise<{ slug: string }>
}

export default async function EggPage({ params }: Props) {
  const { slug } = await params

  const creator = await prisma.creator.findUnique({
    where: { slug },
    include: {
      eggs: {
        where: { status: "ACTIVE" },
        orderBy: { eggNumber: "asc" },
        take: 1,
        include: { _count: { select: { fanEggStats: true } } },
      },
      socialLinks: { orderBy: { order: "asc" } },
    },
  })

  if (!creator) notFound()

  const session = await auth()
  const userId = session?.user?.id ?? null
  const myCreatorSlug = userId === creator.userId
    ? creator.slug
    : userId
      ? (await prisma.creator.findUnique({ where: { userId }, select: { slug: true } }))?.slug ?? null
      : null

  const activeEgg = creator.eggs[0]
  if (!activeEgg) {
    const latestEgg = await prisma.egg.findFirst({
      where: { creatorId: creator.id, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
    })
    if (latestEgg) {
      return (
        <>
          <div className="min-h-screen flex items-center justify-center bg-stone-950 text-stone-200 p-6 pb-24">
            <div className="text-center">
              <p className="text-2xl mb-2">{creator.creatorName}のたまごは</p>
              <p className="text-2xl mb-6">もう割れてしまいました。</p>
              <a href={`/u/${slug}/result`} className="text-amber-400 underline">
                結果を見る →
              </a>
            </div>
          </div>
          <BottomNav mySlug={myCreatorSlug} />
        </>
      )
    }
    notFound()
  }

  const isOwner = userId === creator.userId

  if (!activeEgg.isPublic && !isOwner) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-stone-950 text-stone-200 p-6 pb-24">
          <div className="text-center">
            <p className="text-2xl mb-2">このたまごは非公開です。</p>
            <p className="text-stone-500 text-sm mt-2">
              クリエイターがまだ公開していません。
            </p>
          </div>
        </div>
        <BottomNav mySlug={myCreatorSlug} />
      </>
    )
  }

  if (!userId) {
    const { redirect } = await import("next/navigation")
    redirect(`/login?callbackUrl=/u/${slug}`)
  }

  const today = getJSTDate()
  const [tap, stats, watchEntry] = await Promise.all([
    prisma.tap.findFirst({
      where: { eggId: activeEgg.id, userId: userId!, tapDate: today },
    }),
    prisma.fanEggStats.findUnique({
      where: { eggId_userId: { eggId: activeEgg.id, userId: userId! } },
    }),
    prisma.watchList.findUnique({
      where: { userId_eggId: { userId: userId!, eggId: activeEgg.id } },
    }),
  ])

  const eggState = getEggState(activeEgg.currentTapCount)

  return (
    <>
      <EggClient
        eggId={activeEgg.id}
        creatorName={creator.creatorName}
        eggNumber={activeEgg.eggNumber}
        profileMessage={creator.profileMessage}
        linkUrl={creator.linkUrl}
        linkLabel={creator.linkLabel}
        iconUrl={creator.iconUrl}
        eggState={eggState}
        tappedToday={!!tap}
        streakDays={stats?.currentStreakDays ?? 0}
        isLoggedIn={!!userId}
        slug={slug}
        isOwnEgg={isOwner}
        isInWatchList={!!watchEntry}
        tapCount={activeEgg.currentTapCount}
        isPublic={activeEgg.isPublic}
        socialLinks={creator.socialLinks}
      />
      {isOwner && (
        <div className="max-w-sm mx-auto px-6 pb-4">
          <p className="text-stone-700 text-xs mb-3 px-1">アカウント</p>
          <div className="glass-card rounded-2xl overflow-hidden px-4 pt-4">
            <AccountActions logoutAction={logout.bind(null, "/")} />
          </div>
        </div>
      )}
      <BottomNav mySlug={myCreatorSlug} />
    </>
  )
}
