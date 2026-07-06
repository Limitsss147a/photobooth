-- ============================================================
-- SnapBooth Database Schema
-- Run this SQL in Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. OUTLETS — Data outlet/booth
-- ============================================================
CREATE TABLE IF NOT EXISTS outlets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama TEXT NOT NULL,
  alamat TEXT,
  branding_logo_url TEXT,
  theme_color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. DEVICES — Perangkat booth per outlet
-- ============================================================
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outlet_id UUID REFERENCES outlets(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL DEFAULT 'Booth 1',
  license_key TEXT UNIQUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  last_online TIMESTAMPTZ,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. EVENTS — Event per outlet
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outlet_id UUID REFERENCES outlets(id) ON DELETE CASCADE,
  nama_event TEXT NOT NULL,
  tanggal_mulai DATE NOT NULL,
  tanggal_selesai DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. FRAME_TEMPLATES — Template frame/desain
-- ============================================================
CREATE TABLE IF NOT EXISTS frame_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outlet_id UUID REFERENCES outlets(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  nama TEXT NOT NULL,
  kategori TEXT DEFAULT 'Basic',
  harga_tambahan INTEGER DEFAULT 0,
  file_url TEXT,
  thumbnail_url TEXT,
  print_size TEXT DEFAULT '4x6',
  layout_config JSONB DEFAULT '{"placeholders":[{"x":0,"y":0,"width":100,"height":100}],"output_width":1800,"output_height":1200}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. SESSIONS — Sesi foto per device
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  waktu_mulai TIMESTAMPTZ DEFAULT NOW(),
  waktu_selesai TIMESTAMPTZ,
  status TEXT DEFAULT 'started' CHECK (status IN ('started', 'capturing', 'processing', 'printing', 'completed', 'cancelled')),
  guest_email TEXT,
  guest_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. TRANSACTIONS — Transaksi pembayaran
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  metode_bayar TEXT NOT NULL CHECK (metode_bayar IN ('qris', 'cash', 'ticket', 'free')),
  jumlah INTEGER NOT NULL DEFAULT 0,
  status_bayar TEXT DEFAULT 'pending' CHECK (status_bayar IN ('pending', 'settlement', 'cancel', 'expire', 'deny', 'refund')),
  payment_gateway_ref TEXT,
  ticket_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. PHOTOS — Foto per sesi
-- ============================================================
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  file_url TEXT,
  file_local_path TEXT,
  frame_id UUID REFERENCES frame_templates(id) ON DELETE SET NULL,
  filter_applied TEXT DEFAULT 'none',
  is_composited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. VOUCHERS — Kode voucher/diskon
-- ============================================================
CREATE TABLE IF NOT EXISTS vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outlet_id UUID REFERENCES outlets(id) ON DELETE CASCADE,
  kode TEXT UNIQUE NOT NULL,
  tipe_diskon TEXT DEFAULT 'percent' CHECK (tipe_diskon IN ('percent', 'nominal')),
  nilai INTEGER DEFAULT 0,
  kuota INTEGER DEFAULT 100,
  used_count INTEGER DEFAULT 0,
  berlaku_mulai TIMESTAMPTZ DEFAULT NOW(),
  berlaku_sampai TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. USERS — User operator/staff
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outlet_id UUID REFERENCES outlets(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'staff' CHECK (role IN ('owner', 'staff')),
  email TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_sessions_device ON sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_sessions_event ON sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_transactions_session ON transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status_bayar);
CREATE INDEX IF NOT EXISTS idx_photos_session ON photos(session_id);
CREATE INDEX IF NOT EXISTS idx_frame_templates_outlet ON frame_templates(outlet_id);
CREATE INDEX IF NOT EXISTS idx_frame_templates_event ON frame_templates(event_id);

-- ============================================================
-- SEED: Insert default outlet for single-outlet mode
-- ============================================================
INSERT INTO outlets (nama, alamat) 
VALUES ('SnapBooth', 'Default Outlet')
ON CONFLICT DO NOTHING;
