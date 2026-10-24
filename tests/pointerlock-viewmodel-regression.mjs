import { execFileSync } from "node:child_process";
execFileSync(process.execPath, ["tests/pointerlock-regression.test.cjs"], { stdio: "inherit" });
