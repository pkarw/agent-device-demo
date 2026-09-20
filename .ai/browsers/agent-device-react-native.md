# Browser provider: agent-device-react-native (native Android)

This provider implements the QA contract with agent-device on an Android emulator,
not a web browser. Expo Go 57.0.9 hosts the repository's React Native SDK 57 app.
No account, cloud build or hosted browser is used. The demo needs no credentials.

Run all operations from the repository root. The shell wrapper sources the local
Android toolchain. Use one provider at a time on `ANDROID_SERIAL` (default
`emulator-5554`); never seize another live agent-device session. A failed stale
session must be inspected and explicitly closed before retrying.

## ensure-installed

Run `sh .ai/scripts/test-env-up.sh` via om-prepare-test-env. Restore root and
`examples/react_native_counter` dependencies with `npm ci` if absent. Reuse the
existing booted emulator or start `npm run android:emulator` first. The repository
owned launcher downloads a pinned, SHA256-verified official Expo Go APK if absent,
installs it, starts offline localhost Metro on a free port, creates one ADB reverse
mapping, opens the native app and validates an accessibility snapshot plus PNG.
Readiness is never inferred from process launch alone. Linux is the supported
adapter host; missing Android tools or unsupported platforms are explicit blockers.

Outputs: `BROWSER_PROVIDER`, `BROWSER_INSTALLED`, `BROWSER_COMMAND`,
`BROWSER_VERSION`, and `TEST_ENV_*`. Read `.ai/qa/test-env.json` for the current
`exp://127.0.0.1:<port>` base URL, session, source fingerprint and owned Metro PID.
The up/down scripts are repository-owned, not generated; do not overwrite them.

## doctor

`bash .ai/scripts/react-native-device.sh doctor` checks the actual native counter
and captures a valid PNG. This is the native equivalent of browser navigation.

## open

`bash .ai/scripts/react-native-device.sh open` opens or reuses the configured app.
`--force` starts a fresh app session at zero. It accepts no arbitrary URL; the
target is the local Metro base URL bound to this worktree's Expo Go session.

## snapshot

`bash .ai/scripts/react-native-device.sh snapshot` emits accessibility JSON.
Use only references/labels observed in the latest snapshot. App nodes belong to
`host.exp.exponent`; the counter label is `Count: N` and Reset has an `enabled`
state. Re-snapshot after every mutation.

## interact

`bash .ai/scripts/react-native-device.sh interact press '<observed ref or label>' --hold-ms 1 --settle`
presses a control. `scroll` and `back` are also supported. Assert the resulting
counter; software-emulator taps can be ignored. Retry only an unchanged count,
at most five attempts, and fail on unexpected transitions.

## assert

`bash .ai/scripts/react-native-device.sh assert '<observed selector>'` waits and
returns JSON. Check the exact count and the observed Reset `enabled` property;
absence of an error alone is not evidence. Fail on ambiguous or missing nodes.

## screenshot

`bash .ai/scripts/react-native-device.sh screenshot '<output.png>'` writes a PNG
at that exact path. Validate its signature/dimensions and visually inspect it.

## close

`sh .ai/scripts/test-env-down.sh` closes this session, terminates only the recorded
Metro process after checking its command line/worktree identity, removes only its
reverse mapping and marks state stopped. It is idempotent and never shuts down
the shared emulator. Keep real credentials and unrelated screens out of evidence.
