interface SocialLinkItem {
  id: string
  platform: string
  url: string
}

interface Props {
  links: SocialLinkItem[]
}

const PLATFORM_META: Record<string, { icon: string; color: string }> = {
  "X":          { icon: "/sns/x.png",         color: "rgba(0,0,0,0.25)" },
  "Instagram":  { icon: "/sns/instagram.png",  color: "rgba(225,48,108,0.15)" },
  "TikTok":     { icon: "/sns/tiktok.png",     color: "rgba(1,1,1,0.25)" },
  "YouTube":    { icon: "/sns/youtube.png",    color: "rgba(255,0,0,0.15)" },
  "Twitch":     { icon: "/sns/twitch.png",     color: "rgba(145,71,255,0.15)" },
  "SHOWROOM":   { icon: "/sns/showroom.png",   color: "rgba(228,0,127,0.15)" },
  "17LIVE":     { icon: "/sns/17live.png",     color: "rgba(249,115,22,0.15)" },
  "Pococha":    { icon: "/sns/pococha.png",    color: "rgba(236,72,153,0.15)" },
  "note":       { icon: "/sns/note.png",       color: "rgba(65,201,180,0.15)" },
  "Threads":    { icon: "/sns/threads.png",    color: "rgba(16,16,16,0.25)" },
  "BOOTH":      { icon: "/sns/booth.png",      color: "rgba(228,0,30,0.15)" },
  "lit.link":   { icon: "/sns/litlink.png",    color: "rgba(245,158,11,0.15)" },
  "公式サイト": { icon: "/sns/website.png",    color: "rgba(71,85,105,0.15)" },
}

export default function SocialLinks({ links }: Props) {
  if (links.length === 0) return null

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="flex flex-wrap justify-center gap-3">
        {links.map((link) => {
          const meta = PLATFORM_META[link.platform]
          const icon = meta?.icon
          const color = meta?.color ?? "rgba(255,255,255,0.08)"
          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-14 h-14 flex items-center justify-center rounded-2xl transition-opacity hover:opacity-80 active:opacity-50"
              style={{ background: color, border: "1px solid rgba(255,255,255,0.10)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
              title={link.platform}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={icon} alt={link.platform} className="w-8 h-8 object-contain" />
            </a>
          )
        })}
      </div>
    </div>
  )
}
