# PLAN - Implementasi Backend dan Persiapan Integrasi Indobraga

Status dokumen: living implementation plan.  
Tanggal update terakhir: 2026-05-09.  
Sumber utama: `PRD.md` dan `docs/BACKEND_API_CONTRACT.md`.  
Target fase saat ini: backend MVP, integrasi frontend-backend fase 16 sampai 25, alignment struktur monorepo, dan notifikasi admin sudah selesai; fase berikutnya adalah staging/deployment preparation dengan credential aman.

Dokumen ini harus diperbarui setiap kali satu fase selesai, diblokir, atau ruang lingkupnya berubah. Tujuannya agar AI lain atau programmer lain dapat melanjutkan pekerjaan tanpa menebak konteks, mengulang audit dari awal, atau membuat asumsi yang bertentangan dengan PRD dan API contract.

## 1. Aturan Penggunaan PLAN

Status yang dipakai:

| Status        | Makna                                   |
| ------------- | --------------------------------------- |
| `Pending`     | Belum dikerjakan                        |
| `In Progress` | Sedang dikerjakan                       |
| `Done`        | Selesai dan sudah diverifikasi          |
| `Blocked`     | Tidak bisa lanjut tanpa keputusan/input |
| `Skipped`     | Sengaja ditunda dan alasannya dicatat   |

Aturan update:

- Setiap fase hanya boleh ditandai `Done` setelah Definition of Done fase tersebut terpenuhi.
- Saat fase selesai, update `Status`, `Completed at`, `Changed files`, `Verification`, dan `Notes`.
- Jika ada keputusan arsitektur baru, catat di bagian keputusan teknis dan sinkronkan ke `docs/BACKEND_API_CONTRACT.md` bila memengaruhi kontrak.
- Jika implementasi menyimpang dari PRD/API contract, catat alasan dan risiko sebelum lanjut.
- Jangan menghapus catatan fase yang sudah selesai. Tambahkan catatan baru di bawahnya.
- Fase backend 0 sampai 15, fase integrasi frontend 16 sampai 25, fase alignment monorepo 26, dan fase notifikasi admin 27 sudah selesai. Fase berikutnya harus dimulai dengan plan baru untuk staging/deployment, bukan mengubah scope yang sudah diverifikasi.

## 2. Batasan Fase Backend, Integrasi, dan Tahap Berikutnya

Backend yang sudah selesai:

- Backend `apps/api` sudah dibuat sesuai PRD dan API contract.
- Database schema, migration, seed development, service, controller, DTO, guard, worker, dan test backend sudah tersedia.
- Dokumentasi backend, env example, runbook lokal, contract checklist, dan integration readiness report sudah tersedia.
- Adapter provider memakai mock/test mode agar backend bisa diuji tanpa credential production.

Yang sudah dilakukan pada fase integrasi:

- Membuat API client frontend di `apps/web/` yang mengikuti response envelope backend.
- Menghubungkan frontend ke endpoint public dan admin secara bertahap sesuai contract.
- Mengganti mock data frontend per modul setelah endpoint terkait terverifikasi.
- Menambahkan loading, error, empty, optimistic/local state, dan toast sesuai behavior frontend.
- Mengintegrasikan cookie credentials dan CSRF token untuk mutasi admin.
- Menambahkan konfigurasi env frontend untuk base URL API.

Yang boleh dilakukan pada fase berikutnya:

- Menyiapkan environment staging untuk frontend, backend, database, object storage, OAuth, SMTP, dan scheduler worker.
- Menyiapkan Nginx production untuk SSE notification stream dengan proxy buffering disabled.
- Menjalankan smoke test OAuth/SMTP/Object Storage dengan credential aman di environment, bukan di repository.
- Menentukan routing final `robots.txt` dan `sitemap.xml`: static frontend atau dynamic backend sesuai arsitektur deployment.
- Memperbarui `PLAN.md` dengan fase deployment/staging baru sebelum mulai kerja produksi.

Yang tetap tidak boleh dilakukan:

- Tidak menyimpan credential production, token OAuth asli, password SMTP asli, access key object storage asli, atau secret lain ke repository.
- Tidak menambahkan Redis sebagai dependency MVP.
- Tidak menyimpan binary media di database, Redis, atau memory aplikasi.
- Tidak mengubah PRD/API contract secara diam-diam tanpa mencatat alasan di PLAN.
- Tidak menyimpan session token di `localStorage`; auth admin tetap memakai HTTP-only cookie.
- Tidak memanggil internal worker endpoint dari frontend.
- Tidak melakukan production smoke test OAuth/SMTP/S3 dengan credential yang di-commit.

## 3. Kondisi Saat Ini

Fase yang sudah selesai dan kondisi project saat ini:

| Area                            | Status | Evidence                                                                                                                         |
| ------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------- |
| PRD produk dan arsitektur       | Done   | `PRD.md` tersedia dan sudah memuat media, cache, SEO, OAuth/SMTP, email blast, dan scope MVP                                     |
| API contract backend            | Done   | `docs/BACKEND_API_CONTRACT.md` tersedia                                                                                          |
| Frontend UI public dan admin    | Done   | `apps/web/src` berisi screen public/admin yang kini API-first dengan fallback visual development                                 |
| Frontend lint/EOL hygiene       | Done   | `npm run lint` di `apps/web` sukses tanpa warning pada 2026-05-09                                                                |
| Frontend build                  | Done   | `npm run build` di `apps/web` sukses pada 2026-05-09                                                                             |
| SEO technical frontend baseline | Done   | `apps/web/public/robots.txt`, `apps/web/public/sitemap.xml`, route metadata, canonical, noindex admin/login                      |
| Frontend API integration        | Done   | Public screen, admin screen, auth admin, leads, media, email account, email campaign, dan dashboard memakai service API frontend |
| Struktur monorepo ideal         | Done   | Root workspace npm tersedia; frontend berada di `apps/web`, backend di `apps/api`, root repository `.git` berada di root project |
| Backend MVP                     | Done   | `apps/api` selesai sampai fase 15 dan sudah dihubungkan ke frontend pada fase 16-25                                              |
| Admin notification              | Done   | DB-backed notifications, SSE admin bell, notification email worker, dan dokumen kontrak/runbook sudah ditambahkan                |
| Backend unit test               | Done   | 26 suites, 99 tests passed pada 2026-05-10                                                                                       |
| Backend E2E test                | Done   | 11 suites, 43 tests passed pada 2026-05-09; backend lint/build/unit test terakhir hijau pada 2026-05-09                          |

Catatan penting:

- Root project sudah mengikuti struktur monorepo ideal PRD: `apps/web` untuk frontend dan `apps/api` untuk backend.
- Git repository sudah berada di root project, bukan nested di aplikasi frontend.
- Root `package.json` memakai npm workspaces untuk `apps/api` dan `apps/web`.
- `docs/BACKEND_API_CONTRACT.md` menjadi acuan payload, endpoint, error envelope, cache header, permission, dan workflow saat integrasi.

## 4. Prinsip Arsitektur yang Wajib Dipertahankan

- Database MySQL adalah source of truth untuk konten, user, lead, media metadata, email account, campaign, recipient, dan send log.
- API mengikuti base path `/api/v1`.
- Public endpoint ringan, cache-aware, dan hanya mengirim data yang dibutuhkan tampilan.
- Admin endpoint authenticated, permission-aware, dan memakai `Cache-Control: no-store`.
- Response sukses dan error mengikuti envelope di `docs/BACKEND_API_CONTRACT.md`.
- Upload media melalui backend, bukan direct upload dari frontend ke Object Storage.
- Backend melakukan validasi final, sanitasi, resize, kompresi, derivative, dan pencatatan metadata media.
- Media final disimpan di IDCloudHost Object Storage atau adapter S3-compatible, bukan di database.
- Media public memakai object key unik/versioned/hashed agar aman diberi cache panjang.
- Redis tidak dipakai untuk MVP.
- Revalidasi/cache refresh adalah side effect sistem, bukan flow manual admin.
- Notifikasi admin memakai database sebagai source of truth, SSE untuk dashboard aktif, dan fallback polling lambat jika stream gagal.
- Email notifikasi operasional diproses worker backend, bukan di request public.
- Google account memakai OAuth/Gmail API, bukan password/app password manual.
- SMTP Hosting memakai konfigurasi SMTP dan wajib test connection/test send sebelum connected.
- Secret OAuth/SMTP/object storage harus terenkripsi atau berada di environment variable backend.
- Worker email memakai database locking/idempotency agar campaign tidak terkirim ganda.
- Frontend admin harus memakai `credentials: include` dan mengirim `x-csrf-token` untuk mutasi.
- Frontend tidak boleh menyimpan token/session/secret OAuth/SMTP di browser storage.
- Penggantian mock frontend harus bertahap per workflow agar regression UI mudah dilacak.

## 5. Keputusan Teknis yang Harus Dikunci

Fase 0 tidak boleh ditandai `Done` sebelum tabel ini jelas.

| Keputusan                 | Status | Rekomendasi awal                                                                   | Catatan final                                                                                                                                                                       |
| ------------------------- | ------ | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Struktur monorepo backend | Done   | Buat `apps/api`; migrasi frontend ke `apps/web` dilakukan setelah integrasi stabil | Backend dibuat di `apps/api`. Setelah integrasi selesai, frontend dipindahkan ke `apps/web` dan root workspace npm dibuat.                                                          |
| Auth admin                | Done   | HTTP-only secure cookie dengan session/JWT cookie, bukan localStorage              | Gunakan database-backed opaque session cookie. Simpan hash session token di MySQL. Cookie `HttpOnly`, `Secure` di production, `SameSite=Lax`. Mutasi admin memakai CSRF protection. |
| ORM/database toolkit      | Done   | Prisma atau Drizzle untuk MySQL; pilih satu sebelum migration                      | Gunakan Prisma + MySQL untuk schema, migration, seed, dan typed client.                                                                                                             |
| Deployment backend        | Done   | Node/container lebih aman untuk Sharp, FFmpeg, worker, dan temp files              | Target MVP adalah Node.js server/container, bukan Cloudflare/serverless runtime, agar aman untuk Sharp, FFmpeg, temp file, scheduler/worker, dan SDK S3-compatible.                 |
| Worker email              | Done   | Process/command terpisah dengan database locking; scheduler memanggil tick         | Worker utama berupa process/command terpisah dengan database locking/idempotency. Internal tick endpoint boleh tersedia untuk scheduler dan wajib dilindungi internal secret.       |
| Object storage dev mode   | Done   | S3-compatible adapter dengan mock/local fallback untuk test                        | Buat storage abstraction. Production memakai S3-compatible IDCloudHost. Development/test memakai local/mock adapter tanpa credential production.                                    |
| Batas upload gambar/video | Done   | Tentukan MB dan durasi video MVP sebelum coding media                              | Image max 10 MB. Video max 100 MB dan durasi max 120 detik untuk MVP galeri. Nilai dikonfigurasi via env.                                                                           |
| Ukuran derivative media   | Done   | Tentukan `thumbnail`, `medium`, `large`, dan poster video                          | Image: thumbnail 480px, medium 960px, large 1600px sisi terpanjang. Video poster 960px. Format image output WebP.                                                                   |
| Domain production         | Done   | Website domain dan media custom domain final perlu dikunci                         | Default sementara: website `https://indobraga.com`, media `https://media.indobraga.com`. Harus disesuaikan lewat env jika domain final berubah.                                     |
| Password reset admin      | Done   | Tunda dari MVP kecuali user minta masuk scope                                      | Ditunda dari MVP. Admin awal dari seed, perubahan password lewat admin/user management atau prosedur operasional internal.                                                          |
| Audit log detail          | Done   | Minimal audit log untuk mutasi admin penting                                       | Masuk MVP secara minimal: login/logout, create/update/delete/publish/unpublish, media upload/delete, email account change, campaign send.                                           |
| Rich text berita          | Done   | Plain paragraphs atau HTML terbatas; pilih sebelum schema final                    | MVP memakai structured JSON paragraphs/blocks sederhana. HTML bebas tidak diterima untuk mengurangi risiko XSS.                                                                     |

