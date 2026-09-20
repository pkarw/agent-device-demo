# Native Android environment

When `browser.provider` is `agent-device-react-native`, use the matching
`.ai/browsers/agent-device-react-native.md` descriptor. The same repository-owned
up/down entrypoints dispatch to the React Native adapter. Its base URL is the
recorded local Expo `exp://` URI; its descriptor owns Metro and one ADB reverse
mapping, but never the emulator. Verify cold and warm runs via the scripts and
close with the down script. No Flutter APK build is needed for this provider.
Expo SDK 57 rejects combining `--offline` and `--localhost`; the launcher uses
`--localhost` with `EXPO_OFFLINE=1`, and reuses a matching installed
Expo Go version instead of reinstalling it on every cold app launch.
Metro prefers IPv4 (`--dns-result-order=ipv4first`) so localhost readiness and
ADB reverse use the same interface. `EXPO_UNSTABLE_HEADLESS=1` avoids installing
desktop React Native DevTools in this GUI-less container.
The launcher dismisses only the observed Expo Go developer-menu tutorial and
its ensuing menu, using the bounds from a fresh native snapshot. Arbitrary
dialogs are not accepted.

Read and follow the installed `om-prepare-test-env` skill. This repository owns
the unmarked `.ai/scripts/test-env-up.sh` and `test-env-down.sh` entrypoints;
run those unchanged in auto/reuse mode. No database or ephemeral services exist.
Read `.ai/browsers/agent-device.md` for the native Android provider and build
preconditions. The `baseUrl` is an Android application URI, not an HTTP endpoint.

The app session is isolated by worktree and serial; the existing emulator is not
owned by the up script. Always close the session after QA, leaving a reused
emulator running. Never install an APK without proving its source freshness.

After a software-emulator cold boot, the provider dismisses only the exact
`System UI isn't responding` alert before its accessibility health check.
Other alerts fail and are never treated as a passing app launch. Re-run
`sh .ai/scripts/test-env-up.sh` to verify recovery, then run it once more to prove
warm reuse. A failed prior checkout can retain a device session: inspect its
descriptor and running processes before closing that exact stale session.
