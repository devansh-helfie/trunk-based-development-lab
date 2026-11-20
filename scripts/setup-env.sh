#!/usr/bin/env bash
set -euo pipefail

# Run once per demo environment on the personal Mac deployment runner.
environment="${1:-DEV}"
case "$environment" in
  DEV) discount=false ;;
  TEST|PROD) discount=true ;;
  *) echo 'Usage: bash scripts/setup-env.sh DEV|TEST|PROD'; exit 1 ;;
esac
slug=$(printf '%s' "$environment" | tr '[:upper:]' '[:lower:]')
directory="$HOME/.local/share/trunk-based-development-lab/environments/$slug"
umask 077
mkdir -p "$directory"

if [[ -f "$directory/.env" ]]; then
  echo "Existing $environment settings preserved."
else
  printf 'FLAGS_ADMIN_PASSWORD=%s\nFEATURE_BULK_DISCOUNT=%s\n' \
    "$(openssl rand -hex 24)" "$discount" > "$directory/.env"
  echo "Created private $environment settings."
fi

echo "Settings: $directory/.env"
echo 'Panel username: admin. Read the password locally from the settings file.'
