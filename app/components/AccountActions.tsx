"use client"

import { useState } from "react"
import { deleteAccount } from "@/app/actions/dashboard"

interface Props {
  logoutAction: () => Promise<void>
}

export default function AccountActions({ logoutAction }: Props) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  return (
    <div className="space-y-3 pb-12">
      {/* ログアウト */}
      <form action={logoutAction}>
        <button
          type="submit"
          className="w-full py-3 bg-stone-900 text-stone-400 rounded-2xl text-sm"
        >
          ログアウト
        </button>
      </form>

      {/* データ削除 */}
      {!showDeleteConfirm ? (
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full py-3 text-stone-700 text-sm"
        >
          アカウントを削除する
        </button>
      ) : (
        <div className="bg-stone-900 rounded-2xl p-4">
          <p className="text-stone-300 text-sm text-center mb-1">
            本当に削除しますか？
          </p>
          <p className="text-stone-600 text-xs text-center mb-5">
            アカウント・コツコツ履歴・作成したたまごがすべて削除されます。
            <br />
            この操作は取り消せません。
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 py-2.5 bg-stone-800 text-stone-400 rounded-xl text-sm"
            >
              キャンセル
            </button>
            <form action={deleteAccount} className="flex-1">
              <button
                type="submit"
                className="w-full py-2.5 bg-red-950 text-red-400 rounded-xl text-sm"
              >
                削除する
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
