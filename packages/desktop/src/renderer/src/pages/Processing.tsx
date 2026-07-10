import { useState, useEffect } from 'react'
import { Loader2, Printer, ImageIcon, CheckCircle, AlertCircle } from 'lucide-react'
import type { BoothConfig } from '@snapbooth/shared'

interface SessionData {
  id: string
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

type ProcessingStep = 'saving' | 'compositing' | 'printing' | 'done' | 'error'

export default function Processing({ session, config, onComplete }: Props) {
  const [step, setStep] = useState<ProcessingStep>('saving')
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    runProcessing()
  }, [])

  const runProcessing = async () => {
    // @ts-ignore
    const api = window.snapbooth

    try {
      // ====== Step 1: Save captured photos to disk ======
      setStep('saving')
      setProgress(0)

      const savedPaths: string[] = []
      for (let i = 0; i < session.capturedPhotos.length; i++) {
        const dataUrl = session.capturedPhotos[i]

        if (dataUrl.startsWith('file://')) {
          // Photo is already a local file (from DSLR)
          savedPaths.push(dataUrl.replace('file://', ''))
        } else if (api?.compositing?.savePhoto) {
          // Photo is a base64 string (from Webcam)
          const filePath = await api.compositing.savePhoto(dataUrl, session.id, i)
          if (filePath) savedPaths.push(filePath)
        } else {
          // Browser fallback — just keep the data URLs
          savedPaths.push(dataUrl)
        }

        setProgress(Math.round(((i + 1) / session.capturedPhotos.length) * 100))
      }

      // ====== Step 2: Composite photos with frame + filter ======
      setStep('compositing')
      setProgress(0)

      let finalImagePath = savedPaths[0] || ''

      if (api?.compositing?.process && savedPaths.length > 0 && !savedPaths[0].startsWith('data:')) {
        // Simulate progress during composite
        const progressInterval = setInterval(() => {
          setProgress(prev => Math.min(prev + 8, 90))
        }, 200)

        finalImagePath = await api.compositing.process({
          photoPaths: savedPaths,
          filter: session.selectedFilter,
          frameId: session.selectedFrameId || 'classic-white',
          sessionId: session.id
        })

        clearInterval(progressInterval)
        setProgress(100)

        if (!finalImagePath) {
          throw new Error('Compositing returned empty path')
        }
      } else {
        // Browser fallback — simulate compositing
        for (let i = 0; i <= 100; i += 5) {
          setProgress(i)
          await new Promise(r => setTimeout(r, 60))
        }
        finalImagePath = savedPaths[0] || ''
      }

      // ====== Step 3: Print ======
      setStep('printing')
      setProgress(0)

      if (api?.printer?.print && finalImagePath && !finalImagePath.startsWith('data:')) {
        const progressInterval = setInterval(() => {
          setProgress(prev => Math.min(prev + 5, 90))
        }, 300)

        const printResult = await api.printer.print(finalImagePath, config.copies_per_session)
        clearInterval(progressInterval)

        if (!printResult.success) {
          console.warn('[Processing] Print warning:', printResult.error)
          // Don't block flow on print failure — photo is still saved
        }
        setProgress(100)
      } else {
        // Browser fallback — simulate printing
        for (let i = 0; i <= 100; i += 3) {
          setProgress(i)
          await new Promise(r => setTimeout(r, 80))
        }
      }

      // ====== Done ======
      setStep('done')
      await new Promise(r => setTimeout(r, 800))
      onComplete(finalImagePath)

    } catch (err: any) {
      console.error('[Processing] Error:', err)
      setErrorMsg(err?.message || 'Terjadi kesalahan saat memproses foto')
      setStep('error')

      // Auto-recover after 5 seconds
      setTimeout(() => {
        onComplete(session.capturedPhotos[0] || '')
      }, 5000)
    }
  }

  const stepLabels: Record<ProcessingStep, { title: string; subtitle: string }> = {
    saving: { title: 'Menyimpan foto...', subtitle: 'Menyimpan ke penyimpanan lokal' },
    compositing: { title: 'Memproses foto...', subtitle: 'Menerapkan filter & frame' },
    printing: { title: 'Mencetak foto...', subtitle: `${config.copies_per_session} lembar` },
    done: { title: 'Selesai!', subtitle: 'Foto siap diambil' },
    error: { title: 'Gagal memproses', subtitle: errorMsg }
  }

  const current = stepLabels[step]

  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--gradient-surface)' }}>
      <div className="text-center max-w-lg animate-fade-in">
        <div className="mb-10">
          {step === 'error' ? (
            <div className="w-32 h-32 mx-auto rounded-full flex items-center justify-center animate-scale-in" style={{ background: 'linear-gradient(135deg, #93000a, #ffb4ab)', boxShadow: '0 0 30px rgba(255,180,171,0.3)' }}>
              <AlertCircle size={64} color="white" />
            </div>
          ) : step === 'done' ? (
            <div className="w-32 h-32 mx-auto rounded-full flex items-center justify-center animate-scale-in" style={{ background: 'var(--gradient-tertiary)', boxShadow: 'var(--shadow-glow-tertiary)' }}>
              <CheckCircle size={64} color="#003915" />
            </div>
          ) : (
            <div className="w-32 h-32 mx-auto rounded-full flex items-center justify-center" style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-glow-primary)' }}>
              {step === 'printing' ? (
                <Printer size={64} color="#00363a" className="animate-pulse" />
              ) : step === 'saving' ? (
                <ImageIcon size={64} color="#00363a" className="animate-pulse" />
              ) : (
                <Loader2 size={64} color="#00363a" className="animate-spin" />
              )}
            </div>
          )}
        </div>

        <h2 className="text-headline-md mb-2">{current.title}</h2>
        <p className="text-body-md mb-8" style={{ color: 'var(--color-text-secondary)' }}>{current.subtitle}</p>

        {step !== 'done' && step !== 'error' && (
          <div className="w-full max-w-md mx-auto">
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-label-bold text-sm mt-3" style={{ color: 'var(--color-text-muted)' }}>{progress}%</p>
          </div>
        )}

        {/* Step indicators */}
        {step !== 'error' && (
          <div className="flex justify-center gap-8 mt-10">
            {(['saving', 'compositing', 'printing'] as const).map((s, i) => {
              const isActive = s === step
              const isDone = ['saving', 'compositing', 'printing', 'done'].indexOf(step) > ['saving', 'compositing', 'printing'].indexOf(s)
              return (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-label-bold text-sm transition-all"
                    style={{
                      background: isDone ? 'var(--color-tertiary-container)' : isActive ? 'var(--color-primary-container)' : 'var(--color-bg-elevated)',
                      color: isDone ? '#003915' : isActive ? '#00363a' : 'var(--color-text-muted)',
                      transform: isActive ? 'scale(1.1)' : undefined,
                      boxShadow: isActive ? 'var(--shadow-glow-primary)' : isDone ? 'var(--shadow-glow-tertiary)' : undefined
                    }}
                  >
                    {isDone ? '✓' : i + 1}
                  </div>
                  <span className="text-label-bold text-sm" style={{ color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                    {s === 'saving' ? 'Simpan' : s === 'compositing' ? 'Proses' : 'Cetak'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