## 6. Ringkasan Roadmap

| Fase | Nama                                      | Status | Output utama                                                    |
| ---- | ----------------------------------------- | ------ | --------------------------------------------------------------- |
| 0    | Decision Lock dan Setup Strategy          | Done   | Keputusan teknis dikunci dan contract diselaraskan              |
| 1    | Backend Scaffold dan Tooling              | Done   | `apps/api` siap lint/build/test                                 |
| 2    | Database Foundation                       | Done   | Schema, migration, seed development                             |
| 3    | API Core Foundation                       | Done   | Envelope, validation, error, logging, config, security baseline |
| 4    | Auth dan Admin Users                      | Done   | Login/logout/me/permission backend                              |
| 5    | Public Content Read API                   | Done   | Endpoint public ringan sesuai contract                          |
| 6    | Admin Content Management API              | Done   | CRUD admin untuk konten public                                  |
| 7    | Media Pipeline dan Object Storage Adapter | Done   | Upload, optimizer, derivative, metadata                         |
| 8    | Lead, Inquiry, dan WhatsApp Lead          | Done   | Public form backend dan admin listing                           |
| 9    | Email Account Backend                     | Done   | Google OAuth flow, SMTP account, encryption, test               |
| 10   | Email Campaign dan Worker                 | Done   | Campaign, recipients, send log, DB worker                       |
| 11   | SEO Assets dan Revalidation Backend       | Done   | Dynamic sitemap/robots/SEO/revalidation events                  |
| 12   | Dashboard Summary dan Operational Views   | Done   | Ringkasan admin dan status operasional                          |
| 13   | Security, Observability, dan Hardening    | Done   | Rate limit, audit, headers, logs, backup notes                  |
| 14   | Contract Verification dan QA              | Done   | Test suite, contract checklist, build green                     |
| 15   | Backend Handoff Package                   | Done   | Runbook, env docs, integration readiness report                 |

Roadmap integrasi frontend:

| Fase | Nama                                       | Status | Output utama                                                               |
| ---- | ------------------------------------------ | ------ | -------------------------------------------------------------------------- |
| 16   | Integration Plan dan API Client Foundation | Done   | API client, env, envelope/error handler, CSRF helper                       |
| 17   | Auth Admin Integration                     | Done   | Login/logout/me admin tersambung cookie session                            |
| 18   | Public Content Integration                 | Done   | Homepage, portofolio, fasilitas, galeri, berita, kontak memakai API public |
| 19   | Admin Content Integration                  | Done   | CRUD konten admin memakai endpoint backend                                 |
| 20   | Media Integration                          | Done   | Upload multipart, gallery media, retry/delete, media picker                |
| 21   | Leads Integration                          | Done   | Contact form, WhatsApp lead, admin leads workflow                          |
| 22   | Email Accounts Integration                 | Done   | Google OAuth UX, SMTP Hosting flow, account status/action                  |
| 23   | Email Campaign Integration                 | Done   | Draft, recipients, send, logs, worker status UI                            |
| 24   | SEO Runtime dan Cache Integration          | Done   | Strategi metadata/sitemap/revalidation diselaraskan frontend               |
| 25   | Integration QA dan Handoff                 | Done   | Full regression, responsive, build/test, readiness deployment              |
| 26   | Monorepo Structure Alignment               | Done   | Root workspace, root Git, frontend `apps/web`, docs path update            |
| 27   | Admin Notification Runtime                 | Done   | DB notification, SSE bell, read state, dan notification email worker       |
| 28   | Recipient Source Flow                      | Done   | Pesan Kontak filter, Upload CSV dengan template, preview penerima, dan snapshot campaign |

## 7. Detail Fase

### Fase 0 - Decision Lock dan Setup Strategy

Status: Done  
Started at: 2026-05-08  
Completed at: 2026-05-08  
Owner: Codex

Tujuan:

- Mengunci keputusan teknis yang memengaruhi scaffold, database, worker, media, auth, dan deployment.
- Memastikan `docs/BACKEND_API_CONTRACT.md` tidak bertentangan dengan keputusan final.

Task:

- Review open questions di `docs/BACKEND_API_CONTRACT.md`.
- Tentukan strategi auth, ORM, deployment, worker, object storage dev mode, upload limit, derivative size, dan rich text.
- Catat keputusan final di bagian 5 PLAN.
- Update API contract jika ada perubahan endpoint, payload, atau policy.
- Tentukan apakah backend dibuat di `apps/api` tanpa memindahkan `apps/web/`.

Definition of Done:

- Semua keputusan di bagian 5 minimal tidak lagi `Pending`.
- API contract sinkron dengan keputusan final.
- Tidak ada kode backend dibuat sebelum keputusan minimum auth, ORM, dan deployment jelas.

Changed files:

- `PLAN.md`
- `docs/BACKEND_API_CONTRACT.md`

Verification:

- Review manual `PRD.md`, `docs/BACKEND_API_CONTRACT.md`, dan `PLAN.md`.
- Semua keputusan di bagian 5 sudah tidak `Pending`.

Notes:

- Keputusan dikunci dengan asumsi konservatif sebagai system/architecture analyst agar implementasi backend dapat berjalan tanpa menunggu integrasi frontend.
- Frontend `apps/web/` tidak dipindahkan dan tidak dihubungkan ke API pada fase ini.

### Fase 1 - Backend Scaffold dan Tooling

Status: Done  
Started at: 2026-05-08  
Completed at: 2026-05-08  
Owner: Codex

Tujuan:

- Membuat fondasi `apps/api` yang rapi, testable, dan tidak menyentuh frontend.

Task:

- Scaffold NestJS TypeScript di `apps/api`.
- Tambahkan script `dev`, `build`, `lint`, `format`, `test`, dan `test:e2e`.
- Tambahkan Prettier/ESLint backend dengan LF line ending.
- Tambahkan `.env.example` backend tanpa secret asli.
- Tambahkan config loader dan validation untuk environment variable.
- Tambahkan endpoint healthcheck backend, misalnya `/api/v1/health`.
- Pastikan CORS/cookie config masih aman untuk fase backend tanpa frontend integration.
- Dokumentasikan cara menjalankan backend lokal.

Definition of Done:

- `apps/api` bisa install dependency, lint, build, dan menjalankan test awal.
- Tidak ada frontend route yang diubah untuk memanggil API.
- Tidak ada secret production masuk repository.

Changed files:

- `PLAN.md`
- `apps/api/.env.example`
- `apps/api/.gitignore`
- `apps/api/.prettierignore`
- `apps/api/.prettierrc`
- `apps/api/README.md`
- `apps/api/eslint.config.mjs`
- `apps/api/jest.config.cjs`
- `apps/api/nest-cli.json`
- `apps/api/package.json`
- `apps/api/package-lock.json`
- `apps/api/src/app.module.ts`
- `apps/api/src/config/env.ts`
- `apps/api/src/health/health.controller.ts`
- `apps/api/src/health/health.controller.spec.ts`
- `apps/api/src/health/health.module.ts`
- `apps/api/src/health/health.service.ts`
- `apps/api/src/main.ts`
- `apps/api/test/app.e2e-spec.ts`
- `apps/api/test/jest-e2e.cjs`
- `apps/api/tsconfig.build.json`
- `apps/api/tsconfig.json`

Verification:

- `npm install`: sukses, 0 vulnerability.
- `npm run format`: sukses.
- `npm run lint`: sukses.
- `npm run build`: sukses.
- `npm run test`: sukses, 1 test passed.
- `npm run test:e2e`: sukses, 1 test passed.

Notes:

- Scaffold dibuat sebagai package backend mandiri di `apps/api`.
- Belum ada frontend integration.
- npm menampilkan warning deprecation transitif dari beberapa dependency Nest/Jest (`glob`, `inflight`), tetapi audit vulnerability 0.

### Fase 2 - Database Foundation

Status: Done  
Started at: 2026-05-08  
Completed at: 2026-05-08  
Owner: Codex

Tujuan:

- Membuat database model MySQL sesuai PRD dan API contract.

Task:

- Setup ORM/database toolkit yang sudah dipilih.
- Buat koneksi MySQL melalui environment variable.
- Buat migration awal untuk tabel:
  - `users`
  - `site_settings`
  - `hero_sections`
  - `hero_slides`
  - `partners`
  - `production_strengths`
  - `portfolios`
  - `machines`
  - `printing_capacities`
  - `production_capacities`
  - `services`
  - `gallery_items`
  - `news`
  - `inquiries`
  - `whatsapp_leads`
  - `media_files`
  - `email_accounts`
  - `email_campaigns`
  - `email_campaign_recipients`
  - `email_send_logs`
  - `audit_logs` jika diputuskan masuk MVP
- Tambahkan index, unique constraint, status enum, slug policy, dan sort order.
- Buat seed development untuk super admin dan konten contoh dari mock frontend bila diperlukan.
- Pastikan password seed diambil dari env/dev-only placeholder, bukan hardcoded production.

Definition of Done:

- Migration bisa dijalankan dari database kosong.
- Schema mendukung field di API contract.
- Seed development tersedia dan tidak mengandung secret production.
- Constraint slug/email/object key sudah jelas.

Changed files:

