# Flutter counter reset demo

## Goal

Add an accessible Reset counter control to the Android Flutter demo, open a PR,
and publish real agent-device screenshots through om-auto-qa-pr.

## Scope

Preserve Increment and the application ID. Reset is disabled at zero and returns
any positive count to zero. Include widget tests and the existing local pipeline
configuration with completed GitHub/native-device descriptors. Carry forward the
requested OpenMercatoCloud.com README. Labels remain disabled as configured.

Non-goals: redesigning the app, persistence, changing the web app, merging the PR.
The requested React Native demo will be a separate subsequent PR.

## Implementation Plan

### Phase 1: Implementation

1.1 Complete the configured pipeline descriptors and publish the demo README.
1.2 Add Reset counter and regression tests.

### Phase 2: Verification

2.1 Run the configured gate, build Android, and review the PR; hand off native
screenshots to om-auto-qa-pr without changing the reviewed source.

## Risks

Software Android emulation is slow. Build with the emulator stopped to fit memory.
Private GitHub screenshot links require repository access. GitHub does not permit
the PR author to approve their own PR; independent approval remains required.

## Progress

PR: #1

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Implementation

- [x] 1.1 Complete the configured pipeline descriptors and publish the demo README. — 0f8ae78
- [x] 1.2 Add Reset counter and regression tests. — 5db785c

### Phase 2: Verification

- [x] 2.1 Run the configured gate, build Android, and review the PR. — 925f6df

Validation passed: ESLint, five provider tests, Flutter analysis, three widget
tests, Next production build, and Android x86_64 release build (16.9 MB).
Review found no blocking code issues; GitHub refused author self-approval.
Evidence-only om-auto-qa-pr follows on this exact source. Labels remain disabled.
