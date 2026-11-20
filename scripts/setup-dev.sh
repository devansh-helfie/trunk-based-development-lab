#!/usr/bin/env bash
set -euo pipefail

# Run once on the Mac that hosts the personal deployment runner.
dev_directory="$HOME/.local/share/trunk-based-development-lab/environments/dev"
umask 077
mkdir -p "$dev_directory"

if [[ -f "$dev_directory/.env" ]]; then
  echo 'Existing DEV settings preserved.'
else
  printf 'FLAGS_ADMIN_PASSWORD=%s\n' "$(openssl rand -hex 24)" > "$dev_directory/.env"
  echo 'Created private DEV settings.'
fi

echo "Settings: $dev_directory/.env"
echo 'Panel username: admin. Read the password locally from the settings file.'
