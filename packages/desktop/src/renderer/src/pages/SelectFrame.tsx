import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import type { BoothConfig } from '@snapbooth/shared'

interface Props {
  config: BoothConfig
  onSelect: (frameId: string) => void
}

interface FrameOption {
  id: string
  name: string
  category: string
  extraPrice: number
  previewColor: string
  description: string
}

// Demo frames — in production these come from Supabase
const DEMO_FRAMES: FrameOption[] = [
  {
    id: 'classic-white',
    name: 'Classic White',
    category: 'Basic',
    extraPrice: 0,
    previewColor: '#ffffff',
    description: 'Border putih simpel dan elegan'
  },
  {
    id: 'polaroid',
    name: 'Polaroid',
    category: 'Basic',
    extraPrice: 0,
    previewColor: '#f5f5f0',
    description: 'Gaya foto polaroid klasik'
  },
  {
    id: 'floral-gold',
    name: 'Floral Gold',
    category: 'Premium',
    extraPrice: 5000,
    previewColor: '#d4af37',
    description: 'Frame bunga dengan aksen emas'
  },
  {
    id: 'neon-glow',
    name: 'Neon Glow',
    category: 'Premium',
    extraPrice: 5000,
    previewColor: '#ff00ff',
    description: 'Efek neon futuristik'
  },
  {
    id: 'vintage-film',
    name: 'Vintage Film',
    category: 'Artistic',
    extraPrice: 3000,
    previewColor: '#8B7355',
    description: 'Tampilan strip film retro'
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    category: 'Basic',
    extraPrice: 0,
    previewColor: '#1a1a2e',
    description: 'Desain bersih dan modern'
  }
]

export default function SelectFrame({ config, onSelect }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('All')

  const categories = ['All', ...new Set(DEMO_FRAMES.map(f => f.category))]

  const filteredFrames = activeCategory === 'All'
    ? DEMO_FRAMES
    : DEMO_FRAMES.filter(f => f.category === activeCategory)

  return (
    <div className="w-full h-full flex flex-col" style={{ background: 'var(--gradient-surface)' }}>
      {/* Header */}
      <div className="text-center pt-6 pb-2">
        <h2 className="text-3xl font-bold">Pilih Desain Frame</h2>
        <p className="text-[var(--color-text-secondary)] mt-1">Pilih frame untuk mempercantik fotomu</p>
      </div>

      {/* Category tabs */}
      <div className="flex justify-center gap-3 px-8 py-4">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-2.5 rounded-full font-medium transition-all ${
              activeCategory === cat
                ? 'text-white shadow-lg'
                : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
            }`}
            style={activeCategory === cat ? { background: 'var(--gradient-primary)' } : {}}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Frame grid */}
      <div className="flex-1 overflow-y-auto px-8 pb-4">
        <div className="grid grid-cols-3 gap-6 max-w-[1200px] mx-auto">
          {filteredFrames.map(frame => (
            <div
              key={frame.id}
              onClick={() => setSelected(frame.id)}
              className={`frame-card ${selected === frame.id ? 'selected' : ''} animate-float-up`}
            >
              {/* Frame preview */}
              <div className="aspect-[3/4] relative overflow-hidden">
                <div
                  className="absolute inset-0"
                  style={{ background: frame.previewColor }}
                />
                {/* Simulated photo area */}
                <div
                  className="absolute inset-[12%] rounded-lg"
                  style={{
                    background: 'var(--color-bg-deep)',
                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3)'
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    📸
                  </div>
                </div>
                {/* Extra price badge */}
                {frame.extraPrice > 0 && (
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold bg-[var(--color-accent)] text-white">
                    +Rp {frame.extraPrice.toLocaleString('id-ID')}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h4 className="font-bold text-lg">{frame.name}</h4>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">{frame.description}</p>
                <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]">
                  {frame.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom action */}
      <div className="px-8 py-6 text-center">
        <button
          onClick={() => selected && onSelect(selected)}
          disabled={!selected}
          className={`btn-primary btn-touch inline-flex ${!selected ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Lanjut <ArrowRight size={24} />
        </button>
      </div>
    </div>
  )
}
