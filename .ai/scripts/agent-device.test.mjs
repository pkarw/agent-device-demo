import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const provider = new URL("./agent-device.mjs", import.meta.url);

function fixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), "device-provider-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const put = (file, content, mode) => {
    const target = path.join(root, file);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, content, { mode });
  };
  put(".ai/agentic.config.json", JSON.stringify({ paths: { qa: ".ai/qa" } }));
  put("examples/flutter_counter/lib/main.dart", "source");
  put("examples/flutter_counter/android/build.gradle.kts", "android build");
  put("examples/flutter_counter/pubspec.yaml", "name: test");
  put("examples/flutter_counter/pubspec.lock", "packages: {}");
  put("examples/flutter_counter/build/app/outputs/flutter-apk/app-release.apk", "test-only apk");
  put("bin/adb", "#!/bin/sh\nprintf '%s\\n' \"${FAKE_BOOT:-1}\"\n", 0o755);
  put("node_modules/.bin/agent-device", `#!/usr/bin/env node
import { appendFileSync, writeFileSync } from 'node:fs';
const args = process.argv.slice(2);
appendFileSync('calls.jsonl', JSON.stringify(args) + '\\n');
if (args[0] === 'open' && process.env.FAKE_ALERT) console.log('[button] "Close app"\\n[button] "Wait"');
else if (args[0] === 'alert' && args[1] === 'get') console.log(JSON.stringify({data:{alert:{title:process.env.FAKE_ALERT}}}));
else if (args[0] === 'screenshot') writeFileSync(args[1], Buffer.from([137,80,78,71,13,10,26,10]));
else if (args[0] === '--version') console.log('0.21.6');
else console.log(JSON.stringify({ success: true }));
`, 0o755);
  copyFileSync(provider, path.join(root, "provider.mjs"));
  return {
    root, put,
    run(operation, args = [], env = {}) {
      return spawnSync(process.execPath, ["provider.mjs", operation, ...args], {
        cwd: root, encoding: "utf8", timeout: 10000,
        env: { ...process.env, ANDROID_SERIAL: "emulator-test", PATH: `${root}/bin:${process.env.PATH}`, ...env },
      });
    },
    state() { return JSON.parse(readFileSync(path.join(root, ".ai/qa/test-env.json"))); },
    calls() { return readFileSync(path.join(root, "calls.jsonl"), "utf8").trim().split("\n").map(JSON.parse); },
  };
}

test("cold install, warm reuse and idempotent session-only close", (t) => {
  const f = fixture(t);
  const cold = f.run("ensure-installed");
  assert.equal(cold.status, 0, cold.stderr);
  assert.match(cold.stdout, /TEST_ENV_REUSED=0/);
  assert.equal(f.state().device.ownedEmulator, false);
  const warm = f.run("ensure-installed");
  assert.equal(warm.status, 0, warm.stderr);
  assert.match(warm.stdout, /TEST_ENV_REUSED=1/);
  assert.equal(f.calls().filter(([command]) => command === "install").length, 1);
  assert.equal(f.run("close").status, 0);
  assert.equal(f.run("close").status, 0);
  assert.equal(f.state().status, "stopped");
  assert.equal(f.calls().filter(([command]) => command === "close").length, 1);
});

test("changed source invalidates a cached APK", (t) => {
  const f = fixture(t);
  assert.equal(f.run("ensure-installed").status, 0);
  f.put("examples/flutter_counter/lib/main.dart", "changed source");
  const result = f.run("ensure-installed");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /APK missing or stale/);
});

test("first use rejects an APK older than its source", (t) => {
  const f = fixture(t);
  utimesSync(path.join(f.root, "examples/flutter_counter/lib/main.dart"), new Date(), new Date(Date.now() + 10000));
  assert.match(f.run("ensure-installed").stderr, /APK missing or stale/);
});

test("missing CLI, unbooted device and foreign URL fail closed", (t) => {
  const f = fixture(t);
  assert.match(f.run("open", ["https://example.com"]).stderr, /only the Flutter counter/);
  assert.match(f.run("ensure-installed", [], { FAKE_BOOT: "0" }).stderr, /not ready/);
  rmSync(path.join(f.root, "node_modules/.bin/agent-device"));
  assert.match(f.run("ensure-installed").stderr, /agent-device is missing/);
  assert.equal(existsSync(path.join(f.root, ".ai/qa/test-env.lock")), false);
});

test("an existing lock is preserved, never silently removed", (t) => {
  const f = fixture(t);
  f.put(".ai/qa/test-env.lock/owner.json", JSON.stringify({ pid: process.pid }));
  assert.match(f.run("close").stderr, /Another environment operation holds/);
  assert.equal(existsSync(path.join(f.root, ".ai/qa/test-env.lock/owner.json")), true);
});

test("only the known emulator System UI ANR is recovered", (t) => {
  const f = fixture(t);
  const result = f.run("ensure-installed", [], { FAKE_ALERT: "System UI isn't responding" });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(f.calls().filter(([command, action]) => command === "alert" && action === "dismiss").length, 1);
});

test("an app ANR fails without dismissing the evidence", (t) => {
  const f = fixture(t);
  const result = f.run("ensure-installed", [], { FAKE_ALERT: "Flutter counter isn't responding" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Android alert blocks the app/);
  assert.equal(f.calls().some(([command, action]) => command === "alert" && action === "dismiss"), false);
});
