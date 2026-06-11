"use client"

import { useState, useTransition } from "react"
import { addSocialLink, removeSocialLink, updateSocialLink } from "@/app/actions/socialLinks"
import { PLATFORMS } from "@/app/lib/social-platforms"

interface SocialLinkItem {
  id: string
  platform: string
  url: string
}

interface Props {
  initialLinks: SocialLinkItem[]
}

const INITIAL_SHOW = 3

const PLATFORM_META: Record<string, { icon: string; bg: string; text: string }> = {
  "X":          { icon: "/sns/x.png",         bg: "#000000", text: "#ffffff" },
  "Instagram":  { icon: "/sns/instagram.png",  bg: "#e1306c", text: "#ffffff" },
  "TikTok":     { icon: "/sns/tiktok.png",     bg: "#010101", text: "#ffffff" },
  "YouTube":    { icon: "/sns/youtube.png",    bg: "#ff0000", text: "#ffffff" },
  "Twitch":     { icon: "/sns/twitch.png",     bg: "#9147ff", text: "#ffffff" },
  "SHOWROOM":   { icon: "/sns/showroom.png",   bg: "#e4007f", text: "#ffffff" },
  "17LIVE":     { icon: "/sns/17live.png",     bg: "#f97316", text: "#ffffff" },
  "Pococha":    { icon: "/sns/pococha.png",    bg: "#ec4899", text: "#ffffff" },
  "note":       { icon: "/sns/note.png",       bg: "#41c9b4", text: "#ffffff" },
  "Threads":    { icon: "/sns/threads.png",    bg: "#101010", text: "#ffffff" },
  "BOOTH":      { icon: "/sns/booth.png",      bg: "#e4001e", text: "#ffffff" },
  "lit.link":   { icon: "/sns/litlink.png",    bg: "#f59e0b", text: "#ffffff" },
  "公式サイト": { icon: "/sns/website.png",    bg: "#475569", text: "#ffffff" },
}

function PlatformBadge({ platform }: { platform: string }) {
  const meta = PLATFORM_META[platform]
  return (
    <span
      className="flex items-center gap-1.5 px-2 py-1 rounded-lg shrink-0 text-xs font-medium"
      style={{ background: meta?.bg ?? "#374151", color: meta?.text ?? "#fff", minWidth: "6.5rem" }}
    >
      {meta && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={meta.icon} alt="" className="w-3.5 h-3.5 object-contain shrink-0" />
      )}
      {platform}
    </span>
  )
}

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path d="M9.5 2.5L11.5 4.5L4.5 11.5H2.5V9.5L9.5 2.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function SocialLinksEditor({ initialLinks }: Props) {
  const [links, setLinks] = useState(initialLinks)
  const [platform, setPlatform] = useState<typeof PLATFORMS[number]>(PLATFORMS[0])
  const [url, setUrl] = useState("")
  const [isPending, startTransition] = useTransition()
  const [expanded, setExpanded] = useState(false)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editUrl, setEditUrl] = useState("")

  const MAX_LINKS = 12

  function handleAdd() {
    if (!url.trim()) return
    if (links.length >= MAX_LINKS) return
    startTransition(async () => {
      const result = await addSocialLink(platform, url.trim())
      if (result.ok) {
        setLinks((prev) => [...prev, { id: Date.now().toString(), platform, url: url.trim() }])
        setUrl("")
        setAdding(false)
      }
    })
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      await removeSocialLink(id)
      setLinks((prev) => prev.filter((l) => l.id !== id))
      if (editingId === id) setEditingId(null)
    })
  }

  function startEdit(link: SocialLinkItem) {
    setEditingId(link.id)
    setEditUrl(link.url)
  }

  function handleUpdate(id: string) {
    if (!editUrl.trim()) return
    startTransition(async () => {
      await updateSocialLink(id, editUrl.trim())
      setLinks((prev) => prev.map((l) => l.id === id ? { ...l, url: editUrl.trim() } : l))
      setEditingId(null)
    })
  }

  const visible = expanded ? links : links.slice(0, INITIAL_SHOW)
  const hasMore = links.length > INITIAL_SHOW

  return (
    <div>
      {/* ヘッダー行 */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-stone-500 text-xs">
          SNS・サービスリンク
          <span className="ml-1.5 text-stone-700">{links.length}/{MAX_LINKS}</span>
        </p>
        {links.length < MAX_LINKS && (
          <button
            onClick={() => { setAdding((v) => !v); setUrl("") }}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-base transition-colors ${
              adding ? "bg-stone-700 text-stone-400" : "bg-stone-800 text-stone-400 hover:bg-stone-700"
            }`}
            aria-label="SNSリンクを追加"
          >
            {adding ? "×" : "+"}
          </button>
        )}
      </div>

      {/* 追加フォーム（+押したとき） */}
      {adding && (
        <div className="mb-3 space-y-2">
          <div className="flex gap-2">
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as typeof PLATFORMS[number])}

              className="bg-stone-800 text-stone-300 text-xs rounded-lg px-2 py-2 outline-none shrink-0"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              autoFocus
              className="flex-1 bg-stone-800 text-stone-300 text-xs rounded-lg px-3 py-2 outline-none placeholder:text-stone-600 min-w-0"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={isPending || !url.trim()}
            className="w-full py-2 bg-stone-200 text-stone-900 rounded-lg text-xs font-medium disabled:opacity-40"
          >
            {isPending ? "追加中..." : "追加する"}
          </button>
        </div>
      )}

      {/* 既存リンク一覧 */}
      {links.length > 0 && (
        <div className="space-y-2">
          {visible.map((link) => (
            <div key={link.id}>
              {editingId === link.id ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <PlatformBadge platform={link.platform} />
                    <input
                      type="url"
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      autoFocus
                      className="flex-1 bg-stone-800 text-stone-300 text-xs rounded-lg px-3 py-1.5 outline-none min-w-0"
                    />
                  </div>
                  <div className="flex gap-2 pl-[6.5rem]">
                    <button
                      onClick={() => setEditingId(null)}
                      disabled={isPending}
                      className="flex-1 py-1.5 bg-stone-800 text-stone-500 rounded-lg text-xs"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={() => handleUpdate(link.id)}
                      disabled={isPending || !editUrl.trim()}
                      className="flex-1 py-1.5 bg-stone-200 text-stone-900 rounded-lg text-xs font-medium disabled:opacity-40"
                    >
                      {isPending ? "保存中..." : "保存"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <PlatformBadge platform={link.platform} />
                  <span className="text-stone-400 text-xs flex-1 min-w-0 truncate">{link.url}</span>
                  <button
                    onClick={() => startEdit(link)}
                    disabled={isPending}
                    className="w-10 h-10 flex items-center justify-center text-stone-600 hover:text-stone-400 transition-colors shrink-0"
                  >
                    <PencilIcon />
                  </button>
                  <button
                    onClick={() => handleRemove(link.id)}
                    disabled={isPending}
                    className="text-stone-600 text-xs px-1 py-1 shrink-0 hover:text-red-400 transition-colors"
                  >
                    削除
                  </button>
                </div>
              )}
            </div>
          ))}
          {hasMore && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-stone-600 text-xs hover:text-stone-400 transition-colors"
            >
              {expanded ? "折りたたむ ↑" : `他 ${links.length - INITIAL_SHOW} 件を表示 ↓`}
            </button>
          )}
        </div>
      )}

      {links.length === 0 && !adding && (
        <p className="text-stone-700 text-xs">右上の + から追加できます</p>
      )}
    </div>
  )
}
