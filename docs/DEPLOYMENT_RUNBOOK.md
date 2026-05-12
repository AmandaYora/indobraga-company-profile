# Deployment Runbook - Indobraga

Dokumen ini menjadi panduan deploy dan redeploy untuk project Indobraga setelah repository dipindahkan ke monorepo GitHub. Tujuannya agar AI atau programmer berikutnya dapat melanjutkan deployment tanpa menebak struktur server, credential handling, atau urutan build.

## Status Arsitektur Production Saat Ini

- Repository: `https://github.com/AmandaYora/indobraga-company-profile.git`
- Branch production: `main`
- Domain utama: `https://indobraga.com`
- Domain www: `https://www.indobraga.com`
- VPS public IP: `203.145.34.51`
- Server OS: Ubuntu 24.04 LTS
- App root di VPS: `/var/www/indobraga`
- Working tree production: `/var/www/indobraga/current`
- Shared secret/env path: `/var/www/indobraga/shared/apps-api.env`
- Backend runtime: NestJS build output `apps/api/dist/src/main.js`
- Frontend runtime: Nitro/Vite output `apps/web/.output/server/index.mjs`
- Reverse proxy: Nginx
- Process manager: PM2 + systemd
- SSL: Certbot/Let's Encrypt
- Database: MySQL di VPS
- Object storage: IDCloudHost S3-compatible bucket `indobraga`

Production memakai model monorepo:

```text
/var/www/indobraga/
  current/              # git clone dari repository GitHub
  shared/
    apps-api.env        # env production backend, tidak masuk Git
  deploy.sh             # script deploy server-local
```

## Prinsip Wajib

- Jangan commit file `.env`, credential, access key, secret, atau password.
- Jangan menyimpan binary upload production di Git.
- Jangan menghapus `/var/www/indobraga/shared/apps-api.env`.
- Jangan mengubah DNS/SSL tanpa memahami dampaknya ke traffic production.
- Jangan menjalankan migration production sebelum backup database jika migration bersifat destruktif atau berisiko.
- Jangan menonaktifkan login SSH password kecuali ada keputusan eksplisit dari owner.

## DNS dan HTTPS

DNS yang diharapkan:

```text
A      @      203.145.34.51
CNAME  www    indobraga.com
```

HTTPS sudah dipasang untuk:

```text
indobraga.com
www.indobraga.com
```

Cek DNS dari lokal:

```bash
nslookup indobraga.com
nslookup www.indobraga.com
```

Cek sertifikat di VPS:

```bash
sudo certbot certificates
systemctl is-active certbot.timer
sudo certbot renew --dry-run
```

## Login VPS

Gunakan SSH key yang sudah didaftarkan ke VPS. Contoh dari Windows PowerShell:

```powershell
ssh -i "$env:USERPROFILE\.ssh\indobraga_vps_ed25519" dimasprasetio@203.145.34.51
```

Jika memakai password SSH, pastikan hanya dilakukan dari lingkungan yang dipercaya.

## Deploy Ulang Normal

Deploy ulang normal digunakan setelah ada perubahan code yang sudah masuk ke branch `main`.

Di VPS:

```bash
cd /var/www/indobraga
./deploy.sh
```

Script server-local tersebut menjalankan urutan:

1. Backup/copy env production dari `apps/api/.env` ke `shared/apps-api.env`.
2. `git fetch` dan `git pull --ff-only origin main`.
3. Copy ulang `shared/apps-api.env` ke `apps/api/.env`.
4. `npm ci`.
5. `npm run db:generate`.
6. `npm run build:api`.
7. `npm run build:web`.
8. `npx prisma migrate deploy`.
9. `npm run db:seed`.
10. Restart PM2 process `indobraga-api` dan `indobraga-web`.
11. `pm2 save`.
12. Validasi dan reload Nginx.
13. Smoke test API health dan homepage.

Jika `git pull --ff-only` gagal, artinya ada divergensi commit atau perubahan lokal di VPS. Jangan paksa reset sebelum mengecek:

