/**
 * SnapBooth — Print Service
 * 
 * Uses Electron's built-in webContents.print() to send
 * the composited image to the system's default printer.
 */

import { BrowserWindow } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'

/**
 * Print an image file using a hidden BrowserWindow
 */
export async function printImage(
  imagePath: string,
  copies: number = 1,
  printerName?: string
): Promise<{ success: boolean; error?: string }> {
  if (!existsSync(imagePath)) {
    return { success: false, error: `File not found: ${imagePath}` }
  }

  return new Promise((resolve) => {
    // Create a hidden window to load and print the image
    const printWindow = new BrowserWindow({
      show: false,
      width: 1800,
      height: 1200,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    })

    // Load an HTML page that shows only the image
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: 100%; height: 100%; overflow: hidden; }
          body {
            display: flex;
            align-items: center;
            justify-content: center;
            background: white;
          }
          img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }
          @media print {
            @page { margin: 0; size: 4in 6in; }
            body { margin: 0; }
            img { width: 100%; height: 100%; object-fit: cover; }
          }
        </style>
      </head>
      <body>
        <img src="file://${imagePath.replace(/\\/g, '/')}" />
      </body>
      </html>
    `

    printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)

    printWindow.webContents.on('did-finish-load', () => {
      // Small delay to ensure image is rendered
      setTimeout(() => {
        const printOptions: Electron.WebContentsPrintOptions = {
          silent: true,        // Skip print dialog (direct to printer)
          printBackground: true,
          copies: copies,
          margins: { marginType: 'none' },
          pageSize: { width: 101600, height: 152400 } // 4x6 inches in microns
        }

        if (printerName) {
          printOptions.deviceName = printerName
        }

        printWindow.webContents.print(printOptions, (success, failureReason) => {
          printWindow.close()

          if (success) {
            console.log(`[Printer] Printed ${copies} copies of ${imagePath}`)
            resolve({ success: true })
          } else {
            console.error(`[Printer] Print failed: ${failureReason}`)
            resolve({ success: false, error: failureReason || 'Unknown print error' })
          }
        })
      }, 500)
    })

    printWindow.webContents.on('did-fail-load', () => {
      printWindow.close()
      resolve({ success: false, error: 'Failed to load print content' })
    })
  })
}

/**
 * Get list of available printers
 */
export async function getAvailablePrinters(mainWindow: BrowserWindow): Promise<Electron.PrinterInfo[]> {
  return mainWindow.webContents.getPrintersAsync()
}
