"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"

type Tab = "taps" | "fans" | "streak"

export interface RankingItem {
  eggId: string
  creatorName: string
  slug: string
  pct: number
  metricValue: number
  iconUrl: string | null
}

interface Props {
  tapRanking: RankingItem[]
  fanRanking: RankingItem[]
  streakRanking: RankingItem[]
}

function metricText(value: number, tab: Tab): string {
  if (tab === "taps") return value.toLocaleString("en-US") + " 回"
  return value.toLocaleString("en-US") + " 人"
}

function EggRankItem({ rank, item, tab }: { rank: number; item: RankingItem; tab: Tab }) {
  return (
    <Link href={`/u/${item.slug}`} className="block glass-card rounded-2xl p-4 active:opacity-70">
      <div className="flex items-center gap-3">
        <span className={`text-sm w-5 shrink-0 text-right ${rank <= 3 ? "text-amber-400 font-medium" : "text-stone-600"}`}>
          {rank}
        </span>
        <div className="relative w-8 h-8 shrink-0">
          {item.iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.iconUrl} alt={item.slug} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-stone-700 flex items-center justify-center text-stone-400 text-xs">
              {item.slug[0].toUpperCase()}
            </div>
          )}
          {rank <= 3 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/rank-${rank}.png`} alt="" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0 flex-1">
              <p className="text-stone-200 text-sm truncate">{item.creatorName}のたまご</p>
              <p className="text-stone-600 text-xs font-mono">{item.slug}</p>
            </div>
            <span className="text-stone-500 text-xs shrink-0 mt-0.5">{metricText(item.metricValue, tab)}</span>
          </div>
          <div className="w-full bg-stone-800 rounded-full h-1">
            <div
              className="bg-amber-500 h-1 rounded-full"
              style={{ width: `${Math.min(item.pct * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  )
}

const PAGE_SIZE = 10

export default function RankingClient({ tapRanking, fanRanking, streakRanking }: Props) {
  const [tab, setTab] = useState<Tab>("taps")
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const tabs: { key: Tab; label: string }[] = [
    { key: "taps", label: "コツコツ総合" },
    { key: "fans", label: "総参加者数" },
    { key: "streak", label: "継続ユーザー" },
  ]

  const current = tab === "taps" ? tapRanking : tab === "fans" ? fanRanking : streakRanking
  const visible = current.slice(0, displayCount)
  const hasMore = displayCount < current.length

  useEffect(() => {
    setDisplayCount(PAGE_SIZE)
  }, [tab])

  useEffect(() => {
    if (!hasMore) return
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDisplayCount((c) => c + PAGE_SIZE)
        }
      },
      { rootMargin: "100px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, displayCount])

  return (
    <div className="min-h-screen bg-transparent text-stone-200 p-5 pb-28">
      <div className="max-w-sm mx-auto">
        <div className="pt-6 mb-6">
          <h1 className="text-base text-stone-300">たまごランキング</h1>
        </div>

        <div className="flex gap-1.5 mb-5 bg-stone-900 p-1 rounded-2xl">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${
                tab === t.key ? "bg-white/10 text-stone-100" : "text-stone-500"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {visible.length === 0 ? (
            <p className="text-center text-stone-600 text-sm py-12">
              まだデータがありません。
            </p>
          ) : (
            <>
              {visible.map((item, i) => (
                <EggRankItem key={item.eggId} rank={i + 1} item={item} tab={tab} />
              ))}
              {hasMore && <div ref={sentinelRef} className="h-10" />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
