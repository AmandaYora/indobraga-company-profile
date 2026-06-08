# Backend Contract QA Checklist

Tanggal: 2026-05-10

Sumber: `PRD.md`, `docs/BACKEND_API_CONTRACT.md`, dan `PLAN.md`.

## Scope

- Backend API berada di `apps/api`.
- Frontend `apps/web/` sudah diintegrasikan ke API untuk fase 16 sampai 25 sesuai `PLAN.md`.
- Redis tidak digunakan.
- Provider email/media memakai adapter yang aman untuk development/test tanpa credential production.

## Endpoint Coverage

| Area              | Status | Endpoint utama                                                                                                 |
| ----------------- | ------ | -------------------------------------------------------------------------------------------------------------- |
| Health            | Done   | `GET /api/v1/health`                                                                                           |
| Auth              | Done   | `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`                                   |
| Admin Users       | Done   | `GET/POST/PATCH/DELETE /api/v1/admin/users...`                                                                 |
| Public Content    | Done   | `GET /api/v1/public/site-settings`, `home`, `portfolio`, `facilities`, `gallery`, `news`, `news/:slug`         |
| Admin Content     | Done   | Site settings, hero, partners, strengths, portfolios, machines, capacities, services, gallery, news            |
| Media             | Done   | `POST/GET/DELETE /api/v1/admin/media`, retry failed                                                            |
| Leads             | Done   | Public inquiries/WhatsApp leads, admin list/detail/update/archive                                              |
| Audience internal | Done   | `GET /api/v1/admin/audience/contacts`, `preview`, `export.csv`, inquiry-to-audience sync                       |
| Email Accounts    | Done   | Google OAuth URL/callback, SMTP test/save/update/reconnect/disable/delete                                      |
| Email Campaigns   | Done   | Draft dari recipients (tab Single/Massal), draft dari filter Pesan Kontak (backend, legacy), update draft, send, recipients, logs, internal worker tick |
| Email Templates   | Done   | List/create/update/delete template email (mode teks/HTML), dipakai ulang di Kirim Email |
| Notifications     | Done   | Admin list/unread/read/read-all, SSE stream, internal notification email worker tick                           |
| SEO Assets        | Done   | `robots.txt`, `sitemap.xml`, `GET /api/v1/public/seo/:route`                                                   |
| Revalidation      | Done   | Queue on content/media changes, internal revalidation tick                                                     |
| Dashboard         | Done   | `GET /api/v1/admin/dashboard`                                                                                  |

## Security/Cache Checklist

- Admin session memakai HTTP-only cookie.
- Admin mutation memakai CSRF token.
- Permission matrix diterapkan lewat `RequirePermissions`.
- Admin response memakai `Cache-Control: no-store`.
- Public content memakai public cache header.
- Secret OAuth/SMTP tidak dikirim ke response.
- Token/password SMTP dienkripsi at rest.
- Login dan public form memiliki rate limit.
- Internal worker endpoint memakai `x-internal-worker-secret`.
- Admin notification SSE memakai session cookie, no-store, dan tidak memakai JSON envelope.
- Halaman Kirim Email memiliki tab Single (satu penerima) dan Massal (upload Excel `.xlsx`) dengan validasi email, dedupe, dan preview sebelum draf.
- Pesan Kontak/Prospek WhatsApp memiliki aksi Kirim Email (deep-link ke tab Single terisi) dan Kirim WA (wa.me ke nomor prospek).
- Campaign dari recipients eksplisit atau filter Pesan Kontak hanya mengambil email valid dan membuat snapshot recipient.
- Production env menolak default development secret.

## Remaining Production Smoke Tests

Smoke test berikut tidak boleh dilakukan dengan credential yang di-commit:

- Google OAuth consent production.
- SMTP Hosting test send production.
- S3-compatible Object Storage production upload/delete.
- Scheduler production untuk worker email dan revalidation.
- Scheduler production untuk notification email worker.
- Nginx production untuk SSE dengan proxy buffering disabled pada route notifikasi.
- Restore database dari backup production/staging.

## Snapshot Verifikasi Terakhir

Tanggal: 2026-05-12.

- `npm run lint:api`: pass.
- `npm run lint:web`: pass.
- `npm run build:api`: pass.
- `npm run build:web`: pass.
- `npm run test:api`: pass, 26 suites, 99 tests.
- `npx jest --config jest.config.cjs --coverage --runInBand --coverageReporters=json-summary --coverageReporters=text-summary`: pass, statement coverage 23.47%.
- `npm run test:e2e`: pass sebelumnya, 11 suites, 43 tests.
- `npm run db:validate`: pass.
- `npx prisma migrate deploy`: pass.
- Redis dependency: tidak ada.
- Frontend `apps/web` lint/build: pass pada 2026-05-09.
- Frontend API integration: auth, public content, admin content, media, leads (termasuk aksi Kirim Email/Kirim WA), Kirim Email tab Single/Massal (upload Excel `.xlsx`), email accounts, email campaigns, dashboard, dan SEO baseline sudah tersedia di `apps/web/src`.
- Root npm workspace: pass untuk `apps/api` dan `apps/web`.
- `npm run security:audit`: pass untuk dependency production dan validasi IOC TanStack. Raw `npm audit --omit=dev` masih melaporkan advisory TanStack `GHSA-rmmr-r34h-pfm5` karena rentang advisory upstream terlalu luas.
