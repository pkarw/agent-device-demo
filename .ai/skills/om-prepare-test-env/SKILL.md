# Native Android environment

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
