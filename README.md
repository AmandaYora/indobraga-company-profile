# Indobraga

Monorepo untuk website company profile Indobraga, dashboard admin, dan backend API.

## Struktur

```text
indobraga/
  apps/
    web/  # React + TanStack Router/Vite frontend public dan admin
    api/  # NestJS + Prisma backend API
  docs/
  PRD.md
  PLAN.md
```

## Commands

```bash
npm install
npm run dev:web
npm run dev:api
npm run lint
npm run build
npm run test
```

Backend tetap membutuhkan `.env` di `apps/api/.env`. Frontend memakai `.env` di `apps/web/.env`.

## Dokumen

- `PRD.md`
- `PLAN.md`
- `docs/BACKEND_API_CONTRACT.md`
- `docs/INTEGRATION_READINESS_REPORT.md`
- `docs/OPERATIONS_RUNBOOK.md`
- `docs/DEPLOYMENT_RUNBOOK.md`
