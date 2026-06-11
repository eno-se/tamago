"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { createNextEgg } from "@/app/actions/dashboard"

export default function NextEggButton() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleCreate() {
    startTransition(async () => {
      const result = await createNextEgg()
      if (!result.error) {
        router.refresh()
      }
    })
  }

  return (
    <button
      onClick={handleCreate}
      disabled={isPending}
      className="w-full py-4 bg-amber-500 text-stone-950 rounded-2xl font-medium disabled:opacity-50 active:scale-95 transition-transform"
    >
      {isPending ? "作成中..." : "次のたまごを作る"}
    </button>
  )
}
