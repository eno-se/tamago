import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/app/lib/prisma"
import OnboardingForm from "./OnboardingForm"

export default async function OnboardingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login?callbackUrl=/onboarding")

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (creator) redirect("/dashboard")

  return <OnboardingForm />
}
