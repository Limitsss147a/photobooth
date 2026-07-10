import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
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
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

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

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative" style={{ background: 'var(--gradient-surface)' }}>
      {/* Background glow orbs */}
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

      <div className="text-center max-w-2xl z-10 animate-scale-in px-8">
        {/* Success icon with glow */}
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
          <RotateCcw size={20} />
          Selesai
        </button>

        <p className="text-sm mt-8" style={{ color: 'var(--color-text-muted)' }}>
          Terima kasih sudah menggunakan {config.outlet_name || 'SnapBooth'}! 📸
        </p>
      </div>
    </div>
  )
}
