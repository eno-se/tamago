import { Suspense } from "react"
import { unstable_cache } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/app/lib/prisma"
import BottomNav from "@/app/components/BottomNav"
import RankingClient, { type RankingItem } from "./RankingClient"

const TARGET = 1_000_000

// ランキングデータは5分間キャッシュ（全ユーザー共通）
const getCachedRankings = unstable_cache(
  async () => {
    const [tapRanking, fanRanking, streakGroups] = await Promise.all([
      // コツコツ総合: インデックス使用・上位1000件
      prisma.egg.findMany({
        where: { status: "ACTIVE", isPublic: true },
        orderBy: { currentTapCount: "desc" },
        take: 1000,
        select: {
          id: true,
          currentTapCount: true,
          creator: { select: { slug: true, iconUrl: true, creatorName: true } },
        },
      }),
      // 総参加者数: カウント降順・上位1000件
      prisma.egg.findMany({
        where: { status: "ACTIVE", isPublic: true },
        orderBy: { fanEggStats: { _count: "desc" } },
        take: 1000,
        select: {
          id: true,
          currentTapCount: true,
          creator: { select: { slug: true, iconUrl: true, creatorName: true } },
          _count: { select: { fanEggStats: true } },
        },
      }),
      // 継続ユーザー: groupByで集計
      prisma.fanEggStats.groupBy({
        by: ["eggId"],
        where: { currentStreakDays: { gt: 0 } },
        _count: { userId: true },
        orderBy: { _count: { userId: "desc" } },
        take: 2000, // フィルタ後に1000件確保するため多めに取得
      }),
    ])

    // 継続ランキング: 取得したeggIdのうちACTIVE+公開のみ残す
    const streakEggIds = streakGroups.map((g) => g.eggId)
    const streakEggs = streakEggIds.length > 0
      ? await prisma.egg.findMany({
          where: { id: { in: streakEggIds }, status: "ACTIVE", isPublic: true },
          select: {
            id: true,
            currentTapCount: true,
            creator: { select: { slug: true, iconUrl: true, creatorName: true } },
          },
        })
      : []

    const streakCountMap = new Map(streakGroups.map((g) => [g.eggId, g._count.userId]))

    function toItem(
      id: string,
      creatorName: string,
      currentTapCount: number,
      slug: string,
      iconUrl: string | null,
      metricValue: number
    ): RankingItem {
      return { eggId: id, creatorName, slug, iconUrl, pct: currentTapCount / TARGET, metricValue }
    }

    return {
      tapRanking: tapRanking.map((e) =>
        toItem(e.id, e.creator.creatorName, e.currentTapCount, e.creator.slug, e.creator.iconUrl, e.currentTapCount)
      ),
      fanRanking: fanRanking.map((e) =>
        toItem(e.id, e.creator.creatorName, e.currentTapCount, e.creator.slug, e.creator.iconUrl, e._count.fanEggStats)
      ),
      streakRanking: streakGroups
        .map((g) => {
          const egg = streakEggs.find((e) => e.id === g.eggId)
          return egg
            ? toItem(egg.id, egg.creator.creatorName, egg.currentTapCount, egg.creator.slug, egg.creator.iconUrl, streakCountMap.get(g.eggId) ?? 0)
            : null
        })
        .filter((x): x is RankingItem => x !== null),
    }
  },
  ["global-rankings"],
  { revalidate: 300 } // 5分キャッシュ
)

// ランキングデータを非同期で流し込む（Suspenseの中身）
async function RankingContent() {
  const { tapRanking, fanRanking, streakRanking } = await getCachedRankings()
  return (
    <RankingClient
      tapRanking={tapRanking}
      fanRanking={fanRanking}
      streakRanking={streakRanking}
    />
  )
}

// データ取得中に表示するスケルトン
function RankingSkeleton() {
  return (
    <div className="min-h-screen bg-stone-950 p-5 pb-28">
      <div className="max-w-sm mx-auto">
        <div className="pt-6 mb-6">
          <div className="h-5 w-20 bg-stone-900 rounded-lg animate-pulse" />
        </div>
        <div className="h-11 bg-stone-900 rounded-2xl mb-5 animate-pulse" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[72px] bg-stone-900 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default async function RankingPage() {
  // ユーザー固有部分（BottomNavのmySlug）は毎回取得
  const session = await auth()
  const userId = session?.user?.id ?? null
  const myCreator = userId
    ? await prisma.creator.findUnique({ where: { userId }, select: { slug: true } })
    : null

  return (
    <>
      {/* ランキングデータはSuspenseでストリーミング */}
      <Suspense fallback={<RankingSkeleton />}>
        <RankingContent />
      </Suspense>
      <BottomNav mySlug={myCreator?.slug ?? null} />
    </>
  )
}
