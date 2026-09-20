## 📸 UI QA evidence — PASS

**Verdict:** ✅ PASS — the real Android Flutter app increments, resets to zero,
and increments again. Reset's accessibility state is disabled exactly at zero.
**Verified:** `feat/flutter-counter-reset` @ `5c6c159`;
`android://dev.example.flutter_counter`, demo/no login, `agent-device` 0.21.6.

| # / Priority | Action | Expected | Observed | Result / Evidence |
|---|---|---|---|---|
| 1 / P1 | Open app | 0; Reset disabled | Count 0, enabled=false | [PASS: initial](https://github.com/pkarw/agent-device-demo/blob/qa-evidence-pr-1/pr-1/step-01-initial-zero.png) |
| 2 / P1 | Increment five times | 5; Reset enabled | Each transition checked; count 5, enabled=true | [PASS: five](https://github.com/pkarw/agent-device-demo/blob/qa-evidence-pr-1/pr-1/step-02-five-increments.png) |
| 3 / P1 | Press Reset | 0; Reset disabled | Count 0, enabled=false | [PASS: reset](https://github.com/pkarw/agent-device-demo/blob/qa-evidence-pr-1/pr-1/step-03-reset-zero.png) |
| 4 / P1 | Increment after reset | 1; Reset enabled | Count 1, enabled=true | [PASS: increment again](https://github.com/pkarw/agent-device-demo/blob/qa-evidence-pr-1/pr-1/step-04-increment-after-reset.png) |

### Environment and limits

Android 11/API 30 x86_64, 540×960, software emulator, release APK 16.9 MB.
APK SHA256: `fc149d585a03e736caa3962106db7202f67188e9bfbef9ccc7c8863c25c85026`.
The provider's cold and warm launch passed; warm launch reused its session.
The known emulator System UI startup ANR was recovered before testing; app ANRs
are not suppressed. Screenshots and accessibility assertions were both checked.

Private-repository images are linked instead of embedded: inline rendering is
unavailable without authentication. Local PNGs, snapshots, command log and JSON
report: `/tmp/qa-pr-1-20260920/`. Evidence lives on a separate branch, not the
change branch. Physical devices, rotation, other Android versions and iOS were
not exercised. Unit tests cover repeated reset; no dedicated Reset E2E test ships
yet. Evidence-only: no QA sign-off or GitHub approval is granted. Labels are disabled.
