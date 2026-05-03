#!/bin/sh
set -e

if [ -z "${DATABASE_URL}" ]; then
  echo "DATABASE_URL is not set" >&2
  exit 1
fi

if [ -z "${JWT_SECRET}" ]; then
  echo "JWT_SECRET is not set" >&2
  exit 1
fi

MAX_RETRIES=${MAX_RETRIES:-10}
SLEEP=${SLEEP:-5}
i=0
until npx prisma migrate deploy; do
  i=$((i+1))
  if [ "$i" -ge "$MAX_RETRIES" ]; then
    echo "Migrations failed after $i attempts" >&2
    exit 1
  fi
  echo "Migrate failed, retrying in $SLEEP seconds..."
  sleep "$SLEEP"
done

exec node dist/index.js
