import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs exposed to renderer via contextBridge
const snapboothApi = {
  // Camera
  camera: {
    connect: () => ipcRenderer.invoke('camera:connect'),
    disconnect: () => ipcRenderer.invoke('camera:disconnect'),
    startLiveView: () => ipcRenderer.invoke('camera:start-live-view'),
    stopLiveView: () => ipcRenderer.invoke('camera:stop-live-view'),
    capture: () => ipcRenderer.invoke('camera:capture'),
    getStatus: () => ipcRenderer.invoke('camera:status'),
    onFrame: (callback: (frame: ArrayBuffer) => void) => {
      ipcRenderer.on('camera:frame', (_event, frame) => callback(frame))
    }
  },

  // Printer
  printer: {
    print: (imagePath: string, copies: number) =>
      ipcRenderer.invoke('printer:print', imagePath, copies),
    getStatus: () => ipcRenderer.invoke('printer:status')
  },

  // Payment
  payment: {
    createQris: (amount: number) => ipcRenderer.invoke('payment:create-qris', amount),
    checkStatus: (orderId: string) => ipcRenderer.invoke('payment:check-status', orderId),
    cancel: (orderId: string) => ipcRenderer.invoke('payment:cancel', orderId),
    onStatusUpdate: (callback: (status: string) => void) => {
      ipcRenderer.on('payment:status-update', (_event, status) => callback(status))
    }
  },

  // Config
  config: {
    get: () => ipcRenderer.invoke('config:get'),
    update: (config: Record<string, unknown>) => ipcRenderer.invoke('config:update', config)
  },

  // Sync
  sync: {
    getStatus: () => ipcRenderer.invoke('sync:status'),
    force: () => ipcRenderer.invoke('sync:force')
  },

  // System
  system: {
    setKioskMode: (enabled: boolean) => ipcRenderer.invoke('system:kiosk-mode', enabled)
  }
}

// Expose APIs to renderer
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('snapbooth', snapboothApi)
  } catch (error) {
    console.error('Failed to expose APIs:', error)
  }
} else {
  // @ts-ignore - fallback for non-isolated context
  window.electron = electronAPI
  // @ts-ignore
  window.snapbooth = snapboothApi
}
