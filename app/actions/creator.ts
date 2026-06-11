"use server"

import { auth } from "@/auth"
import { prisma } from "@/app/lib/prisma"

interface CreatorForm {
  creatorName: string
  instagramId: string
  profileMessage: string
  slug: string
  isPublic: boolean
}

function validateName(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) return "名前を入力してください。"
  if ([...trimmed].length > 16) return "名前は16文字以内です。"
  if (/[\n\r]/.test(trimmed)) return "名前に改行は使えません。"
  if (/https?:\/\//i.test(trimmed)) return "名前にURLは使えません。"
  return null
}

function validateSlug(slug: string): string | null {
  if (slug.length < 4) return "IDは4文字以上です。"
  if (slug.length > 15) return "IDは15文字以内です。"
  if (!/^[a-z]/.test(slug)) return "IDは英字で始めてください。"
  if (slug.endsWith("_")) return "IDの末尾に_は使えません。"
  if (/__/.test(slug)) return "IDに__（連続アンダースコア）は使えません。"
  if (!/^[a-z0-9_]+$/.test(slug)) return "IDは英小文字・数字・_のみ使えます。"
  return null
}

export async function registerCreator(
  form: CreatorForm
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { error: "ログインが必要です。" }

  const { creatorName, instagramId, profileMessage, slug, isPublic } = form

  const nameError = validateName(creatorName)
  if (nameError) return { error: nameError }

  const slugError = validateSlug(slug)
  if (slugError) return { error: slugError }

  const existing = await prisma.creator.findUnique({ where: { slug } })
  if (existing) return { error: "そのIDはすでに使われています。" }

  const existingCreator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
  })
  if (existingCreator) return { error: "すでにクリエイター登録済みです。" }

  await prisma.creator.create({
    data: {
      userId: session.user.id,
      creatorName: creatorName.trim(),
      instagramId: instagramId.trim() || null,
      profileMessage: profileMessage.trim() || null,
      slug,
      eggs: {
        create: {
          eggNumber: 1,
          title: creatorName.trim() + "のたまご",
          isPublic,
        },
      },
    },
  })

  return {}
}