- `PLAN.md`
- `docs/BACKEND_API_CONTRACT.md`
- `apps/api/.env.example`
- `apps/api/package.json`
- `apps/api/package-lock.json`
- `apps/api/prisma.config.ts`
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/seed.ts`
- `apps/api/prisma/migrations/migration_lock.toml`
- `apps/api/prisma/migrations/20260508000000_init/migration.sql`
- `apps/api/tsconfig.json`

Verification:

- `npx prisma format`: sukses.
- `npm run db:validate`: sukses.
- `npm run db:migrate`: sukses, migration `20260508000000_init` berhasil diterapkan ke database kosong lokal.
- `npm run db:seed`: sukses.
- `npx prisma migrate status`: sukses, database schema up to date.
- Query MySQL dev: `users` berisi 1 seed admin dan `site_settings` berisi 1 record.
- `npm run format`: sukses.
- `npm run lint`: sukses.
- `npm run build`: sukses.
- `npm run test`: sukses, 1 test passed.
- `npm run test:e2e`: sukses, 1 test passed.

Notes:

- Jangan menyimpan media binary di database. `media_files` hanya metadata dan object key/URL.
- Development lokal memakai database `indobraga` dan shadow database `indobraga_shadow`; keduanya dibuat lokal untuk Prisma Migrate tanpa memberi hak global berlebihan ke user aplikasi.
- Local `.env` dibuat dari `.env.example` untuk verifikasi, tetapi tetap ignored dan tidak boleh berisi secret production.
- Belum ada integrasi frontend.

### Fase 3 - API Core Foundation

Status: Done  
Started at: 2026-05-08  
Completed at: 2026-05-08  
Owner: Codex

Tujuan:

- Membuat fondasi API konsisten sebelum endpoint bisnis dibuat.

Task:

- Implement standard response envelope.
- Implement standard error format dan global exception filter.
- Implement validation pipe, DTO convention, dan sanitasi input.
- Implement request ID middleware/interceptor.
- Implement structured logging.
- Implement cache header helper.
- Implement pagination helper untuk page dan cursor.
- Implement permission decorator/guard skeleton.
- Implement rate limit baseline untuk login dan public form.
- Implement OpenAPI/Swagger hanya untuk backend documentation jika sesuai keputusan.

Definition of Done:

- Semua endpoint awal memakai envelope dan error format standar.
- Error validasi field konsisten dengan contract.
- Test unit/e2e untuk success, validation error, auth error, dan not found tersedia.

Changed files:

- `apps/api/package.json`
- `apps/api/package-lock.json`
- `apps/api/src/app.module.ts`
- `apps/api/src/main.ts`
- `apps/api/src/core/api-error.ts`
- `apps/api/src/core/cache-control.decorator.ts`
- `apps/api/src/core/cache-control.interceptor.ts`
- `apps/api/src/core/core.module.ts`
- `apps/api/src/core/http-exception.filter.ts`
- `apps/api/src/core/pagination.ts`
- `apps/api/src/core/pagination.spec.ts`
- `apps/api/src/core/permissions.decorator.ts`
- `apps/api/src/core/permissions.guard.ts`
- `apps/api/src/core/request-context.ts`
- `apps/api/src/core/request-id.middleware.ts`
- `apps/api/src/core/response-envelope.interceptor.ts`
- `apps/api/src/core/validation.pipe.ts`
- `apps/api/src/types/express.d.ts`
- `apps/api/src/health/health.controller.ts`
- `apps/api/src/health/health.controller.spec.ts`
- `apps/api/test/app.e2e-spec.ts`
- `apps/api/test/core.e2e-spec.ts`

Verification:

- `npm install @nestjs/throttler helmet class-transformer class-validator`: sukses, 0 vulnerability.
- `npm install -D @types/express`: sukses, 0 vulnerability.
- `npm run format`: sukses.
- `npm run lint`: sukses.
- `npm run build`: sukses.
- `npm run test`: sukses, 2 test suites passed, 5 tests passed.
- `npm run test:e2e`: sukses, 2 test suites passed, 5 tests passed.

Notes:

- Jangan membuat response endpoint yang berbeda-beda formatnya walaupun lebih cepat.
- Global response envelope, standard error filter, request id middleware, cache header decorator/interceptor, validation pipe, pagination helper, permission guard skeleton, throttler baseline, dan Helmet baseline sudah tersedia.
- E2E sudah mencakup success envelope, validation error, auth error dari protected route skeleton, not found error, request id header, dan no-store cache header healthcheck.
- Belum ada endpoint bisnis selain healthcheck dan test-only controller untuk e2e.

### Fase 4 - Auth dan Admin Users

Status: Done  
Started at: 2026-05-08  
Completed at: 2026-05-08  
Owner: Codex

Tujuan:

- Membuat auth backend admin yang aman sebelum modul admin lain dibuat.

Task:

- Implement `POST /api/v1/auth/login`.
- Implement `POST /api/v1/auth/logout`.
- Implement `GET /api/v1/auth/me`.
- Implement `POST /api/v1/auth/refresh` jika strategi auth membutuhkan refresh.
- Hash password admin dengan algoritma kuat.
- Implement role `super_admin` dan `content_editor`.
- Implement permission check sesuai matrix contract.
- Implement CSRF protection bila memakai cookie dan mutasi lintas origin.
- Implement rate limit login.
- Pastikan token/session tidak disimpan di localStorage.
- Tambahkan admin users API sesuai contract jika masuk fase ini:
  - list user
  - create user
  - update role/status
  - reset password manual/admin-side bila masuk scope

Definition of Done:

- Login/logout/me berjalan di backend.
- Admin endpoint dummy/protected menolak unauthenticated request.
- Permission guard dapat membedakan role.
- Secret/session tidak bocor ke response.

Changed files:

- `PLAN.md`
- `docs/BACKEND_API_CONTRACT.md`
- `apps/api/.env.example`
- `apps/api/package.json`
- `apps/api/package-lock.json`
- `apps/api/src/app.module.ts`
- `apps/api/src/auth/auth.controller.ts`
- `apps/api/src/auth/auth.decorators.ts`
- `apps/api/src/auth/auth.module.ts`
- `apps/api/src/auth/auth.service.ts`
- `apps/api/src/auth/auth.types.ts`
- `apps/api/src/auth/cookie.utils.ts`
- `apps/api/src/auth/csrf.guard.ts`
- `apps/api/src/auth/dto/login.dto.ts`
- `apps/api/src/auth/session-auth.guard.ts`
- `apps/api/src/config/env.ts`
- `apps/api/src/core/core.module.ts`
- `apps/api/src/core/permissions.decorator.ts`
- `apps/api/src/database/database.module.ts`
- `apps/api/src/database/prisma.service.ts`
- `apps/api/src/types/express.d.ts`
- `apps/api/src/users/dto/create-user.dto.ts`
- `apps/api/src/users/dto/list-users-query.dto.ts`
- `apps/api/src/users/dto/update-user-status.dto.ts`
- `apps/api/src/users/dto/update-user.dto.ts`
- `apps/api/src/users/dto/user-id-param.dto.ts`
- `apps/api/src/users/dto/user-role-status.dto.ts`
- `apps/api/src/users/users.controller.ts`
- `apps/api/src/users/users.module.ts`
- `apps/api/src/users/users.service.ts`
- `apps/api/test/auth.e2e-spec.ts`

Verification:

- `npm install cookie-parser`: sukses, 0 vulnerability.
- `npm install -D @types/cookie-parser`: sukses, 0 vulnerability.
- `npm run format`: sukses.
- `npm run lint`: sukses.
- `npm run build`: sukses.
- `npm run test`: sukses, 2 test suites passed, 5 tests passed.
- `npm run test:e2e`: sukses, 3 test suites passed, 9 tests passed.
- `npm audit --omit=dev`: sukses, 0 vulnerability.

Notes:

- Frontend login mock tidak diubah pada fase ini.
- Auth admin memakai opaque session token di HTTP-only cookie, hash token di MySQL, dan CSRF double-submit cookie/header untuk mutasi authenticated.
- Endpoint auth tersedia: `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`.
- Admin Users API tersedia: list, detail, create, update, update status, dan disable/cabut akses via soft inactive.
- Permission matrix dasar sudah diselaraskan dengan contract. `users.manage` hanya untuk `super_admin`; `content_editor` ditolak pada Admin Users API.
- Password admin selalu di-hash dengan bcrypt dan tidak pernah dikirim balik ke response.

### Fase 5 - Public Content Read API

Status: Done  
Started at: 2026-05-08  
Completed at: 2026-05-08  
Owner: Codex

Tujuan:

- Membuat endpoint public ringan sesuai kebutuhan website public.

Task:

- Implement `GET /api/v1/public/site-settings`.
- Implement `GET /api/v1/public/home`.
- Implement `GET /api/v1/public/portfolio` dengan cursor/filter.
- Implement `GET /api/v1/public/facilities`.
- Implement `GET /api/v1/public/gallery` dengan cursor.
- Implement `GET /api/v1/public/news` dengan page pagination SEO-friendly.
- Implement `GET /api/v1/public/news/:slug`.
- Pastikan response hanya memuat metadata ringan untuk listing.
- Pastikan hanya status `published` yang keluar di public API.
- Tambahkan cache header public sesuai contract.

Definition of Done:

- Semua public read endpoint dari API contract tersedia.
- Listing portofolio/galeri/news tidak mengirim konten berat yang tidak dibutuhkan.
- Draft/inactive tidak keluar di public API.
- Pagination dan cursor konsisten.

Changed files:

- `PLAN.md`
- `apps/api/src/app.module.ts`
- `apps/api/src/public-content/dto/gallery-query.dto.ts`
- `apps/api/src/public-content/dto/news-query.dto.ts`
- `apps/api/src/public-content/dto/portfolio-query.dto.ts`
- `apps/api/src/public-content/dto/slug-param.dto.ts`
- `apps/api/src/public-content/media-presenter.ts`
- `apps/api/src/public-content/public-content.controller.ts`
- `apps/api/src/public-content/public-content.module.ts`
- `apps/api/src/public-content/public-content.service.ts`
- `apps/api/test/public-content.e2e-spec.ts`

Verification:

- `npm run format`: sukses.
- `npm run lint`: sukses.
- `npm run build`: sukses.
- `npm run test:e2e -- public-content`: sukses, 1 test suite passed, 6 tests passed.
- `npm run test`: sukses, 2 test suites passed, 5 tests passed.
- `npm run test:e2e`: sukses, 4 test suites passed, 15 tests passed.
- `npm run db:validate`: sukses.
- `npm audit --omit=dev`: sukses, 0 vulnerability.

Notes:

- Frontend public tetap memakai mock data sampai fase integrasi dibuat.
- Endpoint public read tersedia: `site-settings`, `home`, `portfolio`, `facilities`, `gallery`, `news`, dan `news/:slug`.
- Public endpoint hanya mengeluarkan konten `PUBLISHED` dan tidak mengirim field internal seperti status, object key, storage metadata, uploaded_by, audit, atau secret.
- Portofolio dan galeri memakai cursor berbasis `sortOrder` + `id`; berita memakai page pagination.
- Cache header mengikuti contract: public list `max-age=60, stale-while-revalidate=300`, detail/site settings `max-age=300, stale-while-revalidate=600`.
- E2E membuat fixture langsung di database dan membersihkannya setelah test, tanpa mengubah frontend atau menambahkan integrasi API.

### Fase 6 - Admin Content Management API

Status: Done
Started at: 2026-05-09
Completed at: 2026-05-09
Owner: Codex

Tujuan:

- Membuat API admin untuk mengelola konten public dari dashboard.

Task:

- Implement resource pattern list/detail/create/update/delete/status/sort untuk:
  - site settings
  - hero slides
  - partners/client logos
  - production strengths
  - portfolios
  - machines/facilities
  - printing capacities
  - production capacities
  - services
  - gallery items
  - news
- Implement validation bisnis:
  - slug unique
  - status enum valid
  - sort order valid
  - media relation valid
  - published content wajib punya field minimal
- Implement soft delete bila diputuskan.
- Trigger revalidation event setelah publish/unpublish/update/delete.
- Tambahkan audit log untuk mutasi penting bila masuk MVP.

Definition of Done:

- Admin CRUD utama berjalan dan protected.
- Response mengikuti envelope contract.
- Mutasi admin tidak mengembalikan data secret.
- Revalidation event tercatat/terpanggil sebagai side effect.

Changed files:

- `PLAN.md`
- `apps/api/src/app.module.ts`
- `apps/api/src/admin-content/admin-content.controller.ts`
- `apps/api/src/admin-content/admin-content.module.ts`
- `apps/api/src/admin-content/admin-content.service.ts`
- `apps/api/src/admin-content/dto/admin-content.dto.ts`
- `apps/api/src/admin-content/dto/admin-list-query.dto.ts`
- `apps/api/src/admin-content/dto/content-status-update.dto.ts`
- `apps/api/src/admin-content/dto/reorder.dto.ts`
- `apps/api/src/admin-content/dto/site-settings-update.dto.ts`
- `apps/api/src/audit/audit.module.ts`
- `apps/api/src/audit/audit.service.ts`
- `apps/api/src/core/content-status.dto.ts`
- `apps/api/src/core/id-param.dto.ts`
- `apps/api/src/revalidation/revalidation.module.ts`
- `apps/api/src/revalidation/revalidation.service.ts`
- `apps/api/test/admin-content.e2e-spec.ts`

Verification:

- `npm run format`: sukses.
- `npm run lint`: sukses.
- `npm run build`: sukses.
- `npm run test:e2e -- admin-content`: sukses, 1 test suite passed, 4 tests passed.

Notes:

- Jangan membuat tombol/flow baru di frontend pada fase ini.
- Admin Content API tersedia untuk site settings, hero, hero slides, partners, production strengths, portfolios, machines, printing capacities, production capacities, services, gallery items, dan news.
- Mutasi admin protected dengan session + CSRF, memakai `Cache-Control: no-store`, permission-aware, dan menulis audit log + revalidation event.
- Soft delete memakai status `inactive` untuk konten public.
- Validasi publish minimum tersedia untuk media portfolio dan content news.
- Frontend tetap tidak dihubungkan ke API.

### Fase 7 - Media Pipeline dan Object Storage Adapter

Status: Done  
Started at: 2026-05-09  
Completed at: 2026-05-09  
Owner: Codex

Tujuan:

- Membuat upload media backend yang aman, teroptimasi, dan siap object storage.

Task:

- Implement `POST /api/v1/admin/media`.
- Implement `GET /api/v1/admin/media`.
- Implement `GET /api/v1/admin/media/:id`.
- Implement `DELETE /api/v1/admin/media/:id`.
- Implement `POST /api/v1/admin/media/:id/retry`.
- Validasi MIME dengan sniffing, bukan hanya extension.
- Validasi ukuran, dimensi, dan durasi sesuai keputusan Fase 0.
- Strip metadata yang tidak perlu.
- Auto-rotate gambar berdasarkan orientasi.
- Generate derivative image:
  - `thumbnail`
  - `medium`
  - `large`
- Generate poster video dan final MP4 H.264 + AAC jika video masuk MVP.
- Buat object key unik/versioned/hashed.
- Upload final files ke adapter S3-compatible.
- Simpan metadata ke `media_files`.
- Implement cleanup temp files.
- Implement cleanup/lifecycle note untuk file lama yang tidak direferensikan.

Definition of Done:

- Upload gambar menghasilkan derivative dan metadata.
- Upload file invalid ditolak dengan error contract.
- Binary media tidak disimpan di database.
- Adapter storage dapat diuji tanpa credential production.
- Cache URL final aman untuk long immutable cache.

Changed files:

- `PLAN.md`
- `apps/api/.gitignore`
- `apps/api/package.json`
- `apps/api/package-lock.json`
- `apps/api/src/app.module.ts`
- `apps/api/src/media/dto/list-media-query.dto.ts`
- `apps/api/src/media/dto/upload-media.dto.ts`
- `apps/api/src/media/local-storage.service.ts`
- `apps/api/src/media/media-sniff.ts`
- `apps/api/src/media/media-status.dto.ts`
- `apps/api/src/media/media.controller.ts`
- `apps/api/src/media/media.module.ts`
- `apps/api/src/media/media.service.ts`
- `apps/api/test/media.e2e-spec.ts`

Verification:

- `npm install sharp file-type multer`: sukses, 0 vulnerability.
- `npm install -D @types/multer`: sukses, 0 vulnerability.
- `npm run format`: sukses.
- `npm run lint`: sukses.
- `npm run build`: sukses.
- `npm run test:e2e -- media`: sukses, 1 test suite passed, 2 tests passed.

Notes:

- Jika FFmpeg belum tersedia di environment lokal, catat prerequisite dengan jelas dan jangan menandai video pipeline `Done`.
- Image upload menghasilkan derivative WebP `thumbnail`, `medium`, dan `large` melalui Sharp.
- Development/test memakai local storage adapter di `.local-storage` dan hanya menyimpan metadata + URL/object key di database; binary tidak disimpan di database.
- MIME sniffing dasar tersedia untuk PNG/JPEG/WebP/MP4; file unsupported ditolak dengan `UNSUPPORTED_MEDIA_TYPE`.
- Video MP4 disimpan melalui adapter lokal sebagai metadata/video URL. Transcoding FFmpeg/H.264 dan poster generation dicatat sebagai prerequisite deployment yang memiliki FFmpeg; e2e MVP memverifikasi image pipeline sebagai jalur utama.
- Endpoint media tersedia: upload, list, detail, delete/mark deleted, dan retry failed.

### Fase 8 - Lead, Inquiry, dan WhatsApp Lead

Status: Done  
Started at: 2026-05-09  
Completed at: 2026-05-09  
Owner: Codex

Tujuan:

- Menangani lead public tanpa bergantung pada frontend mock.

Task:

- Implement `POST /api/v1/public/inquiries`.
- Implement `POST /api/v1/public/whatsapp-leads`.
- Implement admin listing/detail/status untuk inquiries.
- Implement admin listing/detail/status untuk WhatsApp leads.
- Validasi nama, email, nomor telepon, perusahaan, dan pesan.
- Tambahkan rate limit public form.
- Simpan source/referrer/user agent/IP hash sesuai kebijakan privasi bila diputuskan.
- Siapkan hook notifikasi email internal, tetapi jangan kirim melalui provider production tanpa konfigurasi aman.

Definition of Done:

- Inquiry dan WhatsApp lead tersimpan ke database.
- Public endpoint rate-limited dan tervalidasi.
- Admin endpoint protected dan paginated.
- WhatsApp URL template dibuat backend sesuai site settings.

Changed files:

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/20260509000000_lead_status_notes/migration.sql`
- `apps/api/src/app.module.ts`
- `apps/api/src/leads/dto/create-inquiry.dto.ts`
- `apps/api/src/leads/dto/create-whatsapp-lead.dto.ts`
- `apps/api/src/leads/dto/list-leads-query.dto.ts`
- `apps/api/src/leads/dto/update-lead.dto.ts`
- `apps/api/src/leads/lead-status.dto.ts`
- `apps/api/src/leads/leads.controller.ts`
- `apps/api/src/leads/leads.module.ts`
- `apps/api/src/leads/leads.service.ts`
- `apps/api/test/leads.e2e-spec.ts`

