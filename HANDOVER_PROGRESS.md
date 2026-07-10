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
| **Supabase** | `db/supabase.ts` | CRUD DB & Upload Storage (`photos` bucket) | ✅ |
| **Sharp** | `compositing/index.ts` | Save foto, apply filter, composite + frame | ✅ |
| **Print** | `printing/index.ts` | Print ke printer Windows (silent, 4×6) | ✅ |
| **DigiCam** | `camera/digicam.ts` | DSLR Web API capture & live view (DigiCamControl) | ✅ |
| **Webhook** | `supabase/functions/`| Supabase Edge Function untuk notifikasi Midtrans | ✅ **BARU** |

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

### E. Integrasi Kamera DSLR (✅ BARU — Selesai)
File: `src/main/camera/digicam.ts`
Karena keterbatasan akses *Canon EDSDK*, sistem telah dialihkan untuk menggunakan **DigiCamControl** (standar industri open-source).
*   **Live View**: Mengambil aliran MJPEG dari `localhost:5513` secara langsung.
*   **Capture**: Mengirim perintah HTTP `?slc=capture` dan mendownload foto resolusi penuh.

### F. Web Dashboard (✅ BARU — Diinisialisasi)
Folder: `packages/dashboard`
*   Framework: Next.js + Tailwind CSS (v4) + Lucide Icons.
*   Desain: Tema premium Dark Mode (biru tua, *glassmorphism*).
*   Komponen: `Sidebar.tsx`, `page.tsx` (Overview Dashboard sudah memiliki template *layout* untuk data dan grafik).
*   Script: Bisa dijalankan bersamaan dengan desktop menggunakan `pnpm dev:dashboard` dari root.

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
*   **Blokir**: Tidak ada. Masalah Canon SDK sudah diatasi menggunakan DigiCamControl API.
*   **Catatan Email**: Pengiriman email dengan Resend versi Free Tier *hanya* bisa dikirim ke email terdaftar. Untuk ke email tamu, harus verifikasi domain sendiri di Resend.

---

## 6. Perbaikan Terakhir (10 Juli 2026) — Sinkronisasi Real-time & Bug Fixes

1.  **Config Key Mapping** — (✅ Selesai) Keselarasan struktur JSON antara Desktop App (`snake_case`) dan Dashboard (`camelCase`). Dashboard sekarang menggunakan `BoothConfig` type yang tersentralisasi.
2.  **Real-Time Sync** — (✅ Selesai) Implementasi *Smart Polling* interval 15 detik di `App.tsx` desktop. Kiosk sekarang dapat memperbarui tema dan harga paket secara dinamis tanpa perlu direstart!
3.  **Database Session Fix** — (✅ Selesai) Memperbaiki ID Session mismatch dan kendala *Foreign Key Violation* dengan menginisialisasi sesi langsung di database (via UUID) tepat saat layar AttractScreen disentuh.
4.  **Frame Outlet ID Bug** — (✅ Selesai) Memperbaiki bug di mana Upload Frame dari dashboard tidak memuat parameter `outlet_id`.
5.  **Performa Kiosk** — (✅ Selesai) Mencegah *memory leak* dari idle timer menggunakan implementasi `useRef` di `App.tsx`, serta merapikan logika rotasi kanvas di layar penangkapan gambar.
6.  **Pengaturan Paket Lanjutan** — (✅ Selesai) Fitur penyesuaian harga `standard_price` dan `premium_price` dari dashboard.

## 7. Langkah Selanjutnya (Backlog / Optional)
1. Autentikasi Login untuk Admin Dashboard.
2. Sistem Manajemen Kode Voucher / Diskon.
3. Multi-outlet & Lisensi Multi-Kiosk.
4. Notifikasi WhatsApp pasca cetak selesai.

## 7. Referensi Struktur File
```
packages/desktop/src/
├── main/
│   ├── index.ts              ← Entry point + IPC handlers
│   ├── compositing/index.ts  ← Sharp image processing
│   ├── printing/index.ts     ← Windows print service
│   ├── payment/midtrans.ts   ← Midtrans QRIS
│   ├── email/resend.ts       ← Resend email
│   ├── camera/digicam.ts     ← DigiCamControl API        ← BARU
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
