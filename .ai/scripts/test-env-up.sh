#!/bin/sh
# Repository-owned adapter around scripts/android-*.sh; invoked through the provider.
# history: 2026-09-20 Recover only the observed System UI startup ANR; app ANRs fail.
set -eu
repo_root=$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)
provider=$(node -p "require(process.argv[1]).browser.provider" "$repo_root/.ai/agentic.config.json")
if [ "$provider" = "agent-device-react-native" ]; then
  exec bash "$(dirname "$0")/react-native-device.sh" open "$@"
fi
exec bash "$(dirname "$0")/agent-device.sh" ensure-installed "$@"
