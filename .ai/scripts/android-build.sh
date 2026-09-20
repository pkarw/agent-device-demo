#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/../../scripts/android-env.sh"
cd "$ANDROID_DEMO_ROOT/examples/flutter_counter"
# The small workspace cannot reliably build an APK while emulating Android.
if adb devices | awk 'NR > 1 && $2 == "device" { found=1 } END { exit !found }'; then
  echo 'Stop the Android emulator before building, then restart it with npm run android:emulator.' >&2
  exit 1
fi
flutter build apk --debug --target-platform android-x64
(cd android && ./gradlew --stop)
# The next up run checks all build inputs before adopting this APK.
node -e 'require("node:fs").rmSync(process.argv[1], {force:true})' "$ANDROID_DEMO_ROOT/.ai/qa/test-env-build-cache.json"
