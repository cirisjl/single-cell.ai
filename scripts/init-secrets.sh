#!/bin/sh
# Run ONLY when provisioning a NEW instance; never regenerate stored DB secrets.
set -eu
if [ "${1:-}" != "--new-install" ]; then
  echo 'Usage: sh scripts/init-secrets.sh --new-install' >&2
  echo 'For EXISTING deployments, bring over existing secrets and Directus KEY/SECRET.' >&2
  exit 2
fi
umask 077
mkdir -p secrets
if command -v openssl >/dev/null 2>&1; then
  random_hex() { openssl rand -hex 32; }
elif command -v python3 >/dev/null 2>&1; then
  random_hex() { python3 -c 'import secrets; print(secrets.token_hex(32))'; }
else
  echo 'Need openssl or python3 to generate strong random credentials.' >&2
  exit 1
fi
for name in redis_password rabbitmq_password mysql_password jupyter_token \
  mongo_express_password jwt_token_secret directus_password \
  flower_basicauth_password directus_key directus_secret; do
  file="secrets/$name.txt"
  if [ ! -e "$file" ]; then
    random_hex > "$file"
    echo "Created $file"
  else
    echo "Kept existing $file"
  fi
done
# External integrations are optional for initial boot, but Compose requires
# their secret files to exist when a service mounts them.
for name in github_token email_password openai_api_key gemini_api_key \
  googledrive_key googledrive_secret dropbox_key dropbox_secret \
  onedrive_key onedrive_secret; do
  file="secrets/$name.txt"
  if [ ! -e "$file" ]; then
    : > "$file"
    echo "Created empty $file (fill in when enabling this integration)"
  else
    echo "Kept existing $file"
  fi
done
echo 'Done. Store secrets securely; do not commit them or regenerate after data exists.'
