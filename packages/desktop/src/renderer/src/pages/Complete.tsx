import { useState } from 'react'
import { Mail, PartyPopper, RotateCcw } from 'lucide-react'
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
        session.compositedImagePath || null
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
    <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--gradient-surface)' }}>
      <div className="text-center max-w-2xl animate-scale-in">
        <div className="text-8xl mb-6">🎉</div>
        <h2 className="text-4xl font-black mb-3" style={{
          background: 'var(--gradient-primary)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Foto Sudah Siap!
        </h2>
        <p className="text-xl text-[var(--color-text-secondary)] mb-10">
          Ambil hasil cetak di bawah dan masukkan email untuk menerima softfile
        </p>

        {!emailSent ? (
          <div className="glass-card p-8 max-w-md mx-auto mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Mail size={24} className="text-[var(--color-primary-light)]" />
              <h3 className="text-lg font-bold">Kirim ke Email</h3>
            </div>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full px-5 py-4 text-lg rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none mb-4"
            />
            <button
              onClick={handleSendEmail}
              disabled={!email || sending}
              className={`btn-primary w-full ${(!email || sending) ? 'opacity-50' : ''}`}
            >
              {sending ? 'Mengirim...' : 'Kirim Softfile 📧'}
            </button>
            {emailError && (
              <p className="text-[var(--color-error)] text-sm mt-3">{emailError}</p>
            )}
          </div>
        ) : (
          <div className="glass-card p-6 max-w-md mx-auto mb-8 border-[var(--color-success)]">
            <p className="text-[var(--color-success)] font-bold text-lg">
              ✅ Email terkirim ke {email}
            </p>
          </div>
        )}

        <button onClick={onFinish} className="btn-secondary btn-touch mt-4">
          <RotateCcw size={20} />
          Selesai
        </button>

        <p className="text-[var(--color-text-muted)] text-sm mt-8">
          Terima kasih sudah menggunakan {config.outlet_name}! 📸
        </p>
      </div>
    </div>
  )
}
