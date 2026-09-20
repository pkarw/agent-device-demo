#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/android-env.sh"
cd "$ANDROID_DEMO_ROOT"
node scripts/android-screenshots.mjs "$@"
