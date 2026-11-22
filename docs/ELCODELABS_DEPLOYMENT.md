# Deploy Indobraga di VPS Elcodelabs

Dokumen ini menjelaskan cara menjalankan Indobraga di VPS Elcodelabs (`103.189.235.79`) mengikuti
`/opt/elcodelabs/SERVER_PLAYBOOK.md`.

**Status:** produksi `indobraga.com` berjalan di VPS Elcodelabs sejak 2026-11-22 (DNS A `@` -> `103.189.235.79`,
`www` CNAME ke `@`). VPS lama (`203.145.34.51`, PM2 + nginx) hanya disimpan sementara sebagai cadangan dan
tidak lagi menerima deploy: workflow `Quality` kini hanya memeriksa kode. Rollback darurat ke server lama =
kembalikan A record `@` ke `203.145.34.51` (TTL 300); setelah server lama dimatikan, `docs/DEPLOYMENT_RUNBOOK.md`
dan `scripts/deploy-production.sh` tinggal arsip.

## Aturan Elcodelabs yang dipatuhi

| Aturan | Penerapan di Indobraga |
|---|---|
| 1 aplikasi = 1 container | API dan web berjalan dalam **satu image/container**. `ops/docker/entrypoint.mjs` menjalankan keduanya dan satu reverse proxy kecil pada `APP_PORT`. |
| Build di CI, server hanya pull | `.github/workflows/image.yml` membangun image dan push ke `ghcr.io/amandayora/indobraga-company-profile:<git-sha>`. Server tidak pernah `docker build`. |
| MySQL host, bersama, 1 DB + 1 user per app | Database `indobraga_db`, user `indobraga_user@'172.%'` (`mysql_native_password`). Container memakai `host.docker.internal`. |
| Port localhost unik | `127.0.0.1:8087` (publish hanya ke localhost). |
| Secret hanya di `~/indobraga/.env` (600) | Image tidak membawa secret. |
| nginx host + certbot, 1 domain | Site `/etc/nginx/sites-available/indobraga`, sertifikat `--cert-name <domain>`. |
| Daftar di `apps.conf` + tabel playbook | Setelah container sehat dan domain menjawab HTTPS. |
| Cek setelah perubahan | `/opt/elcodelabs/check-all-apps.sh` harus OK di semua baris. |

## Alur kerja container

```
internet -> nginx (host, TLS) -> 127.0.0.1:8087 -> entrypoint proxy
                                                    |- /api/*, /robots.txt, /sitemap.xml -> API  (127.0.0.1:3001 di dalam container)
                                                    '- lainnya                           -> web  (127.0.0.1:3000 di dalam container)
```

Proxy meneruskan header apa adanya (tidak menambah `X-Forwarded-For`), karena API mempercayai tepat satu hop
(nginx host). Jika salah satu proses mati, container keluar dan Docker menjalankannya ulang utuh.

Perintah container: `serve` (default), `migrate` (`prisma migrate deploy`), `seed`.

## Berkas di repo

- `Dockerfile`, `.dockerignore`
- `ops/docker/entrypoint.mjs`
- `.github/workflows/image.yml` (build + push image pada setiap push ke `main`; tidak men-deploy apa pun)
- `ops/elcodelabs/docker-compose.prod.yml`, `ops/elcodelabs/deploy.sh` (disalin ke `~/indobraga/` di VPS)
- `ops/elcodelabs/nginx-indobraga.conf.template` (site nginx)

## Deploy

```bash
cd ~/indobraga && ./deploy.sh <git-sha-40-karakter>
```

`deploy.sh`: pull image -> backup database (`~/indobraga/backups`) -> `migrate` -> `up -d` -> cek
`/api/v1/health` -> simpan 2 image terakhir. Rollback: jalankan lagi dengan sha sebelumnya (image lama tetap ada di GHCR).

Alur rilis: merge ke `main` -> workflow `Image` membangun, menguji (smoke test), lalu push
`ghcr.io/amandayora/indobraga-company-profile:<sha>` -> di VPS jalankan `./deploy.sh <sha>`.

Backup sebelum migrasi memakai `sudo -n mysqldump` (MySQL root lewat auth_socket), karena
`indobraga_user` hanya ada untuk `172.%` (container) dan tidak bisa login dari shell host.

Setelah `.env` diubah, container harus dibuat ulang agar nilainya terbaca:
`docker compose -f docker-compose.prod.yml up -d --force-recreate app`.
