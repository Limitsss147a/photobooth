import { useState } from 'react'
import { ArrowLeft, Printer, Image, Sparkles } from 'lucide-react'
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
  icon: React.ReactNode
  popular?: boolean
  gradient: string
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
      icon: <Image size={32} />,
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)'
    },
    {
      id: 'standard',
      name: 'Standard',
      price: config.base_price * 2,
      prints: 2,
      photos: 3,
      features: ['3 foto', '2 cetak 4×6', 'Semua filter', 'Softfile via email', 'Pilih frame'],
      icon: <Printer size={32} />,
      popular: true,
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: config.base_price * 3,
      prints: 4,
      photos: 5,
      features: ['5 foto', '4 cetak 4×6', 'Semua filter', 'Softfile via email & WA', 'Frame premium', 'Retake gratis'],
      icon: <Sparkles size={32} />,
      gradient: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)'
    }
  ]

  return (
    <div className="w-full h-full flex flex-col" style={{ background: 'var(--gradient-surface)' }}>
      {/* Header */}
      <div className="flex items-center px-8 pt-8 pb-4">
        <button onClick={onBack} className="btn-secondary p-4 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1 text-center">
          <h2 className="text-3xl font-bold">Pilih Paket Foto</h2>
          <p className="text-[var(--color-text-secondary)] mt-1">Pilih paket yang sesuai keinginanmu</p>
        </div>
        <div className="w-14" /> {/* Spacer */}
      </div>

      {/* Package cards */}
      <div className="flex-1 flex items-center justify-center gap-8 px-12 pb-8">
        {packages.map((pkg, index) => (
          <div
            key={pkg.id}
            className={`relative flex-1 max-w-[380px] rounded-[24px] overflow-hidden cursor-pointer transition-all duration-300
              ${selected === pkg.id ? 'scale-105 ring-4 ring-[var(--color-primary)]' : 'hover:scale-102'}
            `}
            style={{
              background: 'var(--color-bg-card)',
              border: selected === pkg.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
              boxShadow: selected === pkg.id ? 'var(--shadow-glow)' : 'var(--shadow-md)',
              animationDelay: `${index * 100}ms`
            }}
            onClick={() => setSelected(pkg.id)}
          >
            {/* Popular badge */}
            {pkg.popular && (
              <div
                className="absolute top-4 right-4 px-4 py-1.5 rounded-full text-sm font-bold text-white"
                style={{ background: 'var(--gradient-accent)' }}
              >
                ⭐ Populer
              </div>
            )}

            {/* Icon header */}
            <div
              className="p-8 flex items-center justify-center"
              style={{ background: pkg.gradient }}
            >
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-white">
                {pkg.icon}
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
              <p className="text-4xl font-black mb-6" style={{ color: 'var(--color-primary-light)' }}>
                Rp {pkg.price.toLocaleString('id-ID')}
              </p>

              <ul className="space-y-3 mb-8">
                {pkg.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-[var(--color-text-secondary)]">
                    <span className="w-5 h-5 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center text-xs text-[var(--color-primary-light)]">✓</span>
                    {feat}
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  selected === pkg.id
                    ? 'btn-primary'
                    : 'bg-[var(--color-bg-elevated)] text-[var(--color-text)] border border-[var(--color-border)]'
                }`}
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
