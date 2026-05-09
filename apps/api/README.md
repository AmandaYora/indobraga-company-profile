# Indobraga Backend API

Backend API untuk Indobraga dibangun sebagai aplikasi NestJS di `apps/api`.

Backend MVP sudah selesai dan sudah terintegrasi dengan frontend `apps/web`.

## Local Setup

```bash
npm install
cd apps/api
copy .env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Dalam root monorepo, command backend juga bisa dijalankan dengan:

```bash
npm run dev:api
npm run lint:api
npm run build:api
npm run test:api
```

Healthcheck:

```txt
GET http://localhost:3001/api/v1/health
```

## Commands

```bash
npm run lint
npm run build
npm run test
npm run test:e2e
npm run db:validate
npm run db:migrate
npm run db:seed
```

## Workers

Internal worker endpoints are not called by the frontend:

```txt
POST /api/v1/internal/workers/email-campaigns/tick
POST /api/v1/internal/workers/notifications/tick
POST /api/v1/internal/revalidation/tick
Header: x-internal-worker-secret: <INTERNAL_WORKER_SECRET>
```

Use a trusted scheduler/server-side job for production.

## Environment Notes

- `SESSION_SECRET`, `CREDENTIAL_ENCRYPTION_KEY`, and `INTERNAL_WORKER_SECRET` must be strong production secrets.
- `EMAIL_PROVIDER_MODE=mock` is the safe local/default mode.
- `STORAGE_DRIVER=local` is for development/test only; production should use S3-compatible object storage.
- `MEDIA_OBJECT_PREFIX=upload`, `MEDIA_STORAGE_ENV=dev|prod`, and `MEDIA_PATH_TIME_ZONE=Asia/Jakarta` control media object keys.
- IDCloudHost Object Storage uses `S3_ENDPOINT=https://is3.cloudhost.id` and bucket `indobraga`.
- S3 mode requires `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and `PUBLIC_MEDIA_URL`.
- Admin notifications use DB-backed state plus SSE at `/api/v1/admin/notifications/stream`.
- Contact-form notification email is queued in `notification_email_jobs` and processed by `POST /api/v1/internal/workers/notifications/tick`.
- `NOTIFICATION_EMAIL_TO` and `NOTIFICATION_EMAIL_SENDER` should point to the operational mailbox in production.
- Contact inquiries with valid email are upserted into `marketing_contacts` for the Kontak Marketing audience flow.
- Email campaigns can be drafted manually or from audience filters through `/api/v1/admin/email-campaigns/draft/from-audience`; recipients are always snapshotted into `email_campaign_recipients`.
- `CORS_ORIGINS` must include the deployed frontend origin.
- Production seed reads `SEED_ADMIN_*` for the login account and `SEED_SMTP_*` for the default SMTP sender account. Keep real passwords only in server env, never in Git.

## Architecture Decisions

- Runtime target: Node.js server/container.
- API prefix: `/api/v1`.
- ORM target: Prisma + MySQL.
- Auth target: database-backed HTTP-only session cookie.
- Media storage target: IDCloudHost Object Storage via S3-compatible adapter.
- Development storage: local/mock adapter.
- Redis is not part of MVP.
