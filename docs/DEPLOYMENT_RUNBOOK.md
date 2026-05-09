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
9. Restart PM2 process `indobraga-api` dan `indobraga-web`.
10. `pm2 save`.
11. Validasi dan reload Nginx.
12. Smoke test API health dan homepage.

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
```

Ekspektasi:

- Homepage `200`.
- `www` `200`.
- API health `200`.
- HTTP otomatis redirect ke HTTPS.

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

- `npm run lint` lolos di lokal/CI.
- `npm run build` lolos di lokal/CI.
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
