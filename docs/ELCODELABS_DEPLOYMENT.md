# Deploy Indobraga di VPS Elcodelabs

Dokumen ini menjelaskan cara menjalankan Indobraga di VPS Elcodelabs (`103.189.235.79`) mengikuti
`/opt/elcodelabs/SERVER_PLAYBOOK.md`. **VPS produksi Indobraga yang lama (`203.145.34.51`, PM2 + nginx,
dideploy oleh workflow `Quality`) tidak diubah** oleh perubahan ini: workflow, skrip deploy, dan DNS lama dibiarkan.

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
- `.github/workflows/image.yml` (hanya build + push image; tidak men-deploy apa pun)
- `ops/elcodelabs/docker-compose.prod.yml`, `ops/elcodelabs/deploy.sh` (disalin ke `~/indobraga/` di VPS)
- `ops/elcodelabs/nginx-indobraga.conf.template` (site nginx)

## Deploy

```bash
cd ~/indobraga && ./deploy.sh <git-sha-40-karakter>
```

`deploy.sh`: pull image -> backup database (`~/indobraga/backups`) -> `migrate` -> `up -d` -> cek
`/api/v1/health` -> simpan 2 image terakhir. Rollback: jalankan lagi dengan sha sebelumnya (image lama tetap ada di GHCR).
