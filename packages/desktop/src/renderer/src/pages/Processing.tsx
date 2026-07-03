import { useState, useEffect } from 'react'
import { Loader2, Printer, ImageIcon, CheckCircle } from 'lucide-react'
import type { BoothConfig } from '@snapbooth/shared'

interface SessionData {
  packagePrice: number
  paymentMethod: 'qris' | 'cash' | null
  orderId: string | null
  capturedPhotos: string[]
  selectedFilter: string
  selectedFrameId: string | null
  guestEmail: string
  compositedImagePath: string | null
}

interface Props {
  session: SessionData
  config: BoothConfig
  onComplete: (imagePath: string) => void
}

type ProcessingStep = 'compositing' | 'printing' | 'done'

export default function Processing({ session, config, onComplete }: Props) {
  const [step, setStep] = useState<ProcessingStep>('compositing')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    runProcessing()
  }, [])

  const runProcessing = async () => {
    setStep('compositing')
    for (let i = 0; i <= 100; i += 5) {
      setProgress(i)
      await new Promise(r => setTimeout(r, 80))
    }
    setStep('printing')
    setProgress(0)
    for (let i = 0; i <= 100; i += 3) {
      setProgress(i)
      await new Promise(r => setTimeout(r, 100))
    }
    setStep('done')
    await new Promise(r => setTimeout(r, 500))
    onComplete(session.capturedPhotos[0] || '')
  }

  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--gradient-surface)' }}>
      <div className="text-center max-w-lg animate-fade-in">
        <div className="mb-10">
          {step !== 'done' ? (
            <div className="w-32 h-32 mx-auto rounded-full flex items-center justify-center" style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-glow)' }}>
              <Loader2 size={64} color="white" className="animate-spin" />
            </div>
          ) : (
            <div className="w-32 h-32 mx-auto rounded-full flex items-center justify-center animate-scale-in" style={{ background: 'linear-gradient(135deg, #22c55e, #34d399)' }}>
              <CheckCircle size={64} color="white" />
            </div>
          )}
        </div>
        <h2 className="text-3xl font-bold mb-2">
          {step === 'compositing' ? 'Memproses foto...' : step === 'printing' ? 'Mencetak foto...' : 'Selesai!'}
        </h2>
        <p className="text-[var(--color-text-secondary)] text-lg mb-8">
          {step === 'compositing' ? 'Menerapkan filter & frame' : step === 'printing' ? `${config.copies_per_session} lembar` : 'Foto siap diambil'}
        </p>
        {step !== 'done' && (
          <div className="w-full max-w-md mx-auto">
            <div className="h-3 bg-[var(--color-bg-elevated)] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: 'var(--gradient-primary)' }} />
            </div>
            <p className="text-[var(--color-text-muted)] text-sm mt-3">{progress}%</p>
          </div>
        )}
      </div>
    </div>
  )
}
