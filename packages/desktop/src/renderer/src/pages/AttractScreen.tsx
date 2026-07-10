import { useEffect, useState } from 'react'
import type { BoothConfig } from '@snapbooth/shared'

interface Props {
  config: BoothConfig
  onStart: () => void
}

export default function AttractScreen({ config, onStart }: Props) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number; duration: number }>>([])

  useEffect(() => {
    const pts = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 3 + Math.random() * 8,
      delay: Math.random() * 5,
      duration: 6 + Math.random() * 6
    }))
    setParticles(pts)
  }, [])

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-between relative overflow-hidden cursor-pointer"
      onClick={onStart}
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Ambient background image / gradient */}
      <div className="absolute inset-0 z-0">
        {/* Dynamic gradient orbs */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-25"
          style={{
            top: '10%',
            left: '20%',
            background: 'radial-gradient(circle, rgba(0,240,255,0.4) 0%, transparent 70%)',
            animation: 'attractPulse 4s ease-in-out infinite',
            filter: 'blur(40px)'
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-20"
          style={{
            bottom: '20%',
            right: '15%',
            background: 'radial-gradient(circle, rgba(255,36,228,0.4) 0%, transparent 70%)',
            animation: 'attractPulse 5s ease-in-out infinite 1s',
            filter: 'blur(40px)'
          }}
        />
        <div
          className="absolute w-[300px] h-[300px] rounded-full opacity-15"
          style={{
            top: '50%',
            right: '40%',
            background: 'radial-gradient(circle, rgba(38,249,121,0.3) 0%, transparent 70%)',
            animation: 'attractPulse 6s ease-in-out infinite 2s',
            filter: 'blur(40px)'
          }}
        />
        {/* Bottom gradient overlay */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom, rgba(15,19,31,0.3), transparent, rgba(15,19,31,0.95))'
        }} />
      </div>

      {/* Floating particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.id % 3 === 0 ? '#00f0ff' : p.id % 3 === 1 ? '#ff24e4' : '#26f979',
            opacity: 0.15,
            animation: `floatParticle ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
            filter: 'blur(1px)'
          }}
        />
      ))}

      {/* Top safe zone spacer */}
      <div className="w-full h-24 z-10" />

      {/* Center Brand Anchor */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 w-full px-8">
        <h1
          className="text-display text-center"
          style={{
            color: 'var(--color-primary-dim)',
            filter: 'drop-shadow(0 0 20px rgba(0,219,233,0.6))'
          }}
        >
          {config.outlet_name || 'SnapBooth'}
        </h1>

        <p
          className="text-body-lg text-center max-w-xl mt-4"
          style={{
            color: 'var(--color-secondary-dim)',
            opacity: 0.9,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
          }}
        >
          {config.attract_screen_subtitle || 'Step into the glow. Create your moment.'}
        </p>
      </div>

      {/* Bottom Action Area (Kiosk Comfort Zone) */}
      <div className="w-full flex flex-col items-center pb-16 z-20 px-16" style={{ gap: 'var(--space-gutter)' }}>
        {/* Massive CTA Button */}
        <button
          className="w-4/5 max-w-3xl animate-kiosk-pulse"
          style={{
            height: '160px',
            background: 'var(--color-primary)',
            color: '#00363a',
            borderRadius: 'var(--radius-full)',
            border: '4px solid var(--color-primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onClick={(e) => {
            e.stopPropagation()
            onStart()
          }}
        >
          <span className="text-headline-lg uppercase tracking-wider">
            {config.attract_screen_text || 'Tap To Start'}
          </span>
        </button>

        {/* Footer badge */}
        <div
          className="glass-panel px-6 py-3 flex items-center gap-2"
          style={{ borderRadius: 'var(--radius-full)', padding: '12px 24px' }}
        >
          <span className="text-label-bold uppercase tracking-widest text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            📸 Powered by SnapBooth Systems
          </span>
        </div>

        {/* Price hint */}
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Mulai dari Rp {config.base_price.toLocaleString('id-ID')}
        </p>
      </div>
    </div>
  )
}
