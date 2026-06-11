"use client"

import { useState } from "react"

export default function CopyUrlButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="text-xs text-stone-400 bg-stone-800 hover:bg-stone-700 px-3 py-1.5 rounded-lg transition-colors shrink-0"
    >
      {copied ? "コピー済み ✓" : "URLコピー"}
    </button>
  )
}
