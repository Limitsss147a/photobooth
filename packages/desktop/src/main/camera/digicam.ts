import { app } from 'electron'
import { join } from 'path'
import { writeFileSync, existsSync, mkdirSync } from 'fs'

const DIGICAM_URL = 'http://localhost:5513'

/**
 * Trigger camera capture via DigiCamControl Web API
 * and download the resulting full-resolution image.
 */
export async function captureDSLRPhoto(sessionId: string, index: number): Promise<string> {
  try {
    console.log(`[DigiCam] Triggering capture ${index + 1}...`)
    
    // 1. Send the capture command
    const captureRes = await fetch(`${DIGICAM_URL}/?slc=capture`)
    if (!captureRes.ok) {
      throw new Error(`Failed to trigger capture. Status: ${captureRes.status}`)
    }

    // 2. Wait for the camera to take the photo and transfer it via USB.
    // DSLR processing and transfer usually takes 1-3 seconds depending on the camera.
    await new Promise(resolve => setTimeout(resolve, 2500))

    // 3. Fetch the last taken image
    console.log('[DigiCam] Downloading full resolution image...')
    const imageRes = await fetch(`${DIGICAM_URL}/image/last`)
    if (!imageRes.ok) {
      throw new Error(`Failed to fetch last image. Status: ${imageRes.status}`)
    }

    // 4. Save to local temp directory
    const arrayBuffer = await imageRes.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const dir = join(app.getPath('userData'), 'temp_captures', sessionId)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    const filePath = join(dir, `capture_${index + 1}.jpg`)
    writeFileSync(filePath, buffer)
    
    console.log(`[DigiCam] Photo saved to: ${filePath}`)
    return filePath

  } catch (error: any) {
    console.error('[DigiCam] Camera capture error:', error.message)
    throw new Error('Gagal mengambil foto dari kamera. Pastikan DigiCamControl berjalan.')
  }
}
