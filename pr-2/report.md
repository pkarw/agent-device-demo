## 📸 UI QA evidence — PASS

**Verified:** `feat/react-native-counter` @ `6f3275526b48b585c46c64ea943f8de33eea2a1c`; `exp://127.0.0.1:46651`; provider `agent-device-react-native`; no login.

| # / Priority | Action | Expected | Observed | Result / Evidence |
|---|---|---|---|---|
| 1 / P1 | Fresh native launch | Count 0; Reset disabled | Count 0; Reset disabled; native 540×960 PNG captured | PASS · [Screenshot](https://github.com/pkarw/agent-device-demo/blob/qa-evidence-pr-2/pr-2/step-01-initial.png) |
| 2 / P1 | Tap Increment five times; assert each transition | Count 5; Reset enabled | Count 5; Reset enabled; native 540×960 PNG captured | PASS · [Screenshot](https://github.com/pkarw/agent-device-demo/blob/qa-evidence-pr-2/pr-2/step-02-five.png) |
| 3 / P1 | Tap Reset counter | Count 0; Reset disabled | Count 0; Reset disabled; native 540×960 PNG captured | PASS · [Screenshot](https://github.com/pkarw/agent-device-demo/blob/qa-evidence-pr-2/pr-2/step-03-reset.png) |
| 4 / P1 | Increment after reset | Count 1; Reset enabled | Count 1; Reset enabled; native 540×960 PNG captured | PASS · [Screenshot](https://github.com/pkarw/agent-device-demo/blob/qa-evidence-pr-2/pr-2/step-04-again.png) |

- Real Android 11/API 30 software emulator; Expo Go 57.0.9 hosts React Native 0.86.3. No browser used.
- All four PNGs were visually inspected: values 0/5/0/1 and disabled/enabled Reset match the native snapshots; the Expo tutorial does not cover the app.
- Evidence only, not QA sign-off or GitHub approval. Independent review is required.
- Not exercised: physical devices, iOS, rotation, standalone production APK.
- Private repository: screenshot links require GitHub access.

Local artifacts: `/tmp/qa-pr-2-20260920`. Automated UI regression: `npm run android:react-native:screenshots`.
