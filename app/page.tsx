import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const session = await auth()
  if (session?.user?.id) redirect("/dashboard")

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-6 text-stone-200">
      <div className="max-w-sm w-full text-center">
        <div className="mb-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/title-logo.png" alt="コツコツたまご" className="w-full mx-auto mb-4" />
          <p className="text-stone-400 leading-relaxed">
            推しのたまごを、1日1回だけコツコツできる。
            <br />
            何回で割れるか、何が出るかは分からない。
          </p>
        </div>

        <a
          href="/login"
          className="block w-full py-4 bg-stone-100 text-stone-950 rounded-2xl font-medium"
        >
          はじめる
        </a>
      </div>
    </div>
  )
}