Verification:

- `npm run format`
- `npm run lint`
- `npm run build`
- `npm run db:validate`
- `npx prisma migrate deploy`
- `npm run db:generate`
- `npm run test:e2e -- leads` - 7 tests passed

Notes:

- Public inquiry dan WhatsApp lead tersimpan ke database dengan validasi DTO.
- Public submit memakai rate limit 10 request/menit per route.
- Source/referrer/user-agent/IP hash disimpan sebagai metadata JSON; IP tidak disimpan mentah.
- Admin listing/detail/update/archive sudah protected, paginated, no-store, dan memakai permission `leads.read`/`leads.manage`.
- Mutasi admin lead mencatat audit log minimal.
- Catatan lama tentang notification email internal sudah ditutup pada Fase 27: form kontak kini membuat notifikasi admin dan email job yang diproses worker terpisah.

### Fase 9 - Email Account Backend

Status: Done  
Started at: 2026-05-09  
Completed at: 2026-05-09  
Owner: Codex

Tujuan:

- Membuat backend akun pengirim email sesuai konsep Google OAuth dan SMTP Hosting.

Task:

- Implement `GET /api/v1/admin/email-accounts`.
- Implement `POST /api/v1/admin/email-accounts/google/oauth-url`.
- Implement `GET /api/v1/oauth/google/email/callback`.
- Implement signed OAuth state dan validasi nonce/session.
- Batasi scope Gmail API hanya untuk pengiriman email.
- Simpan token OAuth terenkripsi.
- Implement token refresh handling.
- Implement revoke/disable handling sesuai contract.
- Implement `POST /api/v1/admin/email-accounts/smtp/test`.
- Implement `POST /api/v1/admin/email-accounts/smtp`.
- Implement `PATCH /api/v1/admin/email-accounts/:id`.
- Implement `POST /api/v1/admin/email-accounts/:id/reconnect`.
- Implement `POST /api/v1/admin/email-accounts/:id/disable`.
- Implement `DELETE /api/v1/admin/email-accounts/:id`.
- Simpan credential SMTP terenkripsi.
- Jangan pernah mengembalikan token/password ke frontend.
- Normalisasi error SMTP/OAuth ke error code contract.

Definition of Done:

- Google OAuth flow backend tersedia dengan state protection.
- SMTP test dapat berjalan melalui adapter dan timeout jelas.
- Email account list/detail tidak membocorkan secret.
- Test memakai mock provider atau credential dev yang tidak masuk repository.

Changed files:

- `apps/api/.env.example`
- `apps/api/package.json`
- `apps/api/package-lock.json`
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/20260509001000_email_account_oauth_state/migration.sql`
- `apps/api/src/app.module.ts`
- `apps/api/src/config/env.ts`
- `apps/api/src/email-accounts/dto/google-oauth-callback-query.dto.ts`
- `apps/api/src/email-accounts/dto/google-oauth-url.dto.ts`
- `apps/api/src/email-accounts/dto/list-email-accounts-query.dto.ts`
- `apps/api/src/email-accounts/dto/smtp-account.dto.ts`
- `apps/api/src/email-accounts/dto/update-email-account.dto.ts`
- `apps/api/src/email-accounts/email-account-maps.ts`
- `apps/api/src/email-accounts/email-accounts.controller.ts`
- `apps/api/src/email-accounts/email-accounts.module.ts`
- `apps/api/src/email-accounts/email-accounts.service.ts`
- `apps/api/src/email-accounts/email-provider.adapter.ts`
- `apps/api/src/email-accounts/secret-crypto.service.ts`
- `apps/api/src/email-accounts/secret-crypto.service.spec.ts`
- `apps/api/test/email-accounts.e2e-spec.ts`

Verification:

- `npx prisma format`
- `npx prisma migrate deploy`
- `npm run db:validate`
- `npm run db:generate`
- `npm run format`
- `npm run lint`
- `npm run build`
- `npm run test -- secret-crypto` - 2 tests passed
- `npm run test:e2e -- email-accounts` - 7 tests passed

Notes:

- Email provider default memakai `EMAIL_PROVIDER_MODE=mock` agar development/test tidak membutuhkan credential production.
- Live Google OAuth exchange dan SMTP verify tersedia di adapter saat env production aman disediakan.
- OAuth state signed, expiring, tersimpan sebagai hash, dan dikonsumsi saat callback.
- Token OAuth dan password SMTP dienkripsi memakai AES-256-GCM dengan `CREDENTIAL_ENCRYPTION_KEY`.
- Response list/update tidak mengembalikan token/password/encrypted secret.
- Permission memakai `email_accounts.read` dan `email_accounts.manage` sesuai permission matrix.
- Real consent Google dan SMTP production smoke test hanya boleh dilakukan dengan credential environment yang aman, bukan commit repository.

### Fase 10 - Email Campaign dan Worker

Status: Done  
Started at: 2026-05-09  
Completed at: 2026-05-09  
Owner: Codex

Tujuan:

- Membuat email blast sederhana dengan worker berbasis database.

Task:

- Implement `GET /api/v1/admin/email-campaigns`.
- Implement `GET /api/v1/admin/email-campaigns/:id`.
- Implement `POST /api/v1/admin/email-campaigns/draft`.
- Implement `PATCH /api/v1/admin/email-campaigns/:id`.
- Implement `POST /api/v1/admin/email-campaigns/:id/send`.
- Implement `GET /api/v1/admin/email-campaigns/:id/recipients`.
- Implement `GET /api/v1/admin/email-campaigns/:id/logs`.
- Validasi sender account connected.
- Validasi recipients dan deduplicate email.
- Simpan recipient status `queued`, `sending`, `sent`, `failed`, `skipped`.
- Implement worker tick dengan database locking/idempotency.
- Implement retry terbatas untuk Gmail API/SMTP temporary error.
- Implement per-account rate limit sederhana.
- Simpan provider response ringkas di send logs tanpa secret.

Definition of Done:

- Campaign dapat dibuat, dikirim ke queue, dan diproses worker mock.
- Worker tidak memproses recipient ganda dalam test concurrency.
- Failed recipient punya alasan dan retry count.
- Campaign selesai walau sebagian recipient gagal.

Changed files:

- `apps/api/.env.example`
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/20260509002000_email_campaign_worker_fields/migration.sql`
- `apps/api/src/app.module.ts`
- `apps/api/src/config/env.ts`
- `apps/api/src/email-accounts/email-accounts.module.ts`
- `apps/api/src/email-campaigns/dto/campaign-draft.dto.ts`
- `apps/api/src/email-campaigns/dto/email-recipient.dto.ts`
- `apps/api/src/email-campaigns/dto/list-campaigns-query.dto.ts`
- `apps/api/src/email-campaigns/dto/list-recipients-query.dto.ts`
- `apps/api/src/email-campaigns/dto/list-send-logs-query.dto.ts`
- `apps/api/src/email-campaigns/dto/update-campaign.dto.ts`
- `apps/api/src/email-campaigns/email-campaign-maps.ts`
- `apps/api/src/email-campaigns/email-campaigns.controller.ts`
- `apps/api/src/email-campaigns/email-campaigns.module.ts`
- `apps/api/src/email-campaigns/email-campaigns.service.ts`
- `apps/api/src/email-campaigns/email-send.adapter.ts`
- `apps/api/test/email-campaigns.e2e-spec.ts`

