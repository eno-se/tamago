"use client"

interface ProfileCardProps {
  creatorName: string
  slug: string
  iconUrl: string | null
  profileMessage: string | null
  linkUrl: string | null
  linkLabel: string | null
  isOwnEgg: boolean
  onEdit: () => void
}

export default function ProfileCard({
  creatorName,
  slug,
  iconUrl,
  profileMessage,
  linkUrl,
  linkLabel,
  isOwnEgg,
  onEdit,
}: ProfileCardProps) {
  const len = [...creatorName].length
  const displayName = len >= 12 ? [...creatorName].slice(0, 11).join("") + "…" : creatorName
  const nameSizeClass = len >= 8 ? "text-lg" : "text-[22px]"

  return (
    <section
      className="relative mx-auto mb-2 w-[calc(100%-36px)] max-w-sm overflow-hidden rounded-[24px] border border-[#d5bf80]/38 p-[20px_18px_18px] backdrop-blur-[18px]"
      style={{
        background:
          "linear-gradient(135deg,rgba(58,86,68,0.48) 0%,rgba(30,55,42,0.42) 45%,rgba(16,36,27,0.50) 100%)",
        boxShadow:
          "0 18px 40px rgba(0,0,0,0.35),0 0 28px rgba(206,178,92,0.08),inset 0 1px 0 rgba(255,255,255,0.08)",
      }}
    >
      {/* 表面の反射 */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-70"
        style={{
          background:
            "radial-gradient(circle at 18% 0%,rgba(255,255,255,0.12),transparent 32%),linear-gradient(120deg,rgba(255,255,255,0.05),transparent 42%)",
        }}
      />

      {/* 編集ボタン（オーナーのみ） */}
      {isOwnEgg && (
        <button
          onClick={onEdit}
          className="absolute right-[18px] top-[18px] z-10 grid h-7 w-7 place-items-center text-[#d5bf80]/65 transition-colors hover:text-[#d5bf80]"
        >
          <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
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

      {/* アイコン + 名前 + ID */}
      <div className="relative z-10 flex items-start gap-[14px]">
        {iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={iconUrl}
            alt={creatorName}
            className="h-14 w-14 shrink-0 rounded-full object-cover ring-1 ring-[#d5bf80]/20"
          />
        ) : (
          <div className="h-14 w-14 shrink-0 rounded-full bg-[rgba(20,45,32,0.8)] ring-1 ring-[#d5bf80]/20 flex items-center justify-center text-[#d5bf80]/55 text-xl">
            {creatorName[0]}
          </div>
        )}
        <div className="pt-1 min-w-0">
          <p className={`${nameSizeClass} font-extrabold tracking-[0.03em] text-white/95`}>
            {displayName}
          </p>
          <p className="mt-0.5 text-[14px] tracking-[0.04em] text-[#dcdccd]/48">@{slug}</p>
        </div>
      </div>

      {/* 一言メッセージ */}
      {profileMessage && (
        <div className="relative z-10 mt-[18px] w-full rounded-[12px] border border-white/[0.035] bg-white/[0.072] px-[15px] py-[13px]">
          <p className="text-[14px] font-medium leading-[1.55] text-white/68">{profileMessage}</p>
        </div>
      )}

      {/* 外部リンク */}
      {linkUrl && (
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative z-10 mt-3 inline-flex items-center gap-1.5 rounded-full px-[14px] py-[7px] text-[13px] font-extrabold tracking-[0.02em] text-[#f5a400] no-underline transition-opacity hover:opacity-80 active:opacity-60"
          style={{
            background: "rgba(15,15,12,0.58)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05),0 4px 14px rgba(0,0,0,0.25)",
          }}
        >
          <span>{linkLabel || linkUrl}</span>
          <span className="-translate-y-px">↗</span>
        </a>
      )}
    </section>
  )
}
