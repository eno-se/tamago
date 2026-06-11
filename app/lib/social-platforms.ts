export const PLATFORMS = [
  "X",
  "Instagram",
  "TikTok",
  "YouTube",
  "Twitch",
  "SHOWROOM",
  "17LIVE",
  "Pococha",
  "note",
  "Threads",
  "BOOTH",
  "lit.link",
  "公式サイト",
] as const

export type Platform = (typeof PLATFORMS)[number]