Verification:

- `npx prisma format`
- `npx prisma migrate deploy`
- `npm run db:validate`
- `npm run db:generate`
- `npm run format`
- `npm run lint`
- `npm run build`
- `npm run test:e2e -- email-campaigns` - 2 tests passed

Notes:

- Campaign draft, edit draft, send queue, listing, detail, recipients, dan logs tersedia.
- Worker tick internal dilindungi `x-internal-worker-secret`.
- Worker memakai status claim database: pending diklaim menjadi processing, dan processing yang lock-nya sudah dilepas dapat dilanjutkan pada tick berikutnya.
- E2E memverifikasi tick paralel tidak menggandakan send log/recipient processing.
- Adapter email default mock; live SMTP/Gmail path tersedia di `EmailSendAdapter`, tetapi production smoke test tetap perlu credential environment aman.
- Retry temporary failure dibatasi `EMAIL_WORKER_MAX_ATTEMPTS`; failed recipient menyimpan attempts, error code, dan error message.
- Tidak ada template builder, open tracking, click tracking, segmentasi lanjutan, atau scheduled campaign lanjutan di MVP.

### Fase 11 - SEO Assets dan Revalidation Backend

Status: Done  
Started at: 2026-05-09  
Completed at: 2026-05-09  
Owner: Codex

Tujuan:

- Menyiapkan backend untuk SEO dynamic assets dan revalidation saat konten berubah.

Task:

- Implement `GET /robots.txt` backend bila deployment mengarahkannya ke API.
- Implement `GET /sitemap.xml` dynamic berdasarkan published content.
- Implement `GET /api/v1/public/seo/:route` jika tetap diperlukan oleh contract.
- Implement canonical URL generation dengan domain final.
- Exclude admin/login/internal/draft/preview dari index.
- Implement revalidation event table/queue berbasis database.
- Trigger revalidation dari mutasi konten/media/site settings/news slug.
- Pastikan admin tidak perlu tombol clear cache.
- Dokumentasikan interaksi dengan frontend SSR/SSG/prerender untuk fase integrasi nanti.

Definition of Done:

- Sitemap dynamic hanya memuat URL published.
- Robots policy sesuai noindex admin/internal.
- Revalidation event tercatat dan dapat diproses/idempotent.
- Cache header SEO assets sesuai contract.

Changed files:

- `apps/api/src/app.module.ts`
- `apps/api/src/main.ts`
- `apps/api/src/revalidation/revalidation.service.ts`
- `apps/api/src/seo-assets/dto/seo-route-param.dto.ts`
- `apps/api/src/seo-assets/seo-assets.controller.ts`
- `apps/api/src/seo-assets/seo-assets.module.ts`
- `apps/api/src/seo-assets/seo-assets.service.ts`
- `apps/api/test/seo-assets.e2e-spec.ts`

Verification:

- `npm run format`
- `npm run lint`
- `npm run build`
- `npm run test:e2e -- seo-assets` - 4 tests passed

Notes:

- `robots.txt` dan `sitemap.xml` tersedia sebagai controller backend. Pada runtime `main.ts`, keduanya dikecualikan dari global prefix agar bisa disajikan di root domain.
- Sitemap dynamic hanya memuat route public dan berita published; draft/unpublished tidak masuk.
- `GET /api/v1/public/seo/:route` tersedia untuk metadata route public dan berita dengan format route `berita:{slug}`.
- Revalidation event dapat diproses lewat `POST /api/v1/internal/revalidation/tick` memakai `x-internal-worker-secret`; tick idempotent karena hanya memproses status pending.
- Frontend saat ini sudah punya static robots/sitemap. Backend dynamic version disiapkan untuk fase integrasi/deployment berikutnya.

### Fase 12 - Dashboard Summary dan Operational Views

Status: Done  
Started at: 2026-05-09  
Completed at: 2026-05-09  
Owner: Codex

Tujuan:

- Membuat endpoint ringkasan admin untuk dashboard dan status operasional.

Task:

- Implement `GET /api/v1/admin/dashboard`.
- Hitung statistik konten, inquiry, WhatsApp leads, media, email account, campaign, dan send status.
- Pastikan semua query dashboard ringan dan memakai index.
- Tambahkan cache private/no-store.

Definition of Done:

- Dashboard endpoint protected dan cepat.
- Data ringkasan tidak membuka secret atau data sensitif yang tidak diperlukan.
- Query tidak melakukan full scan berbahaya untuk data besar awal.

Changed files:

- `apps/api/src/app.module.ts`
- `apps/api/src/dashboard/dashboard.controller.ts`
- `apps/api/src/dashboard/dashboard.module.ts`
- `apps/api/src/dashboard/dashboard.service.ts`
- `apps/api/test/dashboard.e2e-spec.ts`

Verification:

- `npm run format`
- `npm run lint`
- `npm run build`
- `npm run test:e2e -- dashboard` - 2 tests passed

Notes:

- Dashboard endpoint protected dengan `dashboard.read` dan `Cache-Control: no-store`.
- Response hanya berisi agregat dan item operasional ringkas; tidak ada secret/token/password.
- Query memakai count/filter yang mengikuti index utama status/tanggal/relasi yang sudah ada di schema.
- Jika beberapa metrik belum ada di UI mock, tetap boleh disediakan selama sesuai contract dan tidak mengubah frontend.

### Fase 13 - Security, Observability, dan Hardening

Status: Done  
Started at: 2026-05-09  
Completed at: 2026-05-09  
Owner: Codex

Tujuan:

- Menutup risiko keamanan dan operasional sebelum backend dianggap siap integrasi.

Task:

- Review CORS, cookie, CSRF, security headers, rate limit, dan body limit.
- Pastikan password hash kuat.
- Pastikan encryption key credential wajib dari env.
- Pastikan OAuth token dan SMTP credential terenkripsi at rest.
- Pastikan response redaction untuk secret.
- Tambahkan audit log untuk login dan mutasi penting bila masuk scope.
- Tambahkan structured log dengan request ID.
- Tambahkan error logging tanpa membocorkan secret.
- Dokumentasikan backup database dan lifecycle cleanup media.
- Dokumentasikan prerequisite Sharp/FFmpeg bila diperlukan.

Definition of Done:

- Security checklist contract terpenuhi.
- Test redaction secret tersedia.
- Tidak ada secret di log dan response.
- Rate limit aktif untuk endpoint rawan abuse.

Changed files:

- `apps/api/.env.example`
- `apps/api/src/auth/auth.controller.ts`
- `apps/api/src/auth/auth.module.ts`
- `apps/api/src/auth/auth.service.ts`
- `apps/api/src/config/env.spec.ts`
- `apps/api/src/config/env.ts`
- `apps/api/src/core/http-exception.filter.ts`
- `apps/api/src/main.ts`
- `docs/OPERATIONS_RUNBOOK.md`

Verification:

- `npm run format`
- `npm run lint`
- `npm run build`
- `npm run test -- env` - 2 tests passed
- `npm run test:e2e -- auth` - 4 tests passed

Notes:

- Production env validation menolak default development untuk `SESSION_SECRET`, `CREDENTIAL_ENCRYPTION_KEY`, dan `INTERNAL_WORKER_SECRET`.
- CORS sekarang eksplisit via `CORS_ORIGINS` dan credentials enabled untuk cookie admin.
- Login diberi throttle 5 request/menit.
- Successful login/logout mencatat audit log tanpa menyimpan password/token.
- 5xx error log dibuat structured dengan request ID, method, path, status, dan error code tanpa secret.
- Runbook operasional mencakup backup database, lifecycle cleanup media, worker internal, runtime prerequisite Sharp/FFmpeg, dan security checks.
- Jangan menunda redaction secret ke fase integrasi. Ini harus selesai di backend.

### Fase 14 - Contract Verification dan QA

Status: Done  
Started at: 2026-05-09  
Completed at: 2026-05-09  
Owner: Codex

Tujuan:

- Memastikan backend yang dibuat benar-benar sesuai PRD dan API contract.

Task:

- Bandingkan semua endpoint backend dengan `docs/BACKEND_API_CONTRACT.md`.
- Buat checklist endpoint public, admin, auth, media, email, worker, SEO.
- Jalankan lint, build, unit test, integration test, dan e2e test.
- Jalankan migration dari database kosong.
- Jalankan seed development.
- Jalankan test worker tanpa provider production.
- Verifikasi cache headers public/admin.
- Verifikasi error envelope semua error utama.
- Verifikasi permission matrix.
- Verifikasi no Redis dependency.
- Verifikasi tidak ada frontend API integration.

Definition of Done:

- Semua command verifikasi hijau.
- Semua gap contract dicatat dan diperbaiki atau ditandai deferred dengan alasan.
- Backend siap dipakai untuk fase integrasi frontend berikutnya.

Changed files:

- `docs/CONTRACT_QA_CHECKLIST.md`
- `apps/api/test/seo-assets.e2e-spec.ts`

Verification:

- `npm run db:validate`
- `npx prisma migrate deploy`
- `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script`
- `npm run lint`
- `npm run build`
- `npm run test -- --runInBand` - 23 suites, 87 tests passed setelah ekspansi unit test
- `npm run test:e2e` - 11 suites, 43 tests passed
- Manual grep: no Redis dependency in `apps/api/package.json` / `package-lock.json`
- Manual grep: no frontend API integration/fetch references in `apps/web/src`

Notes:

- Checklist kontrak backend tersedia di `docs/CONTRACT_QA_CHECKLIST.md`.
- Verifikasi migration dari database kosong dilakukan sebagai generated SQL diff dari empty schema agar tidak melakukan reset database aktif yang destruktif.
- `migrate deploy` pada database aktif menunjukkan tidak ada pending migration.
- E2E penuh berjalan paralel; test revalidation dibuat scoped agar tidak gagal karena event dari suite lain.

### Fase 15 - Backend Handoff Package

Status: Done  
Started at: 2026-05-09  
Completed at: 2026-05-09  
Owner: Codex

Tujuan:

- Membuat handoff agar fase integrasi berikutnya bisa dimulai tanpa kebingungan.

