export default function TopHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-center py-1 border-b border-white/[0.06]" style={{ background: "rgba(10,9,8,0.5)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="コツコツたまご" className="h-full w-auto" />
    </header>
  )
}
