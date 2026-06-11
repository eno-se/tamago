export type EggStateKey =
  | "INTACT"
  | "TINY_CRACK"
  | "THIN_CRACK"
  | "MORE_CRACKS"
  | "SHADOW"
  | "GLOW"
  | "SHAKE"
  | "SOUND"
  | "ALMOST"
  | "BROKEN"

export interface EggState {
  key: EggStateKey
  message: string
}

export function getEggState(tapCount: number): EggState {
  if (tapCount >= 1000000) return { key: "BROKEN", message: "卵が割れた。" }
  if (tapCount >= 900000)
    return { key: "ALMOST", message: "割れそうで、まだ割れない。" }
  if (tapCount >= 750000)
    return { key: "SOUND", message: "中から、かすかな音がする。" }
  if (tapCount >= 500000)
    return { key: "SHAKE", message: "卵が、ときどき小さく揺れる。" }
  if (tapCount >= 300000)
    return { key: "GLOW", message: "ひびの奥が、かすかに光っている。" }
  if (tapCount >= 100000)
    return { key: "SHADOW", message: "ひびの奥に、何かが見える気がする。" }
  if (tapCount >= 50000)
    return { key: "MORE_CRACKS", message: "ひびが、少しだけ増えている。" }
  if (tapCount >= 10000)
    return { key: "THIN_CRACK", message: "表面に、細いひびが入っている。" }
  if (tapCount >= 1000)
    return { key: "TINY_CRACK", message: "よく見ると、小さなひびがある。" }
  return { key: "INTACT", message: "まだ、静かにしている。" }
}

// JSTの今日の日付を返す (YYYY-MM-DD)
export function getJSTDateString(): string {
  const now = new Date()
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return jst.toISOString().split("T")[0]
}

// JSTの今日の日付をDateオブジェクトとして返す（DB保存用）
export function getJSTDate(): Date {
  const dateStr = getJSTDateString()
  return new Date(dateStr)
}
