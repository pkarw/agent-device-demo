#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/../../scripts/android-env.sh"
cd "$ANDROID_DEMO_ROOT/examples/flutter_counter"
flutter analyze
flutter test