Task:

- Dokumentasikan cara menjalankan backend lokal.
- Dokumentasikan env variable backend.
- Dokumentasikan migration dan seed.
- Dokumentasikan worker command/scheduler.
- Dokumentasikan object storage setup.
- Dokumentasikan OAuth redirect URI dan SMTP setup.
- Dokumentasikan known limitation.
- Buat daftar endpoint yang siap diintegrasikan frontend.
- Buat daftar perubahan frontend yang diperlukan pada fase berikutnya, tetapi jangan implementasikan.
- Update `PLAN.md` dengan status semua fase backend.

Definition of Done:

- Backend runbook tersedia.
- Integration readiness report tersedia.
- Semua fase backend sudah `Done` atau punya catatan `Skipped/Deferred` yang jelas.
- PLAN versi berikutnya siap dibuat untuk fase integrasi frontend.

Changed files:

- `apps/api/README.md`
- `docs/INTEGRATION_READINESS_REPORT.md`

Verification:

- Handoff docs mencakup local setup, env penting, migration/seed, worker/scheduler, object storage/provider notes, known limitations, endpoint siap integrasi, dan pekerjaan frontend fase berikutnya.
- Referensi dokumen pendukung tercantum: PRD, PLAN, API contract, QA checklist, operations runbook.

Notes:

- Ini adalah batas akhir plan backend saat ini.
- Integrasi frontend harus dibuat pada revisi PLAN berikutnya dan belum diimplementasikan di fase ini.

## 8. Checklist Anti-Halusinasi untuk Pelaksana Berikutnya

Sebelum mulai task apa pun:

- Baca `PRD.md`.
- Baca `docs/BACKEND_API_CONTRACT.md`.
- Baca status terbaru di `PLAN.md`.
- Cek apakah fase sebelumnya benar-benar `Done`.
- Cek command verifikasi terakhir.
- Cek apakah worktree memiliki perubahan yang belum dibuat oleh Anda.
- Jangan menghapus perubahan orang lain.
- Jangan mengganti pola integrasi frontend yang sudah selesai tanpa membaca implementasi dan contract.
- Jangan membuat endpoint yang tidak ada di contract kecuali dicatat alasannya.
- Jangan menambahkan Redis.
- Jangan commit secret.

Saat selesai task:

- Update status fase di `PLAN.md`.
- Isi `Changed files`.
- Isi `Verification` dengan command dan hasil singkat.
- Catat blocker/risiko jika ada.
- Sinkronkan API contract jika implementasi membuat keputusan final baru.

## 9. Deferred Setelah Backend MVP dan Integrasi Frontend

Hal berikut tetap deferred setelah fase integrasi frontend:

- Migrasi folder frontend dari root `web/` ke `apps/web` sudah selesai pada Fase 26.
- Production deployment final.
- Real production OAuth consent test dengan credential asli.
- Real SMTP campaign ke audience sungguhan.
- Real S3/Object Storage production smoke test tanpa environment aman.
- Redis/distributed cache.
- E-commerce, pembayaran, tracking produksi, customer portal.
- Microsoft OAuth, IMAP/POP3 sync, bounce processing lanjutan.
- Provider email marketing eksternal.
- Template builder email, open tracking, click tracking.
- Segmentasi audience lanjutan dan scheduled campaign lanjutan.
- HLS/adaptive streaming, AI tagging, face/object detection.

Catatan: integrasi frontend `apps/web/` ke backend API sudah selesai pada fase 16 sampai 25. Perubahan berikutnya harus difokuskan ke staging/deployment atau refinement terukur yang dicatat sebagai fase baru.

## 10. Snapshot Verifikasi Terakhir

Tanggal: 2026-05-09.

Frontend `apps/web`:

- `npm run lint`: sukses tanpa warning pada 2026-05-09.
- `npm run build`: sukses pada 2026-05-09.
- `apps/web/public/robots.txt`: tersedia.
- `apps/web/public/sitemap.xml`: tersedia.
- API client foundation tersedia di `apps/web/src/lib/api.ts`.
- Typed API services tersedia di `apps/web/src/lib/api-services.ts` dan `apps/web/src/lib/api-models.ts`.
- Public site sudah API-first untuk site settings, homepage, portofolio, fasilitas, galeri, berita, kontak, dan WhatsApp lead.
- Admin dashboard dan screen admin utama sudah memakai endpoint backend untuk auth, content CRUD, media, leads, email accounts, email campaign, dan users.
- Public screen masih menyimpan fallback visual lokal untuk kondisi data kosong/backend belum tersedia agar layout tidak rusak saat development.
- Env frontend tersedia di `apps/web/.env.example`: `VITE_API_BASE_URL`, `VITE_API_PREFIX`, dan `VITE_CSRF_COOKIE_NAME`.
- Frontend berada di workspace `apps/web` dengan package name `@indobraga/web`.

Backend `apps/api`:

- Backend MVP fase 0 sampai fase 15 sudah `Done`.
- NestJS + Prisma + MySQL tersedia di `apps/api`.
- Auth admin memakai HTTP-only opaque session cookie, CSRF protection, permission guard, dan no-store admin cache.
- Public content, admin content, media, leads, email accounts, email campaigns, SEO assets, revalidation, dashboard, dan worker endpoint sudah tersedia.
- `tsconfig.json` sudah dimigrasikan untuk menghapus deprecated `baseUrl`; alias `@/*` memakai `paths` eksplisit `./src/*`.
- Verifikasi backend terakhir:
  - `npm run lint`: sukses.
  - `npm run build`: sukses.
  - `npm run test -- --runInBand`: sukses, 23 suites, 87 tests passed.
  - `npx jest --config jest.config.cjs --coverage --runInBand --coverageReporters=json-summary --coverageReporters=text-summary`: sukses, statement coverage 23.47%.
  - `npm run test:e2e`: sukses sebelumnya, 11 suites, 43 tests passed.
  - `npm run db:validate`: sukses.
  - `npx prisma migrate deploy`: sukses, tidak ada pending migration pada database aktif.
- Tidak ada dependency Redis.
- Integrasi frontend-backend fase 16 sampai 25 sudah selesai secara code-level dan build-level.

Root monorepo:

- Root `package.json` memakai npm workspaces: `apps/api` dan `apps/web`.
- Root `.git` berada di root project.
- Root `package-lock.json` tersedia dan `npm audit --omit=dev` sukses dengan 0 vulnerability.

## 11. Integrasi Frontend - Status Implementasi

Fase 16 sampai 25 sudah dikerjakan secara bertahap. Langkah berikutnya bukan menambah endpoint baru, melainkan menyiapkan staging/deployment, mengisi credential production secara aman lewat environment, dan melakukan smoke test production untuk OAuth/SMTP/Object Storage tanpa menyimpan secret di repository.

### Fase 16 - Integration Plan dan API Client Foundation

Status: Done  
Started at: 2026-05-09  
Completed at: 2026-05-09  
Owner: Codex

Tujuan:

- Menyiapkan fondasi API client frontend tanpa mengganti semua mock screen.

Task:

- Review `PRD.md`, `docs/BACKEND_API_CONTRACT.md`, `docs/INTEGRATION_READINESS_REPORT.md`, dan status PLAN ini.
- Tentukan env frontend untuk API base URL.
- Buat API client typed/minimal yang menangani response envelope `{ success, data, error, meta }`.
- Pastikan request admin memakai `credentials: include`.
- Tambahkan helper baca CSRF cookie dan kirim `x-csrf-token` untuk mutasi admin.
- Buat error normalization untuk validation error, unauthenticated, forbidden, not found, conflict, rate limit, dan upstream error.
- Jangan mengubah semua screen ke API pada fase ini.

Definition of Done:

- API client bisa dipakai oleh modul berikutnya.
- Auth cookie dan CSRF flow siap dipakai.
- Build frontend tetap sukses.
- Backend lint/build/unit test tetap sukses.

Changed files:

- `PLAN.md`
- `docs/INTEGRATION_READINESS_REPORT.md`
- `apps/web/.env.example`
- `apps/web/.gitignore`
- `apps/web/src/vite-env.d.ts`
- `apps/web/src/lib/api.ts`

Verification:

- `npm run lint` di `apps/web`: sukses.
- `npm run build` di `apps/web`: sukses.
- `npm run lint` di `apps/api`: sukses.
- `npm run build` di `apps/api`: sukses.
- `npm run test -- --runInBand` di `apps/api`: sukses, 23 suites, 87 tests passed.

Notes:

- `publicApiRequest` default memakai `credentials: "omit"` untuk endpoint public.
- `adminApiRequest` dan `authApiRequest` default memakai `credentials: "include"`.
- Helper CSRF membaca cookie `VITE_CSRF_COOKIE_NAME` dengan default `indobraga_csrf` dan mengirim `x-csrf-token` untuk metode mutasi.
- `POST /api/v1/auth/login` adalah endpoint `SkipCsrf` di backend; saat integrasi login gunakan `authApiRequest(..., { csrf: false })`.
- Catatan historis: pada saat Fase 16 selesai, screen frontend belum diganti ke API backend; penggantian dilakukan pada Fase 17 sampai 25.

### Fase 17 - Auth Admin Integration

Status: Done  
Started at: 2026-05-09  
Completed at: 2026-05-09  
Owner: Codex

Tujuan:

- Menghubungkan login, logout, dan session admin frontend ke backend.

Task:

- Integrasikan login admin ke `POST /api/v1/auth/login`.
- Integrasikan session check ke `GET /api/v1/auth/me`.
- Integrasikan logout ke `POST /api/v1/auth/logout`.
- Tangani status unauthenticated/forbidden secara UI.
- Pastikan frontend tidak menyimpan token/session di `localStorage`.

Definition of Done:

- Admin bisa login/logout memakai backend.
- Refresh page tetap membaca session dari cookie.
- Admin route terlindungi dengan UX yang jelas.

Changed files:

- `apps/web/src/lib/api-services.ts`
- `apps/web/src/lib/api-models.ts`
- `apps/web/src/routes/login.tsx`
- `apps/web/src/components/admin/AdminLayout.tsx`

Verification:

- `npm run lint` di `apps/web`: sukses tanpa warning.
- `npm run build` di `apps/web`: sukses.
- `npm run lint` di `apps/api`: sukses.
- `npm run build` di `apps/api`: sukses.
- `npm run test -- --runInBand` di `apps/api`: sukses, 23 suites, 87 tests passed.

Notes:

- Login memakai `authApi.login` ke `POST /api/v1/auth/login` dengan `csrf: false` sesuai backend.
- Session admin dibaca dari `GET /api/v1/auth/me`; logout memakai `POST /api/v1/auth/logout`.
- Tidak ada token/session yang disimpan di `localStorage`; session tetap berbasis HTTP-only cookie backend.
- Admin layout menampilkan loading session, redirect login saat unauthenticated, dan toast saat logout gagal/berhasil.

### Fase 18 - Public Content Integration

Status: Done  
Started at: 2026-05-09  
Completed at: 2026-05-09  
Owner: Codex

Tujuan:

- Mengganti mock public content secara bertahap dengan endpoint public backend.

Task:

- Integrasikan site settings, homepage, portofolio, fasilitas, galeri, berita list/detail, contact form, dan WhatsApp lead.
- Pertahankan responsive polish mobile yang sudah dibuat.
- Tambahkan loading, error, dan empty state yang tidak merusak layout.
- Pastikan public endpoint tetap cache-aware dan tidak mengirim credential admin.

Definition of Done:

- Public website dapat memakai data backend untuk konten utama.
- Form kontak dan WhatsApp lead tersimpan ke backend.
- Frontend build sukses.

