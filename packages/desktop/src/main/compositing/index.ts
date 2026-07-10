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

  // Output dimensions (300dpi)
  const is4x6 = printSize === '4x6'
  const outputWidth = is4x6 ? 1800 : 600   // 4x6 = 1800x1200, 2x6 = 600x1800
  const outputHeight = is4x6 ? 1200 : 1800

  // Frame border colors based on frameId
  const frameColors: Record<string, { bg: string; border: string }> = {
    'classic-white': { bg: '#ffffff', border: '#e0e0e0' },
    'polaroid': { bg: '#f5f5f0', border: '#d0d0c8' },
    'floral-gold': { bg: '#faf3e0', border: '#d4af37' },
    'neon-glow': { bg: '#0a0a1a', border: '#ff00ff' },
    'vintage-film': { bg: '#2a2118', border: '#8B7355' },
    'minimalist': { bg: '#1a1a2e', border: '#333355' }
  }

  const frame = frameColors[frameId] || frameColors['classic-white']

  // Parse hex colors to RGB
  const parseHex = (hex: string) => ({
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16)
  })

  const bgColor = parseHex(frame.bg)
  const borderColor = parseHex(frame.border)

  // Calculate photo placement
  const photoCount = photoPaths.length
  const borderWidth = Math.round(outputWidth * 0.04) // 4% border
  const gap = Math.round(outputWidth * 0.02) // 2% gap between photos
  const bottomExtraSpace = Math.round(outputHeight * 0.08) // Extra space at bottom for branding

  let photoRegions: Array<{ x: number; y: number; w: number; h: number }> = []

  if (photoCount === 1) {
    // Single photo — centered with border
    photoRegions = [{
      x: borderWidth,
      y: borderWidth,
      w: outputWidth - borderWidth * 2,
      h: outputHeight - borderWidth * 2 - bottomExtraSpace
    }]
  } else if (photoCount === 2) {
    // 2 photos stacked
    const photoH = Math.round((outputHeight - borderWidth * 2 - gap - bottomExtraSpace) / 2)
    photoRegions = [
      { x: borderWidth, y: borderWidth, w: outputWidth - borderWidth * 2, h: photoH },
      { x: borderWidth, y: borderWidth + photoH + gap, w: outputWidth - borderWidth * 2, h: photoH }
    ]
  } else {
    // 2×2 grid (3 or 4 photos)
    const photoW = Math.round((outputWidth - borderWidth * 2 - gap) / 2)
    const photoH = Math.round((outputHeight - borderWidth * 2 - gap - bottomExtraSpace) / 2)
    photoRegions = [
      { x: borderWidth, y: borderWidth, w: photoW, h: photoH },
      { x: borderWidth + photoW + gap, y: borderWidth, w: photoW, h: photoH },
      { x: borderWidth, y: borderWidth + photoH + gap, w: photoW, h: photoH },
      { x: borderWidth + photoW + gap, y: borderWidth + photoH + gap, w: photoW, h: photoH }
    ]
  }

  // Create background canvas
  let composite = sharp({
    create: {
      width: outputWidth,
      height: outputHeight,
      channels: 3,
      background: bgColor
    }
  }).jpeg()

  // Process and place each photo
  const compositeInputs: OverlayOptions[] = []

  for (let i = 0; i < Math.min(photoPaths.length, photoRegions.length); i++) {
    const region = photoRegions[i]
    let photoBuffer = await sharp(photoPaths[i]).toBuffer()

    // Apply filter
    if (filter !== 'none') {
      photoBuffer = await applyFilter(photoBuffer as any, filter) as any
    }

    // Resize to fit region
    const resized = await sharp(photoBuffer)
      .resize(region.w, region.h, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 95 })
      .toBuffer()

    compositeInputs.push({
      input: resized,
      left: region.x,
      top: region.y
    })
  }

  // Add branding text area (SVG overlay)
  const brandingSvg = `
    <svg width="${outputWidth}" height="${bottomExtraSpace}">
      <text x="${outputWidth / 2}" y="${bottomExtraSpace * 0.6}" 
        text-anchor="middle" 
        font-family="Arial, sans-serif" 
        font-size="${Math.round(bottomExtraSpace * 0.35)}" 
        font-weight="bold"
        fill="${frame.bg === '#ffffff' || frame.bg === '#f5f5f0' || frame.bg === '#faf3e0' ? '#333333' : '#cccccc'}">
        SnapBooth
      </text>
      <text x="${outputWidth / 2}" y="${bottomExtraSpace * 0.9}" 
        text-anchor="middle" 
        font-family="Arial, sans-serif" 
        font-size="${Math.round(bottomExtraSpace * 0.2)}" 
        fill="${frame.bg === '#ffffff' || frame.bg === '#f5f5f0' || frame.bg === '#faf3e0' ? '#999999' : '#888888'}">
        ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
      </text>
    </svg>
  `

  compositeInputs.push({
    input: Buffer.from(brandingSvg),
    left: 0,
    top: outputHeight - bottomExtraSpace
  })

  // Add border lines (thin decorative border inside)
  const borderSvg = `
    <svg width="${outputWidth}" height="${outputHeight}">
      <rect x="${Math.round(borderWidth * 0.3)}" y="${Math.round(borderWidth * 0.3)}" 
        width="${outputWidth - Math.round(borderWidth * 0.6)}" 
        height="${outputHeight - Math.round(borderWidth * 0.6)}" 
        fill="none" 
        stroke="rgb(${borderColor.r},${borderColor.g},${borderColor.b})" 
        stroke-width="2" 
        rx="8" />
    </svg>
  `
  compositeInputs.push({
    input: Buffer.from(borderSvg),
    left: 0,
    top: 0
  })

  // Execute composite
  await sharp({
    create: {
      width: outputWidth,
      height: outputHeight,
      channels: 3,
      background: bgColor
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
