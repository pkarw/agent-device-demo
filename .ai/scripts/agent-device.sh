#!/usr/bin/env bash
# Reuse the repository's Android toolchain and running emulator.
set -euo pipefail
source "$(dirname "$0")/../../scripts/android-env.sh"
cd "$ANDROID_DEMO_ROOT"
exec node .ai/scripts/agent-device.mjs "$@"
