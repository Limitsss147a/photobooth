import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, QrCode, Banknote, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import type { BoothConfig } from '@snapbooth/shared'

interface Props {
  config: BoothConfig
  amount: number
  onPaymentComplete: (method: 'qris' | 'cash', orderId: string | null) => void
  onBack: () => void
}

type PaymentState = 'select-method' | 'qris-waiting' | 'cash-input' | 'success' | 'failed'

export default function Payment({ config, amount, onPaymentComplete, onBack }: Props) {
  const [state, setState] = useState<PaymentState>('select-method')
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(config.qris_timeout_seconds || 900)
  const [ticketCode, setTicketCode] = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  const startQrisPayment = async () => {
    setState('qris-waiting')

    try {
      // @ts-ignore
      const result = await window.snapbooth?.payment.createQris(amount)
      if (result) {
        setQrUrl(result.qrUrl)
        setOrderId(result.orderId)
        startTimer()
        startPolling(result.orderId)
      }
    } catch (err) {
      console.error('QRIS creation failed:', err)
      // Demo mode: show a placeholder QR
      setQrUrl('demo-qr')
      setOrderId('DEMO-' + Date.now())
      startTimer()
    }
  }

  const startTimer = () => {
    const deadline = Date.now() + (config.qris_timeout_seconds || 900) * 1000
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.floor((deadline - Date.now()) / 1000))
      setTimeLeft(remaining)
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current)
        if (pollingRef.current) clearInterval(pollingRef.current)
        setState('failed')
      }
    }, 1000)
  }

  const startPolling = (oid: string) => {
    pollingRef.current = setInterval(async () => {
      try {
        // @ts-ignore
        const status = await window.snapbooth?.payment.checkStatus(oid)
        if (status === 'settlement') {
          if (pollingRef.current) clearInterval(pollingRef.current)
          if (timerRef.current) clearInterval(timerRef.current)
          setState('success')
          setTimeout(() => onPaymentComplete('qris', oid), 2000)
        }
      } catch {
        // Continue polling
      }
    }, 3000)
  }

  const handleCashPayment = () => {
    // In demo/single-outlet mode, just proceed
    setState('success')
    setTimeout(() => onPaymentComplete('cash', null), 2000)
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="w-full h-full flex flex-col" style={{ background: 'var(--gradient-surface)' }}>
      {/* Header */}
      <div className="flex items-center px-8 pt-8 pb-4">
        {state === 'select-method' && (
          <button onClick={onBack} className="btn-secondary p-4 rounded-full">
            <ArrowLeft size={24} />
          </button>
        )}
        <div className="flex-1 text-center">
          <h2 className="text-3xl font-bold">Pembayaran</h2>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Total: <span className="text-[var(--color-primary-light)] font-bold text-xl">Rp {amount.toLocaleString('id-ID')}</span>
          </p>
        </div>
        {state === 'select-method' && <div className="w-14" />}
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-12">
        {/* Method Selection */}
        {state === 'select-method' && (
          <div className="flex gap-12 animate-scale-in">
            {/* QRIS */}
            {config.accept_qris && (
              <button
                onClick={startQrisPayment}
                className="glass-card p-12 text-center cursor-pointer hover:border-[var(--color-primary)] transition-all duration-300 hover:scale-105 group w-[350px]"
              >
                <div
                  className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6 transition-all group-hover:shadow-[var(--shadow-glow)]"
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  <QrCode size={56} color="white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">QRIS</h3>
                <p className="text-[var(--color-text-secondary)]">
                  Scan QR dengan GoPay, OVO, DANA, ShopeePay, atau e-wallet lainnya
                </p>
              </button>
            )}

            {/* Cash */}
            {config.accept_cash && (
              <button
                onClick={() => setState('cash-input')}
                className="glass-card p-12 text-center cursor-pointer hover:border-[var(--color-primary)] transition-all duration-300 hover:scale-105 group w-[350px]"
              >
                <div
                  className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6 transition-all group-hover:shadow-[var(--shadow-glow-accent)]"
                  style={{ background: 'var(--gradient-accent)' }}
                >
                  <Banknote size={56} color="white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Tunai</h3>
                <p className="text-[var(--color-text-secondary)]">
                  Bayar tunai ke operator atau masukkan kode tiket
                </p>
              </button>
            )}
          </div>
        )}

        {/* QRIS Waiting */}
        {state === 'qris-waiting' && (
          <div className="text-center animate-scale-in">
            <div className="qr-container mx-auto mb-8 inline-block">
              {qrUrl === 'demo-qr' ? (
                <div className="w-[280px] h-[280px] bg-gray-100 rounded-xl flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <QrCode size={120} className="mx-auto mb-3 text-gray-400" />
                    <p className="text-sm font-medium">QR Code akan muncul di sini</p>
                    <p className="text-xs">Demo Mode</p>
                  </div>
                </div>
              ) : (
                <img src={qrUrl || ''} alt="QR Code" className="w-[280px] h-[280px]" />
              )}
            </div>

            <h3 className="text-2xl font-bold mb-2">Scan QR Code untuk Membayar</h3>
            <p className="text-[var(--color-text-secondary)] mb-6">
              Gunakan GoPay, OVO, DANA, ShopeePay, atau e-wallet lainnya
            </p>

            <div className="flex items-center justify-center gap-3 text-xl mb-8">
              <Clock size={24} className="text-[var(--color-warning)]" />
              <span className={`font-mono font-bold ${timeLeft < 60 ? 'text-[var(--color-error)]' : 'text-[var(--color-text)]'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>

            <div className="flex items-center justify-center gap-2 text-[var(--color-text-muted)]">
              <Loader2 size={18} className="animate-spin" />
              <span>Menunggu pembayaran...</span>
            </div>

            <button
              onClick={() => {
                if (timerRef.current) clearInterval(timerRef.current)
                if (pollingRef.current) clearInterval(pollingRef.current)
                setState('select-method')
              }}
              className="btn-secondary mt-8"
            >
              Batal
            </button>

            {/* Demo: simulate payment button */}
            {import.meta.env.DEV && (
              <button
                onClick={() => {
                  if (timerRef.current) clearInterval(timerRef.current)
                  if (pollingRef.current) clearInterval(pollingRef.current)
                  setState('success')
                  setTimeout(() => onPaymentComplete('qris', orderId), 2000)
                }}
                className="btn-primary mt-4 text-sm"
              >
                [DEV] Simulasi Bayar Berhasil
              </button>
            )}
          </div>
        )}

        {/* Cash Input */}
        {state === 'cash-input' && (
          <div className="text-center animate-scale-in max-w-md">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: 'var(--gradient-accent)' }}
            >
              <Banknote size={48} color="white" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Pembayaran Tunai</h3>
            <p className="text-[var(--color-text-secondary)] mb-8">
              Masukkan kode tiket atau minta operator untuk konfirmasi pembayaran tunai.
            </p>

            <input
              type="text"
              value={ticketCode}
              onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
              placeholder="Masukkan kode tiket..."
              className="w-full px-6 py-4 text-xl text-center font-mono rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 mb-6"
            />

            <div className="flex gap-4">
              <button
                onClick={() => setState('select-method')}
                className="btn-secondary flex-1 py-4"
              >
                Kembali
              </button>
              <button
                onClick={handleCashPayment}
                className="btn-primary flex-1 py-4"
              >
                Konfirmasi
              </button>
            </div>
          </div>
        )}

        {/* Success */}
        {state === 'success' && (
          <div className="text-center animate-scale-in">
            <div
              className="w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8"
              style={{ background: 'linear-gradient(135deg, #22c55e 0%, #34d399 100%)', boxShadow: '0 0 40px rgba(34,197,94,0.3)' }}
            >
              <CheckCircle size={72} color="white" />
            </div>
            <h3 className="text-3xl font-bold mb-3 text-[var(--color-success)]">Pembayaran Berhasil! 🎉</h3>
            <p className="text-xl text-[var(--color-text-secondary)]">Bersiaplah untuk berfoto...</p>
          </div>
        )}

        {/* Failed */}
        {state === 'failed' && (
          <div className="text-center animate-scale-in">
            <div
              className="w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8"
              style={{ background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)', boxShadow: '0 0 40px rgba(239,68,68,0.3)' }}
            >
              <XCircle size={72} color="white" />
            </div>
            <h3 className="text-3xl font-bold mb-3 text-[var(--color-error)]">Pembayaran Gagal</h3>
            <p className="text-xl text-[var(--color-text-secondary)] mb-8">Waktu pembayaran telah habis</p>
            <button onClick={() => setState('select-method')} className="btn-primary">
              Coba Lagi
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
