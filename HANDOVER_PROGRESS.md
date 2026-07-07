# Laporan Progres Pengembangan SnapBooth (Sampai 7 Juli 2026)

Dokumen ini berisi rangkuman komprehensif tentang status pengerjaan proyek **SnapBooth (Photobooth Software)** berdasarkan *Product Requirements Document (PRD)* dan *Implementation Plan* awal. Tujuannya adalah sebagai catatan *handover* (serah terima) yang jelas agar agen/developer selanjutnya dapat melanjutkan pengerjaan dengan mulus.

---

## 1. Arsitektur & Teknologi (Selesai Setup)
*   **Monorepo Structure**: Menggunakan `pnpm workspaces`.
*   **Desktop App (Kiosk)**: Electron + React + TypeScript + Vite (`packages/desktop`).
*   **Shared Library**: Modul `packages/shared` untuk tipe data (interfaces).
*   **Design System**: Tailwind CSS dengan tema dark mode, glassmorphism, dan *micro-animations*.
*   **Database**: Supabase (PostgreSQL).
*   **Payment Gateway**: Midtrans (QRIS) — Core API.
*   **Email Delivery**: Resend.
*   **Image Processing**: Sharp (compositing, filter, resize).

---

## 2. Status Fitur Utama (Berdasarkan PRD)

### A. Desktop UI & Flow (✅ Selesai)
Alur UI dari awal hingga akhir sudah dibangun lengkap dan berjalan di dalam Electron window.
1.  **Attract Screen** (`AttractScreen.tsx`) — animasi partikel, glow, CTA
2.  **Package Selection** (`SelectPackage.tsx`) — 3 tier (Basic/Standard/Premium)
3.  **Payment** (`Payment.tsx`) — QRIS & Tunai method cards
4.  **Capture Session** (`CaptureSession.tsx`) — webcam live-view, countdown, flash, retake
5.  **Filter Selection** (`SelectFilter.tsx`) — 9 CSS filters + live preview
6.  **Frame Selection** (`SelectFrame.tsx`) — grid frame + kategori + harga
7.  **Processing** (`Processing.tsx`) — **3-step real pipeline**: Save → Composite → Print
8.  **Complete** (`Complete.tsx`) — kirim foto via email (Resend)

### B. Backend Services di Electron Main Process (✅ Selesai)
Seluruh service pihak ketiga telah terintegrasi di `packages/desktop/src/main/`:

| Service | File | Fungsi | Status |
|---|---|---|---|
| **Midtrans** | `payment/midtrans.ts` | Create QRIS, Check Status, Cancel | ✅ |
| **Resend** | `email/resend.ts` | Kirim foto via email (HTML branded) | ✅ |
| **Supabase** | `db/supabase.ts` | CRUD sessions, transactions, photos | ✅ |
| **Sharp** | `compositing/index.ts` | Save foto, apply filter, composite + frame | ✅ **BARU** |
| **Print** | `printing/index.ts` | Print ke printer Windows (silent, 4×6) | ✅ **BARU** |

### C. Image Compositing Pipeline (✅ BARU — Selesai)
File: `src/main/compositing/index.ts`
*   **Save foto**: Data URL (base64) dari webcam → file JPEG di `%AppData%/photos/`
*   **Apply filter**: 9 filter menggunakan Sharp (bw, sepia, vintage, warm, cool, vivid, fade, beauty)
*   **Composite**: Foto + frame overlay → output JPEG print-ready (1800×1200px, 300dpi)
*   **Layout**: Support 1 foto (full), 2 foto (stacked), 3-4 foto (2×2 grid)
*   **Branding**: Logo "SnapBooth" + tanggal otomatis di bagian bawah

### D. Print Service (✅ BARU — Selesai)
File: `src/main/printing/index.ts`
*   Hidden BrowserWindow memuat gambar final → dicetak langsung ke printer default
*   Mode *silent* (tanpa dialog print)
*   Ukuran halaman: 4×6 inci
*   Support multiple copies

### E. Yang Masih Berupa Placeholder (⏳)
1.  **Canon EDSDK** — Belum ada akses SDK. Webcam digunakan sebagai fallback.
2.  **Web Dashboard** — Belum dimulai (`packages/dashboard`).

---

## 3. IPC Bridge (Preload) — API Lengkap

```
window.snapbooth.camera.*        — connect, capture, live-view
window.snapbooth.printer.*       — print, getStatus, list
window.snapbooth.payment.*       — createQris, checkStatus, cancel
window.snapbooth.compositing.*   — savePhoto, process, getOutputDir
window.snapbooth.db.*            — createSession, createTransaction, updatePaymentStatus, savePhoto
window.snapbooth.email.*         — sendPhoto
window.snapbooth.config.*        — get, update
window.snapbooth.system.*        — setKioskMode
```

---

## 4. Environment Variables (`.env`)
```
MIDTRANS_CLIENT_KEY=Mid-client-...
MIDTRANS_SERVER_KEY=Mid-server-...
MIDTRANS_IS_PRODUCTION=false
SUPABASE_URL=https://bvvlhpecfpymgzjwvosp.supabase.co
SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
RESEND_API_KEY=re_...
```

---

## 5. Posisi Terakhir Pengerjaan (Checkpoint)
*   **Kode**: Bersih, sudah di-push ke `https://github.com/Limitsss147a/photobooth.git` branch `main`.
*   **Blokir**: User perlu menjalankan `supabase/migrations/001_initial_schema.sql` di Supabase SQL Editor.
*   **Canon SDK**: Menunggu akses dari Canon Developer Programme.

---

## 6. Langkah Selanjutnya

1.  **Jalankan SQL Migration** → Supabase Dashboard → SQL Editor → paste `001_initial_schema.sql` → Run.
2.  **Webhook Midtrans** — Endpoint untuk terima notifikasi pembayaran QRIS.
3.  **Supabase Storage** — Upload foto hasil composite ke cloud storage.
4.  **Canon EDSDK Bridge** — Setelah SDK tersedia, buat C++ addon/wrapper.
5.  **Web Dashboard (Next.js)** — Admin panel di `packages/dashboard`.

## 7. Referensi Struktur File
```
packages/desktop/src/
├── main/
│   ├── index.ts              ← Entry point + IPC handlers
│   ├── compositing/index.ts  ← Sharp image processing    ← BARU
│   ├── printing/index.ts     ← Windows print service     ← BARU
│   ├── payment/midtrans.ts   ← Midtrans QRIS
│   ├── email/resend.ts       ← Resend email
│   └── db/
│       ├── supabase.ts       ← Supabase client + helpers
│       └── setup.ts          ← DB migration script
├── preload/index.ts          ← Secure API bridge
└── renderer/src/
    ├── App.tsx               ← Flow state machine
    ├── main.tsx              ← React entry point
    ├── styles/index.css      ← Design system
    └── pages/
        ├── AttractScreen.tsx
        ├── SelectPackage.tsx
        ├── Payment.tsx
        ├── CaptureSession.tsx
        ├── SelectFilter.tsx
        ├── SelectFrame.tsx
        ├── Processing.tsx    ← Updated with real pipeline
        └── Complete.tsx
```
