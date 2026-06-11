import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/app/lib/prisma"
import { uploadIcon, deleteIcon } from "@/app/lib/r2"

const MAX_BYTES = 200 * 1024

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 })
  }
  const userId = session.user.id

  const formData = await req.formData()
  const file = formData.get("icon") as File | null
  if (!file) return NextResponse.json({ error: "ファイルがありません。" }, { status: 400 })

  const bytes = await file.arrayBuffer()
  if (bytes.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "ファイルサイズが大きすぎます。" }, { status: 400 })
  }

  const creator = await prisma.creator.findUnique({
    where: { userId },
    select: { id: true, slug: true, iconUrl: true },
  })
  if (!creator) return NextResponse.json({ error: "クリエイターが見つかりません。" }, { status: 404 })

  // 旧アイコンをR2から完全削除（URLのパス部分をキーとして使用）
  if (creator.iconUrl) {
    try {
      const oldKey = new URL(creator.iconUrl).pathname.slice(1)
      await deleteIcon(oldKey)
    } catch {}
  }

  // タイムスタンプ付きキーでURLが毎回変わりブラウザキャッシュを防ぐ
  const key = `icons/icon_${creator.id}_${Date.now()}.jpg`
  const url = await uploadIcon(key, Buffer.from(bytes))

  await prisma.creator.update({
    where: { userId },
    data: { iconUrl: url },
  })

  return NextResponse.json({ url })
}
