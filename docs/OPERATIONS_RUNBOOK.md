# Operations Runbook - Indobraga Backend

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
- Revalidation worker dipanggil lewat `POST /api/v1/internal/revalidation/tick`.
- Keduanya wajib memakai header `x-internal-worker-secret`.
- Scheduler production sebaiknya berjalan dari jaringan internal/server trusted.

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
