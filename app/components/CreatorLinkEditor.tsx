"use client"

import { useState, useTransition } from "react"
import { updateCreatorLink } from "@/app/actions/dashboard"

interface Props {
  initialUrl: string | null
  initialLabel: string | null
}

export default function CreatorLinkEditor({ initialUrl, initialLabel }: Props) {
  const [editing, setEditing] = useState(false)
  const [url, setUrl] = useState(initialUrl ?? "")
  const [label, setLabel] = useState(initialLabel ?? "")
  const [savedUrl, setSavedUrl] = useState(initialUrl ?? "")
  const [savedLabel, setSavedLabel] = useState(initialLabel ?? "")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    setError("")
    startTransition(async () => {
      const result = await updateCreatorLink(url, label)
      if (result.error) {
        setError(result.error)
        return
      }
      setSavedUrl(url)
      setSavedLabel(label)
      setEditing(false)
    })
  }

  function handleCancel() {
    setUrl(savedUrl)
    setLabel(savedLabel)
    setError("")
    setEditing(false)
  }

  if (!editing) {
    return (
      <div
        role="button"
        tabIndex={0}
        className="flex items-start justify-between gap-3 cursor-pointer group rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500"
        onClick={() => setEditing(true)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setEditing(true) } }}
      >
        <div className="flex-1 min-w-0">
          {savedUrl ? (
            <div>
              <p className="text-stone-400 text-sm truncate">{savedLabel || savedUrl}</p>
              <p className="text-stone-600 text-xs truncate">{savedUrl}</p>
            </div>
          ) : (
            <p className="text-stone-600 text-sm">リンクを設定する</p>
          )}
        </div>
        <span className="w-10 h-10 flex items-center justify-center text-stone-600 group-hover:text-stone-400 transition-colors shrink-0">
          <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
            <path d="M9.5 2.5L11.5 4.5L4.5 11.5H2.5V9.5L9.5 2.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div>
        <p className="text-stone-500 text-xs mb-1">URL</p>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          autoFocus
          className="w-full px-3 py-2 bg-stone-800 text-stone-200 text-sm rounded-xl outline-none focus:ring-1 focus:ring-stone-500 placeholder:text-stone-600"
        />
      </div>
      <div>
        <p className="text-stone-500 text-xs mb-1">表示テキスト（省略可）</p>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          maxLength={30}
          placeholder="例：インスタはこちら"
          className="w-full px-3 py-2 bg-stone-800 text-stone-200 text-sm rounded-xl outline-none focus:ring-1 focus:ring-stone-500 placeholder:text-stone-600"
        />
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="flex-1 py-2 bg-stone-800 text-stone-500 rounded-xl text-sm"
        >
          キャンセル
        </button>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex-1 py-2 bg-stone-200 text-stone-900 rounded-xl text-sm font-medium"
        >
          {isPending ? "保存中..." : "保存する"}
        </button>
      </div>
    </div>
  )
}