```bash
cd /var/www/indobraga/current
git status
git log --oneline --decorate -5
```

## Manual Deploy Jika Script Hilang

Jika `/var/www/indobraga/deploy.sh` hilang, redeploy manual bisa dilakukan dengan urutan berikut.

```bash
set -euo pipefail

BASE="/var/www/indobraga"
CURRENT="$BASE/current"
SHARED="$BASE/shared"
ENV_FILE="$SHARED/apps-api.env"

cd "$CURRENT"

cp "$CURRENT/apps/api/.env" "$ENV_FILE"
chmod 600 "$ENV_FILE"

git fetch origin main
git pull --ff-only origin main

cp "$ENV_FILE" "$CURRENT/apps/api/.env"
chmod 600 "$CURRENT/apps/api/.env"

npm ci
npm run db:generate
npm run build:api
npm run build:web

cd "$CURRENT/apps/api"
npx prisma migrate deploy

cd "$CURRENT"
npm run db:seed

pm2 delete indobraga-api >/dev/null 2>&1 || true
pm2 delete indobraga-web >/dev/null 2>&1 || true

cd "$CURRENT/apps/api"
pm2 start dist/src/main.js --name indobraga-api --time

cd "$CURRENT/apps/web"
NODE_ENV=production HOST=127.0.0.1 PORT=3000 pm2 start .output/server/index.mjs --name indobraga-web --time

pm2 save
sudo nginx -t
sudo systemctl reload nginx
```

## Smoke Test Setelah Deploy

Jalankan dari lokal:

```bash
curl -I https://indobraga.com/
curl -I https://www.indobraga.com/
curl -I https://indobraga.com/api/v1/health
curl -I https://indobraga.com/robots.txt
curl -I https://indobraga.com/sitemap.xml
```

Ekspektasi:

- Homepage `200`.
- `www` `200`.
- API health `200`.
- HTTP otomatis redirect ke HTTPS.

Smoke test admin setelah login:

- Submit form `/kontak`, pastikan data muncul di Pesan Kontak.
- Cek Email Massal sumber Pesan Kontak, pastikan preview email valid bertambah untuk email inquiry yang baru masuk.
- Cek Email Massal sumber Upload CSV, pastikan template CSV dapat diunduh dan file CSV valid menampilkan preview penerima.
- Buat draf Email Massal dari Pesan Kontak atau CSV, pastikan recipient tersimpan sebagai snapshot dan belum dikirim sampai tombol kirim dipakai.

Jalankan dari VPS:

```bash
pm2 list
pm2 logs indobraga-api --lines 80
pm2 logs indobraga-web --lines 80
systemctl is-active nginx
systemctl is-active mysql
systemctl is-active pm2-dimasprasetio
df -h /
free -h
```

## Nginx

Konfigurasi site berada di:

```text
/etc/nginx/sites-available/indobraga
/etc/nginx/sites-enabled/indobraga
```

Target proxy:

```text
/api/ -> http://127.0.0.1:3001
/     -> http://127.0.0.1:3000
```

Konfigurasi yang paling mendekati ideal untuk SEO asset production adalah exact proxy untuk `robots.txt` dan `sitemap.xml` langsung ke backend, karena backend sudah menjadi source of truth untuk berita published dan revalidation cache:

