import { notFound } from "next/navigation"
import { prisma } from "@/app/lib/prisma"
import { auth } from "@/auth"
import ShareButton from "@/app/components/ShareButton"
import BottomNav from "@/app/components/BottomNav"

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ResultPage({ params }: Props) {
  const { slug } = await params

  const creator = await prisma.creator.findUnique({
    where: { slug },
    include: {
      results: {
        orderBy: { completedAt: "desc" },
        take: 1,
        include: {
          engravings: {
            orderBy: { rank: "asc" },
            take: 100,
          },
          finalTapUser: { select: { name: true } },
        },
      },
    },
  })

  if (!creator || creator.results.length === 0) notFound()

  const session = await auth()
  const myCreator = session?.user?.id
    ? await prisma.creator.findUnique({ where: { userId: session.user.id }, select: { slug: true } })
    : null

  const result = creator.results[0]
  const completedDate = result.completedAt.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <>
    <div className="min-h-screen bg-stone-950 text-stone-200 p-6 pb-16">
      <div className="max-w-sm mx-auto">
        {/* ヘッダー */}
        <div className="text-center pt-10 mb-10">
          <p className="text-stone-500 text-sm mb-3">{completedDate}</p>
          <div className="text-7xl mb-6">✨</div>
          <h1 className="text-2xl font-light tracking-widest mb-2">たまごが割れました</h1>
          <p className="text-stone-400 text-sm leading-relaxed">
            {creator.creatorName}
            <span className="text-stone-600 text-xs font-mono ml-2">{slug}</span>
            のたまごが割れました。
            <br />
            長く応援し続けたファンの名前が刻まれています。
          </p>
        </div>

        {/* 統計 */}
        <div className="grid grid-cols-2 gap-3 mb-10">
          <div className="bg-stone-900 rounded-2xl p-4 text-center">
            <p className="text-2xl font-light text-amber-400">
              {result.totalTaps.toLocaleString()}
            </p>
            <p className="text-stone-500 text-xs mt-1">累計タップ数</p>
          </div>
          <div className="bg-stone-900 rounded-2xl p-4 text-center">
            <p className="text-2xl font-light text-amber-400">
              {result.uniqueFans.toLocaleString()}
            </p>
            <p className="text-stone-500 text-xs mt-1">参加ファン数</p>
          </div>
        </div>

        {/* 最後の一撃 */}
        {result.finalTapUser && (
          <div className="bg-stone-900 rounded-2xl p-4 mb-6 text-center">
            <p className="text-stone-500 text-xs mb-1">最後の一撃</p>
            <p className="text-stone-200">{result.finalTapUser.name ?? "名無し"}</p>
          </div>
        )}

        {/* 刻印一覧 */}
        {result.engravings.length > 0 && (
          <div>
            <p className="text-stone-500 text-xs mb-4 text-center">
              刻まれた名前（連続応援上位者）
            </p>
            <div className="space-y-2">
              {result.engravings.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between px-4 py-3 bg-stone-900 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-stone-600 text-xs w-6 text-right">
                      {e.rank}
                    </span>
                    <span className="text-stone-200 text-sm">{e.engravingName}</span>
                  </div>
                  <span className="text-stone-500 text-xs">
                    {e.streakDays}日連続
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* シェアボタン */}
        <div className="mt-10 mb-4">
          <ShareButton title={`${creator.creatorName}のたまごが割れました`} />
        </div>
      </div>
    </div>
    <BottomNav mySlug={myCreator?.slug ?? null} />
    </>
  )
}
