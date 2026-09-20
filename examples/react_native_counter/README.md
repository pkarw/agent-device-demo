# 📱 React Native × agent-device

An **agent-device demo on [OpenMercatoCloud.com](https://OpenMercatoCloud.com)**:
a real React Native counter running on an Android emulator inside Expo Go.
Tap Increment, reset to zero, and save native screenshots as pull-request evidence.

## 🚀 Run on Android

This workspace already contains the Android emulator and local toolchain used by
the Flutter demo. From the repository root:

```bash
npm ci
npm --prefix examples/react_native_counter ci
npm run android:emulator
# In another terminal, after Android finishes booting:
sh .ai/scripts/test-env-up.sh
```

The configured `agent-device-react-native` provider downloads official Expo Go
57.0.9 only when missing, verifies its SHA256, starts Metro in offline mode on a
free localhost port, installs Expo Go and opens this app. No Expo login, cloud
build, Android Studio GUI or browser automation is required. The native host
package is `host.exp.exponent`; this demo is not a standalone signed APK.

Use one automation session per emulator. Close a previous Flutter session with
its checkout's down script before opening the React Native demo. The adapter is
Linux-specific; it reuses the installed tools under `.android-demo-tools/`.

## 📸 Save screenshots

For the complete repeatable scenario (launch, increment, reset, four screenshots
and session cleanup), run `npm run android:react-native:screenshots`. Optional:
`npm run android:react-native:screenshots -- .ai/qa/artifacts_my-run`.

For individual provider operations on an already-open environment:

```bash
bash .ai/scripts/react-native-device.sh snapshot
# Use a label/ref from that snapshot:
bash .ai/scripts/react-native-device.sh interact press 'label="Increment"' --hold-ms 1 --settle
bash .ai/scripts/react-native-device.sh assert 'label="1"'
bash .ai/scripts/react-native-device.sh screenshot .ai/qa/artifacts_manual/counter-one.png
sh .ai/scripts/test-env-down.sh
```

`om-auto-qa-pr` uses the committed native provider descriptor to exercise initial
zero/disabled Reset, five increments/enabled Reset, reset to zero, and a subsequent
increment. Screenshots, accessibility snapshots and reports are published on a
separate evidence branch. Private-repository images require GitHub access.
Evidence-only QA does not grant approval or merge a PR.

### ✅ Published Android run

[QA report and screenshots on PR #2](https://github.com/pkarw/agent-device-demo/pull/2#issuecomment-5750322928)
verify **0 → 5 → reset to 0 → 1**, including Reset's enabled state.
The four real 540×960 captures are saved separately from source code:
[initial zero](https://github.com/pkarw/agent-device-demo/blob/qa-evidence-pr-2/pr-2/step-01-initial.png),
[five taps](https://github.com/pkarw/agent-device-demo/blob/qa-evidence-pr-2/pr-2/step-02-five.png),
[reset](https://github.com/pkarw/agent-device-demo/blob/qa-evidence-pr-2/pr-2/step-03-reset.png),
and [count again](https://github.com/pkarw/agent-device-demo/blob/qa-evidence-pr-2/pr-2/step-04-again.png).
Open these links while signed into GitHub with repository access.

## 🧪 Validate

```bash
npm --prefix examples/react_native_counter run typecheck
npm --prefix examples/react_native_counter test
npm --prefix examples/react_native_counter run bundle:android
node --test .ai/scripts/react-native-device.test.mjs
```

Counter tests cover initial/disabled state, five increments, reset, repeated reset,
increment after reset, and integer precision. Provider tests guard dependency
failures, foreign state, lock contention and idempotent teardown. The Android
bundle export is not an APK; Expo Go supplies the native runtime.

## 🧰 Versions and references

Created from the official blank TypeScript template 57.0.26. Dependencies are
locked with npm: Expo 57, React Native 0.86.3, React 19.2.3; Node 24 in this workspace.
See [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/) and
[Expo Go for Android](https://expo.dev/go?device=false&platform=android&sdkVersion=57).
The template's MIT license is retained in `LICENSE`.
