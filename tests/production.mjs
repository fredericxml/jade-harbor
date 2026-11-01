import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const server = process.env.PRODUCTION_URL
  ? null
  : spawn(
      process.execPath,
      [
        "node_modules/vite/bin/vite.js",
        "preview",
        "--host",
        "127.0.0.1",
        "--port",
        "4175",
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
let browser;
try {
  if (server)
    await new Promise((resolve, reject) => {
      server.stdout.on("data", (d) => {
        if (d.toString().includes("Local:")) resolve();
      });
      server.on("error", reject);
      server.on("exit", (c) => reject(new Error("preview exited " + c)));
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
  const page = await browser.newPage({ viewport: { width: 960, height: 700 } }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
  });
  await page.goto(process.env.PRODUCTION_URL ?? "http://127.0.0.1:4175");
  await page.locator('[data-action="settings"]').click();
  assert.equal(await page.locator('#graphicsQuality').inputValue(),"medium","fresh production uses balanced quality");
  for(const quality of["high","medium","low","medium"]){
    await page.selectOption('#graphicsQuality',quality);
    await page.waitForFunction(q=>{const c=document.querySelector('canvas'),cap={high:1.6,medium:1.25,low:1}[q],scale={high:1,medium:.88,low:.7}[q],ratio=Math.min(devicePixelRatio,Math.max(.25,Math.min(devicePixelRatio,cap)*scale));return c.width===Math.floor(innerWidth*ratio)&&c.height===Math.floor(innerHeight*ratio);},quality);
    const result=await page.evaluate(()=>{const c=document.querySelector('canvas'),r=c.getBoundingClientRect(),gl=c.getContext('webgl2');return{css:[r.width,r.height],buffer:[gl.drawingBufferWidth,gl.drawingBufferHeight],dpr:devicePixelRatio};});
    const cap={high:1.6,medium:1.25,low:1}[quality],scale={high:1,medium:.88,low:.7}[quality],ratio=Math.min(result.dpr,Math.max(.25,Math.min(result.dpr,cap)*scale));
    assert.deepEqual(result.css,[960,700]);assert.deepEqual(result.buffer,[Math.floor(960*ratio),Math.floor(700*ratio)]);
  }
  await page.locator('[data-action="back"]').click();
  await page.locator('[data-action="new"]').click();
  await page.locator("#world-name").fill("Production smoke");
  await page.locator('[data-action="create"]').click();
  await page.waitForFunction(() => !!document.pointerLockElement);
  await page.locator(".location strong").waitFor();
  assert.equal(
    await page.evaluate(() => window.__game),
    undefined,
    "dev test hook is absent in production",
  );
  assert.equal(
    await page.evaluate(() =>
      document.querySelector("canvas").getContext("webgl2").isContextLost(),
    ),
    false,
    "production has a live WebGL2 context",
  );
  await page.keyboard.press("KeyE");
  await page.getByPlaceholder("Find a block or item…").fill("lantern");
  await page.locator('.catalog-item[title="Festival lantern"]').click();
  await page.keyboard.press("KeyE");
  await page.waitForFunction(() => !!document.pointerLockElement);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Save & return home" }).click();
  await page.reload();
  await page.getByRole("button", { name: /Production smoke/ }).click();
  await page
    .locator(".held-name")
    .filter({ hasText: "Festival lantern" })
    .waitFor();
  assert.deepEqual(errors, []);
  const result = {
    status: "passed",
    checks: [
      "production bundle loads",
      "production preset selector changes actual WebGL buffers while retaining CSS size",
      "WebGL2 context active",
      "dev hook absent",
      "world creation and pointer lock",
      "creative selection survives saved-world reload",
      "no page errors or failed asset responses",
    ],
    errors,
  };
  await mkdir("test-results", { recursive: true });
  await writeFile(
    "test-results/production-results.json",
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser?.close();
  server?.kill();
}
