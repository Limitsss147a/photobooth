import { useState, useEffect } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'
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
  thumbnailUrl?: string
}

const FALLBACK_FRAMES: FrameOption[] = [
  {
    id: 'classic-white',
    name: 'Classic White',
    category: 'Basic',
    extraPrice: 0,
    previewColor: '#ffffff',
    description: 'Border putih simpel'
  }
]

export default function SelectFrame({ config, onSelect }: Props) {
  const [frames, setFrames] = useState<FrameOption[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('All')

  useEffect(() => {
    loadFrames()
  }, [])

  const loadFrames = async () => {
    try {
      // @ts-ignore
      const dbFrames = await window.snapbooth.config.frames()
      if (dbFrames && dbFrames.length > 0) {
        const mapped = dbFrames.map((f: any) => ({
          id: f.id,
          name: f.nama,
          category: f.kategori,
          extraPrice: f.harga_tambahan || 0,
          previewColor: '#ffffff',
          description: '',
          thumbnailUrl: f.thumbnail_url || f.file_url
        }))
        setFrames(mapped)
      } else {
        setFrames(FALLBACK_FRAMES)
      }
    } catch (e) {
      console.error('Failed to load frames:', e)
      setFrames(FALLBACK_FRAMES)
    } finally {
      setLoading(false)
    }
  }

  const categories = ['All', ...new Set(frames.map(f => f.category))]

  const filteredFrames = activeCategory === 'All'
    ? frames
    : frames.filter(f => f.category === activeCategory)

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-white">
        <Loader2 size={48} className="animate-spin text-indigo-400 mb-4" />
        <h2 className="text-xl">Memuat desain frame...</h2>
      </div>
    )
  }

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
              <div className="aspect-[3/4] relative overflow-hidden flex items-center justify-center bg-[var(--color-bg-elevated)]">
                {frame.thumbnailUrl ? (
                  <img src={frame.thumbnailUrl} alt={frame.name} className="absolute inset-0 w-full h-full object-cover z-20 pointer-events-none" />
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{ background: frame.previewColor }}
                  />
                )}
                {/* Simulated photo area (underneath transparent frame) */}
                <div
                  className="absolute inset-[12%] rounded-lg z-10"
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
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold bg-[var(--color-accent)] text-white z-30 shadow-md">
                    +Rp {frame.extraPrice.toLocaleString('id-ID')}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4 bg-[var(--color-bg-deep)]">
                <h4 className="font-bold text-lg">{frame.name}</h4>
                {frame.description && <p className="text-sm text-[var(--color-text-muted)] mt-1">{frame.description}</p>}
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
