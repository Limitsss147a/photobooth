import { app, shell, BrowserWindow, ipcMain, screen } from 'electron'
import { join, resolve } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { config } from 'dotenv'

// Load environment variables
config({ path: resolve(__dirname, '../../../../.env') })

// Services
import { getMidtransService } from './payment/midtrans'
import { sendPhotoEmail } from './email/resend'
import { createSession, createTransaction, updateTransactionStatus, savePhoto, getDefaultOutlet, uploadPhotoToStorage, getFrameTemplates, getDeviceConfig } from './db/supabase'
import { saveBase64Photo, compositePhotos, getPhotosDir } from './compositing'
import { printImage, getAvailablePrinters } from './printing'
import { captureDSLRPhoto } from './camera/digicam'

let mainWindow: BrowserWindow | null = null
let isKioskMode = false

function createWindow(): void {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 1024,
    minHeight: 768,
    show: false,
    frame: !isKioskMode,
    fullscreen: isKioskMode,
    kiosk: isKioskMode,
    autoHideMenuBar: true,
    icon: join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load the renderer
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ============================================================
// IPC Handlers
// ============================================================

function setupIpcHandlers(): void {
  // System - Kiosk Mode
  ipcMain.handle('system:kiosk-mode', (_event, enabled: boolean) => {
    isKioskMode = enabled
    if (mainWindow) {
      mainWindow.setKiosk(enabled)
      mainWindow.setFullScreen(enabled)
      if (enabled) {
        mainWindow.setMenuBarVisibility(false)
        mainWindow.webContents.on('before-input-event', (_e, input) => {
          if (
            (input.alt && input.key === 'F4') ||
            (input.alt && input.key === 'Tab') ||
            (input.control && input.key === 'Escape')
          ) {
            _e.preventDefault()
          }
        })
      }
    }
  })

  // Config
  ipcMain.handle('config:get', async () => {
    try {
      // 1. Fetch remote config
      const remoteConfig = await getDeviceConfig()
      // 2. Merge with defaults
      return { ...getDefaultConfig(), ...(remoteConfig || {}) }
    } catch (error) {
      console.error('[Config] Error fetching config:', error)
      return getDefaultConfig()
    }
  })

  ipcMain.handle('config:update', async (_, configData) => {
    // Since config is managed centrally in dashboard for now,
    // this could just update local state or send back to Supabase if needed.
    // We'll log it as implemented for local override scenarios.
    console.log('[Config] Updating local config:', configData)
    return { success: true }
  })

  ipcMain.handle('config:frames', async () => {
    try {
      const outlet = await getDefaultOutlet()
      return await getFrameTemplates(outlet?.id)
    } catch (e) {
      console.error('Failed to get frames:', e)
      return []
    }
  })

  // ============================================================
  // Payment Handlers (Midtrans QRIS)
  // ============================================================

  ipcMain.handle('payment:create-qris', async (_event, amount: number, sessionId: string) => {
    try {
      const midtrans = getMidtransService()
      const result = await midtrans.createQrisCharge(amount)
      console.log('[Payment] QRIS charge created:', result.orderId)
      
      // Save transaction to Supabase
      try {
        await createTransaction({
          session_id: sessionId,
          metode_bayar: 'qris',
          jumlah: amount,
          status_bayar: 'pending',
          payment_gateway_ref: result.orderId
        })
      } catch (dbErr) {
        console.error('[Payment] Failed to save transaction to DB:', dbErr)
        // Proceed anyway, payment can still complete locally
      }

      return { qrUrl: result.qrUrl, orderId: result.orderId }
    } catch (error: any) {
      console.error('[Payment] QRIS charge failed:', error.message)
      throw error
    }
  })

  ipcMain.handle('payment:check-status', async (_event, orderId: string) => {
    try {
      const midtrans = getMidtransService()
      const result = await midtrans.checkStatus(orderId)
      console.log(`[Payment] Status for ${orderId}: ${result.transactionStatus}`)
      return result.transactionStatus
    } catch (error: any) {
      console.error('[Payment] Status check failed:', error.message)
      return 'pending'
    }
  })

  ipcMain.handle('payment:cancel', async (_event, orderId: string) => {
    try {
      const midtrans = getMidtransService()
      await midtrans.cancelTransaction(orderId)
      console.log(`[Payment] Cancelled: ${orderId}`)
    } catch (error: any) {
      console.error('[Payment] Cancel failed:', error.message)
    }
  })

  // ============================================================
  // Email Handlers (Resend)
  // ============================================================

  ipcMain.handle('email:send-photo', async (_event, to: string, photoFilePath: string | null, sessionId: string) => {
    try {
      let photoUrl: string | undefined = undefined

      if (photoFilePath) {
        // Upload to Supabase Storage first to get a public download link
        console.log(`[Email] Uploading photo to storage: ${photoFilePath}`)
        const uploadedUrl = await uploadPhotoToStorage(photoFilePath)
        if (uploadedUrl) {
          photoUrl = uploadedUrl
          
          // Also save to database
          await savePhoto({
            session_id: sessionId || `session_${Date.now()}`, // fallback if no active session tracking
            file_url: uploadedUrl,
            file_local_path: photoFilePath,
            is_composited: true
          })
        }
      }

      const result = await sendPhotoEmail({
        to,
        outletName: getDefaultConfig().outlet_name,
        photoFilePath: photoFilePath || undefined,
        photoUrl
      })
      console.log(`[Email] Sent to ${to}: ${result.success ? 'OK' : result.error}`)
      return result
    } catch (error: any) {
      console.error('[Email] Send failed:', error.message)
      return { success: false, error: error.message }
    }
  })

  // ============================================================
  // Camera Handlers
  // ============================================================

  ipcMain.handle('camera:connect', async () => {
    return { success: true, type: 'dslr' as const }
  })

  ipcMain.handle('camera:capture', async (_event, sessionId: string, index: number) => {
    try {
      const filePath = await captureDSLRPhoto(sessionId, index)
      return { success: true, filePath }
    } catch (error: any) {
      console.error('[Camera] Capture failed:', error.message)
      return { success: false, error: error.message }
    }
  })

  // ============================================================
  // Compositing Handlers (NEW)
  // ============================================================

  ipcMain.handle('compositing:save-photo', async (_event, dataUrl: string, sessionId: string, index: number) => {
    try {
      const filePath = await saveBase64Photo(dataUrl, sessionId, index)
      console.log(`[Compositing] Photo saved: ${filePath}`)
      return filePath
    } catch (error: any) {
      console.error('[Compositing] Save failed:', error.message)
      return null
    }
  })

  ipcMain.handle('compositing:process', async (_event, options: {
    photoPaths: string[]
    filter: string
    frameId: string
    sessionId: string
  }) => {
    try {
      const outputPath = await compositePhotos(options)
      console.log(`[Compositing] Final image: ${outputPath}`)
      return outputPath
    } catch (error: any) {
      console.error('[Compositing] Process failed:', error.message)
      return null
    }
  })

  ipcMain.handle('compositing:get-output-dir', async () => {
    return getPhotosDir()
  })

  // ============================================================
  // Printer Handlers (UPDATED)
  // ============================================================

  ipcMain.handle('printer:print', async (_event, imagePath: string, copies: number) => {
    try {
      const result = await printImage(imagePath, copies)
      console.log(`[Printer] Print result: ${result.success ? 'OK' : result.error}`)
      return result
    } catch (error: any) {
      console.error('[Printer] Print failed:', error.message)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('printer:status', async () => {
    if (!mainWindow) return 'offline'
    try {
      const printers = await getAvailablePrinters(mainWindow)
      const defaultPrinter = printers.find(p => p.isDefault)
      return defaultPrinter ? 'ready' : 'no_printer'
    } catch {
      return 'offline'
    }
  })

  ipcMain.handle('printer:list', async () => {
    if (!mainWindow) return []
    try {
      return await getAvailablePrinters(mainWindow)
    } catch {
      return []
    }
  })

  // ============================================================
  // Database Handlers (Supabase)
  // ============================================================

  ipcMain.handle('db:create-session', async (_event, eventId: string | null) => {
    try {
      const session = await createSession(null, eventId)
      console.log('[DB] Session created:', session.id)
      return session
    } catch (error: any) {
      console.error('[DB] Create session failed:', error.message)
      return null
    }
  })

  ipcMain.handle('db:create-transaction', async (_event, data: any) => {
    try {
      const txn = await createTransaction(data)
      console.log('[DB] Transaction created:', txn.id)
      return txn
    } catch (error: any) {
      console.error('[DB] Create transaction failed:', error.message)
      return null
    }
  })

  ipcMain.handle('db:update-payment-status', async (_event, sessionId: string, status: string) => {
    try {
      await updateTransactionStatus(sessionId, status)
      console.log(`[DB] Transaction status updated: ${sessionId} → ${status}`)
    } catch (error: any) {
      console.error('[DB] Update status failed:', error.message)
    }
  })

  ipcMain.handle('db:save-photo', async (_event, data: any) => {
    try {
      const photo = await savePhoto(data)
      console.log('[DB] Photo saved:', photo.id)
      return photo
    } catch (error: any) {
      console.error('[DB] Save photo failed:', error.message)
      return null
    }
  })
}

function getDefaultConfig() {
  return {
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
    attract_screen_subtitle: 'Create beautiful memories today',
    default_print_size: '4x6',
    copies_per_session: 1
  }
}

// ============================================================
// App Lifecycle
// ============================================================

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.snapbooth.desktop')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  setupIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
