#!/usr/bin/env bash
set -euo pipefail
# Usage: ./scripts/create-kubernetes-secret.sh /secure/path/to/secrets
NAMESPACE="${NAMESPACE:-oscb}"
DIRECTORY="${1:-secrets}"
if [[ ! -d "$DIRECTORY" ]]; then
  echo "Missing secrets directory: $DIRECTORY" >&2
  exit 1
fi
args=()
for name in mongo_express_password redis_password rabbitmq_password mysql_password github_token email_password openai_api_key gemini_api_key jwt_token_secret directus_password flower_basicauth_password googledrive_key googledrive_secret dropbox_key dropbox_secret onedrive_key onedrive_secret directus_key directus_secret; do
  filename="$DIRECTORY/$name.txt"
  if [[ ! -s "$filename" ]]; then
    echo "Missing or empty secret file: $filename" >&2
    exit 1
  fi
  args+=("--from-file=${name}=${filename}")
done
kubectl -n "$NAMESPACE" create secret generic oscb-secrets \
  "${args[@]}" --dry-run=client -o yaml | kubectl apply -f -
echo "Created/updated oscb-secrets in namespace $NAMESPACE"
