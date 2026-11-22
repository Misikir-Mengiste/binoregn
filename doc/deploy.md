# Deploying Binoregn (Contabo Cloud VPS 4)

Production runs on a Contabo VPS (Ubuntu 24.04) at `62.169.29.172`,
serving https://binoregn.com.

## How it is set up

| Piece | Where |
| --- | --- |
| App user | `binoregn` (no sudo, no password — SSH key only) |
| Code | pushed to `/home/binoregn/repo.git`, checked out in `/home/binoregn/app` |
| Settings / secrets | `/home/binoregn/app/.env` (never in git) |
| Product images | `/home/binoregn/app/public/uploads` (never in git) |
| Process | PM2 app `binoregn` → `next start` on `127.0.0.1:4000` (`ecosystem.config.js`), starts on boot |
| Web | nginx (`deploy/nginx-binoregn.conf`) → HTTPS by Let's Encrypt (auto-renews) |
| Database | PostgreSQL 16, database + role `binoregn`, localhost only |
| Firewall | ufw: only 22 (SSH), 80, 443 |
| Backups | daily `pg_dump` at 02:00 server time (kept 14 days) + one before every deploy, in `/home/binoregn/backups` |
| Cron | Friday payout reminder → `GET /api/cron/payout-reminder`, once at Fri 09:00 Addis Ababa (`~/bin/payout-reminder.sh` runs hourly Thu/Fri and checks Addis time itself — the server clock is Europe/Berlin with daylight saving) |
| Canonical host | `www` and `http://` redirect to `https://binoregn.com` |
| Telegram | webhook `https://binoregn.com/api/telegram/webhook` (`npm run telegram:webhook -- https://binoregn.com`) |

## Deploying an update

From the project folder on the PC that has the deploy key:

```bash
git push origin main          # GitHub (Misikir-Mengiste/binoregn)
git push vps main             # the server
ssh -i ~/.ssh/binoregn_vps binoregn@62.169.29.172 'bash ~/app/deploy/deploy.sh'
```

`deploy.sh` backs up the database, installs dependencies, runs
`prisma migrate deploy`, builds, and reloads PM2.

The `vps` git remote is `binoregn@62.169.29.172:repo.git`, pushed with
`GIT_SSH_COMMAND="ssh -i ~/.ssh/binoregn_vps"` (or an entry in
`~/.ssh/config`).

## Useful commands (on the server, as `binoregn`)

```bash
pm2 status                 # is it running?
pm2 logs binoregn          # live logs
pm2 restart binoregn       # restart after editing .env
```

## Restoring a backup

```bash
gunzip -c ~/backups/<file>.sql.gz | psql "$(grep ^DATABASE_URL ~/app/.env | cut -d'"' -f2 | sed 's/?.*//')"
```
