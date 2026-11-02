#!/bin/sh
# Node/React runtime: load optional Docker secrets without printing values.
set -eu

load_secret() {
    var_name=$1
    file_path=$2
    if [ -f "$file_path" ]; then
        # Strip only CR/LF line endings, matching the existing application.
        value=$(tr -d '\r\n' < "$file_path")
        export "$var_name=$value"
    fi
}

load_secret DBPASSWORD /run/secrets/mysql_password
if [ "${DBPASSWORD+x}" = x ]; then
    export DB_PASSWORD="$DBPASSWORD"
    # Legacy code may read this exact variable name.
    export MYSQL_ROOT_PASSWORD="$DBPASSWORD"
fi
load_secret OPENAI_API_KEY /run/secrets/openai_api_key
load_secret GEMINI_API_KEY /run/secrets/gemini_api_key
load_secret EMAIL_PWD /run/secrets/email_password
load_secret GITHUB_TOKEN /run/secrets/github_token
load_secret JWT_TOKEN_SECRET /run/secrets/jwt_token_secret
load_secret REDIS_PASSWORD /run/secrets/redis_password
load_secret RABBITMQ_PASSWORD /run/secrets/rabbitmq_password
load_secret GOOGLEDRIVE_KEY /run/secrets/googledrive_key
load_secret GOOGLEDRIVE_SECRET /run/secrets/googledrive_secret
load_secret DROPBOX_KEY /run/secrets/dropbox_key
load_secret DROPBOX_SECRET /run/secrets/dropbox_secret
load_secret ONEDRIVE_KEY /run/secrets/onedrive_key
load_secret ONEDRIVE_SECRET /run/secrets/onedrive_secret

# Do not execute or overwrite SSH_CONNECTION (was broken command substitution).
exec "$@"
