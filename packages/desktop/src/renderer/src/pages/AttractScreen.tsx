import { useEffect, useState } from 'react'
import { Camera } from 'lucide-react'
import type { BoothConfig } from '@snapbooth/shared'

interface Props {
  config: BoothConfig
  onStart: () => void
}

export default function AttractScreen({ config, onStart }: Props) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([])

  useEffect(() => {
    // Generate floating particles
    const pts = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5
    }))
    setParticles(pts)
  }, [])

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center relative cursor-pointer"
      onClick={onStart}
      style={{ background: 'var(--gradient-surface)' }}
    >
      {/* Animated background particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full opacity-20"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${4 + Math.random() * 8}px`,
            height: `${4 + Math.random() * 8}px`,
            background: 'var(--gradient-primary)',
            animation: `floatParticle ${6 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`
          }}
        />
      ))}

      {/* Glow orb */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)',
          animation: 'attractPulse 3s ease-in-out infinite'
        }}
      />

      {/* Main content */}
      <div className="relative z-10 text-center animate-fade-in">
        {/* Logo / Icon */}
        <div
          className="mx-auto mb-8 w-32 h-32 rounded-full flex items-center justify-center"
          style={{
            background: 'var(--gradient-primary)',
            boxShadow: '0 0 60px rgba(99,102,241,0.4)'
          }}
        >
          <Camera size={64} color="white" strokeWidth={1.5} />
        </div>

        {/* Brand name */}
        <h1
          className="text-7xl font-black tracking-tight mb-4"
          style={{
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 30px rgba(99,102,241,0.3))'
          }}
        >
          {config.outlet_name || 'SnapBooth'}
        </h1>

        {/* Tagline */}
        <p className="text-2xl text-[var(--color-text-secondary)] mb-16 font-light">
          {config.attract_screen_subtitle || 'Self-Service Photo Experience'}
        </p>

        {/* CTA */}
        <div
          className="inline-block"
          style={{ animation: 'attractPulse 2s ease-in-out infinite' }}
        >
          <button className="btn-primary btn-touch text-2xl px-16 py-6">
            <span className="animate-pulse">👆</span>
            {config.attract_screen_text || 'Sentuh layar untuk mulai!'}
          </button>
        </div>

        {/* Price hint */}
        <p className="mt-8 text-[var(--color-text-muted)] text-lg">
          Mulai dari Rp {config.base_price.toLocaleString('id-ID')}
        </p>
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-[var(--color-text-muted)] text-sm opacity-50">
          Powered by SnapBooth • v1.0
        </p>
      </div>

      <style>{`
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-10px) translateX(-10px); }
          75% { transform: translateY(-30px) translateX(5px); }
        }
      `}</style>
    </div>
  )
}
