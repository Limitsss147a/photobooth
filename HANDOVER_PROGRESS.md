# Laporan Progres Pengembangan SnapBooth (Sampai 6 Juli 2026)

Dokumen ini berisi rangkuman komprehensif tentang status pengerjaan proyek **SnapBooth (Photobooth Software)** berdasarkan *Product Requirements Document (PRD)* dan *Implementation Plan* awal. Tujuannya adalah sebagai catatan *handover* (serah terima) yang jelas agar agen/developer selanjutnya dapat melanjutkan pengerjaan dengan mulus.

---

## 1. Arsitektur & Teknologi (Selesai Setup)
*   **Monorepo Structure**: Menggunakan `pnpm workspaces`.
*   **Desktop App (Kiosk)**: Electron + React + TypeScript + Vite (`packages/desktop`).
*   **Shared Library**: Modul `packages/shared` untuk tipe data (interfaces) yang akan digunakan bersama (Desktop & Web Dashboard).
*   **Design System**: Tailwind CSS dengan tema dark mode, glassmorphism, dan *micro-animations*.
*   **Database**: Supabase (PostgreSQL).
*   **Payment Gateway**: Midtrans (QRIS).
*   **Email Delivery**: Resend.

---

## 2. Status Fitur Utama (Berdasarkan PRD)

### A. Desktop UI & Flow (✅ Selesai)
Alur UI dari awal hingga akhir sudah berhasil dibangun dan dapat berjalan di dalam Electron window (kiosk mode tersedia).
1.  **Attract Screen (`AttractScreen.tsx`)**: Layar *idle* dengan animasi partikel dan *glowing border*.
2.  **Package Selection (`SelectPackage.tsx`)**: Pilihan paket (Basic, Standard, Premium) dengan indikator harga.
3.  **Payment Method (`Payment.tsx`)**: Pemilihan metode pembayaran (QRIS / Tunai).
4.  **Capture Session (`CaptureSession.tsx`)**: Tampilan *live-view* kamera, *countdown*, *flash effect*, dan hasil *capture*.
5.  **Filter Selection (`SelectFilter.tsx`)**: Pemilihan dari 9 CSS filters dengan *live preview*.
6.  **Frame Selection (`SelectFrame.tsx`)**: Grid untuk memilih desain *frame*.
7.  **Processing (`Processing.tsx`)**: Animasi *progress bar* untuk *compositing* dan proses *printing*.
8.  **Complete (`Complete.tsx`)**: Layar akhir, menyertakan input form untuk mengirim hasil foto (*softfile*) via Email.

### B. Integrasi Backend & Layanan Eksternal (✅ Selesai)
Konfigurasi dan kode integrasi untuk layanan pihak ketiga telah ditulis dan dipasang di Electron *Main Process* (`packages/desktop/src/main/`).
1.  **Database (Supabase)**:
    *   File: `src/main/db/supabase.ts` (Client & Helper functions).
    *   *Schema SQL* lengkap (9 tabel) sudah dibuat di `supabase/migrations/001_initial_schema.sql` (Perlu di-*run* manual oleh User di dashboard Supabase).
2.  **Payment (Midtrans)**:
    *   File: `src/main/payment/midtrans.ts`.
    *   Fitur: Create QRIS Charge, Check Status, Cancel Transaction menggunakan Midtrans Core API.
3.  **Email (Resend)**:
    *   File: `src/main/email/resend.ts`.
    *   Fitur: Pengiriman email HTML *branded* dengan *attachment* atau *download link*.
4.  **IPC Bridge (Preload)**:
    *   Fungsi-fungsi API (Camera, Printer, Payment, Config, Email, Sync, System) telah diekspos dengan aman dari *Main Process* ke *Renderer* via `contextBridge` (`packages/desktop/src/preload/index.ts`).

### C. Yang Masih Berupa "Placeholder" (⏳ Menunggu Dikerjakan)
1.  **Integrasi Kamera Asli (Canon EDSDK)**:
    *   Saat ini `camera:connect` dan `camera:capture` di IPC Handler masih berupa *mock/fallback* (webcam) karena menunggu akses Canon Developer Programme.
2.  **Printing Asli (Windows Print Spooler)**:
    *   Saat ini `printer:print` hanya me-log request dan mengembalikan `success: true`. Logika sebenarnya untuk memanggil printer Windows belum diimplementasikan.
3.  **Web Dashboard (Admin Panel)**:
    *   Belum dimulai (direncanakan di `packages/dashboard` menggunakan Next.js). Ini dijadwalkan pada Sprint 5.

---

## 3. Posisi Terakhir Pengerjaan (Checkpoint saat ini)
*   Kode sudah rapi, bersih dari *error*, dan telah di-*push* ke repositori GitHub utama: `https://github.com/Limitsss147a/photobooth.git` di *branch* `main`.
*   File rahasia (seperti `.env`) telah di-ignore dari Git dan API Key yang relevan (Midtrans, Supabase, Resend) sudah disematkan dalam *environment* lokal.
*   **Blokir Saat Ini**: Menunggu pengguna menjalankan `supabase/migrations/001_initial_schema.sql` di SQL Editor pada dashboard Supabase mereka untuk membuat tabel-tabel di database.

---

## 4. Langkah Selanjutnya (Panduan untuk Agen Berikutnya)

Jika agen baru mengambil alih proyek ini, silakan lanjutkan dengan langkah-langkah berikut secara berurutan:

1.  **Verifikasi Database**: Pastikan pengguna telah menjalankan *migration script* di Supabase dan tabel sudah terbentuk.
2.  **Webhook Midtrans**: Buat *endpoint* (bisa menggunakan Supabase Edge Functions atau Next.js Route jika *dashboard* sudah ada) untuk menerima notifikasi status pembayaran QRIS (Settlement/Cancel/Expire) dan memperbarui tabel `transactions`.
3.  **Image Compositing & Storage**: Implementasikan fungsi sesungguhnya di Electron Main Process untuk:
    *   Menggabungkan (composite) foto-foto *capture* menjadi satu gambar akhir dengan *frame* yang dipilih (misal menggunakan modul `sharp` atau `canvas`).
    *   Menyimpan hasil *composite* tersebut ke *local storage* dan mengunggahnya ke Supabase Storage (untuk keperluan *download link* di email).
4.  **Integrasi Hardware Asli**:
    *   Tulis Node.js *addon* (C++) atau gunakan wrapper (seperti `ffi-napi`) untuk Canon EDSDK setelah akses didapatkan.
    *   Implementasikan fungsi *print* sesungguhnya.
5.  **Memulai Web Dashboard**:
    *   Inisialisasi project Next.js di `packages/dashboard`.
    *   Gunakan `shared types` dari `packages/shared`.

## 5. Referensi Struktur File Penting
*   `packages/desktop/src/main/index.ts`: Titik masuk *backend* Electron & IPC Handlers.
*   `packages/desktop/src/preload/index.ts`: Definisi API aman yang dipakai oleh UI.
*   `packages/desktop/src/renderer/src/App.tsx`: Controller alur layar (State machine).
*   `packages/shared/src/index.ts`: Definisi tipe data global.
*   `.env`: Kredensial API lokal (Midtrans, Supabase, Resend).
