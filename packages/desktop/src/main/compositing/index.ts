/**
 * SnapBooth — Image Compositing Service
 * 
 * Handles:
 * 1. Saving captured photos (base64 data URL → file)
 * 2. Applying CSS-equivalent filters using sharp
 * 3. Compositing photos onto frame templates
 * 4. Output: print-ready 4×6 image (1800×1200px @ 300dpi)
 */

import sharp, { OverlayOptions } from 'sharp'
import { join } from 'path'
import { mkdirSync, existsSync, writeFileSync } from 'fs'
import { app } from 'electron'

// Output directory for photos
function getOutputDir(): string {
  const dir = join(app.getPath('userData'), 'photos')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

function getSessionDir(sessionId: string): string {
  const dir = join(getOutputDir(), sessionId)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

/**
 * Save a base64 data URL to a JPEG file
 */
export async function saveBase64Photo(
  dataUrl: string,
  sessionId: string,
  index: number
): Promise<string> {
  const dir = getSessionDir(sessionId)
  const filename = `photo_${index + 1}.jpg`
  const filePath = join(dir, filename)

  // Strip the data URL prefix
  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '')
  const buffer = Buffer.from(base64Data, 'base64')

  // Process with sharp: normalize, ensure JPEG, high quality
  await sharp(buffer)
    .jpeg({ quality: 95, mozjpeg: true })
    .toFile(filePath)

  console.log(`[Compositing] Saved photo ${index + 1}: ${filePath}`)
  return filePath
}

/**
 * Apply a filter to an image and return a new buffer
 */
async function applyFilter(inputBuffer: Buffer, filter: string): Promise<Buffer> {
  let pipeline = sharp(inputBuffer)

  switch (filter) {
    case 'bw':
      pipeline = pipeline.grayscale()
      break
    case 'sepia':
      pipeline = pipeline.tint({ r: 112, g: 66, b: 20 })
      break
    case 'vintage':
      pipeline = pipeline
        .modulate({ brightness: 1.05, saturation: 0.7 })
        .tint({ r: 100, g: 80, b: 60 })
      break
    case 'warm':
      pipeline = pipeline.tint({ r: 255, g: 200, b: 150 })
      break
    case 'cool':
      pipeline = pipeline.tint({ r: 150, g: 200, b: 255 })
      break
    case 'vivid':
      pipeline = pipeline.modulate({ saturation: 1.5, brightness: 1.05 })
      break
    case 'fade':
      pipeline = pipeline
        .modulate({ saturation: 0.5, brightness: 1.1 })
        .gamma(1.8)
      break
    case 'beauty':
      // Slight blur + brightness boost for beauty/glow effect
      pipeline = pipeline
        .blur(0.5)
        .modulate({ brightness: 1.08, saturation: 0.9 })
      break
    case 'none':
    default:
      // No filter
      break
  }

  return pipeline.jpeg({ quality: 95 }).toBuffer()
}

/**
 * Composite photos into a final print-ready image
 * 
 * Supports multiple layouts:
 * - 1 photo: single photo with frame border
 * - 2 photos: 2 photos stacked vertically (photo strip)
 * - 3-4 photos: 2×2 grid layout
 */
export async function compositePhotos(options: {
  photoPaths: string[]
  filter: string
  frameId: string
  sessionId: string
  printSize?: string // '4x6' (default), '2x6' (strip)
}): Promise<string> {
  const { photoPaths, filter, frameId, sessionId, printSize = '4x6' } = options
  const dir = getSessionDir(sessionId)
  const outputPath = join(dir, 'final_composite.jpg')

  // Fetch frame from DB
  const { getFrameTemplates } = await import('../db/supabase')
  const frames = await getFrameTemplates()
  const dbFrame = frames.find(f => f.id === frameId)
  const hasDbLayout = dbFrame && dbFrame.layout_config && dbFrame.file_url

  // Setup dimensions
  let outputWidth = 1800
  let outputHeight = 1200
  if (hasDbLayout && dbFrame.layout_config.output_width) {
    outputWidth = dbFrame.layout_config.output_width
    outputHeight = dbFrame.layout_config.output_height || outputHeight
  } else {
    if (printSize === '2x6') { outputWidth = 600; outputHeight = 1800 }
  }

  const compositeInputs: OverlayOptions[] = []
  
  if (hasDbLayout) {
    // 1. Dynamic Layout from Database
    let placeholders = dbFrame.layout_config.placeholders || []
    
    // If user uploaded a frame but didn't specify placeholders, we calculate a fallback grid
    if (placeholders.length === 0) {
      console.warn('[Compositing] Frame has no placeholders! Falling back to generic grid underneath the PNG.')
      const photoCount = photoPaths.length
      const borderWidth = Math.round(outputWidth * 0.04)
      const gap = Math.round(outputWidth * 0.02)
      const bottomExtraSpace = Math.round(outputHeight * 0.08)
  
      if (photoCount === 1) {
        placeholders = [{ x: borderWidth, y: borderWidth, width: outputWidth - borderWidth * 2, height: outputHeight - borderWidth * 2 - bottomExtraSpace }]
      } else if (photoCount === 2) {
        const photoH = Math.round((outputHeight - borderWidth * 2 - gap - bottomExtraSpace) / 2)
        placeholders = [
          { x: borderWidth, y: borderWidth, width: outputWidth - borderWidth * 2, height: photoH },
          { x: borderWidth, y: borderWidth + photoH + gap, width: outputWidth - borderWidth * 2, height: photoH }
        ]
      } else {
        const photoW = Math.round((outputWidth - borderWidth * 2 - gap) / 2)
        const photoH = Math.round((outputHeight - borderWidth * 2 - gap - bottomExtraSpace) / 2)
        placeholders = [
          { x: borderWidth, y: borderWidth, width: photoW, height: photoH },
          { x: borderWidth + photoW + gap, y: borderWidth, width: photoW, height: photoH },
          { x: borderWidth, y: borderWidth + photoH + gap, width: photoW, height: photoH },
          { x: borderWidth + photoW + gap, y: borderWidth + photoH + gap, width: photoW, height: photoH }
        ]
      }
    }
    
    // Add photos
    for (let i = 0; i < Math.min(photoPaths.length, placeholders.length); i++) {
      const region = placeholders[i]
      let photoBuffer = await sharp(photoPaths[i]).toBuffer()

      if (filter !== 'none') {
        photoBuffer = await applyFilter(photoBuffer as any, filter) as any
      }

      const resized = await sharp(photoBuffer)
        .resize(Math.round(region.width), Math.round(region.height), { fit: 'cover', position: 'centre' })
        .jpeg({ quality: 95 })
        .toBuffer()

      compositeInputs.push({
        input: resized,
        left: Math.round(region.x),
        top: Math.round(region.y)
      })
    }

    // Overlay Frame PNG
    try {
      console.log(`[Compositing] Downloading frame PNG from: ${dbFrame.file_url}`)
      const response = await fetch(dbFrame.file_url)
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer()
        const frameBuffer = Buffer.from(arrayBuffer)
        
        const resizedFrame = await sharp(frameBuffer)
           .resize(outputWidth, outputHeight)
           .png()
           .toBuffer()
           
        compositeInputs.push({
          input: resizedFrame,
          left: 0,
          top: 0
        })
      } else {
         console.error('[Compositing] Failed to download frame PNG:', response.statusText)
      }
    } catch(err) {
      console.error('[Compositing] Error downloading frame:', err)
    }

  } else {
    // 2. Fallback Logic (Hardcoded 4x6 / 2x6)
    const frameColors: Record<string, { bg: string; border: string }> = {
      'classic-white': { bg: '#ffffff', border: '#e0e0e0' },
      'neon-glow': { bg: '#0a0a1a', border: '#ff00ff' },
      'minimalist': { bg: '#1a1a2e', border: '#333355' }
    }
    const frame = frameColors[frameId] || frameColors['classic-white']
    const parseHex = (hex: string) => ({
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16)
    })
    
    // Add background explicitly as first layer
    compositeInputs.push({
      input: await sharp({
        create: {
          width: outputWidth, height: outputHeight, channels: 3, background: parseHex(frame.bg)
        }
      }).jpeg().toBuffer(),
      left: 0,
      top: 0
    })

    const photoCount = photoPaths.length
    const borderWidth = Math.round(outputWidth * 0.04)
    const gap = Math.round(outputWidth * 0.02)
    const bottomExtraSpace = Math.round(outputHeight * 0.08)

    let photoRegions: Array<{ x: number; y: number; w: number; h: number }> = []

    if (photoCount === 1) {
      photoRegions = [{ x: borderWidth, y: borderWidth, w: outputWidth - borderWidth * 2, h: outputHeight - borderWidth * 2 - bottomExtraSpace }]
    } else if (photoCount === 2) {
      const photoH = Math.round((outputHeight - borderWidth * 2 - gap - bottomExtraSpace) / 2)
      photoRegions = [
        { x: borderWidth, y: borderWidth, w: outputWidth - borderWidth * 2, h: photoH },
        { x: borderWidth, y: borderWidth + photoH + gap, w: outputWidth - borderWidth * 2, h: photoH }
      ]
    } else {
      const photoW = Math.round((outputWidth - borderWidth * 2 - gap) / 2)
      const photoH = Math.round((outputHeight - borderWidth * 2 - gap - bottomExtraSpace) / 2)
      photoRegions = [
        { x: borderWidth, y: borderWidth, w: photoW, h: photoH },
        { x: borderWidth + photoW + gap, y: borderWidth, w: photoW, h: photoH },
        { x: borderWidth, y: borderWidth + photoH + gap, w: photoW, h: photoH },
        { x: borderWidth + photoW + gap, y: borderWidth + photoH + gap, w: photoW, h: photoH }
      ]
    }

    for (let i = 0; i < Math.min(photoPaths.length, photoRegions.length); i++) {
      const region = photoRegions[i]
      let photoBuffer = await sharp(photoPaths[i]).toBuffer()
      if (filter !== 'none') photoBuffer = await applyFilter(photoBuffer as any, filter) as any

      const resized = await sharp(photoBuffer)
        .resize(region.w, region.h, { fit: 'cover', position: 'centre' })
        .jpeg({ quality: 95 })
        .toBuffer()

      compositeInputs.push({ input: resized, left: region.x, top: region.y })
    }
  }

  // Execute composite
  await sharp({
    create: {
      width: outputWidth,
      height: outputHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
    .composite(compositeInputs)
    .jpeg({ quality: 95, mozjpeg: true })
    .toFile(outputPath)

  console.log(`[Compositing] Final image: ${outputPath} (${outputWidth}×${outputHeight})`)
  return outputPath
}

/**
 * Get the output directory path
 */
export function getPhotosDir(): string {
  return getOutputDir()
}
