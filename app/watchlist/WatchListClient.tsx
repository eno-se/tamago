"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { removeFromWatchList } from "@/app/actions/watchlist"

export interface WatchItem {
  eggId: string
  creatorName: string
  slug: string
  iconUrl: string | null
  stateMessage: string
  status: string
  pct: number
}

export default function WatchListClient({
  items: initialItems,
}: {
  items: WatchItem[]
}) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleRemove(eggId: string) {
    startTransition(async () => {
      await removeFromWatchList(eggId)
      setItems((prev) => prev.filter((i) => i.eggId !== eggId))
      setConfirmId(null)
    })
  }

  return (
    <div className="min-h-screen bg-transparent text-stone-200 p-6">
      <div className="max-w-sm mx-auto">
        <div className="flex items-center gap-4 mb-6 pt-4">
          <button
            onClick={() => router.back()}
            className="text-stone-500 text-sm"
          >
            ← 戻る
          </button>
          <h1 className="text-base text-stone-300">コツコツリスト</h1>
        </div>

        {items.length === 0 && (
          <p className="text-center text-stone-600 text-sm py-12">
            リストはまだ空です。
            <br />
            たまごページの「リストに追加」から登録できます。
          </p>
        )}

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.eggId} className="glass-card rounded-2xl p-4">
              {confirmId === item.eggId ? (
                <div>
                  <p className="text-stone-300 text-sm mb-4 text-center">
                    リストから削除しますか？
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmId(null)}
                      disabled={isPending}
                      className="flex-1 py-2.5 bg-stone-800 text-stone-400 rounded-xl text-sm"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={() => handleRemove(item.eggId)}
                      disabled={isPending}
                      className="flex-1 py-2.5 bg-red-950 text-red-400 rounded-xl text-sm"
                    >
                      {isPending ? "削除中..." : "削除する"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  {item.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.iconUrl} alt={item.slug} className="w-9 h-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-stone-700 flex items-center justify-center text-stone-400 text-xs shrink-0">
                      {item.slug[0].toUpperCase()}
                    </div>
                  )}
                  <Link href={`/u/${item.slug}`} className="flex-1 min-w-0">
                    <p className="text-stone-200 text-sm font-medium">
                      {item.creatorName}
                      <span className="text-stone-600 text-xs font-mono font-normal ml-2">{item.slug}</span>
                    </p>
                    <p className="text-stone-500 text-xs mt-0.5">
                      {item.stateMessage}
                    </p>
                    <div className="w-full bg-stone-800 rounded-full h-1 mt-2">
                      <div
                        className="bg-amber-500 h-1 rounded-full"
                        style={{ width: `${Math.min(item.pct * 100, 100)}%` }}
                      />
                    </div>
                  </Link>
                  <Link
                    href={`/u/${item.slug}`}
                    className="text-xs text-amber-400 px-3 py-1.5 bg-amber-400/10 rounded-lg shrink-0"
                  >
                    コツコツ →
                  </Link>
                  <button
                    onClick={() => setConfirmId(item.eggId)}
                    className="text-xs text-stone-600 px-2 py-1.5 shrink-0"
                  >
                    削除
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
