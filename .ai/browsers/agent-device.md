# Browser provider: agent-device (native Android)

This project intentionally maps the QA provider contract to a native Android
application, not a web browser. Use the installed Callstack agent-device 0.21.6
and the local Flutter counter APK. Never substitute a browser screenshot for
native evidence. The only allowed base URL is
`android://dev.example.flutter_counter`.

## Environment

Run from the worktree root. `scripts/android-env.sh` selects the local toolchain;
linked worktrees share the ignored `.android-demo-tools` directory and matching
lockfile dependencies. `ANDROID_SERIAL` selects the emulator (default
`emulator-5554`). Sessions are scoped to worktree and serial. No login is needed.

The repository owns `.ai/scripts/test-env-up.sh` and `test-env-down.sh`; invoke
them through om-prepare-test-env rather than replacing them. The up command
requires an already-booted emulator and a fresh APK. Before QA, build with
`bash .ai/scripts/android-build.sh` while the demo emulator is stopped, then
start `npm run android:emulator`. Follow `examples/flutter_counter/README.md`
for the existing workspace installation and resource constraints. Missing SDKs
or an unsupported host are explicit blockers, never successful installation.

## Operations

### ensure-installed

`sh .ai/scripts/test-env-up.sh` checks the pinned CLI, Android boot, APK freshness,
installation, launch, accessibility and a valid PNG. It emits
`BROWSER_PROVIDER`, `BROWSER_INSTALLED`, `BROWSER_COMMAND`, `BROWSER_VERSION`,
`BROWSER_NOTES` and `TEST_ENV_*` values. A nonzero exit is a concrete blocker.
Read values after the first `=`; never source output as shell code.

### doctor

`bash .ai/scripts/agent-device.sh doctor` checks the native session and captures
a real device screenshot; this is the native equivalent of a browser launch.

### open

`bash .ai/scripts/agent-device.sh open android://dev.example.flutter_counter`
opens or reuses the isolated session. `--force` relaunches the app at zero.
Read `.ai/qa/test-env.json` for the session, serial and artifact hash.

### snapshot

`bash .ai/scripts/agent-device.sh snapshot` returns accessibility JSON. Only
use references or labels observed in the latest snapshot; resnapshot after each
mutation. Restrict assertions to nodes belonging to the demo package.

### interact

`bash .ai/scripts/agent-device.sh interact press '<observed reference>' --hold-ms 1 --settle`
presses the observed control. Software emulation occasionally ignores a first
press; inspect the actual count and retry only an unchanged value, at most five
times. Never assume command success implies a counter transition.

### assert

`bash .ai/scripts/agent-device.sh assert 'label="<observed text>"' 60000`
waits for the condition and returns a snapshot. Check `enabled` for the observed
Reset counter node to verify disabled/active states; fail if the expected state
is absent or ambiguous. Text presence alone does not establish button state.

### screenshot

`bash .ai/scripts/agent-device.sh screenshot '<output.png>'` writes the exact
PNG path. Verify the PNG signature and dimensions before publishing.

### close

`sh .ai/scripts/test-env-down.sh` closes only this worktree's agent-device session,
marks its descriptor stopped and is idempotent. It never stops a reused emulator.

## Evidence safety

Keep generated descriptors, locks and QA artifacts ignored. Publish PNGs through
the tracker descriptor on a separate evidence branch, never the change branch.
Use demo state only; no real credentials, tokens or unrelated device screens.
