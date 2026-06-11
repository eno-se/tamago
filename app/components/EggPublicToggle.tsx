"use client"

import { useTransition } from "react"
import { toggleEggPublic } from "@/app/actions/dashboard"

interface Props {
  eggId: string
  isPublic: boolean
}

export default function EggPublicToggle({ eggId, isPublic }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(async () => {
      await toggleEggPublic(eggId, !isPublic)
    })
  }

  return (
    <div className="glass-card flex items-center justify-between py-3 px-4 rounded-2xl">
      <div>
        <p className="text-stone-300 text-sm">たまごを公開する</p>
        <p className="text-stone-600 text-xs mt-0.5">
          {isPublic ? "URLを知っている人がコツコツできます" : "自分だけ見られます"}
        </p>
      </div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className={`w-12 h-6 rounded-full transition-colors relative disabled:opacity-50 ${
          isPublic ? "bg-amber-500" : "bg-stone-700"
        }`}
        aria-label={isPublic ? "公開中" : "非公開"}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
            isPublic ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  )
}
