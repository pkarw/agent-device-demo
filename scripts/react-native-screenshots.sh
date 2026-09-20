#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/android-env.sh"
cd "$ANDROID_DEMO_ROOT"
trap 'sh .ai/scripts/test-env-down.sh' EXIT
sh .ai/scripts/test-env-up.sh --force
node scripts/react-native-screenshots.mjs "$@"
