"use client"

interface Props {
  title: string
}

export default function ShareButton({ title }: Props) {
  function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title, url: window.location.href })
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <button
      onClick={handleShare}
      className="w-full py-4 bg-stone-800 text-stone-200 rounded-2xl text-sm active:scale-95 transition-transform"
    >
      URLをシェアする
    </button>
  )
}
