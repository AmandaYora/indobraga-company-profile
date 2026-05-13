# Architecture Quality Plan

Dokumen ini menetapkan baseline dan arah penyempurnaan teknis Indobraga supaya project bergerak menuju kondisi production-grade secara bertahap, terukur, dan tidak hanya mengejar angka coverage.

## Kondisi Saat Ini

Monorepo berisi dua aplikasi utama:

- `apps/api`: NestJS API, Prisma, MySQL, media storage, admin/content/email/leads modules.
- `apps/web`: TanStack Start/Vite frontend untuk public site dan admin dashboard.

Quality gate yang tersedia:

- `npm run lint`
- `npm test`
- `npm run test:coverage`
- `npm run build`
- `npm run quality`
- `npm run quality:coverage`

Baseline coverage terakhir:

- API coverage: 60.36% statements, 56.13% branches, 59.40% functions, 60.33% lines
- Web coverage: 70.13% statements, 60.73% branches, 65.24% functions, 70.92% lines

Coverage threshold saat ini sengaja mengikuti baseline rendah yang nyata. Fungsinya adalah mencegah regresi lebih dulu. Target ideal dinaikkan bertahap setelah modul kritis ditest dengan benar.

## Definisi Ideal Untuk Project Ini

Project dianggap ideal jika memenuhi kriteria berikut:

1. Build, lint, unit test, dan coverage gate selalu berjalan di CI.
2. Modul bisnis kritis punya unit test yang menutup happy path, failure path, validasi, dan boundary condition.
3. Flow utama user diuji lewat UI atau e2e test, bukan hanya unit test.
4. Secret dan environment production tidak menjadi syarat test lokal.
5. Perubahan data admin punya regression test, terutama payload mapping, auth, media, email, dan revalidation.
6. Dokumentasi operasi menjelaskan deploy, rollback, env, backup, dan incident handling.

## Target Coverage Bertahap

Target awal yang realistis:

- API global statements: 65%
- Web global statements: 70%
- Core helper/pure function modules: 90%+
- Service bisnis kritis: 70%+

Target ideal jangka menengah:

- API global statements: 70-80%
- Web logic/helper statements: 70%+
- Flow admin dan public utama: covered by UI/e2e smoke tests

Target 100% hanya layak untuk modul kecil dan deterministik. Target 100% global untuk semua route/component biasanya mahal, rapuh, dan tidak selalu meningkatkan kualitas.

## Prioritas Test Berikutnya

Urutan prioritas berdasarkan risiko bisnis:

1. `admin-content.controller`: request mapping untuk resource konten besar yang masih 0% coverage.
2. `email-accounts.controller` dan `email-campaigns.controller`: mapping workflow email, provider action, dan worker-sensitive routes.
3. Frontend route/component test untuk admin content, media picker, leads, dan email campaign.
4. Playwright UI smoke test permanen: login, CRUD konten, upload media, inquiry, WhatsApp lead, email campaign draft.
5. Release/deployment checklist final: env aman, rollback, backup DB, object storage, scheduler, dan smoke test staging.

## Arsitektur Testing Yang Direkomendasikan

Gunakan tiga lapisan test:

- Unit test: logic murni, service dengan dependency mock, mapper, payload transformer.
- Integration/e2e API: kontrak endpoint, auth, CSRF, DB behavior, dan error envelope.
- UI smoke test: flow manusia di browser untuk halaman publik dan admin.

Unit test tidak boleh menggantikan UI test untuk perilaku visual dan navigasi. UI test tidak boleh menggantikan unit test untuk branching logic dan edge case.

## Quality Gate

Local gate:

```bash
npm run quality
```

Coverage gate:

```bash
npm run quality:coverage
```

CI menjalankan:

```bash
npm ci
npm run db:generate
npm run db:validate
npm run quality:coverage
```

Coverage threshold boleh dinaikkan hanya setelah coverage aktual naik dan test baru stabil. Jangan menurunkan threshold kecuali ada perubahan arsitektur yang disertai alasan tertulis.

## Risiko Yang Masih Perlu Ditutup

- Coverage backend masih rendah untuk service besar.
- Frontend route/component sebagian besar belum punya unit atau component test.
- Belum ada browser UI test otomatis permanen di repository.
- Belum ada policy branch protection yang memaksa CI hijau sebelum merge.
- File `.env` lokal berisi secret production historis; idealnya semua secret diganti dan dipisah dari workflow dev.

## Rencana Iterasi

Iterasi 1:

- Tambahkan CI dan quality scripts.
- Tambahkan coverage baseline gate.
- Tambahkan regression test untuk bug payload admin.

Iterasi 2:

- Perluas test `admin-content.service` hingga operasi CRUD konten utama lebih merata.
- Test `public-content.service` untuk projection publik, cursor, pagination, gallery, news detail, dan SEO.
- Test `email-accounts.service` untuk list/filter, SMTP connect/update/disable, unique conflict, Google OAuth callback, dan audit side effect.
- Test `email-campaigns.service` untuk list/filter, update draft, send queue reset, recipients/logs, idle worker, dan worker success aggregate.
- Test `notifications.service`, `notification-stream.service`, dan `notifications.controller` untuk worker, SSE, read state, dan internal secret.
- Test `leads.service` dan `leads.controller` untuk inquiry/WhatsApp lifecycle, fallback metadata, archive, not-found, dan side effect failure.
- Test controller public/admin kecil untuk users, media, SEO assets, dan public content.
- Naikkan API coverage threshold ke 60% statements, 56% branches, 59% functions, dan 60% lines.
- Tambahkan test helper frontend untuk Email Blast CSV, validasi draft, recipient estimate, exclusion count, selected account label, dan body HTML.
- Tambahkan test kontrak frontend untuk API service wrappers, render dasar komponen admin/public, route admin resource, route public, dashboard/login, settings/users, dan shell public.
- Naikkan web coverage threshold ke 70% statements, 60% branches, 65% functions, dan 70% lines.

Iterasi 3:

- Test controller besar `admin-content`, `email-accounts`, dan `email-campaigns`.
- Perluas test komponen admin berat yang sudah ada: cabang error/event stream `AdminLayout`, branch submit gagal `AdminResourceManager`, `LeadManager`, `MediaLibraryPanel`, `MediaUploadField`, dan interaksi route email.
- Tambahkan Playwright UI smoke test yang bisa dijalankan lokal dan CI.
- Naikkan API threshold ke 65% dan web threshold ke 75%.

Iterasi 4:

- Test public content projection dan SEO.
- Tambahkan branch protection di repository.
- Definisikan release checklist dan rollback checklist final.
