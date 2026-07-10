import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import type { BoothConfig } from '@snapbooth/shared'

interface Props {
  config: BoothConfig
  onSelect: (price: number) => void
  onBack: () => void
}

interface Package {
  id: string
  name: string
  price: number
  prints: number
  photos: number
  features: string[]
  emoji: string
  popular?: boolean
  glowColor: string
  borderColor: string
}

export default function SelectPackage({ config, onSelect, onBack }: Props) {
  const [selected, setSelected] = useState<string | null>(null)

  const packages: Package[] = [
    {
      id: 'basic',
      name: 'Basic',
      price: config.base_price,
      prints: 1,
      photos: 1,
      features: ['1 foto', '1 cetak 4×6', 'Filter dasar', 'Softfile via email'],
      emoji: '📷',
      glowColor: 'rgba(0, 219, 233, 0.3)',
      borderColor: '#00dbe9'
    },
    {
      id: 'standard',
      name: 'Standard',
      price: config.standard_price || config.base_price * 2,
      prints: 2,
      photos: 3,
      features: ['3 foto', '2 cetak 4×6', 'Semua filter', 'Softfile via email', 'Pilih frame'],
      emoji: '✨',
      popular: true,
      glowColor: 'rgba(255, 36, 228, 0.3)',
      borderColor: '#ff24e4'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: config.premium_price || config.base_price * 3,
      prints: 4,
      photos: 5,
      features: ['5 foto', '4 cetak 4×6', 'Semua filter', 'Softfile via email & WA', 'Frame premium', 'Retake gratis'],
      emoji: '👑',
      glowColor: 'rgba(38, 249, 121, 0.3)',
      borderColor: '#26f979'
    }
  ]

  return (
    <div className="w-full h-full flex flex-col" style={{ background: 'var(--gradient-surface)' }}>
      {/* Header */}
      <div className="flex items-center px-16 pt-10 pb-4">
        <button
          onClick={onBack}
          className="btn-secondary p-4"
          style={{ borderRadius: 'var(--radius-full)', border: '2px solid var(--color-border)' }}
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1 text-center">
          <h2 className="text-headline-md">Pilih Paket Foto</h2>
          <p className="text-body-md mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Pilih paket yang sesuai keinginanmu
          </p>
        </div>
        <div className="w-14" />
      </div>

      {/* Package cards */}
      <div className="flex-1 flex items-center justify-center gap-8 px-16 pb-10">
        {packages.map((pkg, index) => (
          <div
            key={pkg.id}
            className="relative flex-1 max-w-[400px] overflow-hidden cursor-pointer transition-all duration-300 animate-float-up"
            style={{
              background: 'var(--color-bg-card)',
              border: selected === pkg.id ? `3px solid ${pkg.borderColor}` : '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: selected === pkg.id ? `0 0 30px ${pkg.glowColor}` : 'var(--shadow-md)',
              animationDelay: `${index * 100}ms`,
              transform: selected === pkg.id ? 'scale(1.03)' : undefined
            }}
            onClick={() => setSelected(pkg.id)}
          >
            {/* Popular badge */}
            {pkg.popular && (
              <div
                className="absolute top-4 right-4 px-4 py-1.5 rounded-full text-label-bold text-sm z-10"
                style={{
                  background: 'var(--color-secondary-container)',
                  color: 'white',
                  boxShadow: 'var(--shadow-glow-accent)'
                }}
              >
                ⭐ Populer
              </div>
            )}

            {/* Icon header */}
            <div
              className="p-10 flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${pkg.borderColor}33, ${pkg.borderColor}11)`
              }}
            >
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
                style={{
                  background: `${pkg.borderColor}22`,
                  border: `2px solid ${pkg.borderColor}44`,
                  boxShadow: `0 0 20px ${pkg.glowColor}`
                }}
              >
                {pkg.emoji}
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <h3 className="text-headline-md mb-2">{pkg.name}</h3>
              <p className="text-body-lg font-bold mb-6" style={{ color: pkg.borderColor }}>
                Rp {pkg.price.toLocaleString('id-ID')}
              </p>

              <ul className="space-y-3 mb-8">
                {pkg.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-3" style={{ color: 'var(--color-text-secondary)' }}>
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                      style={{ background: `${pkg.borderColor}22`, color: pkg.borderColor }}
                    >
                      ✓
                    </span>
                    <span className="text-body-md">{feat}</span>
                  </li>
                ))}
              </ul>

              <button
                className={selected === pkg.id ? 'btn-primary w-full' : 'btn-secondary w-full'}
                style={
                  selected === pkg.id
                    ? { background: pkg.borderColor, color: '#0f131f' }
                    : { borderColor: pkg.borderColor }
                }
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect(pkg.price)
                }}
              >
                {selected === pkg.id ? 'Lanjut Bayar →' : 'Pilih'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
