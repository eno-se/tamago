"use server"

import { auth, signOut } from "@/auth"
import { prisma } from "@/app/lib/prisma"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function updateProfileMessage(
  message: string
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { error: "ログインが必要です。" }

  if (message.length > 140) return { error: "140文字以内で入力してください。" }

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
  })
  if (!creator) return { error: "クリエイター登録が必要です。" }

  await prisma.creator.update({
    where: { userId: session.user.id },
    data: { profileMessage: message.trim() || null },
  })
  revalidatePath("/dashboard")
  revalidatePath(`/u/${creator.slug}`)
  return {}
}

export async function updateCreatorName(
  name: string
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { error: "ログインが必要です。" }

  const trimmed = name.trim()
  if (!trimmed) return { error: "名前を入力してください。" }
  if (trimmed.length > 30) return { error: "30文字以内で入力してください。" }

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
  })
  if (!creator) return { error: "クリエイター登録が必要です。" }

  await prisma.creator.update({
    where: { userId: session.user.id },
    data: { creatorName: trimmed },
  })
  revalidatePath("/dashboard")
  revalidatePath(`/u/${creator.slug}`)
  return {}
}

export async function updateEggTitle(
  eggId: string,
  title: string
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { error: "ログインが必要です。" }

  const trimmed = title.trim()
  if (!trimmed) return { error: "卵の名前を入力してください。" }
  if (trimmed.length > 50) return { error: "50文字以内で入力してください。" }

  const egg = await prisma.egg.findUnique({
    where: { id: eggId },
    include: { creator: true },
  })
  if (!egg || egg.creator.userId !== session.user.id) {
    return { error: "権限がありません。" }
  }

  await prisma.egg.update({
    where: { id: eggId },
    data: { title: trimmed },
  })
  revalidatePath("/dashboard")
  revalidatePath(`/u/${egg.creator.slug}`)
  return {}
}

export async function updateCreatorLink(
  url: string,
  label: string
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { error: "ログインが必要です。" }

  const trimmedUrl = url.trim()
  const trimmedLabel = label.trim()

  if (trimmedUrl && !/^https?:\/\/.+/.test(trimmedUrl)) {
    return { error: "URLは http:// または https:// から始めてください。" }
  }
  if (trimmedLabel.length > 30) return { error: "表示テキストは30文字以内で入力してください。" }

  const creator = await prisma.creator.findUnique({ where: { userId: session.user.id } })
  if (!creator) return { error: "クリエイター登録が必要です。" }

  await prisma.creator.update({
    where: { userId: session.user.id },
    data: {
      linkUrl: trimmedUrl || null,
      linkLabel: trimmedLabel || null,
    },
  })
  revalidatePath("/dashboard")
  revalidatePath(`/u/${creator.slug}`)
  return {}
}

export async function toggleEggPublic(
  eggId: string,
  isPublic: boolean
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { error: "ログインが必要です。" }

  const egg = await prisma.egg.findUnique({
    where: { id: eggId },
    include: { creator: true },
  })
  if (!egg || egg.creator.userId !== session.user.id) {
    return { error: "権限がありません。" }
  }

  await prisma.egg.update({
    where: { id: eggId },
    data: { isPublic },
  })
  revalidatePath("/dashboard")
  revalidatePath(`/u/${egg.creator.slug}`)
  return {}
}

export async function createNextEgg(): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { error: "ログインが必要です。" }

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
    include: { eggs: { orderBy: { eggNumber: "desc" }, take: 1 } },
  })
  if (!creator) return { error: "クリエイター登録が必要です。" }

  const activeEgg = await prisma.egg.findFirst({
    where: { creatorId: creator.id, status: "ACTIVE" },
  })
  if (activeEgg) return { error: "既にアクティブな卵があります。" }

  const lastEgg = creator.eggs[0]
  if (!lastEgg) return { error: "最初の卵はオンボーディングから作成してください。" }

  const newEgg = await prisma.egg.create({
    data: {
      creatorId: creator.id,
      eggNumber: lastEgg.eggNumber + 1,
      title: creator.creatorName + "のたまご",
      isPublic: false,
    },
  })

  // 前の卵のファン統計を引き継ぐ（累計・最長連続・歴代最速を継承、現在の連続はリセット）
  const prevStats = await prisma.fanEggStats.findMany({
    where: { eggId: lastEgg.id },
  })
  if (prevStats.length > 0) {
    await prisma.fanEggStats.createMany({
      data: prevStats.map((s) => ({
        eggId: newEgg.id,
        userId: s.userId,
        currentStreakDays: 0,
        maxStreakDays: s.maxStreakDays,
        totalTapDays: s.totalTapDays,
        firstTapCount: s.firstTapCount,
        lastTapDate: null,
      })),
      skipDuplicates: true,
    })
  }

  revalidatePath("/dashboard")
  return {}
}

export async function logout(redirectTo: string = "/"): Promise<void> {
  await signOut({ redirectTo })
}

export async function deleteAccount(): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) redirect("/")

  // R2アイコンを先に削除
  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
    select: { iconUrl: true },
  })
  if (creator?.iconUrl) {
    const { deleteIcon } = await import("@/app/lib/r2")
    try {
      const oldKey = new URL(creator.iconUrl).pathname.slice(1)
      await deleteIcon(oldKey)
    } catch {}
  }

  await prisma.user.delete({ where: { id: session.user.id } })

  // signOut は DB の session に依存するためカスケード削除後に失敗する。
  // 直接クッキーを削除して確実にログアウトさせる。
  const cookieStore = await cookies()
  cookieStore.delete("authjs.session-token")
  cookieStore.delete("__Secure-authjs.session-token")

  redirect("/login?deleted=1")
}
