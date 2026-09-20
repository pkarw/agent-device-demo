# React Native Android counter demo

## Goal

Create a React Native counter app on Android, automate it with agent-device and
publish screenshots through om-auto-qa-pr on a new PR.

## Scope and dependency

This PR is stacked on Flutter PR #1 (`feat/flutter-counter-reset`), which supplies
the shared Android tools and QA pipeline. The run selects that base in local
configuration; restore the normal automatic base setting before implementation
commits. After #1 merges, retarget this PR to main. Do not merge either PR.

Use the official Expo SDK 57 blank TypeScript template and matching Expo Go
57.0.9 Android runtime, pinned in manifests/lockfiles. No account or cloud build.
Add Increment and disabled-at-zero Reset with OpenMercatoCloud.com branding.
Non-goals: iOS/web support, backend, authentication, persistent state, standalone
signed production APK. This is a real React Native Android app hosted in Expo Go.

## Implementation Plan

### Phase 1: App and automation

1.1 Scaffold the app and implement/test counter behavior.
1.2 Add reproducible Android launch, QA provider and README instructions.

### Phase 2: Verification

2.1 Validate types, tests and Android bundle; run the shared gate and review.
2.2 Capture and publish real Android screenshots through om-auto-qa-pr.

## Risks

Software emulation is slow; Metro and the emulator share 8 GB memory. Keep
installation and downloads within the 10 GB disk. Private evidence requires
repository access. Independent GitHub approval is required (no self-approval).

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: App and automation

- [x] 1.1 Scaffold the app and implement/test counter behavior. — 2995380
- [x] 1.2 Add reproducible Android launch, QA provider and README instructions. — 381fc74

### Phase 2: Verification

- [x] 2.1 Validate types, tests and Android bundle; run the shared gate and review. — 6f32755
- [x] 2.2 Capture and publish real Android screenshots through om-auto-qa-pr. — 6f32755

## Verification evidence

- Full seven-command validation gate passed against `6f32755`.
- [Code review](https://github.com/pkarw/agent-device-demo/pull/2#issuecomment-5750308034): code verdict approve; GitHub rejects self-approval, so independent approval remains required.
- [Native Android QA PASS](https://github.com/pkarw/agent-device-demo/pull/2#issuecomment-5750322928): four visually inspected 540×960 screenshots, 0 → 5 → reset 0 → 1, with Reset disabled/enabled assertions. Evidence is on `qa-evidence-pr-2`, not this source branch.
- Cold launch, warm reuse, the committed screenshot regression, and idempotent teardown passed. Android emulator was reused and left running; owned Metro/session/reverse mapping were closed.
- Final plan/README evidence links are documentation-only; app and automation source remain at the reviewed and QA-tested revision above.
