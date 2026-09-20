# Flutter counter screenshots on Android

This is Flutter's generated counter demo. The automation uses
[Callstack agent-device](https://github.com/callstack/agent-device) to install the
APK, launch it, tap the accessible **Increment** button five times, verify the
counter, and save screenshots at **0**, **1**, and **5**.

The demo also has a **Reset counter** button. It is disabled at zero, enabled
after incrementing, and returns the count to zero without restarting the app.

## PR screenshot QA

The OM pipeline uses `agent-device` directly on Android (not a browser). Stop the
demo emulator, then run `bash .ai/scripts/android-build.sh` to build its small
x86_64 release APK. Restart with `npm run android:emulator` and wait for Android
to boot. `sh .ai/scripts/test-env-up.sh` installs and opens the fresh release APK;
`sh .ai/scripts/test-env-down.sh` closes only its automation session.

The provider descriptor is `.ai/browsers/agent-device.md`. `om-auto-qa-pr`
captures initial zero/disabled, incremented/enabled, reset zero/disabled, and
increment-after-reset states. It publishes evidence on a separate branch; private
repository screenshots require GitHub access. QA evidence does not grant a
review or merge approval. The original debug screenshot runner below still uses
`app-debug.apk`, so rebuild that APK separately when using it after source edits.

## Run in this workspace

The Android and Flutter tools are already installed locally. From `/workspace`,
start the emulator in one terminal if it isn't already running:

```bash
npm run android:emulator
```

Then run the automation in another terminal:

```bash
npm run android:screenshots
```

The script waits up to 10 minutes for Android to boot. Each run creates a new
timestamped directory under `artifacts/android-counter/` containing three PNGs,
three accessibility snapshots, `commands.json`, and `manifest.json`. A nonzero
exit status means a command, counter assertion, PNG validation, or cleanup failed.
The app is relaunched before each run, resetting the in-memory counter to zero.
Presses use an explicit 1 ms duration. The software emulator can interpret slower
input as a tooltip long-press. The script reads the actual counter after each
press and retries unchanged values up to five times; unexpected values fail.

An optional output directory and device serial can be provided:

```bash
ANDROID_SERIAL=emulator-5554 npm run android:screenshots -- artifacts/my-run
```

Use a fresh output directory to retain earlier evidence. The demo APK is built
for Android x86_64, matching the emulator; rebuild for another ABI before using
a different device.

## Build after changing the demo

```bash
source scripts/android-env.sh
cd examples/flutter_counter
flutter build apk --debug --target-platform android-x64
```

The APK is `build/app/outputs/flutter-apk/app-debug.apk`. On this small container,
stop the emulator before rebuilding, then stop Gradle with `cd android &&
./gradlew --stop` before restarting the emulator. Building and emulating together
can exceed the container's 8 GB memory limit. Regenerable Gradle caches and build
intermediates may also need cleanup to fit within the 10 GB workspace disk.

## Installed toolchain

- Node 24 and project-local `agent-device` 0.21.6.
- Flutter 3.47.5 / Dart 3.13.4.
- Temurin Java 17, Android platform/build tools 36, and NDK 28.2.13676358.
- Android 11 (API 30) x86_64 emulator image, AVD `flutter_counter`, 540 × 960.
- Emulator 35.2.10, which runs without KVM in this container. Version 37 crashed
  while probing the inaccessible KVM device.

SDKs live under the ignored `.android-demo-tools/` directory. The AVD configuration
is in `$HOME/.android/avd/`; its sparse data image is under `.android-demo-tools/`.
`scripts/android-env.sh` puts the tools on PATH. This container uses a network CA:
the local JDK trusts it, and the local Dart launcher supplies `SSL_CERT_FILE` to
both Dart and its precompiled package-manager runtime. Certificate verification
remains enabled.

## Automation commands

The runnable script adds the selected serial/session and logs each command. Its
core workflow is:

```bash
agent-device install examples/flutter_counter/build/app/outputs/flutter-apk/app-debug.apk --platform android
agent-device open dev.example.flutter_counter --platform android --relaunch --foreground
agent-device wait 'label="0"' 60000
agent-device screenshot artifacts/counter-zero.png
agent-device press 'label="Increment"' --hold-ms 1 --settle
agent-device wait 'label="1"' 60000
agent-device screenshot artifacts/counter-one.png
# Four more presses, followed by a label="5" assertion and screenshot.
agent-device close
```

See `scripts/android-screenshots.mjs` for the complete workflow and
[agent-device's commands](https://oss.callstack.com/agent-device/docs/commands)
for additional automation options.
