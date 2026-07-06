import { app, shell, BrowserWindow, ipcMain, screen } from 'electron'
import { join, resolve } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { config } from 'dotenv'

// Load environment variables
config({ path: resolve(__dirname, '../../../../.env') })

// Services
import { getMidtransService } from './payment/midtrans'
import { sendPhotoEmail } from './email/resend'

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
      preload: join(__dirname, '../preload/index.mjs'),
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
    // TODO: Load from SQLite / Supabase sync
    return getDefaultConfig()
  })

  // ============================================================
  // Payment Handlers (Midtrans QRIS)
  // ============================================================

  ipcMain.handle('payment:create-qris', async (_event, amount: number) => {
    try {
      const midtrans = getMidtransService()
      const result = await midtrans.createQrisCharge(amount)
      console.log('[Payment] QRIS charge created:', result.orderId)
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
      return 'pending' // Default to pending on error
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

  ipcMain.handle('email:send-photo', async (_event, to: string, photoFilePath: string | null) => {
    try {
      const result = await sendPhotoEmail({
        to,
        outletName: getDefaultConfig().outlet_name,
        photoFilePath: photoFilePath || undefined
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
    // Webcam fallback — camera handled by renderer via MediaDevices API
    return { success: true, type: 'webcam' as const }
  })

  ipcMain.handle('camera:capture', async () => {
    // Capture handled by renderer canvas — this is a placeholder
    return { filePath: '' }
  })

  // ============================================================
  // Printer Handlers
  // ============================================================

  ipcMain.handle('printer:print', async (_event, imagePath: string, copies: number) => {
    try {
      // Use Electron's built-in print functionality
      if (mainWindow) {
        // For now, print the current window content
        // TODO: Create a hidden print window with the composited image
        console.log(`[Printer] Print requested: ${imagePath}, copies: ${copies}`)
        return { success: true }
      }
      return { success: false }
    } catch (error: any) {
      console.error('[Printer] Print failed:', error.message)
      return { success: false }
    }
  })

  ipcMain.handle('printer:status', async () => {
    return 'ready'
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
