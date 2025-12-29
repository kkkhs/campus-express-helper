#!/usr/bin/env bash
set -euo pipefail
ENV_ID="${1:-${ENV_ID:-}}"
if [ -z "$ENV_ID" ]; then echo "Usage: ./init_db.sh <envId>"; exit 1; fi
collections=(users tasks orders reviews admins complaints)
if command -v cloudbase >/dev/null 2>&1; then CLI="cloudbase"; else echo "Error: please install @cloudbase/cli"; exit 1; fi
if [ -f "cloudbaserc" ]; then
  sed -i.bak -E "s/\"envId\"\s*:\s*\"[^\"]+\"/\"envId\": \"$ENV_ID\"/" cloudbaserc || true
else
  printf '{\n  "envId": "%s"\n}\n' "$ENV_ID" > cloudbaserc
fi
create_collection() { name="$1"; set +e; cloudbase database:create --collection "$name" && return 0; cloudbase database:create -c "$name" && return 0; echo "skip $name"; }
for c in "${collections[@]}"; do create_collection "$c"; done
echo "Done: collections ensured in env $ENV_ID"
