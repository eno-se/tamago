"use client"

import { useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import { tapEgg } from "@/app/actions/tap"
import { addToWatchList, removeFromWatchList } from "@/app/actions/watchlist"
import type { EggState } from "@/app/lib/egg-state"
import EggSvg from "@/app/components/EggSvg"
import SocialLinks from "@/app/components/SocialLinks"
import ProfileEditModal from "@/app/components/ProfileEditModal"
import SNSEditModal from "@/app/components/SNSEditModal"
import EggPublicToggle from "@/app/components/EggPublicToggle"

interface Props {
  eggId: string
  creatorName: string
  eggNumber: number
  profileMessage: string | null
  linkUrl: string | null
  linkLabel: string | null
  iconUrl: string | null
  eggState: EggState
  tappedToday: boolean
  streakDays: number
  isLoggedIn: boolean
  slug: string
  isOwnEgg: boolean
  isInWatchList: boolean
  tapCount: number
  isPublic: boolean
  socialLinks: { id: string; platform: string; url: string }[]
}

interface TapFeedback {
  message: string
  streakDays: number
}

export default function EggClient({
  eggId,
  creatorName,
  eggNumber,
  profileMessage,
  linkUrl,
  linkLabel,
  iconUrl,
  eggState,
  tappedToday: initialTappedToday,
  streakDays: initialStreakDays,
  isLoggedIn,
  tapCount,
  slug,
  isOwnEgg,
  isInWatchList: initialIsInWatchList,
  isPublic,
  socialLinks,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [watchPending, startWatchTransition] = useTransition()
  const [tappedToday, setTappedToday] = useState(initialTappedToday)
  const [streakDays, setStreakDays] = useState(initialStreakDays)
  const [feedback, setFeedback] = useState<TapFeedback | null>(null)
  const [isShaking, setIsShaking] = useState(false)
  const [isInWatchList, setIsInWatchList] = useState(initialIsInWatchList)
  const [watchLimitError, setWatchLimitError] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [snsModalOpen, setSnsModalOpen] = useState(false)
  const eggRef = useRef<HTMLDivElement>(null)

  function handleTap() {
    if (!isLoggedIn) {
      router.push(`/login?callbackUrl=/u/${slug}`)
      return
    }
    if (tappedToday || isPending) return

    setIsShaking(true)
    setTimeout(() => setIsShaking(false), 500)

    setFeedback({ message: "", streakDays: 0 })
    setTimeout(() => setFeedback(null), 500)

    startTransition(async () => {
      const result = await tapEgg(eggId)

      if (!result.ok) {
        if (result.reason === "already_tapped") setTappedToday(true)
        return
      }

      setTappedToday(true)
      setStreakDays(result.streakDays)

      if (result.broken) {
        router.push(`/u/${slug}/result`)
        return
      }

    })
  }

  function handleWatchToggle() {
    setWatchLimitError(false)
    startWatchTransition(async () => {
      if (isInWatchList) {
        await removeFromWatchList(eggId)
        setIsInWatchList(false)
      } else {
        const result = await addToWatchList(eggId)
        if (result.reason === "limit") {
          setWatchLimitError(true)
        } else if (result.ok) {
          setIsInWatchList(true)
        }
      }
    })
  }


  return (
    <div className="min-h-screen bg-transparent flex flex-col p-6 pt-4">
      {/* プロフィール編集モーダル */}
      {editModalOpen && (
        <ProfileEditModal
          creatorName={creatorName}
          profileMessage={profileMessage}
          linkUrl={linkUrl}
          linkLabel={linkLabel}
          iconUrl={iconUrl}
          onClose={() => setEditModalOpen(false)}
        />
      )}

      {/* SNS編集モーダル */}
      {snsModalOpen && (
        <SNSEditModal
          socialLinks={socialLinks}
          onClose={() => setSnsModalOpen(false)}
        />
      )}

      {/* プロフィールカード */}
      <section
        className="relative mx-auto mb-2 w-[calc(100%-36px)] max-w-sm overflow-hidden rounded-[24px] border border-[#d5bf80]/40 p-[20px_18px_18px] backdrop-blur-[18px]"
        style={{
          background: "linear-gradient(135deg,rgba(58,86,68,0.48) 0%,rgba(30,55,42,0.42) 45%,rgba(16,36,27,0.50) 100%)",
          boxShadow: "0 18px 40px rgba(0,0,0,0.35),0 0 28px rgba(206,178,92,0.08),inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        {/* 表面の反射 */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-70"
          style={{ background: "radial-gradient(circle at 18% 0%,rgba(255,255,255,0.12),transparent 32%),linear-gradient(120deg,rgba(255,255,255,0.05),transparent 42%)" }}
        />

        {/* 編集ボタン（オーナーのみ） */}
        {isOwnEgg && (
          <button
            onClick={() => setEditModalOpen(true)}
            className="absolute right-[18px] top-[18px] z-10 grid h-7 w-7 place-items-center text-[#d5bf80]/70 hover:text-[#d5bf80] transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
              <path d="M9.5 2.5L11.5 4.5L4.5 11.5H2.5V9.5L9.5 2.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        {/* アイコン ＋ 名前 ＋ ID */}
        <div className="relative z-10 flex items-start gap-[14px]">
          {iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={iconUrl} alt={creatorName} className="h-14 w-14 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="h-14 w-14 shrink-0 rounded-full bg-stone-700 flex items-center justify-center text-stone-400 text-xl">
              {creatorName[0]}
            </div>
          )}
          <div className="pt-1 min-w-0">
            {(() => {
              const len = [...creatorName].length
              const display = len >= 12 ? [...creatorName].slice(0, 11).join("") + "…" : creatorName
              const size = len >= 8 ? "text-lg" : "text-[22px]"
              return <p className={`${size} font-extrabold tracking-[0.03em] text-white/95`}>{display}</p>
            })()}
            <p className="mt-0.5 text-[14px] tracking-[0.04em] text-[#dcdccd]/50">@{slug}</p>
          </div>
        </div>

        {/* 一言 */}
        {profileMessage && (
          <div className="relative z-10 mt-[18px] min-h-[44px] w-full rounded-[12px] border border-white/[0.035] bg-white/[0.075] px-[15px] py-[13px]">
            <p className="text-[14px] font-semibold leading-[1.5] text-white/70">{profileMessage}</p>
          </div>
        )}

        {/* リンク */}
        {linkUrl && (
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 mt-3 inline-flex items-center gap-1.5 rounded-full px-[14px] py-[7px] text-[13px] font-extrabold tracking-[0.02em] text-[#f5a400] no-underline"
            style={{ background: "rgba(15,15,12,0.58)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05),0 4px 14px rgba(0,0,0,0.25)" }}
          >
            <span>{linkLabel || linkUrl}</span>
            <span className="-translate-y-px">↗</span>
          </a>
        )}
      </section>

      {/* 卵エリア */}
      <div className="relative flex flex-col items-center justify-start pt-4 gap-4 w-full max-w-sm mx-auto">
        <div className="text-center">
          <h1 className="text-stone-300 text-xl tracking-wider">{creatorName}のたまご</h1>
          {eggNumber > 1 && (
            <p className="text-amber-400 text-sm tracking-widest mt-1">
              {"★".repeat(eggNumber)}
            </p>
          )}
        </div>

        <div className="relative mt-4">
          {/* 卵の背後の光 */}
          <div
            className="absolute pointer-events-none -z-10"
            style={{
              left: "50%", top: "46%",
              width: 320, height: 320,
              transform: "translate(-50%,-50%)",
              borderRadius: "50%",
              background: "radial-gradient(circle,rgba(255,213,105,0.28) 0%,rgba(209,158,48,0.14) 34%,rgba(44,91,62,0.16) 58%,transparent 74%)",
              filter: "blur(8px)",
            }}
          />
          {/* 卵周囲の金粉オーラ */}
          <div
            className="absolute pointer-events-none z-[1]"
            style={{
              left: "50%", top: "46%",
              width: 300, height: 300,
              transform: "translate(-50%,-50%)",
              backgroundImage: "radial-gradient(circle,rgba(255,226,139,0.9) 0 1px,transparent 1.5px),radial-gradient(circle,rgba(221,168,63,0.55) 0 1px,transparent 1.4px)",
              backgroundSize: "34px 34px,58px 58px",
              backgroundPosition: "0 0,17px 21px",
              opacity: 0.35,
              maskImage: "radial-gradient(circle,black 0%,black 45%,transparent 72%)",
              WebkitMaskImage: "radial-gradient(circle,black 0%,black 45%,transparent 72%)",
            }}
          />
          {/* コツ画像フィードバック */}
          {feedback && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/kotsu.png"
              alt=""
              className="absolute -top-6 -left-16 w-20 h-auto pointer-events-none z-10"
            />
          )}
          <div
            ref={eggRef}
            style={isShaking ? { animation: "eggTapRock 0.5s ease-in-out" } : {}}
            onClick={() => {
              if (isShaking) return
              setIsShaking(true)
              setTimeout(() => setIsShaking(false), 500)
            }}
            className="relative z-[2] cursor-pointer"
          >
            <EggSvg stateKey={eggState.key} pct={tapCount / 1_000_000} className="w-48 h-64" />
          </div>
        </div>

        <p className="text-stone-400 text-center text-sm leading-relaxed">
          {eggState.message}
        </p>

        {streakDays > 0 && (
          <p className="text-stone-600 text-xs">
            {streakDays}日連続でコツコツしています。
          </p>
        )}
      </div>

      {/* サブボタン行 */}
      <div className="w-full max-w-sm mx-auto mb-4 mt-6">
        <div className="flex gap-2">
          <a
            href={`/u/${slug}/ranking`}
            className="glass-card flex-1 py-2.5 text-stone-400 rounded-xl text-sm text-center"
          >
            コツコツ記録
          </a>
          {!isOwnEgg && (
            <button
              onClick={handleWatchToggle}
              disabled={watchPending}
              className={`glass-card flex-1 py-2.5 rounded-xl text-sm transition-colors ${
                isInWatchList ? "text-amber-400" : "text-stone-400"
              }`}
            >
              {isInWatchList ? "リスト済み ✓" : "リストに追加"}
            </button>
          )}
        </div>
        {watchLimitError && (
          <p className="text-center text-stone-500 text-xs mt-2">
            リストは5件までです。外してから追加してください。
          </p>
        )}
      </div>

      {/* 公開/非公開トグル（オーナーのみ） */}
      {isOwnEgg && (
        <div className="w-full max-w-sm mx-auto mb-4">
          <EggPublicToggle eggId={eggId} isPublic={isPublic} />
        </div>
      )}

      {/* メインボタン */}
      {!isOwnEgg && (
        <div className="w-full max-w-sm mx-auto pb-4">
          {tappedToday ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/btn-done.png" alt="明日もコツコツ" className="w-full" />
          ) : (
            <button onClick={handleTap} disabled={isPending} className="w-full active:scale-95 transition-transform disabled:opacity-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={isPending ? "/btn-pending.png" : "/btn-tap.png"} alt={isPending ? "コツコツ中" : "コツコツする"} className="w-full" />
            </button>
          )}
        </div>
      )}

      {/* SNSカード */}
      {(socialLinks.length > 0 || isOwnEgg) && (
        <div className="glass-card w-full max-w-sm mx-auto mt-4 rounded-3xl p-4 relative">
          {isOwnEgg && (
            <button
              onClick={() => setSnsModalOpen(true)}
              className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center text-stone-500 hover:text-stone-300 transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
                <path d="M9.5 2.5L11.5 4.5L4.5 11.5H2.5V9.5L9.5 2.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          {socialLinks.length > 0 ? (
            <SocialLinks links={socialLinks} />
          ) : (
            <p className="text-stone-600 text-xs">SNSリンクを追加しよう</p>
          )}
        </div>
      )}

      <div className="pb-24" />
    </div>
  )
}
