"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { registerCreator } from "@/app/actions/creator"

export default function OnboardingPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [form, setForm] = useState({ creatorName: "", slug: "" })
  const [isPublic, setIsPublic] = useState<boolean | null>(null)

  function handleNameChange(value: string) {
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 15)
    setForm((prev) => ({ ...prev, creatorName: value, slug }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.creatorName.trim()) {
      setError("名前を入力してください。")
      return
    }
    if (!form.slug || form.slug.length < 2) {
      setError("URLスラッグは英小文字・数字で2文字以上必要です。")
      return
    }
    if (isPublic === null) {
      setError("たまごを公開するかどうかを選択してください。")
      return
    }
    setError("")
    startTransition(async () => {
      const result = await registerCreator({
        creatorName: form.creatorName,
        instagramId: "",
        profileMessage: "",
        slug: form.slug,
        isPublic,
      })
      if (result.error) {
        setError(result.error)
        return
      }
      router.push("/dashboard")
    })
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 flex flex-col items-center justify-center p-6">
      <div className="max-w-sm w-full">
        <div className="mb-10 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/title-logo.png" alt="コツコツたまご" className="h-32 w-auto mx-auto mb-3" />
          <p className="text-stone-500 text-sm">
            自分のたまごを作って、ファンにコツコツしてもらおう。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-stone-500 text-xs mb-1 block">
              あなたの名前 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.creatorName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="例：たいが"
              maxLength={16}
              className="w-full px-4 py-3 bg-stone-900 rounded-xl outline-none focus:ring-1 focus:ring-stone-600 placeholder:text-stone-700"
            />
          </div>

          <div>
            <label className="text-stone-500 text-xs mb-1 block">
              ID <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-stone-600 text-sm">/u/</span>
              <input
                type="text"
                value={form.slug}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    slug: e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9_]/g, "")
                      .slice(0, 15),
                  }))
                }
                placeholder="taiga"
                className="flex-1 px-4 py-3 bg-stone-900 rounded-xl outline-none focus:ring-1 focus:ring-stone-600 placeholder:text-stone-700"
              />
            </div>
            <p className="text-stone-600 text-xs mt-1">英数字と_のみ（4〜15文字）。</p>
            <p className="text-amber-600/80 text-xs mt-1">
              これがあなたの固有IDになります。登録後は変更できません。
            </p>
          </div>

          {/* 公開設定（選択必須） */}
          <div>
            <p className="text-stone-500 text-xs mb-2">
              たまごの公開設定 <span className="text-red-400">*</span>
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`w-full px-4 py-3.5 rounded-xl text-left transition-colors border ${
                  isPublic === true
                    ? "bg-amber-500/10 border-amber-500 text-amber-400"
                    : "bg-stone-900 border-stone-900 text-stone-300"
                }`}
              >
                <p className="text-sm font-medium">公開する</p>
                <p className="text-xs text-stone-500 mt-0.5">URLを知っている人がコツコツできます</p>
              </button>
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`w-full px-4 py-3.5 rounded-xl text-left transition-colors border ${
                  isPublic === false
                    ? "bg-stone-700/50 border-stone-500 text-stone-200"
                    : "bg-stone-900 border-stone-900 text-stone-300"
                }`}
              >
                <p className="text-sm font-medium">非公開にする</p>
                <p className="text-xs text-stone-500 mt-0.5">自分だけ見られます。あとから公開できます。</p>
              </button>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-4 bg-stone-100 text-stone-950 rounded-2xl font-medium disabled:opacity-40 active:scale-95 transition-transform mt-2"
          >
            {isPending ? "作成中..." : "たまごを作る"}
          </button>
        </form>
      </div>
    </div>
  )
}
