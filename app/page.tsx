import Link from 'next/link'

export default function Home() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'var(--background)' }}
    >
      <div className="text-center animate-fadein">
        <h1
          className="font-display font-light mb-14"
          style={{
            color: '#ffffff',
            fontSize: 'clamp(4rem, 12vw, 8rem)',
            letterSpacing: '0.06em',
            lineHeight: 1.1,
          }}
        >
          <span className="block">다이닝</span>
          <span className="block">맑음</span>
        </h1>

        <div
          className="w-14 border-t mx-auto mb-14"
          style={{ borderColor: 'var(--color-gold-dim)' }}
        />

        <Link
          href="/book"
          className="px-12 py-3.5 text-xs tracking-[0.25em] uppercase font-semibold transition-opacity hover:opacity-80"
          style={{ background: 'var(--color-gold)', color: '#0a0908' }}
        >
          예약하기
        </Link>
      </div>
    </main>
  )
}
