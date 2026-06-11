"use client"

import { useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import { tapEgg } from "@/app/actions/tap"
import { addToWatchList, removeFromWatchList } from "@/app/actions/watchlist"
import type { EggState } from "@/app/lib/egg-state"
import EggSvg from "@/app/components/EggSvg"
import SocialLinks from "@/app/components/SocialLinks"
import ProfileCard from "@/app/components/ProfileCard"
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
    <div className="min-h-screen bg-transparent flex flex-col px-[18px] pt-4">
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
      {snsModalOpen && (
        <SNSEditModal
          socialLinks={socialLinks}
          onClose={() => setSnsModalOpen(false)}
        />
      )}

      {/* プロフィールカード */}
      <ProfileCard
        creatorName={creatorName}
        slug={slug}
        iconUrl={iconUrl}
        profileMessage={profileMessage}
        linkUrl={linkUrl}
        linkLabel={linkLabel}
        isOwnEgg={isOwnEgg}
        onEdit={() => setEditModalOpen(true)}
      />

      {/* 卵エリア */}
      <section className="relative flex flex-col items-center pt-8 pb-2 gap-3 w-full max-w-sm mx-auto">
        <div className="text-center">
          <h1 className="text-white/75 text-xl tracking-widest font-light">
            {creatorName}のたまご
          </h1>
          {eggNumber > 1 && (
            <p className="text-amber-400/80 text-sm tracking-widest mt-1">
              {"★".repeat(eggNumber)}
            </p>
          )}
        </div>

        <div className="relative my-3">
          {/* 卵背後のグロー */}
          <div
            className="absolute pointer-events-none -z-10"
            style={{
              left: "50%", top: "46%",
              width: 320, height: 320,
              transform: "translate(-50%,-50%)",
              borderRadius: "50%",
              background:
                "radial-gradient(circle,rgba(255,213,105,0.28) 0%,rgba(209,158,48,0.14) 34%,rgba(44,91,62,0.16) 58%,transparent 74%)",
              filter: "blur(8px)",
            }}
          />
          {/* 金粉オーラ */}
          <div
            className="absolute pointer-events-none z-[1]"
            style={{
              left: "50%", top: "46%",
              width: 300, height: 300,
              transform: "translate(-50%,-50%)",
              backgroundImage:
                "radial-gradient(circle,rgba(255,226,139,0.9) 0 1px,transparent 1.5px),radial-gradient(circle,rgba(221,168,63,0.55) 0 1px,transparent 1.4px)",
              backgroundSize: "34px 34px,58px 58px",
              backgroundPosition: "0 0,17px 21px",
              opacity: 0.35,
              maskImage: "radial-gradient(circle,black 0%,black 45%,transparent 72%)",
              WebkitMaskImage: "radial-gradient(circle,black 0%,black 45%,transparent 72%)",
            }}
          />
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

        <p className="text-white/45 text-center text-sm leading-relaxed tracking-wide">
          {eggState.message}
        </p>
        {streakDays > 0 && (
          <p className="text-[#d5bf80]/45 text-xs tracking-wide">
            {streakDays}日連続でコツコツしています。
          </p>
        )}
      </section>

      {/* サブボタン */}
      <div className="w-full max-w-sm mx-auto mt-6 mb-4">
        <div className="flex gap-2.5">
          <a
            href={`/u/${slug}/ranking`}
            className="sub-btn flex-1 py-3 text-sm text-center font-medium"
          >
            コツコツ記録
          </a>
          {!isOwnEgg && (
            <button
              onClick={handleWatchToggle}
              disabled={watchPending}
              className="sub-btn flex-1 py-3 text-sm font-medium disabled:opacity-50"
              style={isInWatchList ? { color: "rgba(251,191,36,0.88)", borderColor: "rgba(251,191,36,0.28)" } : {}}
            >
              {isInWatchList ? "リスト済み ✓" : "リストに追加"}
            </button>
          )}
        </div>
        {watchLimitError && (
          <p className="text-center text-white/30 text-xs mt-2 tracking-wide">
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
            <button
              onClick={handleTap}
              disabled={isPending}
              className="w-full active:scale-95 transition-transform disabled:opacity-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={isPending ? "/btn-pending.png" : "/btn-tap.png"}
                alt={isPending ? "コツコツ中" : "コツコツする"}
                className="w-full"
              />
            </button>
          )}
        </div>
      )}

      {/* SNSカード */}
      {(socialLinks.length > 0 || isOwnEgg) && (
        <div className="glass-card w-full max-w-sm mx-auto mt-2 mb-4 rounded-[20px] p-5 relative">
          {isOwnEgg && (
            <button
              onClick={() => setSnsModalOpen(true)}
              className="absolute top-3.5 right-3.5 grid h-7 w-7 place-items-center text-[#d5bf80]/55 transition-colors hover:text-[#d5bf80]/90"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M9.5 2.5L11.5 4.5L4.5 11.5H2.5V9.5L9.5 2.5Z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          {socialLinks.length > 0 ? (
            <SocialLinks links={socialLinks} />
          ) : (
            <p className="text-center text-[#d5bf80]/28 text-xs py-2 tracking-widest">
              SNS を追加しよう
            </p>
          )}
        </div>
      )}

      <div className="pb-24" />
    </div>
  )
}
