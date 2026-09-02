#!/usr/bin/env bash
set -euo pipefail

cd /home/ec2-user/apps/booknest

export NODE_ENV=production
export PORT=3000
export POSTGRES_DB=booknest
export POSTGRES_USER=booknest
export ADMIN_SESSION_TTL_HOURS=12
export AWS_REGION=eu-central-1

POSTGRES_SECRET=$(aws secretsmanager get-secret-value \
  --secret-id booknest/prod/postgres \
  --region "$AWS_REGION" \
  --query SecretString \
  --output text)

ADMIN_SECRET=$(aws secretsmanager get-secret-value \
  --secret-id booknest/prod/admin \
  --region "$AWS_REGION" \
  --query SecretString \
  --output text)

GOOGLE_BOOKS_SECRET=$(aws secretsmanager get-secret-value \
  --secret-id booknest/prod/google-books \
  --region "$AWS_REGION" \
  --query SecretString \
  --output text)

export POSTGRES_PASSWORD
POSTGRES_PASSWORD=$(echo "$POSTGRES_SECRET" | jq -r '.password')

export ADMIN_EMAIL
ADMIN_EMAIL=$(echo "$ADMIN_SECRET" | jq -r '.email')

export ADMIN_PASSWORD
ADMIN_PASSWORD=$(echo "$ADMIN_SECRET" | jq -r '.password')

export GOOGLE_BOOKS_API_KEY
GOOGLE_BOOKS_API_KEY=$(echo "$GOOGLE_BOOKS_SECRET" | jq -r '.apiKey')

export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}"

docker compose -f compose.yaml -f compose.prod.yaml up -d postgres

npm ci --include=dev
npm run prisma:generate --workspace @booknest/api
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma
npm run build --workspace @booknest/api
npm run start:prod --workspace @booknest/api
