"use client"

import { useRouter } from "next/navigation"
import IconUploader from "./IconUploader"
import InlineEditor from "./InlineEditor"
import ProfileMessageEditor from "./ProfileMessageEditor"
import CreatorLinkEditor from "./CreatorLinkEditor"
import { updateCreatorName } from "@/app/actions/dashboard"

interface Props {
  creatorName: string
  profileMessage: string | null
  linkUrl: string | null
  linkLabel: string | null
  iconUrl: string | null
  onClose: () => void
}

export default function ProfileEditModal({
  creatorName,
  profileMessage,
  linkUrl,
  linkLabel,
  iconUrl,
  onClose,
}: Props) {
  const router = useRouter()

  function handleClose() {
    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景 */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

      {/* モーダル */}
      <div className="relative w-full max-w-sm max-h-[90vh] rounded-3xl overflow-y-auto" style={{ background: "rgba(20,18,16,0.72)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07)" }}>
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
          <h2 className="text-stone-200 text-base font-semibold">プロフィール編集</h2>
          <button
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center text-stone-500 hover:text-stone-300 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* コンテンツ */}
        <div className="px-5 py-4 pb-12 space-y-3">
          {/* アイコン */}
          <div className="glass-card rounded-2xl p-4">
            <p className="text-stone-500 text-xs mb-3">アイコン</p>
            <IconUploader currentIconUrl={iconUrl} creatorName={creatorName} />
          </div>

          {/* 名前・一言・リンク */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-4 py-4 border-b border-white/[0.06]">
              <p className="text-stone-500 text-xs mb-2">名前</p>
              <InlineEditor
                initial={creatorName}
                onSave={updateCreatorName}
                maxLength={16}
                required
                placeholder="表示名"
                displayClassName="text-stone-200 text-base font-medium"
              />
            </div>
            <div className="px-4 py-4 border-b border-white/[0.06]">
              <p className="text-stone-500 text-xs mb-2">一言メッセージ</p>
              <ProfileMessageEditor initial={profileMessage} />
            </div>
            <div className="px-4 py-4">
              <p className="text-stone-500 text-xs mb-2">リンク</p>
              <CreatorLinkEditor initialUrl={linkUrl} initialLabel={linkLabel} />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
