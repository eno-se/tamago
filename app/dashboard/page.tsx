import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/app/lib/prisma"
import Link from "next/link"
import CopyUrlButton from "@/app/components/CopyUrlButton"
import BottomNav from "@/app/components/BottomNav"
import NextEggButton from "@/app/components/NextEggButton"

function getProgressLabel(pct: number): string {
  if (pct < 1) return "まだ始まったばかり。ファンを集めよう。"
  if (pct < 5) return "少しずつ積み重なっている。"
  if (pct < 15) return "ファンが集まり始めている。"
  if (pct < 30) return "ヒビが入り始めた。"
  if (pct < 50) return "確実に育っている。"
  if (pct < 70) return "折り返しを過ぎた。"
  if (pct < 85) return "もうすぐかもしれない。"
  if (pct < 95) return "割れる一歩手前。"
  return "今にも割れそう。"
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard")

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
    include: {
      eggs: {
        orderBy: { eggNumber: "asc" },
        include: { _count: { select: { fanEggStats: true } } },
      },
    },
  })

  if (!creator) redirect("/onboarding")

  const activeEgg = creator.eggs.find((e) => e.status === "ACTIVE")
  const completedEggs = creator.eggs.filter((e) => e.status === "COMPLETED")

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayTaps = activeEgg
    ? await prisma.tap.count({
        where: { eggId: activeEgg.id, createdAt: { gte: today } },
      })
    : 0

  const baseUrl = process.env.NEXTAUTH_URL ?? ""
  const eggUrl = `${baseUrl}/u/${creator.slug}`

  return (
    <div className="min-h-screen bg-transparent text-stone-200 p-6 pb-28">
      <div className="max-w-sm mx-auto pt-6">

        {/* アクティブな卵 */}
        {activeEgg ? (
          <div className="glass-card rounded-2xl p-5 mb-4">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <p className="text-stone-200 font-semibold">{creator.creatorName}のたまご</p>
                {activeEgg.eggNumber > 1 && (
                  <span className="text-amber-400 text-xs tracking-widest">{"★".repeat(activeEgg.eggNumber)}</span>
                )}
              </div>
              <span className="text-xs text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full font-medium">進行中</span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="text-center">
                <p className="text-2xl font-light text-amber-400">{todayTaps.toLocaleString()}</p>
                <p className="text-stone-500 text-xs mt-1">今日</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-light text-amber-400">{activeEgg.currentTapCount.toLocaleString()}</p>
                <p className="text-stone-500 text-xs mt-1">累計</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-light text-amber-400">{activeEgg._count.fanEggStats.toLocaleString()}</p>
                <p className="text-stone-500 text-xs mt-1">ファン</p>
              </div>
            </div>

            {(() => {
              const pct = Math.min(100, (activeEgg.currentTapCount / 1_000_000) * 100)
              return (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-stone-400 text-xs">{getProgressLabel(pct)}</p>
                    <p className="text-stone-600 text-xs font-mono">{pct.toFixed(1)}%</p>
                  </div>
                  <div className="w-full bg-stone-800 rounded-full h-1.5">
                    <div className="bg-amber-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })()}
          </div>
        ) : completedEggs.length > 0 ? (
          <div className="glass-card rounded-2xl p-5 mb-4">
            <p className="text-stone-500 text-xs mb-1">次のたまご</p>
            <p className="text-amber-400 text-xs tracking-widest mb-4">{"★".repeat(completedEggs.length + 1)}</p>
            <NextEggButton />
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-5 mb-4 text-center">
            <p className="text-stone-500 text-sm mb-4">現在アクティブなたまごはありません</p>
            <Link href="/onboarding" className="text-amber-400 text-sm underline">新しいたまごを作る</Link>
          </div>
        )}

        {/* URL共有 */}
        {activeEgg?.isPublic && (
          <div className="glass-card rounded-2xl px-4 py-4 mb-4">
            <p className="text-stone-500 text-xs mb-2">たまごページのURL</p>
            <div className="flex items-center gap-2">
              <p className="text-stone-300 text-sm font-mono break-all flex-1">{eggUrl}</p>
              <CopyUrlButton url={eggUrl} />
            </div>
          </div>
        )}

        {/* 割れたたまご */}
        {completedEggs.length > 0 && (
          <div className="mb-4">
            <p className="text-stone-500 text-xs mb-2 px-1">割れたたまご</p>
            <div className="glass-card rounded-2xl overflow-hidden">
              {completedEggs.map((egg, i) => (
                <div key={egg.id} className={`px-4 py-4 flex items-center justify-between ${i < completedEggs.length - 1 ? "border-b border-white/[0.06]" : ""}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-stone-300 text-sm">{creator.creatorName}のたまご</p>
                      <span className="text-amber-400 text-xs tracking-widest">{"★".repeat(egg.eggNumber)}</span>
                    </div>
                    <p className="text-stone-600 text-xs mt-0.5">{egg.completedAt?.toLocaleDateString("ja-JP")}</p>
                  </div>
                  <Link href={`/u/${creator.slug}/result`} className="text-amber-400 text-sm font-medium">結果 →</Link>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
      <BottomNav mySlug={creator.slug} />
    </div>
  )
}
