# Integration Readiness Report - Indobraga

Tanggal: 2026-05-09

## Status

Backend MVP di `apps/api`, integrasi frontend di `apps/web`, alignment struktur monorepo, admin notification runtime, dan flow Kontak Marketing untuk Email Massal sudah selesai secara code-level dan build-level. Fase 16 sampai 28 pada `PLAN.md` sudah ditandai `Done`.

Project siap dilanjutkan ke tahap staging/deployment preparation, bukan menambah integrasi backend baru. Production smoke test untuk Google OAuth, SMTP Hosting, Object Storage, notification SSE, dan scheduler worker tetap membutuhkan credential aman melalui environment staging/production.

## Cara Menjalankan Lokal

Install dependency dari root monorepo:

```bash
npm install
```

Backend:

```bash
cd apps/api
copy .env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Frontend:

```bash
cd apps/web
copy .env.example .env
npm run dev
```

Root workspace commands:

```bash
npm run dev:api
npm run dev:web
npm run lint
npm run build
npm run test
```

Healthcheck backend:

```txt
GET http://localhost:3001/api/v1/health
```

Env frontend harus mengarah ke backend lokal/staging melalui:

- `VITE_API_BASE_URL`
- `VITE_API_PREFIX`
- `VITE_CSRF_COOKIE_NAME`

## Verifikasi Terakhir

Root monorepo:

- `npm run lint`: sukses.
- `npm run build`: sukses.
- `npm run test`: sukses sebelumnya; verifikasi terbaru memakai `npm run test:api`, 26 suites, 97 tests passed.
- `npm audit --omit=dev`: sukses, 0 vulnerability.

Frontend `apps/web`:

- `npm run lint`: sukses tanpa warning.
- `npm run build`: sukses.
- Package frontend: `@indobraga/web`.
- Admin notification bell sudah memakai API notification + SSE dengan fallback polling lambat.
- Email Massal sudah mendukung mode input manual dan Kontak Marketing dengan preview audience serta export CSV.

Backend `apps/api`:

- `npm run lint`: sukses.
- `npm run build`: sukses.
- `npm run test -- --runInBand`: sukses, 26 suites, 97 tests passed.
- Notification module mencakup DB notification, read state per admin, SSE stream, dan internal notification email worker tick.
- Audience module mencakup inquiry-to-marketing-contact sync, listing/preview/export CSV, dan resolver recipient aktif untuk campaign.

Verifikasi backend sebelumnya yang tetap relevan:

- `npm run db:validate`: sukses.
- `npx prisma migrate deploy`: sukses.
- `npm run test:e2e`: sukses, 11 suites, 43 tests passed.
- Unit coverage snapshot: statements 23.47%, branches 21.64%, functions 20.47%, lines 22.56%.
- Tidak ada dependency Redis.
- Root npm workspace: tersedia untuk `apps/api` dan `apps/web`.
- `npm audit --omit=dev`: sukses, 0 vulnerability.

## Integrasi Frontend yang Sudah Selesai

- Auth admin: login, session check, logout memakai cookie session backend.
- Public content: site settings, homepage, portofolio, fasilitas, galeri, berita, kontak, dan WhatsApp lead.
- Admin content: site settings, hero, partners, strengths, portofolio, mesin/fasilitas, layanan, galeri, berita, users, dan dashboard.
- Media: upload multipart, media library, retry failed, delete/archive, dan penggunaan derivative URL backend.
- Leads: public inquiry/WhatsApp lead dan admin Pesan Kontak/Prospek WhatsApp.
- Audience/Kontak Marketing: Pesan Kontak otomatis menjadi sumber penerima database-driven, dengan preview dan export CSV untuk operasional.
- Email accounts: Google OAuth URL flow dan SMTP Hosting flow dengan status backend.
- Email campaigns: draft manual, draft dari Kontak Marketing, recipients snapshot, send, campaign history, recipients detail, dan send logs.
- SEO/cache: route metadata baseline frontend tetap ada; backend dynamic robots/sitemap/SEO endpoint tersedia untuk routing deployment final.

## Catatan Implementasi

- Public request memakai wrapper tanpa credential cookie.
- Admin/auth request memakai `credentials: include`.
- Mutasi admin membaca CSRF cookie dan mengirim `x-csrf-token`.
- Login backend memakai `SkipCsrf`; frontend memanggil login dengan `csrf: false`.
- Frontend tidak menyimpan token/session/secret OAuth/SMTP di `localStorage` atau browser storage.
- Public screen masih memiliki fallback visual lokal untuk development/empty backend agar layout tidak rusak; data utama tetap API-first.
- Frontend tidak memanggil endpoint internal worker.
- Root repository `.git` berada di root project; frontend tidak lagi memiliki nested `.git`.

## Endpoint yang Dipakai

- Auth/admin session: `/api/v1/auth/*`
- Public content: `/api/v1/public/site-settings`, `home`, `portfolio`, `facilities`, `gallery`, `news`, `news/:slug`
- Admin content CRUD: `/api/v1/admin/site-settings`, `hero`, `partners`, `production-strengths`, `portfolios`, `machines`, `printing-capacities`, `production-capacities`, `services`, `gallery-items`, `news`
- Media: `/api/v1/admin/media`
- Leads: `/api/v1/public/inquiries`, `/api/v1/public/whatsapp-leads`, `/api/v1/admin/inquiries`, `/api/v1/admin/whatsapp-leads`
- Audience/Kontak Marketing: `/api/v1/admin/audience/contacts`, `/api/v1/admin/audience/preview`, `/api/v1/admin/audience/export.csv`
- Email accounts: `/api/v1/admin/email-accounts/*`, `/api/v1/oauth/google/email/callback`
- Email campaigns: `/api/v1/admin/email-campaigns/*`, termasuk `/draft/from-audience`
- Dashboard: `/api/v1/admin/dashboard`
- SEO assets: `/robots.txt`, `/sitemap.xml`, `/api/v1/public/seo/:route`

## Env Penting

- `DATABASE_URL`, `SHADOW_DATABASE_URL`
- `SESSION_SECRET`, `CSRF_COOKIE_NAME`, `SESSION_COOKIE_NAME`
- `CREDENTIAL_ENCRYPTION_KEY`
- `CORS_ORIGINS`
- `PUBLIC_SITE_URL`, `PUBLIC_MEDIA_URL`
- `STORAGE_DRIVER`, `STORAGE_LOCAL_ROOT`, `S3_*`
- `EMAIL_PROVIDER_MODE`, `SMTP_TEST_TIMEOUT_MS`
- `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`
- `INTERNAL_WORKER_SECRET`

## Worker/Scheduler

Internal endpoint:

- `POST /api/v1/internal/workers/email-campaigns/tick`
- `POST /api/v1/internal/workers/notifications/tick`
- `POST /api/v1/internal/revalidation/tick`

Keduanya wajib memakai header:

```txt
x-internal-worker-secret: <INTERNAL_WORKER_SECRET>
```

Frontend tidak boleh memanggil endpoint internal.

## Known Limitations

- Production smoke test Google OAuth, SMTP send, notification email worker, notification SSE lewat Nginx, dan S3 Object Storage belum dilakukan karena membutuhkan credential environment aman.
- Video poster/transcoding production membutuhkan FFmpeg sebelum diaktifkan penuh.
- Password reset admin ditunda dari MVP sesuai keputusan PLAN.
- Metadata detail berita paling ideal divalidasi lagi pada staging SSR/hybrid agar HTML awal benar-benar membawa SEO detail dari backend.
- Local storage `.local-storage` hanya untuk development/test backend.

## Tahap Berikutnya

- Buat fase staging/deployment baru di `PLAN.md` sebelum mulai kerja production.
- Siapkan database staging, object storage staging, OAuth redirect URI staging, SMTP test account, Nginx SSE config, dan scheduler worker staging.
- Tentukan routing final untuk `robots.txt` dan `sitemap.xml`: static frontend atau dynamic backend.
- Jalankan smoke test end-to-end dengan frontend dan backend berjalan bersamaan di environment staging.

## Dokumen Pendukung

- `PRD.md`
- `PLAN.md`
- `docs/BACKEND_API_CONTRACT.md`
- `docs/CONTRACT_QA_CHECKLIST.md`
- `docs/OPERATIONS_RUNBOOK.md`