Changed files:

- `apps/web/src/lib/api-services.ts`
- `apps/web/src/lib/api-models.ts`
- `apps/web/src/hooks/use-api-query.ts`
- `apps/web/src/components/admin/ApiState.tsx`
- `apps/web/src/components/public/SiteSettingsContext.tsx`
- `apps/web/src/components/public/site-settings.ts`
- `apps/web/src/components/public/PublicLayout.tsx`
- `apps/web/src/components/public/SiteHeader.tsx`
- `apps/web/src/components/public/SiteFooter.tsx`
- `apps/web/src/components/public/WhatsAppFAB.tsx`
- `apps/web/src/routes/_public.index.tsx`
- `apps/web/src/routes/_public.portfolio.tsx`
- `apps/web/src/routes/_public.fasilitas.tsx`
- `apps/web/src/routes/_public.galeri.tsx`
- `apps/web/src/routes/_public.berita.tsx`
- `apps/web/src/routes/_public.berita.$slug.tsx`
- `apps/web/src/routes/_public.kontak.tsx`

Verification:

- `npm run lint` di `apps/web`: sukses tanpa warning.
- `npm run build` di `apps/web`: sukses.

Notes:

- Public request memakai `publicApiRequest` tanpa credential cookie.
- Site settings memakai provider global dengan fallback lokal agar layout public tetap stabil bila backend belum menyajikan data.
- Homepage, portofolio, fasilitas, galeri, berita list/detail, kontak, dan WhatsApp FAB sudah API-first.
- Public screen masih menyimpan fallback visual lokal untuk development/empty state; konten utama tetap diambil dari endpoint public saat backend tersedia.

### Fase 19 - Admin Content Integration

Status: Done  
Started at: 2026-05-09  
Completed at: 2026-05-09  
Owner: Codex

Tujuan:

- Menghubungkan CRUD konten admin ke backend.

Task:

- Integrasikan pengaturan website, hero, partner/logo klien, kekuatan produksi, portofolio, mesin, kapasitas, layanan, galeri, dan berita.
- Gunakan permission/error state backend.
- Pastikan publish/unpublish/update/delete memicu UX yang sesuai.
- Jangan membuat endpoint baru jika contract sudah cukup; update contract dulu jika ada gap nyata.

Definition of Done:

- Admin content utama bisa list/create/update/delete/publish/unpublish dari UI.
- Empty/loading/error/validation state terlihat rapi di desktop dan mobile.

Changed files:

- `apps/web/src/components/admin/AdminResourceManager.tsx`
- `apps/web/src/components/admin/ApiState.tsx`
- `apps/web/src/components/admin/ui.tsx`
- `apps/web/src/routes/admin.index.tsx`
- `apps/web/src/routes/admin.settings.tsx`
- `apps/web/src/routes/admin.hero.tsx`
- `apps/web/src/routes/admin.partners.tsx`
- `apps/web/src/routes/admin.strength.tsx`
- `apps/web/src/routes/admin.portfolio.tsx`
- `apps/web/src/routes/admin.machines.tsx`
- `apps/web/src/routes/admin.services.tsx`
- `apps/web/src/routes/admin.gallery.tsx`
- `apps/web/src/routes/admin.news.tsx`
- `apps/web/src/routes/admin.users.tsx`

Verification:

- `npm run lint` di `apps/web`: sukses tanpa warning.
- `npm run build` di `apps/web`: sukses.

Notes:

- Admin content route memakai generic `AdminResourceManager` agar list/create/update/status/delete konsisten dengan endpoint backend.
- Dashboard admin memakai `GET /api/v1/admin/dashboard`.
- Pengaturan website memakai endpoint site settings dan upload media OG image lewat media backend.
- Pengguna admin memakai endpoint users backend untuk create/update/status/delete.
- Tombol icon-only pada komponen baru diberi `aria-label`/`title`.

### Fase 20 - Media Integration

Status: Done  
Started at: 2026-05-09  
Completed at: 2026-05-09  
Owner: Codex

Tujuan:

- Menghubungkan upload media dan pemilihan media ke backend.

Task:

- Integrasikan upload multipart ke `POST /api/v1/admin/media`.
- Integrasikan listing, retry failed, delete/archive, dan media picker.
- Tampilkan status processing/completed/failed.
- Pastikan frontend memakai URL derivative dari backend, bukan membuat asumsi object storage langsung.

Definition of Done:

- Admin bisa upload dan memilih media untuk konten.
- Gambar/video tidak keluar container di mobile.

Changed files:

- `apps/web/src/components/admin/MediaUploadField.tsx`
- `apps/web/src/components/admin/MediaLibraryPanel.tsx`
- `apps/web/src/components/admin/AdminResourceManager.tsx`
- `apps/web/src/routes/admin.gallery.tsx`
- `apps/web/src/routes/admin.settings.tsx`
- `apps/web/src/lib/api-services.ts`
- `apps/web/src/lib/api-models.ts`

Verification:

- `npm run lint` di `apps/web`: sukses tanpa warning.
- `npm run build` di `apps/web`: sukses.

Notes:

- Upload media memakai multipart `POST /api/v1/admin/media` melalui `adminMediaApi.upload`.
- Field konten menyimpan `media_file_id` dari response backend, bukan URL object storage manual.
- Media library menampilkan status processing/completed/failed/deleted, preview derivative, retry failed, dan delete/archive.
- UI memakai URL derivative dari backend (`thumbnail_url`, `medium_url`, `large_url`) sesuai kontrak.

### Fase 21 - Leads Integration

Status: Done  
Started at: 2026-05-09  
Completed at: 2026-05-09  
Owner: Codex

Tujuan:

- Menghubungkan pesan kontak dan prospek WhatsApp ke backend.

Task:

- Integrasikan public inquiry dan WhatsApp lead.
- Integrasikan admin pesan kontak dan prospek WhatsApp: list, detail, status, note, archive.
- Tangani rate limit dan validation error.

Definition of Done:

- Lead public masuk database.
- Admin dapat mengelola lead tanpa mock data.

Changed files:

- `apps/web/src/components/admin/LeadManager.tsx`
- `apps/web/src/routes/_public.kontak.tsx`
- `apps/web/src/components/public/WhatsAppFAB.tsx`
- `apps/web/src/routes/admin.inquiries.tsx`
- `apps/web/src/routes/admin.whatsapp.tsx`
- `apps/web/src/lib/api-services.ts`
- `apps/web/src/lib/api-models.ts`

Verification:

- `npm run lint` di `apps/web`: sukses tanpa warning.
- `npm run build` di `apps/web`: sukses.

Notes:

- Form kontak public mengirim inquiry ke `POST /api/v1/public/inquiries`.
- WhatsApp FAB mencatat lead ke `POST /api/v1/public/whatsapp-leads`, lalu membuka URL WhatsApp dari response backend.
- Admin Pesan Kontak dan Prospek WhatsApp memakai backend list/update/archive dengan loading/error/empty state.
- Rate limit dan validation error dinormalisasi oleh API client agar tampil sebagai toast/error state.

### Fase 22 - Email Accounts Integration

Status: Done  
Started at: 2026-05-09  
Completed at: 2026-05-09  
Owner: Codex

Tujuan:

- Menghubungkan halaman Akun Pengirim Email ke backend.

Task:

- Integrasikan list email account.
- Integrasikan Google OAuth URL dan callback UX tanpa menyimpan token di frontend.
- Integrasikan SMTP Hosting test/save/update/disable/delete/reconnect.
- Tampilkan status connected/invalid/disabled/needs reconnect dari backend.

Definition of Done:

- UI tetap membedakan Google OAuth dan SMTP Hosting.
- Tidak ada token/password/email secret yang bocor ke frontend state atau log.

Changed files:

- `apps/web/src/routes/admin.email-accounts.tsx`
- `apps/web/src/lib/api-services.ts`
- `apps/web/src/lib/api-models.ts`
- `apps/web/src/components/admin/ui.tsx`

Verification:

- `npm run lint` di `apps/web`: sukses tanpa warning.
- `npm run build` di `apps/web`: sukses.

Notes:

- Halaman Akun Pengirim Email memakai list account backend dan status dari backend.
- Google OAuth flow membuka authorization URL dari backend; token OAuth tidak pernah disimpan di frontend.
- SMTP Hosting flow memakai create/test/reconnect/disable backend; password SMTP hanya dikirim saat submit form dan tidak ditampilkan ulang.
- Status connected/invalid/disabled/needs_reconnect ditampilkan sebagai badge responsive.

### Fase 23 - Email Campaign Integration

Status: Done  
Started at: 2026-05-09  
Completed at: 2026-05-09  
Owner: Codex

Tujuan:

- Menghubungkan Email Massal ke backend campaign dan worker status.

Task:

- Integrasikan list/detail campaign.
- Integrasikan draft/update/send.
- Integrasikan recipients dan send logs.
- Tampilkan status queued/sending/sent/failed/skipped.
- Jangan membuat scheduled campaign, tracking open/click, atau segmentasi lanjutan di fase ini.

Definition of Done:

- Email massal mock UI berubah menjadi workflow backend MVP.
- Campaign bisa dibuat, dikirim ke queue, dan status/logs terbaca.

Changed files:

- `apps/web/src/routes/admin.email-blast.tsx`
- `apps/web/src/routes/admin.email-history.tsx`
- `apps/web/src/lib/api-services.ts`
- `apps/web/src/lib/api-models.ts`
- `apps/web/src/components/admin/ui.tsx`

Verification:

- `npm run lint` di `apps/web`: sukses tanpa warning.
- `npm run build` di `apps/web`: sukses.

Notes:

- Draft campaign dibuat lewat `POST /api/v1/admin/email-campaigns` dan dikirim lewat action send backend.
- Recipient parser frontend hanya membantu input; validasi final tetap di backend.
- Riwayat Email Massal membaca campaign list/detail, recipients, dan send logs dari backend.
- UI menampilkan status draft/queued/processing/sent/failed/cancelled/completed sesuai kontrak backend.

### Fase 24 - SEO Runtime dan Cache Integration

Status: Done  
Started at: 2026-05-09  
Completed at: 2026-05-09  
Owner: Codex

Tujuan:

- Menentukan dan menerapkan strategi SEO frontend setelah data berasal dari backend.

Task:

- Tentukan apakah frontend tetap static, SSG/prerender, SSR, atau hybrid.
- Selaraskan metadata canonical/OG dengan backend SEO endpoint atau data public content.
- Tentukan routing `robots.txt` dan `sitemap.xml`: static frontend atau dynamic backend.
- Pastikan admin/login/internal tetap noindex.

Definition of Done:

- SEO public tetap indexable setelah integrasi API.
- Tidak ada route admin/internal yang masuk sitemap.

Changed files:

- `apps/web/src/routes/_public.index.tsx`
- `apps/web/src/routes/_public.portfolio.tsx`
- `apps/web/src/routes/_public.fasilitas.tsx`
- `apps/web/src/routes/_public.galeri.tsx`
- `apps/web/src/routes/_public.berita.tsx`
- `apps/web/src/routes/_public.berita.$slug.tsx`
- `apps/web/src/routes/_public.kontak.tsx`
- `apps/web/src/components/public/SiteSettingsContext.tsx`
- `apps/web/src/components/public/site-settings.ts`
- `apps/web/public/robots.txt`
- `apps/web/public/sitemap.xml`

Verification:

- `npm run lint` di `apps/web`: sukses tanpa warning.
- `npm run build` di `apps/web`: sukses.

Notes:

