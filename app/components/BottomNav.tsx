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

  const tabs = [
    { href: myEggHref, active: isMyEgg,    img: "/nav-egg.png",      label: "マイページ" },
    { href: "/dashboard", active: isDashboard, img: "/nav-dashboard.png", label: "ダッシュボード" },
    { href: "/watchlist", active: isWatchlist, img: "/nav-list.png",     label: "リスト" },
    { href: "/ranking",   active: isRanking,   img: "/nav-ranking.png",  label: "ランキング" },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "linear-gradient(180deg,rgba(5,14,9,0.88) 0%,rgba(3,10,6,0.96) 100%)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: "1px solid rgba(213,174,82,0.20)",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.45)",
      }}
    >
      <div className="flex max-w-sm mx-auto">
        {tabs.map(({ href, active, img, label }) => (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-[5px] transition-all"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img}
              alt={label}
              className="w-[30px] h-[30px] object-contain transition-all duration-200"
              style={
                active
                  ? { opacity: 1, filter: "drop-shadow(0 0 7px rgba(213,174,82,0.75))" }
                  : { opacity: 0.25, filter: "none" }
              }
            />
            <span
              className="text-[10px] font-medium tracking-wide transition-all duration-200"
              style={{ color: active ? "rgba(213,174,82,0.92)" : "rgba(180,175,160,0.32)" }}
            >
              {label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
