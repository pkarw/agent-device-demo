#!/bin/sh
set -eu
repo_root=$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)
provider=$(node -p "require(process.argv[1]).browser.provider" "$repo_root/.ai/agentic.config.json")
if [ "$provider" = "agent-device-react-native" ]; then
  exec bash "$(dirname "$0")/react-native-device.sh" close
fi
exec bash "$(dirname "$0")/agent-device.sh" close