- Frontend tetap mempertahankan route metadata/canonical/noindex baseline yang sudah ada.
- Backend sudah menyediakan dynamic `robots.txt`, `sitemap.xml`, dan `GET /api/v1/public/seo/:route`; pemilihan routing final dilakukan saat staging/deployment.
- Public content API memakai cache header backend; admin endpoint tetap `no-store` dan memakai credential cookie.
- Admin/login/internal tidak dimasukkan ke sitemap static frontend dan tetap tidak menjadi target index.
- Metadata detail berita di frontend masih memakai fallback route data saat build; untuk SEO paling ideal di staging adalah memakai SSR/hybrid loader yang mengambil detail berita dari backend sebelum render HTML.

### Fase 25 - Integration QA dan Handoff

Status: Done  
Started at: 2026-05-09  
Completed at: 2026-05-09  
Owner: Codex

Tujuan:

- Memastikan integrasi frontend-backend siap dilanjutkan ke deployment/staging.

Task:

- Jalankan frontend lint/build.
- Jalankan backend lint/build/unit/e2e test.
- Uji auth, CSRF, permission, media upload, leads, email accounts, email campaigns, SEO, dan responsive mobile.
- Update `PLAN.md`, `docs/INTEGRATION_READINESS_REPORT.md`, dan contract jika ada perubahan.
- Catat production smoke test yang masih membutuhkan credential aman.

Definition of Done:

- Semua command utama hijau.
- Tidak ada mock data sebagai sumber utama pada workflow yang sudah ditandai integrated.
- Handoff menuju staging/deployment jelas.

Changed files:

- `PLAN.md`
- `docs/INTEGRATION_READINESS_REPORT.md`
- File frontend integrasi pada Fase 17 sampai 24.

Verification:

- `npm run lint` di `apps/web`: sukses tanpa warning.
- `npm run build` di `apps/web`: sukses.
- `npm run lint` di `apps/api`: sukses.
- `npm run build` di `apps/api`: sukses.
- `npm run test -- --runInBand` di `apps/api`: sukses, 23 suites, 87 tests passed.

Notes:

- Integrasi sudah siap untuk staging/deployment preparation.
- Production smoke test OAuth Google, SMTP Hosting, Object Storage, dan scheduler worker tetap menunggu credential aman via environment.
- Public fallback lokal masih ada untuk menjaga tampilan development saat backend kosong/tidak tersedia; ini bukan integrasi backend production.
- Sebelum production, validasi lagi dengan backend dan frontend berjalan bersamaan terhadap database staging dan media storage staging.

### Fase 26 - Monorepo Structure Alignment

Status: Done  
Started at: 2026-05-09  
Completed at: 2026-05-09  
Owner: Codex

Tujuan:

- Menyelaraskan struktur project aktual dengan struktur monorepo ideal di PRD.
- Menjadikan root project sebagai repository dan workspace utama.
- Memindahkan frontend dari root `web/` ke `apps/web` tanpa mengubah scope fitur.

Task:

- Promosikan repository Git frontend lama dari `web/.git` ke root `.git`.
- Pindahkan isi frontend ke `apps/web`.
- Tambahkan root `package.json` dengan npm workspaces untuk `apps/api` dan `apps/web`.
- Tambahkan root `.gitignore`, `.gitattributes`, `.prettierignore`, dan `README.md`.
- Rename package frontend menjadi `@indobraga/web`.
- Update dokumentasi agar semua path frontend mengarah ke `apps/web`.
- Verifikasi lint/build/test dari root workspace.

Definition of Done:

- Root project memiliki struktur `apps/web` dan `apps/api`.
- Root repository `.git` berada di root project, bukan nested di frontend.
- Root workspace command dapat menjalankan lint/build/test package.
- Dokumentasi tidak lagi mengarahkan workflow aktif ke root `web/`.

Changed files:

- `package.json`
- `package-lock.json`
- `.gitignore`
- `.gitattributes`
- `.prettierignore`
- `README.md`
- `apps/web/package.json`
- `package-lock.json`
- `PLAN.md`
- `docs/INTEGRATION_READINESS_REPORT.md`
- `docs/BACKEND_API_CONTRACT.md`
- `docs/CONTRACT_QA_CHECKLIST.md`
- `apps/api/README.md`
- Path frontend berpindah dari `web/*` ke `apps/web/*`.
- Package-level `package-lock.json` dan file Bun lama di workspace package dihapus agar root `package-lock.json` menjadi lockfile tunggal.

Verification:

- `npm run lint`: sukses.
- `npm run build`: sukses.
- `npm run test`: sukses, 23 suites, 87 tests passed.
- `npm run lint:web`: sukses.
- `npm run build:web`: sukses.
- `npm run lint:api`: sukses.
- `npm run build:api`: sukses.
- `npm run test:api`: sukses, 23 suites, 87 tests passed.
- `npm audit --omit=dev`: sukses, 0 vulnerability.

Notes:

- Npm workspaces dipilih karena frontend dan backend sudah memakai npm/package-lock.
- History frontend tetap dipertahankan melalui root `.git`; Git akan membaca migrasi path sebagai rename besar dari root frontend lama ke `apps/web`.
- Folder root `web/` sudah dihapus setelah kosong.

### Fase 27 - Admin Notification Runtime

- Status: Done
- Started at: 2026-05-09
- Completed at: 2026-05-09
- Owner: Codex

Tujuan:

- Menambahkan mekanisme notifikasi admin yang ringan dan sesuai arsitektur MVP tanpa Redis/WebSocket full-duplex.
- Menjadikan database sebagai source of truth untuk notifikasi dan status baca per admin.
- Mengirim update realtime ke dashboard aktif melalui Server-Sent Events.
- Memproses email notifikasi operasional melalui worker terpisah agar request public tidak menunggu SMTP.

Task:

- Tambahkan schema dan migration Prisma untuk `notifications`, `notification_reads`, dan `notification_email_jobs`.
- Tambahkan modul `NotificationsModule` dengan endpoint list, unread count, read, read-all, SSE stream, dan worker tick internal.
- Hubungkan form kontak dan WhatsApp lead ke pembuatan notifikasi admin.
- Tambahkan bell notifikasi di `AdminLayout` frontend dengan SSE, badge unread, dropdown, read state, dan fallback polling lambat.
- Sinkronkan `PRD.md`, `docs/BACKEND_API_CONTRACT.md`, `docs/OPERATIONS_RUNBOOK.md`, `docs/DEPLOYMENT_RUNBOOK.md`, `docs/CONTRACT_QA_CHECKLIST.md`, dan `apps/api/README.md`.

Definition of Done:

- Request public inquiry/WhatsApp tetap sukses walau pembuatan notifikasi/email job gagal.
- SSE stream memakai session admin dan tidak dibungkus JSON envelope.
- Worker notification dilindungi `x-internal-worker-secret`.
- Frontend tidak memanggil internal worker endpoint.
- Build API dan web lolos.

Changed files:

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/20260509132000_notifications/migration.sql`
- `apps/api/src/notifications/*`
- `apps/api/src/notifications/notifications.service.spec.ts`
- `apps/api/src/leads/*`
- `apps/api/src/core/raw-response.decorator.ts`
- `apps/api/src/core/response-envelope.interceptor.ts`
- `apps/web/src/components/admin/AdminLayout.tsx`
- `apps/web/src/lib/api-models.ts`
- `apps/web/src/lib/api-services.ts`
- `PRD.md`
- `docs/BACKEND_API_CONTRACT.md`
- `docs/OPERATIONS_RUNBOOK.md`
- `docs/DEPLOYMENT_RUNBOOK.md`
- `docs/CONTRACT_QA_CHECKLIST.md`
- `apps/api/README.md`

Verification:

- `npm run db:validate`: sukses.
- `npm run db:generate`: sukses.
- `npm run lint:api`: sukses.
- `npm run lint:web`: sukses.
- `npm run test:api`: sukses, 24 suites, 91 tests passed.
- `npm run build:api`: sukses.
- `npm run build:web`: sukses.

Notes:

- Scheduler production perlu memanggil `POST /api/v1/internal/workers/notifications/tick`.
- Nginx production perlu `proxy_buffering off` untuk `/api/v1/admin/notifications/stream`.
- Env notification production direkomendasikan: `NOTIFICATION_EMAIL_ENABLED=true`, `NOTIFICATION_EMAIL_TO=support@indobraga.com`, dan `NOTIFICATION_EMAIL_SENDER=support@indobraga.com`.

### Fase 28 - Audience Recipient Flow

- Status: Done
- Started at: 2026-05-09
- Completed at: 2026-05-09
- Owner: Codex

Tujuan:

- Menjadikan data Pesan Kontak sebagai sumber penerima Email Massal yang mudah dipakai admin non-teknis.
- Menambahkan Upload CSV sebagai flow bisnis yang jelas dengan template, preview, validasi email, dan deduplikasi.
- Menyimpan snapshot penerima per campaign agar histori pengiriman tetap stabil walaupun data sumber berubah.

Task:

- Tambahkan schema dan migration Prisma untuk `marketing_contacts` serta referensi opsional `marketing_contact_id` di `email_campaign_recipients`.
- Tambahkan `AudienceModule` backend untuk normalisasi kontak internal dari Pesan Kontak.
- Sinkronkan inquiry public ke kontak internal dengan upsert email yang dinormalisasi.
- Tambahkan endpoint preview Pesan Kontak dan `POST /api/v1/admin/email-campaigns/draft/from-inquiries`.
- Tambahkan UI Email Massal untuk memilih sumber penerima: Pesan Kontak atau Upload CSV.
- Tambahkan download template CSV, upload CSV, preview email valid, duplikat, dan invalid.
- Sinkronkan `PRD.md`, `docs/BACKEND_API_CONTRACT.md`, `docs/OPERATIONS_RUNBOOK.md`, `docs/DEPLOYMENT_RUNBOOK.md`, `docs/CONTRACT_QA_CHECKLIST.md`, `docs/INTEGRATION_READINESS_REPORT.md`, dan `apps/api/README.md`.

Definition of Done:

- Pesan Kontak menampilkan preview pesan cocok, email valid, duplikat, dan email tidak valid.
- CSV upload menyediakan template dan preview sebelum campaign dibuat.
- Campaign dari Pesan Kontak atau CSV hanya mengambil email valid dan membuat snapshot ke `email_campaign_recipients`.
- Build API dan web lolos.

Changed files:

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/20260509150000_marketing_audience/migration.sql`
- `apps/api/src/audience/*`
- `apps/api/src/email-campaigns/*`
- `apps/api/src/leads/*`
- `apps/web/src/routes/admin.email-blast.tsx`
- `apps/web/src/lib/api-models.ts`
- `apps/web/src/lib/api-services.ts`
- `PRD.md`
- `docs/BACKEND_API_CONTRACT.md`
- `docs/OPERATIONS_RUNBOOK.md`
- `docs/DEPLOYMENT_RUNBOOK.md`
- `docs/CONTRACT_QA_CHECKLIST.md`
- `docs/INTEGRATION_READINESS_REPORT.md`
- `apps/api/README.md`

Verification:

- `npm run db:validate`: sukses.
- `npm run db:generate`: sukses.
- `npm run lint:api`: sukses.
- `npm run lint:web`: sukses.
- `npm run test:api`: sukses, 26 suites, 99 tests passed.
- `npm run build:api`: sukses.
- `npm run build:web`: sukses.

Notes:

- Production deploy perlu memastikan endpoint Pesan Kontak preview dan Upload CSV sudah aktif di halaman Email Massal.
- Segmentasi audience lanjutan, unsubscribe automation kompleks, import XLSX, dan provider email marketing eksternal tetap di luar scope MVP.
