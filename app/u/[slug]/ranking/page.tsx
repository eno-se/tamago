import { notFound } from "next/navigation"
import { prisma } from "@/app/lib/prisma"
import { auth } from "@/auth"
import { getJSTDate } from "@/app/lib/egg-state"
import Link from "next/link"
import BottomNav from "@/app/components/BottomNav"

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ tab?: string }>
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
}

export default async function RankingPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { tab } = await searchParams
  const activeTab = tab === "streak" ? "streak" : tab === "today" ? "today" : tab === "fastest" ? "fastest" : "total"

  const session = await auth()
  const myCreator = session?.user?.id
    ? await prisma.creator.findUnique({ where: { userId: session.user.id }, select: { slug: true } })
    : null

  const creator = await prisma.creator.findUnique({
    where: { slug },
    include: {
      eggs: { where: { status: "ACTIVE" }, take: 1 },
    },
  })

  if (!creator) notFound()
  const egg =
    creator.eggs[0] ??
    (await prisma.egg.findFirst({
      where: { creatorId: creator.id },
      orderBy: { eggNumber: "desc" },
    }))
  if (!egg) notFound()

  // タブごとにデータ取得
  if (activeTab === "today") {
    const today = getJSTDate()

    const allTaps = await prisma.tap.findMany({
      where: { eggId: egg.id, tapDate: today },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { id: true, name: true, image: true, creator: { select: { slug: true } } } } },
    })

    // ユーザーごとに最初のタップだけ残す（最速順）
    const seen = new Set<string>()
    const fastestTaps = allTaps.filter((tap) => {
      if (seen.has(tap.userId)) return false
      seen.add(tap.userId)
      return true
    })

    return (
      <PageShell slug={slug} creatorName={creator.creatorName} activeTab={activeTab} mySlug={myCreator?.slug ?? null}>
        {fastestTaps.length === 0 ? (
          <p className="text-center text-stone-600 text-sm py-12">今日はまだコツコツしていません。</p>
        ) : (
          fastestTaps.map((tap, i) => {
            const name = tap.user.name ?? "名無し"
            return (
              <div key={tap.id} className="glass-card flex items-center justify-between px-4 py-3 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className={`text-xs w-6 text-right ${i < 3 ? "text-amber-400 font-medium" : "text-stone-600"}`}>
                    {i + 1}
                  </span>
                  <div className="relative w-8 h-8 shrink-0">
                    {tap.user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={tap.user.image} alt={name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-stone-700 flex items-center justify-center text-stone-400 text-xs">
                        {name[0]}
                      </div>
                    )}
                    {i < 3 && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/rank-${i + 1}.png`} alt="" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-stone-200 text-sm">{name}</span>
                    {tap.user.creator?.slug && (
                      <span className="text-stone-600 text-xs font-mono ml-1.5">{tap.user.creator.slug}</span>
                    )}
                  </div>
                </div>
                <span className="text-stone-500 text-xs tabular-nums">{formatTime(tap.createdAt)}</span>
              </div>
            )
          })
        )}
      </PageShell>
    )
  }

  // 継続 / 合計 / 歴代最速タブ
  const orderBy =
    activeTab === "streak"
      ? [{ maxStreakDays: "desc" as const }, { totalTapDays: "desc" as const }]
      : activeTab === "total"
      ? [{ totalTapDays: "desc" as const }, { maxStreakDays: "desc" as const }]
      : [{ firstTapCount: "desc" as const }, { totalTapDays: "desc" as const }]

  const stats = await prisma.fanEggStats.findMany({
    where: { eggId: egg.id, ...(activeTab === "fastest" ? { firstTapCount: { gt: 0 } } : {}) },
    include: { user: { select: { id: true, name: true, image: true, creator: { select: { slug: true } } } } },
    orderBy,
    take: 50,
  })

  return (
    <PageShell slug={slug} creatorName={creator.creatorName} activeTab={activeTab} mySlug={myCreator?.slug ?? null}>
      {stats.length === 0 ? (
        <p className="text-center text-stone-600 text-sm py-12">
          {activeTab === "fastest" ? "まだ1位を獲得したファンがいません。" : "まだデータがありません。"}
        </p>
      ) : (
        stats.map((stat, i) => {
          const name = stat.user.name ?? "名無し"
          const value =
            activeTab === "streak" ? `${stat.maxStreakDays}日連続` :
            activeTab === "fastest" ? `${stat.firstTapCount}回` :
            `${stat.totalTapDays}日`
          return (
            <div key={stat.id} className="glass-card flex items-center justify-between px-4 py-3 rounded-xl">
              <div className="flex items-center gap-3">
                <span className={`text-xs w-6 text-right ${i < 3 ? "text-amber-400 font-medium" : "text-stone-600"}`}>
                  {i + 1}
                </span>
                <div className="relative w-8 h-8 shrink-0">
                  {stat.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={stat.user.image} alt={name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-stone-700 flex items-center justify-center text-stone-400 text-xs">
                      {name[0]}
                    </div>
                  )}
                  {i < 3 && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/rank-${i + 1}.png`} alt="" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-stone-200 text-sm">{name}</span>
                  {stat.user.creator?.slug && (
                    <span className="text-stone-600 text-xs font-mono ml-1.5">{stat.user.creator.slug}</span>
                  )}
                </div>
              </div>
              <span className="text-stone-500 text-xs">{value}</span>
            </div>
          )
        })
      )}
    </PageShell>
  )
}

function PageShell({
  slug,
  creatorName,
  activeTab,
  mySlug,
  children,
}: {
  slug: string
  creatorName: string
  activeTab: string
  mySlug: string | null
  children: React.ReactNode
}) {
  const tabs = [
    { key: "total", label: "合計コツコツ" },
    { key: "streak", label: "継続コツコツ" },
    { key: "fastest", label: "歴代最速" },
    { key: "today", label: "今日の最速" },
  ]

  return (
    <>
    <div className="min-h-screen bg-transparent text-stone-200 p-6">
      <div className="max-w-sm mx-auto">
        <div className="flex items-center gap-4 mb-6 pt-4">
          <Link href={`/u/${slug}`} className="text-stone-500 text-sm">
            ← 戻る
          </Link>
          <h1 className="text-base text-stone-300">
            {creatorName}
            <span className="text-stone-600 text-xs font-mono ml-2">{slug}</span>
            のコツコツ記録
          </h1>
        </div>

        <div className="flex gap-2 mb-6">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={`/u/${slug}/ranking?tab=${t.key}`}
              className={`flex-1 py-2.5 text-center rounded-xl text-xs font-medium transition-colors ${
                activeTab === t.key ? "bg-amber-500 text-stone-950" : "glass-card text-stone-400"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        <div className="space-y-2 pb-24">{children}</div>
      </div>
    </div>
    <BottomNav mySlug={mySlug} />
    </>
  )
}
