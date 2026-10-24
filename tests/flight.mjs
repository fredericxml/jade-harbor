import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const server = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "4178"],
  { stdio: ["ignore", "pipe", "pipe"] },
);
let browser;
try {
  await new Promise((ok, fail) => {
    server.stdout.on("data", (b) => {
      if (b.toString().includes("Local:")) ok();
    });
    server.on("error", fail);
    server.on("exit", (c) => fail(Error("server " + c)));
  });
  browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--disable-dev-shm-usage",
    ],
  });
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:4178");
  await page.getByRole("button", { name: "Create a world" }).click();
  await page.getByRole("button", { name: "Enter your world" }).click();
  await page.waitForFunction(
    () => window.__game?.active && window.__game.input.locked,
  );
  await page.keyboard.press("Escape");
  await page.locator("#change-mode").selectOption("spectator");
  await page.getByRole("button", { name: "Return to world" }).click();
  await page.waitForFunction(
    () => window.__game.mode === "spectator" && window.__game.input.locked,
  );
  const y = await page.evaluate(() => window.__game.body.position.y);
  await page.keyboard.down("Space");
  await page.waitForFunction((y) => window.__game.body.position.y > y + 3, y);
  await page.keyboard.up("Space");
  const high = await page.evaluate(() => window.__game.body.position.y);
  await page.keyboard.down("ControlLeft");
  await page.waitForFunction(
    (y) => window.__game.body.position.y < y - 2,
    high,
  );
  await page.keyboard.up("ControlLeft");
  const before = await page.evaluate(() => ({
    ...window.__game.body.position,
  }));
  await page.keyboard.down("KeyW");
  await page.waitForFunction(
    (p) =>
      Math.hypot(
        window.__game.body.position.x - p.x,
        window.__game.body.position.z - p.z,
      ) > 2,
    before,
  );
  await page.keyboard.up("KeyW");
  assert.deepEqual(errors, []);
  const result = {
    status: "passed",
    checks: [
      "Spectator selected through Pause UI",
      "Space ascends at least 3 blocks",
      "Control descends at least 2 blocks",
      "W flies forward at least 2 blocks",
    ],
    errors,
  };
  await writeFile(
    "test-results/flight-results.json",
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser?.close();
  server.kill();
}
