import { signIn } from "@/auth"

interface Props {
  searchParams: Promise<{ callbackUrl?: string; deleted?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const { callbackUrl, deleted } = await searchParams
  const redirectTo = callbackUrl ?? "/dashboard"

  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="mb-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/title-logo.png" alt="コツコツたまご" className="w-full mx-auto mb-2" />
          {deleted ? (
            <p className="text-stone-400 text-sm bg-stone-900 rounded-xl px-4 py-3 mt-3">
              アカウントを削除しました。ご利用ありがとうございました。
            </p>
          ) : (
            <p className="text-stone-500 text-sm">
              ログインして、推しのたまごをコツコツしよう。
            </p>
          )}
        </div>

        <form
          action={async () => {
            "use server"
            await signIn("google", { redirectTo })
          }}
        >
          <button
            type="submit"
            className="w-full py-4 bg-white text-stone-900 rounded-2xl font-medium flex items-center justify-center gap-3 active:scale-95 transition-transform"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Googleでログイン
          </button>
        </form>

        <p className="text-stone-700 text-xs mt-8 leading-relaxed">
          ログインすると、1日1回だけコツコツできます。
        </p>

        {process.env.NODE_ENV === "development" && (
          <div className="mt-10 pt-6 border-t border-stone-800">
            <p className="text-stone-600 text-xs mb-3">開発用ログイン</p>
            <form method="POST" action="/api/dev-signin" className="space-y-2">
              <input type="hidden" name="redirectTo" value={redirectTo} />
              <input
                name="email"
                type="email"
                placeholder="test@example.com"
                required
                className="w-full px-4 py-3 bg-stone-900 text-stone-300 rounded-xl text-sm outline-none focus:ring-1 focus:ring-stone-600 placeholder:text-stone-700"
              />
              <button
                type="submit"
                className="w-full py-3 bg-stone-800 text-stone-400 rounded-xl text-sm hover:bg-stone-700 transition-colors"
              >
                このメールでログイン
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
