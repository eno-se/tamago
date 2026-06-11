import type { EggStateKey } from "@/app/lib/egg-state"

interface Props {
  stateKey: EggStateKey
  pct?: number   // currentTapCount / 1_000_000 (0–1)
  className?: string
}

function ramp(p: number, lo: number, hi: number): number {
  return Math.min(1, Math.max(0, (p - lo) / (hi - lo)))
}

function getDrift(i: number) {
  const a1 = (i * 67 + 30) % 360
  const a2 = (i * 113 + 150) % 360
  const d  = 8 + (i % 5) * 4
  const dur = 2.5 + (i * 1.1) % 3.5
  const toRad = (deg: number) => deg * Math.PI / 180
  const dx1 = (Math.cos(toRad(a1)) * d).toFixed(1)
  const dy1 = (Math.sin(toRad(a1)) * d).toFixed(1)
  const dx2 = (Math.cos(toRad(a2)) * d * 0.55).toFixed(1)
  const dy2 = (Math.sin(toRad(a2)) * d * 0.55).toFixed(1)
  return { move: `0 0; ${dx1} ${dy1}; ${dx2} ${dy2}; 0 0`, dur: dur.toFixed(1), opDur: (dur * 0.72).toFixed(1) }
}

export default function EggSvg({ stateKey, pct, className = "" }: Props) {
  const isBroken  = stateKey === "BROKEN"
  const showGlow  = ["GLOW","SHAKE","SOUND","ALMOST"].includes(stateKey)
  const p = pct ?? 0

  // pct が渡されていれば滑らかにグラデーション、なければ stateKey で判定
  const shakeIntensity = p > 0 ? ramp(p, 0.5, 1.0) : (["SHAKE","SOUND","ALMOST"].includes(stateKey) ? 1.0 : 0)
  const isShaking = shakeIntensity > 0
  // 素数比の2アニメーション（0.41s : 0.67s ≈ 黄金比）を重ねる
  // intensity 0→1 で 4倍速→1倍速
  const scale = 4 - shakeIntensity * 3
  const durX = (0.41 * scale).toFixed(2)
  const durR = (0.67 * scale).toFixed(2)
  const floatAnim  = isShaking
    ? `eggShakeX ${durX}s ease-in-out infinite, eggShakeR ${durR}s ease-in-out infinite`
    : "eggFloat 4s ease-in-out infinite"
  const groundAnim = isShaking
    ? `eggShakeX ${durX}s ease-in-out infinite`
    : "eggShadowFloat 4s ease-in-out infinite"

  if (isBroken) {
    return (
      <svg viewBox="0 0 120 160" className={className} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="brokenGrad" cx="35" cy="45" r="75" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#ffe8a0" />
            <stop offset="40%"  stopColor="#d4902a" />
            <stop offset="100%" stopColor="#6a3500" />
          </radialGradient>
        </defs>
        <path d="M60 30 Q20 50 18 88 Q18 130 60 140 Z" fill="url(#brokenGrad)" stroke="#a06020" strokeWidth="0.4" transform="rotate(-15,60,88)" />
        <path d="M60 30 Q100 50 102 88 Q102 130 60 140 Z" fill="url(#brokenGrad)" stroke="#a06020" strokeWidth="0.4" transform="rotate(15,60,88)" />
      </svg>
    )
  }

  const bokeh: [number, number, number, number][] = [
    [24, 32,  1.4, 0.70], [168, 24, 1.0, 0.55], [44, 210, 1.2, 0.60],
    [178, 190, 1.5, 0.65], [18, 118, 0.8, 0.45], [185, 105, 1.0, 0.50],
    [96,  18,  1.8, 0.80], [145, 228, 1.0, 0.40], [52, 52,  0.7, 0.38],
    [158, 65,  1.3, 0.60], [30, 170, 1.0, 0.48], [172, 148, 0.8, 0.42],
    [78, 242,  1.5, 0.62], [116,  15, 0.9, 0.52], [14, 78,  1.1, 0.50],
    [135, 12,  0.7, 0.38], [60, 238, 0.9, 0.42], [188, 58,  0.7, 0.35],
  ]

  return (
    <div className={`relative ${className}`}>

      {/* ボケパーティクル */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 192 256"
        preserveAspectRatio="xMidYMid slice" style={{ zIndex: 0 }}>
        {bokeh.map(([cx, cy, r, op], i) => {
          const { move, dur, opDur } = getDrift(i)
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill={`rgba(255,210,80,${op})`}>
              <animateTransform attributeName="transform" type="translate"
                values={move} dur={`${dur}s`} repeatCount="indefinite" calcMode="linear" />
              <animate attributeName="opacity" values={`${op};${(op * 0.35).toFixed(2)};${op}`}
                dur={`${opDur}s`} repeatCount="indefinite" />
            </circle>
          )
        })}
      </svg>

      {/* 背面の環境グロー */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse at 50% 54%, rgba(255,160,20,0.14) 0%, rgba(220,100,0,0.05) 70%, transparent 100%)",
        filter: "blur(80px)", zIndex: 1,
        opacity: 0.4 + ramp(p, 0, 1.0) * 0.6,
      }} />

      {/* 地面のゴールドグロー */}
      <div className="absolute pointer-events-none" style={{
        bottom: "0%", left: "50%", transform: "translateX(-50%)", width: "150%", height: "22%", zIndex: 2,
        opacity: 0.4 + ramp(p, 0, 1.0) * 0.6,
      }}>
        <div style={{
          width: "100%", height: "100%", borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(255,185,40,0.32) 0%, rgba(240,130,0,0.10) 60%, transparent 85%)",
          filter: "blur(35px)", animation: groundAnim,
        }} />
      </div>

      {/* 卵本体ラッパー */}
      <div className="absolute pointer-events-none" style={{
        top: "1%", left: "10%", width: "80%", height: "84%", animation: floatAnim, zIndex: 3,
      }}>
        {/* オーラ */}
        <div style={{
          position: "absolute", inset: "-60%", borderRadius: "50%",
          background: "radial-gradient(ellipse at 50% 54%, rgba(255,255,230,0.18) 0%, rgba(255,200,80,0.07) 55%, transparent 82%)",
          filter: "blur(60px)", pointerEvents: "none",
          opacity: 0.4 + ramp(p, 0, 1.0) * 0.6,
        }} />

        {/* 卵シェイプ */}
        <div style={{
          position: "relative", width: "100%", height: "100%",
          borderRadius: "80% 80% 80% 80% / 100% 100% 65% 65%",
          background: `
            radial-gradient(circle at 32% 22%,
              rgba(255,255,255,0.98)  0%,
              rgba(255,248,200,0.90)  8%,
              rgba(255,225,110,0.48) 20%,
              transparent            35%
            ),
            radial-gradient(ellipse at 46% 44%,
              #fff8cc  0%,
              #f5c840 18%,
              #cc8018 48%,
              #854808 76%,
              #361600 100%
            )
          `,
          boxShadow: `
            inset -16px -24px 34px rgba(20,6,0,0.65),
            inset  12px  14px 26px rgba(255,240,140,0.60),
            inset   2px  -5px 14px rgba(255,210,60,0.35),
            0 0 ${18 + ramp(p, 0, 1.0) * 24}px rgba(255,255,255,${(0.40 + ramp(p, 0, 1.0) * 0.35).toFixed(2)}),
            0 0 ${60 + ramp(p, 0, 1.0) * 60}px rgba(255,248,220,${(0.15 + ramp(p, 0, 1.0) * 0.20).toFixed(2)}),
            0 16px 60px rgba(100,40,0,0.25)
          `,
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", inset: 0, borderRadius: "inherit",
            backgroundImage: `
              radial-gradient(circle at 22% 38%, rgba(255,255,255,0.18) 0 1px, transparent 2px),
              radial-gradient(circle at 68% 28%, rgba(80,35,0,0.18)     0 1px, transparent 2px),
              radial-gradient(circle at 58% 68%, rgba(255,255,255,0.12) 0 1px, transparent 2px),
              radial-gradient(circle at 38% 82%, rgba(60,22,0,0.15)     0 1px, transparent 2px)
            `,
            backgroundSize: "26px 26px, 34px 34px, 22px 22px, 38px 38px",
            opacity: 0.38, mixBlendMode: "overlay", pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", left: "8%", right: "5%", bottom: "-2%", height: "38%",
            borderRadius: "50%",
            background: "radial-gradient(ellipse at center, rgba(20,6,0,0.58) 0%, rgba(50,18,0,0.30) 42%, transparent 75%)",
            filter: "blur(5px)", pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", top: "10%", left: "16%", width: "30%", height: "36%",
            borderRadius: "50%",
            background: "linear-gradient(145deg, rgba(255,255,255,0.92), rgba(255,252,210,0.60) 35%, transparent 75%)",
            filter: "blur(3px)", transform: "rotate(14deg)", pointerEvents: "none",
          }} />

          {showGlow && (
            <div style={{
              position: "absolute", inset: 0, borderRadius: "inherit",
              background: "radial-gradient(circle at 50% 52%, rgba(255,210,60,0.60) 0%, rgba(255,170,20,0.24) 52%, transparent 78%)",
              animation: "eggGlowPulse 1.5s ease-in-out infinite",
              pointerEvents: "none",
            }} />
          )}

          {/* ひび画像オーバーレイ */}
          {p > 0.001 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/crack${Math.min(10, Math.ceil(p * 10))}.png`}
              alt=""
              style={{
                position: "absolute", inset: 0, width: "100%", height: "100%",
                objectFit: "cover",
                mixBlendMode: "multiply",
                opacity: ramp(p, 0.001, 0.05),
                pointerEvents: "none",
              }}
            />
          )}

        </div>


      </div>
    </div>
  )
}