```nginx
location = /robots.txt {
    proxy_pass http://127.0.0.1:3001/robots.txt;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location = /sitemap.xml {
    proxy_pass http://127.0.0.1:3001/sitemap.xml;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Jika exact proxy ini belum diterapkan, frontend runtime tetap menyediakan fallback `robots.txt` dan `sitemap.xml` agar route root tidak kosong saat deploy.

Route SSE admin notification perlu proxy buffering dimatikan agar event tidak tertahan oleh Nginx. Contoh blok yang aman ditempatkan sebelum blok `/api/` umum:

```nginx
location /api/v1/admin/notifications/stream {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 1h;
}
```

Static asset frontend dilayani oleh Nginx dengan cache panjang:

```text
/assets/ -> /var/www/indobraga/current/apps/web/.output/public/assets/
Cache-Control: public, max-age=31536000, immutable
```

Setiap perubahan Nginx wajib dicek dulu:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## PM2

Nama process production:

```text
indobraga-api
indobraga-web
```

Perintah umum:

```bash
pm2 list
pm2 restart indobraga-api
pm2 restart indobraga-web
pm2 logs indobraga-api --lines 120
pm2 logs indobraga-web --lines 120
pm2 save
```

Pastikan PM2 systemd aktif:

```bash
systemctl is-active pm2-dimasprasetio
```

## Database Migration

Migration production dijalankan dari folder API:

```bash
cd /var/www/indobraga/current/apps/api
npx prisma migrate deploy
```

Sebelum migration berisiko, ambil backup MySQL lebih dulu. Minimal:

```bash
mysqldump -u <user> -p <database> > ~/indobraga-backup-$(date +%Y%m%d-%H%M%S).sql
```

Jangan simpan backup jangka panjang hanya di disk VPS yang sama. Pindahkan ke storage terpisah jika backup penting.

## Production Seed

Seed production digunakan untuk memastikan akun login awal dan akun SMTP default tersedia. Seed harus idempotent dan tidak boleh menyimpan secret di Git.

Command:

```bash
cd /var/www/indobraga/current
npm run db:seed
```

Env seed yang dibaca backend:

```text
SEED_ADMIN_NAME
SEED_ADMIN_EMAIL
SEED_ADMIN_PASSWORD
SEED_SMTP_EMAIL
SEED_SMTP_DISPLAY_NAME
SEED_SMTP_HOST
SEED_SMTP_PORT
SEED_SMTP_SECURITY
SEED_SMTP_USERNAME
SEED_SMTP_PASSWORD
```

Nilai secret seperti `SEED_ADMIN_PASSWORD` dan `SEED_SMTP_PASSWORD` hanya boleh disimpan di `/var/www/indobraga/shared/apps-api.env` dan file aktif `/var/www/indobraga/current/apps/api/.env`. Password SMTP akan dienkripsi ke database memakai `CREDENTIAL_ENCRYPTION_KEY`.

## Worker Scheduler

Worker internal tidak dipanggil frontend. Jalankan dari VPS dengan cron, systemd timer, atau process scheduler trusted yang membawa header `x-internal-worker-secret`.

Endpoint worker production:

```text
POST http://127.0.0.1:3001/api/v1/internal/workers/email-campaigns/tick
POST http://127.0.0.1:3001/api/v1/internal/workers/notifications/tick
POST http://127.0.0.1:3001/api/v1/internal/revalidation/tick
```

Contoh cron lokal server:

```bash
* * * * * curl -fsS -X POST -H "x-internal-worker-secret: $INTERNAL_WORKER_SECRET" http://127.0.0.1:3001/api/v1/internal/workers/email-campaigns/tick >/dev/null
* * * * * curl -fsS -X POST -H "x-internal-worker-secret: $INTERNAL_WORKER_SECRET" http://127.0.0.1:3001/api/v1/internal/workers/notifications/tick >/dev/null
*/5 * * * * curl -fsS -X POST -H "x-internal-worker-secret: $INTERNAL_WORKER_SECRET" http://127.0.0.1:3001/api/v1/internal/revalidation/tick >/dev/null
```

Jika memakai cron, jangan menulis secret langsung di command. Load dari file env root-only atau gunakan wrapper script dengan permission `700`.

## Environment Production

File production aktif:

```text
/var/www/indobraga/current/apps/api/.env
```

Backup/copy yang harus dipertahankan:

```text
/var/www/indobraga/shared/apps-api.env
```

Local repository hanya boleh menyimpan `.env.example`.

Jika env perlu diubah, edit langsung di VPS:

```bash
nano /var/www/indobraga/shared/apps-api.env
cp /var/www/indobraga/shared/apps-api.env /var/www/indobraga/current/apps/api/.env
chmod 600 /var/www/indobraga/current/apps/api/.env
pm2 restart indobraga-api
pm2 save
```

Jangan pernah menyalin isi `.env` production ke chat, issue, PR, atau commit.

Env notification production yang perlu dicek saat deploy:

```text
NOTIFICATION_EMAIL_ENABLED=true
NOTIFICATION_EMAIL_TO=support@indobraga.com
NOTIFICATION_EMAIL_SENDER=support@indobraga.com
NOTIFICATION_WORKER_BATCH_SIZE=20
NOTIFICATION_WORKER_MAX_ATTEMPTS=3
NOTIFICATION_STREAM_HEARTBEAT_MS=30000
```

## Object Storage dan Media

Object storage production menggunakan IDCloudHost S3-compatible storage. Path upload yang direncanakan:

```text
upload/[dev atau prod]/[kategori]/[tanggal]/[file]
```

Contoh:

```text
upload/prod/berita/2026/05/09/nama-file.webp
```

Gunakan `MEDIA_STORAGE_ENV=prod` di production agar object key tidak bercampur dengan development.

## Rollback

Rollback paling aman tergantung jenis perubahan.

Untuk rollback code tanpa rollback database:

```bash
cd /var/www/indobraga/current
git log --oneline -10
git checkout <commit-sebelumnya>
npm ci
npm run db:generate
npm run build:api
npm run build:web
pm2 delete indobraga-api >/dev/null 2>&1 || true
pm2 delete indobraga-web >/dev/null 2>&1 || true
cd apps/api && pm2 start dist/src/main.js --name indobraga-api --time
cd ../web && NODE_ENV=production HOST=127.0.0.1 PORT=3000 pm2 start .output/server/index.mjs --name indobraga-web --time
pm2 save
```

Setelah kondisi stabil, kembalikan ke branch production:

```bash
cd /var/www/indobraga/current
git checkout main
git pull --ff-only origin main
```

Jika migration database sudah berjalan, rollback code saja belum tentu cukup. Analisis migration terkait dan gunakan backup database jika diperlukan.

## Checklist Sebelum Go Live atau Redeploy Besar

- Node.js runtime minimal `22.12.0`.
- `npm run db:validate` lolos di lokal/CI.
- `npm run lint` lolos di lokal/CI.
- `npm run build` lolos di lokal/CI.
- `npm run security:audit` lolos; command ini memvalidasi `npm audit --omit=dev` plus IOC supply-chain TanStack.
- Perubahan database sudah punya migration Prisma.
- Backup database tersedia sebelum migration berisiko.
- `.env.example` diperbarui jika ada env baru.
- Tidak ada secret masuk Git.
- DNS mengarah ke `203.145.34.51`.
- `sudo nginx -t` lolos.
- `certbot renew --dry-run` lolos setelah perubahan SSL/Nginx besar.
- Smoke test domain dan API health lolos setelah deploy.

## Troubleshooting Singkat

Jika homepage mati:

```bash
pm2 logs indobraga-web --lines 120
curl -I http://127.0.0.1:3000/
sudo nginx -t
```

Jika API mati:

```bash
pm2 logs indobraga-api --lines 120
curl -I http://127.0.0.1:3001/api/v1/health
```

Jika upload media gagal:

- Cek env object storage.
- Cek bucket permission/public access sesuai kebutuhan.
- Cek log API.
- Pastikan file tidak melebihi limit Nginx/API.

Jika HTTPS gagal:

```bash
sudo nginx -t
sudo certbot certificates
sudo certbot renew --dry-run
curl -I http://indobraga.com/
curl -I https://indobraga.com/
```

Jika disk hampir penuh:

```bash
df -h /
du -sh /var/www/indobraga/* 2>/dev/null
pm2 flush
npm cache clean --force
```

Hapus hanya artefak yang jelas tidak dipakai. Jangan hapus `current`, `shared`, database, atau object storage credential.
