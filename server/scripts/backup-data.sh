#!/usr/bin/env bash
#
# backup-data.sh — copies Lunchify's data file somewhere that isn't this
# server's disk. The file store already writes atomically (temp + rename)
# and flushes on every change, so corruption-on-write isn't the risk; total
# loss of this one disk is. Run this on a schedule (cron) once hosted.
#
# Usage:
#   DATA_FILE=/app/server/data/lunchify.json \
#   BACKUP_DIR=/var/backups/lunchify \
#   ./backup-data.sh
#
# Cron example (daily at 2am, keeps 30 days locally):
#   0 2 * * * DATA_FILE=/app/server/data/lunchify.json BACKUP_DIR=/var/backups/lunchify /app/server/scripts/backup-data.sh
#
# BACKUP_DIR should itself be synced off-box (rsync to another host, S3,
# etc.) — this script only handles the local snapshot + rotation.

set -euo pipefail

DATA_FILE="${DATA_FILE:?set DATA_FILE to the path of lunchify.json}"
BACKUP_DIR="${BACKUP_DIR:?set BACKUP_DIR to where snapshots should go}"
KEEP_DAYS="${KEEP_DAYS:-30}"

if [ ! -f "$DATA_FILE" ]; then
  echo "!! $DATA_FILE not found — nothing to back up" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
STAMP=$(date +%Y%m%d-%H%M%S)
OUT="$BACKUP_DIR/lunchify-$STAMP.json.gz"

gzip -c "$DATA_FILE" > "$OUT"
echo "backed up $DATA_FILE -> $OUT"

find "$BACKUP_DIR" -name 'lunchify-*.json.gz' -mtime "+$KEEP_DAYS" -delete
