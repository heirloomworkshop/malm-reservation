import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'var(--background)' }}
    >
      <div className="text-center animate-fadein">
        <div className="flex justify-center mb-14">
          <Image
            src="/logo.png"
            alt="다이닝 맑음"
            width={220}
            height={330}
            style={{ width: 'clamp(140px, 22vw, 220px)', height: 'auto' }}
            priority
          />
        </div>

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
