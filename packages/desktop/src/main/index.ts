import { app, shell, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

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
      // Block keyboard shortcuts in kiosk mode
      if (enabled) {
        mainWindow.setMenuBarVisibility(false)
        mainWindow.webContents.on('before-input-event', (_e, input) => {
          // Block Alt+F4, Alt+Tab, Ctrl+Esc, Win key
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

  // Camera - placeholder handlers
  ipcMain.handle('camera:connect', async () => {
    // TODO: Implement via native bridge
    return { success: true, type: 'webcam' as const }
  })

  ipcMain.handle('camera:capture', async () => {
    // TODO: Implement via native bridge
    return { filePath: '' }
  })

  // Printer - placeholder handlers
  ipcMain.handle('printer:print', async (_event, _imagePath: string, _copies: number) => {
    // TODO: Implement via Windows Print Spooler
    return { success: true }
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
    enabled_filters: ['none', 'bw', 'sepia', 'vintage', 'warm', 'cool'],
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
