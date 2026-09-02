#!/usr/bin/env bash
set -euo pipefail

cd /home/ec2-user/apps/booknest

export NODE_ENV=production
export PORT=3000
export ADMIN_SESSION_TTL_HOURS=12
export AWS_REGION=eu-central-1
export S3_BUCKET_NAME=booknest-covers-prod

POSTGRES_SECRET=$(aws secretsmanager get-secret-value \
  --secret-id booknest/prod/postgres \
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

export GOOGLE_BOOKS_API_KEY
GOOGLE_BOOKS_API_KEY=$(echo "$GOOGLE_BOOKS_SECRET" | jq -r '.apiKey')

export DATABASE_URL="postgresql://booknest:${POSTGRES_PASSWORD}@localhost:5432/booknest"

exec npm run start:prod --workspace @booknest/api
