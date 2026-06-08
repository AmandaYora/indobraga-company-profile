# Operations Runbook - Indobraga Backend

Untuk panduan deploy/redeploy VPS, domain, HTTPS, PM2, Nginx, dan smoke test production, lihat `docs/DEPLOYMENT_RUNBOOK.md`.

## Production Secrets

- `SESSION_SECRET`, `CREDENTIAL_ENCRYPTION_KEY`, dan `INTERNAL_WORKER_SECRET` wajib berupa secret production yang kuat.
- Credential OAuth, SMTP, S3/Object Storage, dan database hanya disimpan di environment/server secret manager.
- Jangan commit file `.env` production atau credential provider.

## Database Backup

- Backup MySQL minimal harian untuk MVP awal.
- Simpan backup di storage terpisah dari server aplikasi.
- Uji restore berkala ke database staging agar backup tidak hanya tersimpan tetapi benar-benar dapat dipakai.
- Sebelum migration production, ambil backup snapshot terbaru.

## Media Lifecycle

- Binary media tidak disimpan di database; database hanya menyimpan metadata dan URL/object key.
- Media yang dihapus admin ditandai `DELETED`; cleanup object storage dapat dijalankan sebagai job terpisah setelah dipastikan tidak direferensikan konten aktif.
- Local storage `.local-storage` hanya untuk development/test, bukan production.
- Object Storage production memakai IDCloudHost S3-compatible endpoint `https://is3.cloudhost.id` dengan bucket `indobraga`.
- URL media public idealnya memakai CDN/custom media domain `https://media.indobraga.com`; jika belum aktif, gunakan URL bucket IDCloudHost yang sudah diuji akses public.

## Worker

- Email campaign worker dipanggil lewat `POST /api/v1/internal/workers/email-campaigns/tick`.
- Notification email worker dipanggil lewat `POST /api/v1/internal/workers/notifications/tick`.
- Revalidation worker dipanggil lewat `POST /api/v1/internal/revalidation/tick`.
- Semua endpoint worker wajib memakai header `x-internal-worker-secret`.
- Scheduler production sebaiknya berjalan dari jaringan internal/server trusted.
- Notification email worker hanya memproses email operasional dari `notification_email_jobs`; bell admin tetap membaca `notifications` dari database dan SSE.

## Admin Notifications

- Bell admin memakai DB-backed notification sebagai sumber kebenaran.
- Admin yang sedang membuka dashboard menerima update lewat Server-Sent Events di `/api/v1/admin/notifications/stream`.
- Jika SSE gagal di browser, frontend fallback ke polling lambat sekitar 120 detik.
- Email notifikasi untuk pesan kontak diproses worker terpisah, sehingga submit form publik tidak menunggu SMTP.
- Env production yang relevan: `NOTIFICATION_EMAIL_ENABLED`, `NOTIFICATION_EMAIL_TO`, `NOTIFICATION_EMAIL_SENDER`, `NOTIFICATION_WORKER_BATCH_SIZE`, `NOTIFICATION_WORKER_MAX_ATTEMPTS`, dan `NOTIFICATION_STREAM_HEARTBEAT_MS`.

## Kirim Email dan Follow-up Lead

- Halaman Kirim Email memakai dua tab: Single (kirim ke satu email tujuan bebas, judul campaign dibuat otomatis) dan Massal (unggah daftar penerima dari file Excel `.xlsx`).
- Tab Massal membaca file Excel di browser, lalu menampilkan preview email valid, duplikat, dan email tidak valid sebelum draf dibuat. Kolom `email` wajib, `nama` opsional. CSV tidak lagi dipakai.
- Follow-up per kontak dilakukan dari daftar Pesan Kontak dan Prospek WhatsApp: aksi Kirim Email mengarahkan ke tab Single dengan email terisi, dan aksi Kirim WA membuka WhatsApp ke nomor prospek. Halaman Kirim Email tidak lagi memiliki sumber penerima "Pesan Kontak".
- Endpoint backend `recipient-sources/inquiries/preview` dan `draft/from-inquiries` tetap ada untuk pemakaian programatik, tetapi tidak dipanggil UI default.
- Isi email punya dua mode: Teks biasa atau HTML mentah (dengan pratinjau). Variabel `{{...}}` tetap diganti per penerima di kedua mode.
- Isi + subjek bisa disimpan sebagai Template (tombol "Simpan sebagai Template") lalu dipakai ulang lewat "Pakai Template". Template dikelola di menu Kelola Template (hanya edit/hapus; pembuatan tetap dari Kirim Email).
- Campaign tetap menyimpan snapshot penerima di `email_campaign_recipients`.
- Sebelum campaign besar, cek domain sender SPF, DKIM, DMARC, dan limit provider SMTP/Gmail.

## Runtime Prerequisites

- Node.js runtime/container untuk NestJS.
- Sharp membutuhkan native dependency yang cocok dengan platform container.
- FFmpeg belum diwajibkan untuk test MVP saat ini, tetapi perlu tersedia sebelum video poster/transcoding production diaktifkan.

## Security Checks

- Admin API memakai HTTP-only session cookie dan CSRF token untuk mutasi.
- Admin response memakai `Cache-Control: no-store`.
- Public cache hanya untuk konten/SEO asset yang aman.
- Token OAuth dan password SMTP terenkripsi at rest dengan AES-256-GCM.
- Response API tidak boleh mengirim password, token OAuth, password SMTP, atau encrypted secret.
