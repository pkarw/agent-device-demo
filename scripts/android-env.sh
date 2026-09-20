#!/usr/bin/env bash
# Source this file to use the workspace-local Android and Flutter toolchain.
ANDROID_DEMO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export ANDROID_HOME="$ANDROID_DEMO_ROOT/.android-demo-tools/android-sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export ANDROID_AVD_HOME="${ANDROID_AVD_HOME:-$HOME/.android/avd}"
export JAVA_HOME="$ANDROID_DEMO_ROOT/.android-demo-tools/java"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_DEMO_ROOT/.android-demo-tools/flutter/bin:$ANDROID_DEMO_ROOT/node_modules/.bin:$PATH"
if [[ -x "$ANDROID_DEMO_ROOT/.android-demo-tools/emulator-35/emulator/emulator" ]]; then
  export PATH="$ANDROID_DEMO_ROOT/.android-demo-tools/emulator-35/emulator:$PATH"
fi
if [[ -n "${SSL_CERT_FILE:-}" ]]; then
  export FLUTTER_TOOL_ARGS="--root-certs-file=$SSL_CERT_FILE"
fi
if [[ -n "${HTTPS_PROXY:-}" ]]; then
  read -r ANDROID_PROXY_HOST ANDROID_PROXY_PORT < <(node -e 'const u = new URL(process.env.HTTPS_PROXY); console.log(u.hostname, u.port || 80)')
  export GRADLE_OPTS="${GRADLE_OPTS:-} -Dhttps.proxyHost=$ANDROID_PROXY_HOST -Dhttps.proxyPort=$ANDROID_PROXY_PORT -Dhttp.proxyHost=$ANDROID_PROXY_HOST -Dhttp.proxyPort=$ANDROID_PROXY_PORT -Dhttp.nonProxyHosts=localhost"
fi
