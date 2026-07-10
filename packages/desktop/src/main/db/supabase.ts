import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve, basename } from 'path'
import { readFileSync } from 'fs'
import crypto from 'crypto'

// Load .env from project root
config({ path: resolve(__dirname, '../../../../.env') })

// Fix for Node < 22 not having native WebSocket
// Supabase instantiates RealtimeClient which checks for WebSocket.
// Since we don't use Realtime in the main process, we can just provide a dummy class.
class DummyWebSocket {
  constructor() {}
}

if (typeof global.WebSocket === 'undefined') {
  ;(global as any).WebSocket = DummyWebSocket
}

let supabase: SupabaseClient | null = null

/**
 * Get the Supabase client singleton
 * Uses the service/secret key for server-side operations (main process only)
 */
export function getSupabase(): SupabaseClient {
  if (!supabase) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY

    if (!url || !key) {
      throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env')
    }

    supabase = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  return supabase
}

/**
 * Get a public Supabase client (for anon operations)
 */
export function getPublicSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env')
  }

  return createClient(url, key)
}

// ============================================================
// Database Helper Functions
// ============================================================

/**
 * Record a new session in the database
 */
export async function createSession(deviceId: string | null, eventId: string | null) {
  const sb = getSupabase()
  const { data, error } = await sb
    .from('sessions')
    .insert({
      device_id: deviceId,
      event_id: eventId,
      status: 'started'
    })
    .select()
    .single()

  if (error) {
    console.error('[Supabase] Create session error:', error.message)
    throw error
  }
  return data
}

/**
 * Update session status
 */
export async function updateSession(sessionId: string, updates: Record<string, unknown>) {
  const sb = getSupabase()
  const { error } = await sb
    .from('sessions')
    .update(updates)
    .eq('id', sessionId)

  if (error) {
    console.error('[Supabase] Update session error:', error.message)
  }
}

/**
 * Record a transaction
 */
export async function createTransaction(data: {
  session_id: string
  metode_bayar: string
  jumlah: number
  status_bayar?: string
  payment_gateway_ref?: string
  ticket_code?: string
}) {
  const sb = getSupabase()
  const { data: result, error } = await sb
    .from('transactions')
    .insert(data)
    .select()
    .single()

  if (error) {
    console.error('[Supabase] Create transaction error:', error.message)
    throw error
  }
  return result
}

/**
 * Update transaction status (e.g., after payment webhook)
 */
export async function updateTransactionStatus(sessionId: string, status: string) {
  const sb = getSupabase()
  const { error } = await sb
    .from('transactions')
    .update({ status_bayar: status, updated_at: new Date().toISOString() })
    .eq('session_id', sessionId)

  if (error) {
    console.error('[Supabase] Update transaction error:', error.message)
  }
}

/**
 * Save photo record
 */
export async function savePhoto(data: {
  session_id: string
  file_url?: string
  file_local_path?: string
  frame_id?: string
  filter_applied?: string
  is_composited?: boolean
}) {
  const sb = getSupabase()
  const { data: result, error } = await sb
    .from('photos')
    .insert(data)
    .select()
    .single()

  if (error) {
    console.error('[Supabase] Save photo error:', error.message)
    throw error
  }
  return result
}

/**
 * Get all active frame templates for this outlet
 */
export async function getFrameTemplates(outletId?: string) {
  const sb = getSupabase()
  let query = sb
    .from('frame_templates')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (outletId) {
    query = query.eq('outlet_id', outletId)
  }

  const { data, error } = await query
  if (error) {
    console.error('[Supabase] Get frames error:', error.message)
    return []
  }
  return data || []
}

/**
 * Get transaction summary (for dashboard)
 */
export async function getTransactionSummary(days: number = 30) {
  const sb = getSupabase()
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await sb
    .from('transactions')
    .select('*')
    .eq('status_bayar', 'settlement')
    .gte('created_at', since)

  if (error) {
    console.error('[Supabase] Get summary error:', error.message)
    return { count: 0, total: 0, transactions: [] }
  }

  const total = (data || []).reduce((sum, t) => sum + (t.jumlah || 0), 0)
  return {
    count: data?.length || 0,
    total,
    transactions: data || []
  }
}

/**
 * Get the default outlet (for single-outlet mode)
 */
export async function getDefaultOutlet() {
  const sb = getSupabase()
  const { data, error } = await sb
    .from('outlets')
    .select('*')
    .limit(1)
    .single()

  if (error) {
    console.error('[Supabase] Get outlet error:', error.message)
    return null
  }
  return data
}

/**
 * Upload a local file to Supabase Storage and get public URL
 */
export async function uploadPhotoToStorage(localFilePath: string, bucket: string = 'photos'): Promise<string | null> {
  try {
    const sb = getSupabase()
    const fileName = basename(localFilePath)
    const uniqueFileName = `${crypto.randomUUID()}_${fileName}`
    const fileBuffer = readFileSync(localFilePath)

    const { data, error } = await sb
      .storage
      .from(bucket)
      .upload(uniqueFileName, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: false
      })

    if (error) {
      console.error('[Supabase Storage] Upload error:', error.message)
      return null
    }

    const { data: publicUrlData } = sb
      .storage
      .from(bucket)
      .getPublicUrl(data.path)

    console.log(`[Supabase Storage] Uploaded successfully: ${publicUrlData.publicUrl}`)
    return publicUrlData.publicUrl
  } catch (err: any) {
    console.error('[Supabase Storage] Exception during upload:', err.message)
    return null
  }
}

/**
 * Get device configuration from Supabase
 */
export async function getDeviceConfig() {
  const sb = getSupabase()
  const { data, error } = await sb
    .from('devices')
    .select('config')
    .limit(1)
    .single()

  if (error) {
    console.error('[Supabase] Get device config error:', error.message)
    return null
  }
  return data?.config
}
