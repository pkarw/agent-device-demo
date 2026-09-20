#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/../../scripts/android-env.sh"
cd "$ANDROID_DEMO_ROOT"
exec node .ai/scripts/react-native-device.mjs "$@"
