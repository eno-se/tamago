"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"

interface Props {
  mySlug: string | null
}

export default function BottomNav({ mySlug }: Props) {
  const pathname = usePathname()

  const isMyEgg = mySlug ? pathname.startsWith(`/u/${mySlug}`) : false
  const isDashboard = pathname.startsWith("/dashboard")
  const isWatchlist = pathname === "/watchlist"
  const isRanking = pathname === "/ranking"

  const myEggHref = mySlug ? `/u/${mySlug}` : "/dashboard"

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08]" style={{ background: "rgba(10,9,8,0.5)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
      <div className="flex max-w-sm mx-auto">
        <Link
          href={myEggHref}
          className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-opacity ${
            isMyEgg ? "opacity-100" : "opacity-30"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/nav-egg.png" alt="マイページ" className="w-9 h-9 object-contain" />
          <span className="text-xs" style={{ color: "white", WebkitTextStroke: "0.3px #f59e0b" }}>マイページ</span>
        </Link>

        <Link
          href="/dashboard"
          className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-opacity ${
            isDashboard ? "opacity-100" : "opacity-30"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/nav-dashboard.png" alt="ダッシュボード" className="w-9 h-9 object-contain" />
          <span className="text-xs" style={{ color: "white", WebkitTextStroke: "0.3px #f59e0b" }}>ダッシュボード</span>
        </Link>

        <Link
          href="/watchlist"
          className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-opacity ${
            isWatchlist ? "opacity-100" : "opacity-30"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/nav-list.png" alt="リスト" className="w-9 h-9 object-contain" />
          <span className="text-xs" style={{ color: "white", WebkitTextStroke: "0.3px #f59e0b" }}>リスト</span>
        </Link>

        <Link
          href="/ranking"
          className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-opacity ${
            isRanking ? "opacity-100" : "opacity-30"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/nav-ranking.png" alt="ランキング" className="w-9 h-9 object-contain" />
          <span className="text-xs" style={{ color: "white", WebkitTextStroke: "0.3px #f59e0b" }}>ランキング</span>
        </Link>
      </div>
    </nav>
  )
}
