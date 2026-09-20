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

- [ ] 1.1 Scaffold the app and implement/test counter behavior.
- [ ] 1.2 Add reproducible Android launch, QA provider and README instructions.

### Phase 2: Verification

- [ ] 2.1 Validate types, tests and Android bundle; run the shared gate and review.
- [ ] 2.2 Capture and publish real Android screenshots through om-auto-qa-pr.
