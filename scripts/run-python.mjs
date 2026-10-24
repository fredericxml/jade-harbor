// Cross-platform Python launcher for release scripts (Windows often uses `python`, not `python3`).
import { spawnSync } from "node:child_process";
const [script, ...args] = process.argv.slice(2);
if (!script) throw new Error("Usage: node scripts/run-python.mjs <script.py> [...args]");
const candidates = process.platform === "win32" ? ["python", "py"] : ["python3", "python"];
for (const command of candidates) {
  const probe = spawnSync(command, ["-c", "import sys"], { stdio: "ignore" });
  if (probe.status !== 0) continue;
  const result = spawnSync(command, [script, ...args], { stdio: "inherit" });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}
throw new Error(`Python is required. Tried: ${candidates.join(", ")}`);
