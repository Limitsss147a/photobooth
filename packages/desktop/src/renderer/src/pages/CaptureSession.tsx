import { useState, useEffect, useRef, useCallback } from 'react'
import { Camera, RotateCcw } from 'lucide-react'
import type { BoothConfig } from '@snapbooth/shared'

interface Props {
  config: BoothConfig
  sessionId: string
  onCapture: (photos: string[]) => void
}

type CaptureState = 'preview' | 'countdown' | 'flash' | 'review'

export default function CaptureSession({ config, sessionId, onCapture }: Props) {
  const [state, setState] = useState<CaptureState>('preview')
  const [countdown, setCountdown] = useState(config.countdown_seconds)
  const [photos, setPhotos] = useState<string[]>([])
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null)
  const [retakesLeft, setRetakesLeft] = useState(config.max_retakes)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Setup camera on mount
  useEffect(() => {
    if (config.camera_type !== 'webcam') {
      // For DSLR via DigiCamControl, live view is polled from the local web server
      let isMounted = true
      const updateLiveView = () => {
        if (!isMounted || state !== 'preview') return
        const img = new Image()
        img.onload = () => {
          if (videoRef.current) {
            videoRef.current.style.backgroundImage = `url(${img.src})`
            videoRef.current.style.backgroundSize = 'cover'
            videoRef.current.style.backgroundPosition = 'center'
          }
          setTimeout(updateLiveView, 100) // Poll at 10fps
        }
        img.onerror = () => {
          setTimeout(updateLiveView, 500) // Retry slower on error
        }
        img.src = `http://localhost:5513/liveview.jpg?t=${Date.now()}`
      }
      updateLiveView()

      return () => { isMounted = false }
    } else {
      // Standard Webcam fallback
      startCamera()
      return () => stopCamera()
    }
  }, [config.camera_type, state])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'user'
        },
        audio: false
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error('Camera access failed:', err)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  const startCountdown = useCallback(() => {
    setState('countdown')
    let count = config.countdown_seconds

    const interval = setInterval(() => {
      count--
      setCountdown(count)

      if (count <= 0) {
        clearInterval(interval)
        capturePhoto()
      }
    }, 1000)
  }, [config.countdown_seconds])

  const capturePhoto = async () => {
    setState('flash')

    if (config.camera_type !== 'webcam') {
      try {
        // @ts-ignore
        const api = window.snapbooth
        
        // Trigger capture via main process (DigiCamControl)
        const result = await api.camera.capture(sessionId, photos.length)
        
        if (result.success) {
          // Pass the absolute file path, processing page will handle it
          setCurrentPhoto(`file://${result.filePath.replace(/\\/g, '/')}`)
        } else {
          console.error('DSLR Capture failed:', result.error)
          alert('Gagal mengambil foto dari kamera (DSLR Error)')
        }
      } catch (err) {
        console.error('DSLR Capture exception:', err)
      }
    } else {
      // Capture from webcam video
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current
        const canvas = canvasRef.current
        canvas.width = video.videoWidth || 1920
        canvas.height = video.videoHeight || 1080
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.save()
          // Move to center
          ctx.translate(canvas.width / 2, canvas.height / 2)
          // Flip horizontally to match the mirrored video preview
          ctx.scale(-1, 1)
          
          if (config.camera_rotation) {
            ctx.rotate((config.camera_rotation * Math.PI) / 180)
          }
          
          ctx.drawImage(video, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height)
          ctx.restore()
          const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
          setCurrentPhoto(dataUrl)
        }
      }
    }

    // Flash effect then review
    setTimeout(() => {
      setState('review')
      setCountdown(config.countdown_seconds)
    }, 500) // Give it a bit more time for DSLR transfer
  }

  const acceptPhoto = () => {
    if (currentPhoto) {
      const newPhotos = [...photos, currentPhoto]
      setPhotos(newPhotos)

      if (newPhotos.length >= config.photos_per_session) {
        // All photos taken, proceed
        onCapture(newPhotos)
      } else {
        // More photos needed
        setCurrentPhoto(null)
        setState('preview')
      }
    }
  }

  const retakePhoto = () => {
    if (retakesLeft > 0) {
      setRetakesLeft(prev => prev - 1)
      setCurrentPhoto(null)
      setState('preview')
    }
  }

  return (
    <div className="w-full h-full flex flex-col relative" style={{ background: '#000' }}>
      {/* Camera preview */}
      <div className="flex-1 relative overflow-hidden">
        {config.camera_type !== 'webcam' ? (
          <div
            ref={videoRef as any}
            className={`w-full h-full ${state === 'review' ? 'hidden' : ''}`}
            style={{
              backgroundColor: '#111',
              transform: config.camera_rotation ? `rotate(${config.camera_rotation}deg)` : undefined
            }}
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${state === 'review' ? 'hidden' : ''}`}
            style={{
              transform: `scaleX(-1) ${config.camera_rotation ? `rotate(${config.camera_rotation}deg)` : ''}`
            }}
          />
        )}
        <canvas ref={canvasRef} className="hidden" />

        {/* Captured photo review */}
        {state === 'review' && currentPhoto && (
          <img
            src={currentPhoto}
            alt="Captured"
            className="w-full h-full object-cover animate-scale-in"
          />
        )}

        {/* Flash effect */}
        {state === 'flash' && (
          <div
            className="absolute inset-0 bg-white z-50"
            style={{ animation: 'flashEffect 0.3s ease-out forwards' }}
          />
        )}

        {/* Countdown overlay */}
        {state === 'countdown' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-40">
            <span className="countdown">{countdown}</span>
          </div>
        )}

        {/* Photo counter */}
        <div className="absolute top-6 right-6 glass-card px-5 py-3 z-30">
          <span className="text-lg font-bold">
            📸 {photos.length + (state === 'review' ? 1 : 0)} / {config.photos_per_session}
          </span>
        </div>

        {/* Guide frame overlay */}
        {state === 'preview' && (
          <div className="absolute inset-0 pointer-events-none z-20">
            <div className="absolute inset-[8%] border-2 border-white/20 rounded-[32px]" />
            {/* Corner markers */}
            <div className="absolute top-[8%] left-[8%] w-12 h-12 border-t-3 border-l-3 border-white/50 rounded-tl-2xl" />
            <div className="absolute top-[8%] right-[8%] w-12 h-12 border-t-3 border-r-3 border-white/50 rounded-tr-2xl" />
            <div className="absolute bottom-[8%] left-[8%] w-12 h-12 border-b-3 border-l-3 border-white/50 rounded-bl-2xl" />
            <div className="absolute bottom-[8%] right-[8%] w-12 h-12 border-b-3 border-r-3 border-white/50 rounded-br-2xl" />
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 p-8 z-30">
        <div className="flex items-center justify-center gap-6">
          {state === 'preview' && (
            <button
              onClick={startCountdown}
              className="w-24 h-24 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              style={{
                background: 'var(--gradient-primary)',
                boxShadow: '0 0 40px rgba(99,102,241,0.5)'
              }}
            >
              <Camera size={40} color="white" />
            </button>
          )}

          {state === 'review' && (
            <>
              {retakesLeft > 0 && (
                <button onClick={retakePhoto} className="btn-secondary btn-touch">
                  <RotateCcw size={24} />
                  Ulang ({retakesLeft})
                </button>
              )}
              <button onClick={acceptPhoto} className="btn-primary btn-touch">
                ✓ Gunakan Foto Ini
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes flashEffect {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
