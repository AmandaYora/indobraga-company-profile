# Perbaikan Temuan QA Elcodelabs (IB-01 s.d. IB-17)

Sumber: `Report-QA-Indobraga-by-Elcodelabs.pdf` (pengujian black-box production, 13 November 2026, 75 test case, 17 temuan).
Dokumen ini memetakan setiap temuan ke perbaikan di kode, cara memverifikasinya, dan langkah yang masih
harus dilakukan manual di server.

## Yang wajib dilakukan saat deploy

1. **Migrasi database** (otomatis dijalankan oleh `scripts/deploy-production.sh`, atau manual):
   ```bash
   cd apps/api && npx prisma migrate deploy
   ```
   Migrasi `20261121000000_normalize_whatsapp_number` mengubah nomor WhatsApp di Pengaturan Website dari
   `085223000039` menjadi `6285223000039` (IB-01). Idempotent: aman dijalankan ulang.
2. **Nginx** (IB-07) - tidak bisa dilakukan dari aplikasi, harus di server:
   ```bash
   sudo cp ops/nginx/indobraga-security.conf         /etc/nginx/snippets/
   sudo cp ops/nginx/indobraga-security-headers.conf /etc/nginx/snippets/
   # di blok server HTTPS pada /etc/nginx/sites-available/indobraga tambahkan:
   #   include snippets/indobraga-security.conf;
   # dan di dalam `location /assets/ { ... }` tambahkan:
   #   include snippets/indobraga-security-headers.conf;
   sudo nginx -t && sudo systemctl reload nginx
   curl -sI https://indobraga.com/login | grep -iE "^server|strict-transport|x-frame|x-content-type|content-security|referrer"
   ```
   Hasil yang benar: `server: nginx` (tanpa versi) dan semua header keamanan muncul.
3. **Akun**: peran *Editor Konten* kini dibatasi (IB-08). Akun `support@indobraga.com` (Editor Konten) tidak lagi
   bisa membuka Pengaturan Website, Pengguna Admin, Akun Pengirim Email, dan tidak bisa mengirim email. Pekerjaan
   itu dilakukan akun **Super Admin**. Pastikan Indobraga memegang minimal satu akun Super Admin sebelum deploy.
4. **Variabel lingkungan baru** (opsional, ada default; lihat `apps/api/.env.example`):
   `MEDIA_ORPHAN_TTL_HOURS`, `MEDIA_CLEANUP_POLL_MS`, `REVALIDATION_WORKER_POLL_MS`, `REVALIDATION_RETENTION_DAYS`.
5. Instal ulang dependensi (`npm ci`): API menambah paket `xss` (sanitasi HTML email).

## Pemetaan temuan

