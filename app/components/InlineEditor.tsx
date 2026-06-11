"use client"

import { useState, useTransition } from "react"

interface Props {
  initial: string
  onSave: (value: string) => Promise<{ error?: string }>
  maxLength?: number
  required?: boolean
  placeholder?: string
  displayClassName?: string
}

export default function InlineEditor({
  initial,
  onSave,
  maxLength = 50,
  required = false,
  placeholder = "",
  displayClassName = "text-stone-200",
}: Props) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initial)
  const [saved, setSaved] = useState(initial)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    if (required && !value.trim()) {
      setError("入力してください。")
      return
    }
    setError("")
    startTransition(async () => {
      const result = await onSave(value)
      if (result.error) {
        setError(result.error)
        return
      }
      setSaved(value)
      setEditing(false)
    })
  }

  function handleCancel() {
    setValue(saved)
    setError("")
    setEditing(false)
  }

  if (!editing) {
    return (
      <button
        type="button"
        className="w-full flex items-center justify-between gap-3 group rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500"
        onClick={() => setEditing(true)}
      >
        <span className={`${displayClassName} flex-1 text-left`}>
          {saved || <span className="text-stone-600">{placeholder}</span>}
        </span>
        <span className="w-10 h-10 flex items-center justify-center text-stone-600 group-hover:text-stone-400 transition-colors shrink-0">
          <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
            <path d="M9.5 2.5L11.5 4.5L4.5 11.5H2.5V9.5L9.5 2.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={maxLength}
        autoFocus
        placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-stone-800 text-stone-200 text-sm rounded-xl outline-none focus:ring-1 focus:ring-stone-500 placeholder:text-stone-600"
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <div className="flex gap-2">
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
