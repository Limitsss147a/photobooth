import { useState, useEffect, useCallback } from 'react'
import AttractScreen from './pages/AttractScreen'
import SelectPackage from './pages/SelectPackage'
import Payment from './pages/Payment'
import CaptureSession from './pages/CaptureSession'
import SelectFilter from './pages/SelectFilter'
import SelectFrame from './pages/SelectFrame'
import Processing from './pages/Processing'
import Complete from './pages/Complete'
import type { BoothConfig, FilterType } from '@snapbooth/shared'

// Application flow stages
type AppStage =
  | 'attract'       // Idle/attract screen
  | 'select-package'// Choose photo package
  | 'payment'       // Pay via QRIS or cash
  | 'capture'       // Live view + countdown + capture
  | 'select-filter' // Choose filter
  | 'select-frame'  // Choose frame design
  | 'processing'    // Compositing + printing
  | 'complete'      // Done, show result

interface SessionData {
  packagePrice: number
  paymentMethod: 'qris' | 'cash' | null
  orderId: string | null
  capturedPhotos: string[]
  selectedFilter: FilterType
  selectedFrameId: string | null
  guestEmail: string
  compositedImagePath: string | null
}

const initialSessionData: SessionData = {
  packagePrice: 0,
  paymentMethod: null,
  orderId: null,
  capturedPhotos: [],
  selectedFilter: 'none',
  selectedFrameId: null,
  guestEmail: '',
  compositedImagePath: null
}

export default function App() {
  const [stage, setStage] = useState<AppStage>('attract')
  const [config, setConfig] = useState<BoothConfig | null>(null)
  const [session, setSession] = useState<SessionData>(initialSessionData)
  const [idleTimer, setIdleTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  // Load config on startup
  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      // @ts-ignore - snapbooth is exposed via preload
      const cfg = await window.snapbooth?.config?.get()
      if (cfg) {
        setConfig(cfg)
        return
      }
    } catch (err) {
      console.error('Failed to load config:', err)
    }
    // Use defaults (browser context or Electron config failure)
    setConfig({
      countdown_seconds: 5,
      photos_per_session: 1,
      max_retakes: 2,
      session_timeout_seconds: 180,
      idle_timeout_seconds: 60,
      camera_type: 'webcam',
      camera_rotation: 0,
      base_price: 10000,
      accept_cash: true,
      accept_qris: true,
      qris_timeout_seconds: 900,
      enabled_filters: ['none', 'bw', 'sepia', 'vintage', 'warm', 'cool', 'vivid', 'fade', 'beauty'],
      outlet_name: 'SnapBooth',
      logo_url: null,
      theme_color: '#6366f1',
      attract_screen_text: 'Sentuh layar untuk mulai!',
      default_print_size: '4x6',
      copies_per_session: 1
    } as BoothConfig)
  }

  // Reset idle timer on any interaction
  const resetIdleTimer = useCallback(() => {
    if (idleTimer) clearTimeout(idleTimer)
    if (stage !== 'attract' && config) {
      const timer = setTimeout(() => {
        // Return to attract screen after idle
        resetSession()
      }, config.session_timeout_seconds * 1000)
      setIdleTimer(timer)
    }
  }, [stage, config, idleTimer])

  useEffect(() => {
    resetIdleTimer()
    return () => {
      if (idleTimer) clearTimeout(idleTimer)
    }
  }, [stage])

  const resetSession = () => {
    setSession(initialSessionData)
    setStage('attract')
  }

  const updateSession = (updates: Partial<SessionData>) => {
    setSession(prev => ({ ...prev, ...updates }))
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--color-text-secondary)] text-lg">Memuat SnapBooth...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative overflow-hidden" onClick={resetIdleTimer}>
      {/* Background glow effect */}
      <div className="bg-glow" />

      {/* Stage renderer */}
      <div className="relative z-10 w-full h-full">
        {stage === 'attract' && (
          <AttractScreen
            config={config}
            onStart={() => setStage('select-package')}
          />
        )}

        {stage === 'select-package' && (
          <SelectPackage
            config={config}
            onSelect={(price) => {
              updateSession({ packagePrice: price })
              setStage('payment')
            }}
            onBack={() => setStage('attract')}
          />
        )}

        {stage === 'payment' && (
          <Payment
            config={config}
            amount={session.packagePrice}
            onPaymentComplete={(method, orderId) => {
              updateSession({ paymentMethod: method, orderId })
              setStage('capture')
            }}
            onBack={() => setStage('select-package')}
          />
        )}

        {stage === 'capture' && (
          <CaptureSession
            config={config}
            onCapture={(photos) => {
              updateSession({ capturedPhotos: photos })
              setStage('select-filter')
            }}
          />
        )}

        {stage === 'select-filter' && (
          <SelectFilter
            config={config}
            photos={session.capturedPhotos}
            onSelect={(filter) => {
              updateSession({ selectedFilter: filter })
              setStage('select-frame')
            }}
          />
        )}

        {stage === 'select-frame' && (
          <SelectFrame
            config={config}
            onSelect={(frameId) => {
              updateSession({ selectedFrameId: frameId })
              setStage('processing')
            }}
          />
        )}

        {stage === 'processing' && (
          <Processing
            session={session}
            config={config}
            onComplete={(imagePath) => {
              updateSession({ compositedImagePath: imagePath })
              setStage('complete')
            }}
          />
        )}

        {stage === 'complete' && (
          <Complete
            session={session}
            config={config}
            onFinish={resetSession}
          />
        )}
      </div>

      {/* Status bar (dev mode only) */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/80 text-xs text-[var(--color-text-muted)] p-2 flex gap-4 z-50">
          <span>Stage: <b className="text-[var(--color-primary-light)]">{stage}</b></span>
          <span>Price: Rp {session.packagePrice.toLocaleString()}</span>
          <span>Photos: {session.capturedPhotos.length}</span>
          <span>Filter: {session.selectedFilter}</span>
        </div>
      )}
    </div>
  )
}