| ID | Tingkat | Perbaikan | Verifikasi |
|----|---------|-----------|------------|
| IB-01 | Kritis | Helper `core/phone.ts` menormalkan `0xxx` -> `62xxx`. Dipakai di validasi Pengaturan (DTO), pembuatan tautan `wa.me` pada prospek, dan presenter pengaturan (publik + admin), sehingga data lama berformat lokal pun menghasilkan tautan benar. Migrasi data mengoreksi nilai yang sudah tersimpan. Field WhatsApp kini wajib & divalidasi di form. | Unit + e2e; uji browser: menyimpan `0852-2300-0039` -> tersimpan `6285223000039`, `wa.me/6285223000039`. |
| IB-02 | Tinggi | (1) Pratinjau HTML dirender di `<iframe sandbox="">` + CSP di dokumen (`EmailHtmlPreview`), tidak ada lagi `dangerouslySetInnerHTML`. (2) HTML disanitasi di server (`core/html-sanitizer.ts`, allow-list) saat simpan template/draf, saat tampil, dan saat kirim - baris lama pun aman. | Unit + e2e; uji browser dengan payload `onerror` yang disisipkan langsung ke DB: tidak tereksekusi (`__qaXss` tetap 0). |
| IB-03 | Sedang | Validator allow-list URL `IsSafeLinkUrl` (http/https/mailto/tel/`/path`) pada `cta_href`; keluaran publik juga dibersihkan (`safeLinkOrNull`); helper `safeHref` di frontend. | Unit + e2e (`javascript:` -> 400). |
| IB-04 | Sedang | Endpoint baru `GET /api/v1/admin/search` (hasil dibatasi hak akses pengguna) dan kotak cari header yang berfungsi (debounce, grup hasil, navigasi keyboard, Enter membuka daftar tujuan sudah terfilter). | Unit + e2e + uji browser. |
| IB-05 | Sedang | Widget WhatsApp: validasi nomor di browser (aturan sama dengan API), error di samping field, **tidak membuka WhatsApp bila prospek gagal tersimpan**. DTO telepon memakai `IsPhoneNumberId` (menolak `0812`, `abcdefghij`, 7 digit). | Unit + uji browser. |
| IB-06 | Sedang | Server menolak status Tayang tanpa logo (buat, ubah, dan tombol Tayangkan di daftar) dengan error pada field `logo_media_id`; form menandai field lebih dulu. | Unit + e2e + uji browser. |
| IB-07 | Sedang | Header keamanan (CSP, X-Frame-Options, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP) dikirim aplikasi web pada build produksi (`vite.config.ts`); snippet nginx untuk `server_tokens off` + header pada aset statis (`ops/nginx/`). Opsi SMTP "Tanpa enkripsi" dihapus dari API dan UI. | `curl -I` pada build produksi; e2e (`smtp_security: none` -> 400). Bagian nginx **perlu diterapkan di server** (lihat atas). |
| IB-08 | Sedang | Editor Konten kehilangan `users.manage`, `site_settings.manage`, `email_accounts.manage`, `email_campaigns.send`. Menu sidebar mengikuti hak akses. Tombol nonaktifkan untuk akun sendiri disembunyikan; server menolak menonaktifkan akun sendiri dan **akun aktif terakhir** (peran apa pun). | Unit + e2e + uji browser (menu editor vs super admin). |
| IB-09 | Sedang | Form melacak file yang diunggah; **Batal/tutup** (atau penggantian gambar) langsung menghapusnya. Cadangan di server: sapuan terjadwal `MediaCleanupWorker` menghapus media tanpa relasi lebih tua dari 24 jam (kecuali arsip). | Unit + e2e (DB nyata) + uji browser (file terhapus saat Batal). |
| IB-10 | Sedang | API mengembalikan `details` per field (juga untuk field wajib & aturan publish); komponen `Field` menampilkan pesan di bawah input, `aria-invalid`, `aria-required`, fokus ke field pertama yang salah. Diterapkan di semua form konten, Pengaturan, Pengguna, Akun Email, Template, dan Kirim Email. | Unit + uji browser. |
| IB-11 | Rendah | `TablePagination` kini menampilkan `start` apa adanya (sebelumnya +1 ganda): "1-10 dari 39", "11-20", "1-1 dari 1". | Test + uji browser. |
| IB-12 | Rendah | Semua form baru default **Draf**; tombol Tayangkan di daftar meminta konfirmasi. | Uji browser. |
| IB-13 | Rendah | "Kirim Email" memvalidasi form lebih dulu (`collectBlastErrors`); dialog konfirmasi hanya muncul bila lengkap. | Unit. |
| IB-14 | Rendah | Satu komponen 404 bergaya situs (`NotFound`); `/portfolio/{slug}` dan `/berita/{slug}` yang tidak ada kini **HTTP 404** dengan header/footer situs; tidak ada lagi soft-404 + tombol "Coba lagi". | Uji browser + `curl -w "%{http_code}"`. |
| IB-15 | Rendah | Halaman detail `/portfolio/{slug}` (endpoint `GET /public/portfolio/:slug`) memakai slug dan Judul/Deskripsi Google dari admin; masuk sitemap; modal portofolio menautkan ke halaman detail. | Unit + e2e + uji browser. |
| IB-16 | Rendah | Label terhubung ke input (`for`/`id`), error inline di form kontak, email/telepon/WhatsApp/Instagram/alamat berupa tautan (`mailto:`/`tel:`/`wa.me`/instagram/maps), footer diberi ruang agar tidak tertutup tombol WhatsApp, gambar hero punya `alt`, logo header punya nama aksesibel. Pengaturan situs kini dimuat di server sehingga HTML awal sudah memuat kontak asli (bukan nilai bawaan). | Uji browser. |
| IB-17 | Info | (c) logo asli menggantikan inisial "AI" di login & sidebar admin; (d) `RevalidationWorker` menguras antrean `pending_revalidation` otomatis dan memangkas event lama; (e) Riwayat Email menampilkan subjek dan isi email (HTML dalam sandbox). Lihat catatan di bawah untuk (a) dan (b). | Uji browser / unit. |

## Catatan - butuh keputusan/aksi Indobraga (bukan perubahan kode)

- **IB-17a**: angka kapasitas sublim tidak konsisten ("12K meter/hari" di Kekuatan Produksi vs "Sublim 5K meter/hari" di
  Gambar Utama). Ini isi konten di database; perbaiki lewat panel admin sesuai angka yang benar.
- **IB-17b**: isi berita tetap teks polos (aman). Editor teks kaya (tebal, tautan, subjudul) adalah fitur baru; bila
  diinginkan, bangun dengan HTML disanitasi memakai `core/html-sanitizer.ts` yang sama.
- **CSP**: `script-src` masih memakai `'unsafe-inline'` karena TanStack Start menyisipkan skrip hidrasi inline. Untuk
  CSP berbasis nonce perlu dukungan nonce di SSR; ini peningkatan lanjutan.
- Setelah deploy, minta Elcodelabs menguji ulang IB-01, IB-02, IB-07, IB-08.
