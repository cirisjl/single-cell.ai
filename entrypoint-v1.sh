#!/bin/sh
# Exit immediately if a command exits with a non-zero status
set -e

echo "Starting entrypoint script..."

# Map simple secrets directly to environment variables
if [ -f /run/secrets/mysql_password ]; then
    export DBPASSWORD=$(cat /run/secrets/mysql_password | tr -d '\r\n')
    export DB_PASSWORD=$DBPASSWORD # For Directus/Node
    export MYSQL_ROOT_PASSWORD=$DBPASSWORD # For Directus/Node
fi

if [ -f /run/secrets/openai_api_key ]; then
    export OPENAI_API_KEY=$(cat /run/secrets/openai_api_key | tr -d '\r\n')
fi

if [ -f /run/secrets/gemini_api_key ]; then
    export GEMINI_API_KEY=$(cat /run/secrets/gemini_api_key | tr -d '\r\n')
fi

if [ -f /run/secrets/email_password ]; then
    export EMAIL_PWD=$(cat /run/secrets/email_password | tr -d '\r\n')
fi

if [ -f /run/secrets/github_token ]; then
    export GITHUB_TOKEN=$(cat /run/secrets/github_token | tr -d '\r\n')
fi

if [ -f /run/secrets/jwt_token_secret ]; then
    export JWT_TOKEN_SECRET=$(cat /run/secrets/jwt_token_secret | tr -d '\r\n')
fi

# Construct complex URLs using the secrets
if [ -f /run/secrets/redis_password ]; then
    export REDIS_PASSWORD=$(cat /run/secrets/redis_password | tr -d '\r\n')
fi

if [ -f /run/secrets/rabbitmq_password ]; then
    export RABBITMQ_PASSWORD=$(cat /run/secrets/rabbitmq_password | tr -d '\r\n')
fi

if [ -f /run/secrets/googledrive_key ]; then
    export GOOGLEDRIVE_KEY=$(cat /run/secrets/googledrive_key | tr -d '\r\n')
fi

if [ -f /run/secrets/googledrive_secret ]; then
    export GOOGLEDRIVE_SECRET=$(cat /run/secrets/googledrive_secret | tr -d '\r\n')
fi

if [ -f /run/secrets/dropbox_key ]; then
    export DROPBOX_KEY=$(cat /run/secrets/dropbox_key | tr -d '\r\n')
fi

if [ -f /run/secrets/dropbox_secret ]; then
    export DROPBOX_SECRET=$(cat /run/secrets/dropbox_secret | tr -d '\r\n')
fi

if [ -f /run/secrets/onedrive_key ]; then
    export ONEDRIVE_KEY=$(cat /run/secrets/onedrive_key | tr -d '\r\n')
fi

if [ -f /run/secrets/onedrive_secret ]; then
    export ONEDRIVE_SECRET=$(cat /run/secrets/onedrive_secret | tr -d '\r\n')
fi

export SSH_CONNECTION=$(SSH_CONNECTION)

echo "Secrets parsed and environment variables exported."

# This passes the command from your docker-compose.yml or Dockerfile to the shell
exec "$@"