import { useState, useEffect } from 'react'
import { RotateCcw, ArrowRight } from 'lucide-react'
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
  onFinish: () => void
}

export default function Complete({ session, config, onFinish }: Props) {
  const [step, setStep] = useState<'review' | 'email'>('review')
  const [previewBase64, setPreviewBase64] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    async function loadPreview() {
      if (session.compositedImagePath) {
        try {
          // @ts-ignore
          const base64 = await window.snapbooth?.compositing?.getFileBase64(session.compositedImagePath)
          if (base64) setPreviewBase64(base64)
        } catch (err) {
          console.error('Failed to load preview base64:', err)
        }
      }
    }
    loadPreview()
  }, [session.compositedImagePath])

  const handleSendEmail = async () => {
    if (!email || !email.includes('@')) return
    setSending(true)
    setEmailError(null)

    try {
      // @ts-ignore - snapbooth is exposed via preload
      const result = await window.snapbooth?.email?.sendPhoto(
        email,
        session.compositedImagePath || null,
        session.id
      )

      if (result?.success) {
        setEmailSent(true)
      } else {
        setEmailError(result?.error || 'Gagal mengirim email')
      }
    } catch (err) {
      console.error('Email send error:', err)
      setEmailError('Gagal mengirim email. Coba lagi.')
    } finally {
      setSending(false)
    }
  }

  // Background orbs component to reuse
  const GlowBackground = () => (
    <div className="absolute inset-0 pointer-events-none z-0">
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-20"
        style={{
          top: '-10%',
          left: '30%',
          background: 'radial-gradient(circle, rgba(38,249,121,0.5) 0%, transparent 70%)',
          filter: 'blur(60px)'
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full opacity-15"
        style={{
          bottom: '10%',
          right: '20%',
          background: 'radial-gradient(circle, rgba(0,240,255,0.4) 0%, transparent 70%)',
          filter: 'blur(60px)'
        }}
      />
    </div>
  )

  if (step === 'review') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center relative" style={{ background: 'var(--gradient-surface)' }}>
        <GlowBackground />
        
        <div className="text-center max-w-4xl z-10 animate-scale-in px-8 flex flex-col items-center">
          <h2
            className="text-headline-lg mb-8"
            style={{
              color: 'var(--color-primary)',
              filter: 'drop-shadow(0 0 15px rgba(0,240,255,0.4))'
            }}
          >
            Review Hasil Foto Anda
          </h2>

          <div className="glass-panel p-4 inline-block mb-10 relative">
            {previewBase64 ? (
              <img src={previewBase64} alt="Preview" className="max-h-[60vh] object-contain rounded" style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }} />
            ) : (
              <div className="w-[400px] h-[300px] flex items-center justify-center text-white text-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mr-3"></div>
                Memuat preview...
              </div>
            )}
          </div>

          <div className="flex gap-6">
            <button onClick={onFinish} className="btn-secondary btn-touch px-10 py-4 text-lg">
              <RotateCcw size={24} className="mr-2 inline" />
              Selesai Sekarang
            </button>
            
            <button onClick={() => setStep('email')} className="btn-primary btn-touch px-10 py-4 text-lg">
              Kirim Softfile <ArrowRight size={24} className="ml-2 inline" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative" style={{ background: 'var(--gradient-surface)' }}>
      <GlowBackground />

      <div className="text-center max-w-2xl z-10 animate-scale-in px-8">
        <div
          className="text-8xl mb-6 animate-neon-glow inline-block"
          style={{ filter: 'drop-shadow(0 0 20px rgba(38,249,121,0.5))' }}
        >
          🎉
        </div>

        <h2
          className="text-headline-lg mb-3"
          style={{
            color: 'var(--color-tertiary)',
            filter: 'drop-shadow(0 0 15px rgba(38,249,121,0.4))'
          }}
        >
          Foto Sudah Siap!
        </h2>

        <p className="text-body-lg mb-10" style={{ color: 'var(--color-text-secondary)' }}>
          Ambil hasil cetak di bawah dan masukkan email untuk menerima softfile
        </p>

        {!emailSent ? (
          <div className="glass-panel p-8 max-w-md mx-auto mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">📧</span>
              <h3 className="text-label-bold text-lg">Kirim ke Email</h3>
            </div>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="input-field mb-4 text-lg"
            />
            <button
              onClick={handleSendEmail}
              disabled={!email || sending}
              className={`btn-primary w-full ${(!email || sending) ? 'opacity-50' : ''}`}
            >
              {sending ? 'Mengirim...' : 'Kirim Softfile 📧'}
            </button>
            {emailError && (
              <p className="text-sm mt-3" style={{ color: 'var(--color-error)' }}>{emailError}</p>
            )}
          </div>
        ) : (
          <div
            className="glass-panel p-6 max-w-md mx-auto mb-8"
            style={{ border: '2px solid var(--color-success)' }}
          >
            <p className="text-label-bold text-lg" style={{ color: 'var(--color-success)' }}>
              ✅ Email terkirim ke {email}
            </p>
          </div>
        )}

        <button onClick={onFinish} className="btn-accent btn-touch mt-4">
          <RotateCcw size={20} className="inline mr-2" />
          Selesai
        </button>

        <p className="text-sm mt-8" style={{ color: 'var(--color-text-muted)' }}>
          Terima kasih sudah menggunakan {config.outlet_name || 'SnapBooth'}! 📸
        </p>
      </div>
    </div>
  )
}
