#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/android-env.sh"

ANDROID_ACCEL=auto
if [[ ! -r /dev/kvm || ! -w /dev/kvm ]]; then
  ANDROID_ACCEL=off
fi

exec emulator -avd flutter_counter \
  -data "$ANDROID_DEMO_ROOT/.android-demo-tools/android-userdata.img" \
  -no-window -no-audio -no-boot-anim -no-snapshot -no-metrics \
  -accel "$ANDROID_ACCEL" -gpu swiftshader_indirect \
  -memory 2048 -cores 2 -camera-back none -camera-front none
