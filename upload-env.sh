#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env}"
TARGET_ENV="${2:-development}"

if [ ! -f "$ENV_FILE" ]; then
  echo "env file not found: $ENV_FILE"
  exit 1
fi

if ! command -v vercel >/dev/null 2>&1; then
  echo "vercel CLI is not installed"
  exit 1
fi

echo "Uploading env vars from $ENV_FILE to Vercel ($TARGET_ENV)"

while IFS= read -r line || [ -n "$line" ]; do
  line="${line%$'\r'}"

  if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
    continue
  fi

  if [[ "$line" == export[[:space:]]* ]]; then
    line="${line#export }"
  fi

  if [[ "$line" != *"="* ]]; then
    continue
  fi

  KEY="${line%%=*}"
  VALUE="${line#*=}"

  KEY="${KEY#${KEY%%[![:space:]]*}}"
  KEY="${KEY%${KEY##*[![:space:]]}}"

  if [ -z "$KEY" ]; then
    continue
  fi

  echo "Adding $KEY"
  printf '%s\n' "$VALUE" | vercel env add "$KEY" "$TARGET_ENV" --force --yes >/dev/null
done < "$ENV_FILE"

echo "Done"
