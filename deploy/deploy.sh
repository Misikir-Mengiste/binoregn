#!/usr/bin/env bash
# Runs ON THE SERVER as the "binoregn" user (see doc/deploy.md):
#   ssh binoregn@<server> 'bash ~/app/deploy/deploy.sh'
# Checks out the latest pushed main into ~/app, installs dependencies,
# applies database migrations, builds, and reloads the app with no
# downtime for already-open pages. ~/app/.env and ~/app/public/uploads
# are not in git, so they survive every deploy.
set -euo pipefail

APP="$HOME/app"
REPO="$HOME/repo.git"

echo "==> Checking out main"
git --git-dir="$REPO" --work-tree="$APP" checkout -f main
cd "$APP"
echo "    $(git --git-dir="$REPO" log --oneline -1 main)"

echo "==> Backing up the database"
mkdir -p "$HOME/backups"
# Read only DATABASE_URL — don't `source` .env: values such as passwords
# may contain $ or other characters the shell would expand.
DB_URL=$(grep -E '^DATABASE_URL=' "$APP/.env" | head -1 | sed -E 's/^DATABASE_URL=//; s/^"//; s/"$//')
pg_dump "${DB_URL%%\?*}" | gzip > "$HOME/backups/pre-deploy-$(date +%Y%m%d-%H%M%S).sql.gz"

echo "==> Installing dependencies"
npm ci --no-audit --no-fund

echo "==> Applying database migrations"
npx prisma migrate deploy

echo "==> Building"
npm run build

echo "==> Reloading"
if pm2 describe binoregn >/dev/null 2>&1; then
  pm2 reload ecosystem.config.js --update-env
else
  pm2 start ecosystem.config.js
fi
pm2 save >/dev/null

echo "==> Done"
