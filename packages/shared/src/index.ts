// SnapBooth Shared Types
// Centralized type definitions used by both desktop app and dashboard

// ============================================================
// Database Entity Types (mirrors Supabase schema)
// ============================================================

export interface Outlet {
  id: string;
  nama: string;
  alamat: string;
  branding_logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: string;
  outlet_id: string;
  license_key: string;
  device_name: string;
  status: 'active' | 'inactive' | 'expired';
  last_online: string | null;
  created_at: string;
}

export interface Event {
  id: string;
  outlet_id: string;
  nama_event: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  is_active: boolean;
  created_at: string;
}

export interface Session {
  id: string;
  device_id: string;
  event_id: string | null;
  waktu_mulai: string;
  waktu_selesai: string | null;
  status: 'started' | 'capturing' | 'processing' | 'printing' | 'completed' | 'cancelled';
  guest_email: string | null;
  guest_phone: string | null;
}

export interface Transaction {
  id: string;
  session_id: string;
  metode_bayar: PaymentMethod;
  jumlah: number;
  status_bayar: PaymentStatus;
  payment_gateway_ref: string | null;
  ticket_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  session_id: string;
  file_url: string;
  file_local_path: string | null;
  frame_id: string | null;
  filter_applied: string | null;
  is_composited: boolean;
  created_at: string;
}

export interface FrameTemplate {
  id: string;
  outlet_id: string;
  event_id: string | null;
  nama: string;
  kategori: string;
  harga_tambahan: number;
  file_url: string;
  thumbnail_url: string | null;
  print_size: PrintSize;
  layout_config: FrameLayoutConfig;
  is_active: boolean;
  created_at: string;
}

export interface Voucher {
  id: string;
  outlet_id: string;
  kode: string;
  tipe_diskon: 'percent' | 'nominal';
  nilai: number;
  kuota: number;
  used_count: number;
  berlaku_mulai: string;
  berlaku_sampai: string;
  is_active: boolean;
}

export interface User {
  id: string;
  outlet_id: string;
  role: UserRole;
  email: string;
  nama: string;
  created_at: string;
}

// ============================================================
// Enums & Constants
// ============================================================

export type UserRole = 'owner' | 'staff';

export type PaymentMethod = 'qris' | 'cash' | 'ticket' | 'free';

export type PaymentStatus = 'pending' | 'settlement' | 'cancel' | 'expire' | 'deny' | 'refund';

export type PrintSize = '2x6' | '4x6' | '5x7' | '6x8';

export type FilterType =
  | 'none'
  | 'bw'
  | 'sepia'
  | 'vintage'
  | 'warm'
  | 'cool'
  | 'beauty'
  | 'vivid'
  | 'fade';

export type CameraType = 'canon_edsdk' | 'nikon' | 'sony' | 'webcam';

export type CameraStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export type PrinterStatus = 'ready' | 'printing' | 'error' | 'paper_low' | 'offline';

// ============================================================
// Configuration Types
// ============================================================

export interface BoothConfig {
  // Session
  countdown_seconds: number;
  photos_per_session: number;
  max_retakes: number;
  session_timeout_seconds: number;
  idle_timeout_seconds: number;

  // Camera
  camera_type: CameraType;
  camera_rotation: 0 | 90 | 180 | 270;

  // Payment
  base_price: number;
  accept_cash: boolean;
  accept_qris: boolean;
  qris_timeout_seconds: number;

  // Filters
  enabled_filters: FilterType[];

  // Branding
  outlet_name: string;
  logo_url: string | null;
  theme_color: string;
  attract_screen_text: string;

  // Print
  default_print_size: PrintSize;
  copies_per_session: number;
}

export interface FrameLayoutConfig {
  // Position & size of photo placeholder(s) within the frame
  placeholders: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
  }>;
  // Output dimensions in pixels
  output_width: number;
  output_height: number;
}

// ============================================================
// API Types
// ============================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface MidtransChargeRequest {
  order_id: string;
  gross_amount: number;
  payment_type: 'qris';
}

export interface MidtransChargeResponse {
  status_code: string;
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_status: string;
  actions?: Array<{
    name: string;
    method: string;
    url: string;
  }>;
}

export interface MidtransWebhookPayload {
  transaction_time: string;
  transaction_status: string;
  transaction_id: string;
  status_message: string;
  status_code: string;
  signature_key: string;
  payment_type: string;
  order_id: string;
  gross_amount: string;
  fraud_status?: string;
}

// ============================================================
// Sync Types (Offline Queue)
// ============================================================

export interface SyncQueueItem {
  id: string;
  type: 'transaction' | 'session' | 'photo';
  action: 'create' | 'update';
  payload: Record<string, unknown>;
  created_at: string;
  retries: number;
  last_error: string | null;
}

// ============================================================
// Desktop IPC Types (Electron main <-> renderer)
// ============================================================

export interface IpcChannels {
  // Camera
  'camera:connect': () => Promise<{ success: boolean; type: CameraType }>;
  'camera:disconnect': () => Promise<void>;
  'camera:start-live-view': () => Promise<void>;
  'camera:stop-live-view': () => Promise<void>;
  'camera:capture': () => Promise<{ filePath: string }>;
  'camera:status': () => CameraStatus;

  // Printer
  'printer:print': (imagePath: string, copies: number) => Promise<{ success: boolean }>;
  'printer:status': () => PrinterStatus;

  // Payment
  'payment:create-qris': (amount: number) => Promise<{ qrUrl: string; orderId: string }>;
  'payment:check-status': (orderId: string) => Promise<PaymentStatus>;
  'payment:cancel': (orderId: string) => Promise<void>;

  // Config
  'config:get': () => Promise<BoothConfig>;
  'config:update': (config: Partial<BoothConfig>) => Promise<void>;

  // Sync
  'sync:status': () => Promise<{ pending: number; lastSync: string | null }>;
  'sync:force': () => Promise<void>;

  // System
  'system:kiosk-mode': (enabled: boolean) => Promise<void>;
}
