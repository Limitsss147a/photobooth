import { useState, useMemo } from 'react'
import type { BoothConfig, FilterType } from '@snapbooth/shared'

interface Props {
  config: BoothConfig
  photos: string[]
  onSelect: (filter: FilterType) => void
}

interface FilterOption {
  id: FilterType
  name: string
  cssFilter: string
  emoji: string
}

const FILTERS: FilterOption[] = [
  { id: 'none', name: 'Original', cssFilter: 'none', emoji: '📷' },
  { id: 'bw', name: 'B&W', cssFilter: 'grayscale(100%) contrast(1.1)', emoji: '⬛' },
  { id: 'sepia', name: 'Sepia', cssFilter: 'sepia(80%) contrast(1.05) brightness(1.05)', emoji: '🟤' },
  { id: 'vintage', name: 'Vintage', cssFilter: 'sepia(40%) contrast(0.9) brightness(1.1) saturate(0.8)', emoji: '📻' },
  { id: 'warm', name: 'Warm', cssFilter: 'sepia(20%) saturate(1.3) brightness(1.05)', emoji: '🌅' },
  { id: 'cool', name: 'Cool', cssFilter: 'saturate(0.9) brightness(1.05) hue-rotate(20deg)', emoji: '❄️' },
  { id: 'vivid', name: 'Vivid', cssFilter: 'saturate(1.5) contrast(1.1) brightness(1.05)', emoji: '🌈' },
  { id: 'fade', name: 'Fade', cssFilter: 'contrast(0.85) brightness(1.15) saturate(0.7)', emoji: '🌫️' },
  { id: 'beauty', name: 'Beauty', cssFilter: 'brightness(1.1) contrast(0.95) saturate(1.1)', emoji: '✨' }
]

export default function SelectFilter({ config, photos, onSelect }: Props) {
  const [selected, setSelected] = useState<FilterType>('none')
  const previewPhoto = photos[0] || ''

  const enabledFilters = useMemo(() => {
    return FILTERS.filter(f => config.enabled_filters.includes(f.id))
  }, [config.enabled_filters])

  const currentFilter = FILTERS.find(f => f.id === selected) || FILTERS[0]

  return (
    <div className="w-full h-full flex flex-col" style={{ background: 'var(--gradient-surface)' }}>
      {/* Header */}
      <div className="text-center pt-8 pb-4">
        <h2 className="text-headline-md">Pilih Filter</h2>
        <p className="text-body-md mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Sentuh filter untuk melihat preview
        </p>
      </div>

      {/* Main content */}
      <div className="flex-1 flex gap-8 px-16 pb-8 min-h-0">
        {/* Photo preview (large) */}
        <div className="flex-1 flex items-center justify-center">
          <div
            className="relative w-full max-w-[600px] aspect-[3/4] overflow-hidden"
            style={{
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-glow-primary)',
              border: '2px solid var(--color-border)'
            }}
          >
            {previewPhoto ? (
              <img
                src={previewPhoto}
                alt="Preview"
                className="w-full h-full object-cover transition-all duration-500"
                style={{ filter: currentFilter.cssFilter }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--color-bg-card)' }}>
                <p style={{ color: 'var(--color-text-muted)' }}>No preview</p>
              </div>
            )}

            {/* Filter name badge */}
            <div
              className="absolute bottom-4 left-4 glass-panel px-4 py-2"
              style={{ borderRadius: 'var(--radius-full)' }}
            >
              <span className="text-label-bold text-lg">{currentFilter.emoji} {currentFilter.name}</span>
            </div>
          </div>
        </div>

        {/* Filter grid (right side) */}
        <div className="w-[380px] flex flex-col">
          <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-3 gap-3 auto-rows-min content-start">
            {enabledFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelected(filter.id)}
                className={`filter-card ${selected === filter.id ? 'selected' : ''} flex flex-col`}
              >
                {/* Thumbnail */}
                <div className="aspect-square overflow-hidden">
                  {previewPhoto ? (
                    <img
                      src={previewPhoto}
                      alt={filter.name}
                      className="w-full h-full object-cover"
                      style={{ filter: filter.cssFilter }}
                    />
                  ) : (
                    <div className="w-full h-full" style={{ background: 'var(--color-bg-elevated)' }} />
                  )}
                </div>
                <div className="py-2 px-1 text-center">
                  <span className="text-label-bold text-sm">{filter.emoji} {filter.name}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Apply button */}
          <button
            className="btn-primary w-full mt-4"
            onClick={() => onSelect(selected)}
          >
            Terapkan Filter →
          </button>
        </div>
      </div>
    </div>
  )
}
