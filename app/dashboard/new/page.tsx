"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { registerCreator } from "@/app/actions/creator"

export default function NewCreatorPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    creatorName: "",
    instagramId: "",
    profileMessage: "",
    slug: "",
  })

  function handleChange(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (key === "creatorName") {
      setForm((prev) => ({
        ...prev,
        creatorName: value,
        slug: value
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, "")
          .slice(0, 15),
      }))
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.creatorName || !form.slug) {
      setError("表示名・URLスラッグは必須です。")
      return
    }
    setError("")
    startTransition(async () => {
      const result = await registerCreator({ ...form, isPublic: false })
      if (result.error) {
        setError(result.error)
        return
      }
      router.push("/dashboard")
    })
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 p-6">
      <div className="max-w-sm mx-auto pt-8">
        <h1 className="text-xl mb-8">クリエイター登録</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-stone-500 text-xs mb-1 block">
              表示名 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.creatorName}
              onChange={(e) => handleChange("creatorName", e.target.value)}
              placeholder="例：たいが"
              maxLength={16}
              className="w-full px-4 py-3 bg-stone-900 rounded-xl outline-none focus:ring-1 focus:ring-stone-600 placeholder:text-stone-700"
            />
          </div>

          <div>
            <label className="text-stone-500 text-xs mb-1 block">
              URLスラッグ <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-stone-600 text-sm">/u/</span>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => handleChange("slug", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 15))}
                placeholder="taiga"
                className="flex-1 px-4 py-3 bg-stone-900 rounded-xl outline-none focus:ring-1 focus:ring-stone-600 placeholder:text-stone-700"
              />
            </div>
            <p className="text-stone-600 text-xs mt-1">
              英数字とハイフンのみ。InstagramリンクはこのURLです。
            </p>
          </div>

          <div>
            <label className="text-stone-500 text-xs mb-1 block">
              Instagram ID（任意）
            </label>
            <input
              type="text"
              value={form.instagramId}
              onChange={(e) => handleChange("instagramId", e.target.value.replace("@", ""))}
              placeholder="例：taiga_official"
              className="w-full px-4 py-3 bg-stone-900 rounded-xl outline-none focus:ring-1 focus:ring-stone-600 placeholder:text-stone-700"
            />
          </div>

          <div>
            <label className="text-stone-500 text-xs mb-1 block">
              ファンへのメッセージ（任意）
            </label>
            <input
              type="text"
              value={form.profileMessage}
              onChange={(e) => handleChange("profileMessage", e.target.value)}
              placeholder="例：今日も1回だけ叩けます"
              maxLength={50}
              className="w-full px-4 py-3 bg-stone-900 rounded-xl outline-none focus:ring-1 focus:ring-stone-600 placeholder:text-stone-700"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-4 bg-stone-100 text-stone-950 rounded-2xl font-medium disabled:opacity-40 active:scale-95 transition-transform"
          >
            {isPending ? "登録中..." : "登録してたまごを作る"}
          </button>
        </form>
      </div>
    </div>
  )
}
