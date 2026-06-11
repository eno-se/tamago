"use client"

import { useState, useTransition } from "react"
import { updateProfileMessage } from "@/app/actions/dashboard"

const MAX_LENGTH = 140

export default function ProfileMessageEditor({ initial }: { initial: string | null }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initial ?? "")
  const [saved, setSaved] = useState(initial ?? "")
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      await updateProfileMessage(value)
      setSaved(value)
      setEditing(false)
    })
  }

  if (!editing) {
    return (
      <button
        type="button"
        className="w-full flex items-start justify-between gap-3 group rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500"
        onClick={() => setEditing(true)}
      >
        <div className="flex-1 text-left min-w-0">
          <span className="text-stone-300 text-sm leading-relaxed">
            {saved || (
              <span className="text-stone-600">一言を入力してください（宣伝文など）</span>
            )}
          </span>
          {saved && (
            <p className="text-stone-700 text-xs mt-1">{saved.length}/{MAX_LENGTH}</p>
          )}
        </div>
        <span className="w-10 h-10 flex items-center justify-center text-stone-600 group-hover:text-stone-400 transition-colors shrink-0">
          <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
            <path d="M9.5 2.5L11.5 4.5L4.5 11.5H2.5V9.5L9.5 2.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </button>
    )
  }

  const remaining = MAX_LENGTH - value.length

  return (
    <div className="space-y-3">
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={MAX_LENGTH}
          rows={3}
          autoFocus
          placeholder="宣伝用の一言（たまごページに表示されます）"
          className="w-full px-3 py-2.5 bg-stone-800 text-stone-200 text-sm rounded-xl outline-none focus:ring-1 focus:ring-stone-500 placeholder:text-stone-600 resize-none"
        />
        <span className={`absolute bottom-2 right-3 text-xs ${remaining <= 20 ? "text-amber-400" : "text-stone-600"}`}>
          {remaining}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => { setValue(saved); setEditing(false) }}
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
