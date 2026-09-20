import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { setTimeout } from "node:timers/promises";

const serial = process.env.ANDROID_SERIAL || "emulator-5554";
const session = `flutter-counter-${process.pid}`;
const output = path.resolve(process.argv[2] || `artifacts/android-counter/${new Date().toISOString().replaceAll(":", "-")}`);
const cli = path.resolve("node_modules/.bin/agent-device");
const apk = path.resolve("examples/flutter_counter/build/app/outputs/flutter-apk/app-debug.apk");
const screenshots = [];
const log = [];
let openAttempted = false;
mkdirSync(output, { recursive: true });

function run(...args) {
  const command = [...args, "--platform", "android", "--serial", serial, "--session", session];
  console.log(`agent-device ${command.join(" ")}`);
  const result = spawnSync(cli, command, { encoding: "utf8", timeout: 600_000, maxBuffer: 10 * 1024 * 1024 });
  log.push({ command, status: result.status, stdout: result.stdout, stderr: result.stderr });
  writeFileSync(path.join(output, "commands.json"), JSON.stringify(log, null, 2));
  if (result.stdout && (!args.includes("--json") || result.status !== 0)) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`agent-device ${args[0]} failed (${result.status})`);
  return result.stdout;
}

function capture(name, count) {
  run("wait", `label="${count}"`, "60000");
  const filename = path.join(output, `${name}.png`);
  run("screenshot", filename);
  const png = readFileSync(filename);
  if (!png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    throw new Error(`Invalid PNG: ${filename}`);
  }
  screenshots.push({ file: path.basename(filename), counter: count, width: png.readUInt32BE(16), height: png.readUInt32BE(20) });
  writeFileSync(path.join(output, `${name}.json`), run("snapshot", "--json"));
}

function increment(expected) {
  // A slow software emulator may interpret a touch as a tooltip long-press.
  // Read the actual counter before retrying so we never intentionally over-tap.
  for (let attempt = 0; attempt < 5; attempt++) {
    run("press", 'label="Increment"', "--hold-ms", "1", "--settle");
    const snapshot = JSON.parse(run("snapshot", "--json"));
    const counter = snapshot.data.nodes.find((node) => node.bundleId === "dev.example.flutter_counter" && /^\d+$/.test(node.label || ""));
    const value = Number(counter?.label);
    if (value === expected) return;
    if (value !== expected - 1) throw new Error(`Expected counter ${expected}, found ${counter?.label}`);
    console.log(`Touch did not increment the counter; retrying (${attempt + 1}/5).`);
  }
  throw new Error(`Counter did not reach ${expected} after five verified touch attempts.`);
}

try {
  console.log(`Waiting for Android ${serial} to finish booting...`);
  const deadline = Date.now() + 600_000;
  while (true) {
    const boot = spawnSync("adb", ["-s", serial, "shell", "getprop", "sys.boot_completed"], { encoding: "utf8", timeout: 10_000 });
    if (boot.status === 0 && boot.stdout.trim() === "1") break;
    if (Date.now() >= deadline) throw new Error(`Android ${serial} did not finish booting within 10 minutes. Run npm run android:emulator first.`);
    await setTimeout(2000);
  }
  run("install", apk);
  openAttempted = true;
  const initial = run("open", "dev.example.flutter_counter", "--relaunch", "--foreground", "--timeout", "300000");
  // Recover only the observed emulator System UI startup dialog, not app ANRs.
  if (initial.includes('[button] "Close app"') && initial.includes('[button] "Wait"')) {
    const alert = JSON.parse(run("alert", "get", "--json"));
    if (alert.data?.alert?.title === "System UI isn't responding") {
      run("alert", "dismiss");
    } else {
      throw new Error(`Android alert blocks the app: ${alert.data?.alert?.title}`);
    }
  }
  capture("01-counter-zero", 0);
  increment(1);
  capture("02-counter-one", 1);
  for (let count = 2; count <= 5; count++) {
    increment(count);
  }
  capture("03-counter-five", 5);
  writeFileSync(path.join(output, "manifest.json"), JSON.stringify({ platform: "android", app: "dev.example.flutter_counter", serial, screenshots }, null, 2));
  console.log(`Screenshots verified and saved to ${output}`);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  if (openAttempted) {
    try { run("close"); } catch (error) {
      console.error(`Session cleanup failed: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
