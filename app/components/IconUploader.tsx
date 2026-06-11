"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  currentIconUrl: string | null
  creatorName: string
}

interface CropState {
  imgSrc: string
  imgEl: HTMLImageElement
  displayW: number
  displayH: number
  offsetX: number
  offsetY: number
}

const PREVIEW = 240

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

export default function IconUploader({ currentIconUrl, creatorName }: Props) {
  const [preview, setPreview] = useState<string | null>(currentIconUrl)
  const [crop, setCrop] = useState<CropState | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const dragRef = useRef<{ sx: number; sy: number; sox: number; soy: number } | null>(null)
  const router = useRouter()

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError("")
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.max(PREVIEW / img.width, PREVIEW / img.height)
      const displayW = img.width * scale
      const displayH = img.height * scale
      setCrop({
        imgSrc: url,
        imgEl: img,
        displayW,
        displayH,
        offsetX: (PREVIEW - displayW) / 2,
        offsetY: (PREVIEW - displayH) / 2,
      })
    }
    img.src = url
    if (inputRef.current) inputRef.current.value = ""
  }

  function bounds(c: CropState) {
    return { minX: PREVIEW - c.displayW, maxX: 0, minY: PREVIEW - c.displayH, maxY: 0 }
  }

  function move(dx: number, dy: number) {
    setCrop((c) => {
      if (!c || !dragRef.current) return c
      const b = bounds(c)
      return {
        ...c,
        offsetX: clamp(dragRef.current.sox + dx, b.minX, b.maxX),
        offsetY: clamp(dragRef.current.soy + dy, b.minY, b.maxY),
      }
    })
  }

  // マウス
  function onMouseDown(e: React.MouseEvent) {
    if (!crop) return
    dragRef.current = { sx: e.clientX, sy: e.clientY, sox: crop.offsetX, soy: crop.offsetY }
    e.preventDefault()
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragRef.current) return
    move(e.clientX - dragRef.current.sx, e.clientY - dragRef.current.sy)
  }
  function onDragEnd() { dragRef.current = null }

  // タッチ
  function onTouchStart(e: React.TouchEvent) {
    if (!crop) return
    const t = e.touches[0]
    dragRef.current = { sx: t.clientX, sy: t.clientY, sox: crop.offsetX, soy: crop.offsetY }
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!dragRef.current) return
    const t = e.touches[0]
    move(t.clientX - dragRef.current.sx, t.clientY - dragRef.current.sy)
    e.preventDefault()
  }

  async function handleConfirm() {
    if (!crop) return
    setUploading(true)
    setError("")
    try {
      const canvas = document.createElement("canvas")
      canvas.width = 80
      canvas.height = 80
      const ctx = canvas.getContext("2d")!
      const scale = crop.displayW / crop.imgEl.width
      ctx.drawImage(
        crop.imgEl,
        -crop.offsetX / scale,
        -crop.offsetY / scale,
        PREVIEW / scale,
        PREVIEW / scale,
        0, 0, 80, 80
      )
      const blob = await new Promise<Blob>((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error("変換失敗"))), "image/jpeg", 0.5)
      )
      setPreview(URL.createObjectURL(blob))
      setCrop(null)

      const form = new FormData()
      form.append("icon", blob, "icon.jpg")
      const r = await fetch("/api/upload/icon", { method: "POST", body: form })
      const json = await r.json()
      if (!r.ok) throw new Error(json.error ?? "アップロード失敗")

      // サーバーから返った新URLをプレビューに反映（ブラウザキャッシュ回避）
      setPreview(json.url)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました")
    } finally {
      setUploading(false)
    }
  }

  function handleCancel() {
    if (crop) URL.revokeObjectURL(crop.imgSrc)
    setCrop(null)
  }

  // クロップUI
  if (crop) {
    return (
      <div className="space-y-3">
        <p className="text-stone-500 text-xs">ドラッグして位置を調整してください</p>
        <div
          className="rounded-full overflow-hidden cursor-grab active:cursor-grabbing mx-auto"
          style={{ width: PREVIEW, height: PREVIEW, position: "relative", touchAction: "none" }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onDragEnd}
          onMouseLeave={onDragEnd}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onDragEnd}
        >
          <img
            src={crop.imgSrc}
            draggable={false}
            style={{
              position: "absolute",
              width: crop.displayW,
              height: crop.displayH,
              left: crop.offsetX,
              top: crop.offsetY,
              pointerEvents: "none",
              userSelect: "none",
            }}
            alt=""
          />
        </div>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <div className="flex gap-2">
          <button onClick={handleCancel} className="flex-1 py-2 bg-stone-800 text-stone-500 rounded-xl text-sm">
            キャンセル
          </button>
          <button
            onClick={handleConfirm}
            disabled={uploading}
            className="flex-1 py-2 bg-stone-200 text-stone-900 rounded-xl text-sm font-medium disabled:opacity-50"
          >
            {uploading ? "アップロード中..." : "確定する"}
          </button>
        </div>
      </div>
    )
  }

  // 通常表示
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="relative shrink-0 group"
      >
        {preview ? (
          <img src={preview} alt={creatorName} className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-stone-700 flex items-center justify-center text-stone-400 text-xl">
            {creatorName[0]}
          </div>
        )}
        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-white text-xs">変更</span>
        </div>
      </button>
      <p className="text-xs text-stone-500">タップして変更</p>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}
