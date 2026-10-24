import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
const server = process.env.GAME_URL
  ? null
  : spawn(
      process.execPath,
      [
        "node_modules/vite/bin/vite.js",
        "--host",
        "127.0.0.1",
        "--port",
        "4174",
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
if (server)
  await new Promise((resolve, reject) => {
    server.stdout.on("data", (d) => {
      if (d.toString().includes("Local:")) resolve();
    });
    server.on("error", reject);
    server.on("exit", (c) => reject(new Error("test server exited " + c)));
  });
await mkdir("test-results", { recursive: true });
let browser;
try {
  browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--disable-dev-shm-usage",
    ],
  });
} catch (error) {
  server?.kill();
  throw error;
}
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (
    m.type() === "error" &&
    /THREE.WebGL|Shader Error|WebGL.*CONTEXT_LOST/.test(m.text())
  )
    errors.push(m.text());
});
try {
  await page.goto(process.env.GAME_URL ?? "http://127.0.0.1:4174/");
  await page.getByRole("button", { name: "Create a world" }).waitFor();
  await page.waitForFunction(() => window.__game?.view.groups.size > 65);
  await page.screenshot({ path: "test-results/menu.png" });
  await page.getByRole("button", { name: "Create a world" }).click();
  await page.locator("#world-name").fill("QA Jade Harbor");
  await page.getByRole("button", { name: "Enter your world" }).click();
  await page.waitForFunction(() => window.__game?.active);
  await page.waitForFunction(
    () =>
      window.__game.world.pending.size === 0 &&
      window.__game.view.groups.size > 65,
  );
  await page.waitForTimeout(500);
  assert(
    await page.evaluate(() => !!document.pointerLockElement),
    "pointer lock acquired",
  );
  await page.screenshot({ path: "test-results/gameplay.png" });
  await page.setViewportSize({ width: 960, height: 600 });
  const before = await page.evaluate(() => window.__game.body.position.z);
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(700);
  await page.keyboard.up("KeyW");
  const after = await page.evaluate(() => window.__game.body.position.z);
  assert(after < before - 1, "W moves the player");
  // Fixture points the camera at a nearby ground block; mining and placing use real mouse input.
  await page.mouse.move(480, 300);
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    window.__game.input.onLook = undefined;
    window.__game.yaw = 0;
    window.__game.pitch = -0.85;
    window.__game.body.velocity.x = 0;
    window.__game.body.velocity.z = 0;
  });
  await page.waitForFunction(
    () => window.__game.hit && window.__game.pitch < -0.5,
  );

  const hit = await page.evaluate(() => window.__game.hit);
  assert(hit, "ground raycast");
  await page.mouse.down({ button: "left" });
  await page.waitForFunction(
    (h) => window.__game.world.get(h.x, h.y, h.z) === 0,
    hit,
    { timeout: 5000 },
  );
  await page.mouse.up({ button: "left" });
  assert.equal(
    await page.evaluate((h) => window.__game.world.get(h.x, h.y, h.z), hit),
    0,
    "mouse mines targeted terrain",
  );
  await page.waitForTimeout(250);
  await page.mouse.click(480, 300, { button: "right" });
  await page.waitForFunction(() =>
    Object.values(Object.fromEntries(window.__game.world.edits)).includes(9),
  );
  const edits = await page.evaluate(() =>
    Object.fromEntries(window.__game.world.edits),
  );
  assert(
    Object.values(edits).includes(9),
    "right mouse places selected vermilion block",
  );
  await page.keyboard.press("KeyE");
  await page.getByPlaceholder("Find a block or item…").fill("lantern");
  await page.getByRole("button", { name: "Festival lantern" }).click();
  assert.equal(
    await page.evaluate(() => window.__game.inventory.held.id),
    14,
    "creative catalog changes hotbar",
  );
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(150);
  const savedEdits = await page.evaluate(async () => {
    window.__game.pause();
    await window.__game.save();
    return Object.fromEntries(window.__game.world.edits);
  });
  await page.reload();
  await page.getByRole("button", { name: /QA Jade Harbor/ }).click();
  await page.waitForFunction(() => window.__game?.active);
  const restored = await page.evaluate(() =>
    Object.fromEntries(window.__game.world.edits),
  );
  assert.deepEqual(restored, savedEdits, "edits survive IndexedDB reload");
  assert.equal(
    await page.evaluate(() => window.__game.inventory.held.id),
    14,
    "inventory survives reload",
  );
  await page.keyboard.press("F3");
  await page.waitForTimeout(300);
  await page.screenshot({ path: "test-results/core-verified.png" });

  // Survival fixtures arrange reachable resources; actions use real mouse and UI controls.
  await page.evaluate(() => {
    const g = window.__game;
    g.input.onLook = undefined;
    g.mode = "survival";
    g.inventory.slots = Array(36).fill(null);
    g.inventory.selected = 0;
    g.body.position = { x: 0.5, y: 21.1, z: 22.5 };
    g.body.velocity = { x: 0, y: 0, z: 0 };
    g.yaw = 0;
    g.pitch = -0.15;
    g.world.set(0, 22, 19, 6);
    g.health = g.hunger = 20;
  });
  await page.waitForFunction(() => window.__game.hit?.value === 6);
  await page.mouse.down();
  await page.waitForFunction(
    () => window.__game.world.get(0, 22, 19) === 0,
    null,
    { timeout: 12000 },
  );
  await page.mouse.up();
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(500);
  await page.keyboard.up("KeyW");
  await page.waitForFunction(
    () => window.__game.inventory.count(6) >= 1,
    null,
    { timeout: 5000 },
  );
  await page.evaluate(() => {
    const g = window.__game;
    g.inventory.add(6, 3);
    g.world.set(1, 21, 20, 23);
  });
  await page.keyboard.press("KeyE");
  await page.getByRole("button", { name: "Crafting book" }).click();
  await page.locator('[data-action="slot"][data-index="0"]').click();
  await page.locator('[data-action="grid-slot"][data-index="0"]').click();
  await page.locator('[data-action="grid-output"]').click();
  await page.locator('[data-action="grid-slot"][data-index="0"]').click();
  await page.locator('[data-action="slot"][data-index="1"]').click();
  for (let i = 0; i < 3; i++)
    await page.locator('[data-action="make"][data-id="planks"]').click();
  await page.locator('[data-action="make"][data-id="sticks"]').click();
  await page.locator('[data-action="make"][data-id="tool-120"]').click();
  assert.equal(
    await page.evaluate(() => window.__game.inventory.count(120)),
    1,
    "crafting UI produces a wooden pickaxe",
  );
  await page.screenshot({ path: "test-results/crafting.png" });
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.waitForFunction(
    () => !!document.pointerLockElement && window.__game.input.locked,
  );
  await page.evaluate(() => {
    const g = window.__game;
    g.inventory.add(19, 1);
    g.inventory.add(101, 1);
    g.body.position = { x: 0.5, y: 21.1, z: 22.5 };
    g.body.velocity = { x: 0, y: 0, z: 0 };
    g.yaw = 0;
    g.pitch = -0.15;
    g.cooldown = 0;
    g.world.set(0, 22, 19, 24);
  });
  await page.waitForFunction(() => window.__game.hit?.value === 24);
  await page.mouse.click(480, 300, { button: "right" });
  await page.getByText("A little heat. A new possibility.").waitFor();
  for (const [id, target] of [
    [19, 0],
    [101, 1],
  ]) {
    const idx = await page.evaluate(
      (id) => window.__game.inventory.slots.findIndex((s) => s?.id === id),
      id,
    );
    await page.locator(`[data-action="slot"][data-index="${idx}"]`).click();
    await page
      .locator(`[data-action="furnace-slot"][data-index="${target}"]`)
      .click();
  }
  await page.waitForFunction(
    () => window.__game.simulation.furnaces["0,22,19"]?.slots[2]?.id === 102,
    null,
    { timeout: 12000 },
  );
  await page.locator('[data-action="furnace-slot"][data-index="2"]').click();
  const empty = await page.evaluate(() =>
    window.__game.inventory.slots.findIndex((s) => !s),
  );
  await page.locator(`[data-action="slot"][data-index="${empty}"]`).click();
  assert.equal(
    await page.evaluate(() => window.__game.inventory.count(102)),
    1,
    "kiln smelts ore and output is collectible",
  );
  await page.screenshot({ path: "test-results/kiln.png" });
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.waitForFunction(
    () => !!document.pointerLockElement && window.__game.input.locked,
  );
  await page.evaluate(() => {
    const g = window.__game;
    g.world.set(0, 22, 19, 0);
    g.inventory.add(111, 2);
    g.body.position = { x: 0.5, y: 21.1, z: 22.5 };
    g.yaw = 0;
    g.pitch = -0.2;
    const e = g.entities.list.find((e) => e.kind === "villager");
    e.body.position = { x: 0.5, y: 21.1, z: 19.5 };
    e.goal = { ...e.body.position };
    e.timer = 999;
    g.cooldown = 0;
  });
  await page.waitForFunction(
    () => window.__game.entityHit?.kind === "villager",
  );
  await page.mouse.click(480, 300, { button: "right" });
  await page.locator('[data-action="trade"][data-id="2"]').click();
  assert.equal(
    await page.evaluate(() => window.__game.inventory.count(105)),
    3,
    "merchant gives food",
  );
  assert.equal(
    await page.evaluate(() => window.__game.inventory.count(111)),
    1,
    "merchant consumes payment",
  );
  await page.screenshot({ path: "test-results/trading.png" });
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.waitForFunction(
    () => !!document.pointerLockElement && window.__game.input.locked,
  );
  await page.evaluate(() => {
    const g = window.__game;
    const i = g.inventory.slots.findIndex((s) => s?.id === 105);
    [g.inventory.slots[0], g.inventory.slots[i]] = [
      g.inventory.slots[i],
      g.inventory.slots[0],
    ];
    g.inventory.selected = 0;
    g.hunger = 10;
    g.yaw = Math.PI / 2;
    g.pitch = 0;
    g.cooldown = 0;
  });
  await page.mouse.click(480, 300, { button: "right" });
  await page.waitForFunction(() => window.__game.hunger > 15, null, {
    timeout: 5000,
  });
  assert.equal(
    await page.evaluate(() => window.__game.inventory.count(105)),
    2,
    "eating consumes food",
  );
  await page.evaluate(() => window.__game.inventory.add(102, 5));
  await page.keyboard.press("KeyE");
  await page.getByRole("button", { name: "Crafting book" }).click();
  await page.locator('[data-action="make"][data-id="armor-150"]').click();
  await page.getByRole("button", { name: "Inventory", exact: true }).click();
  const armorIndex = await page.evaluate(() =>
    window.__game.inventory.slots.findIndex((s) => s?.id === 150),
  );
  assert(armorIndex >= 0, "armor recipe creates helmet");
  await page
    .locator(`[data-action="slot"][data-index="${armorIndex}"]`)
    .click();
  await page.locator('[data-action="armor-slot"][data-index="0"]').click();
  assert.equal(
    await page.evaluate(() => window.__game.inventory.equipment.protection),
    2,
    "equipment slot provides protection",
  );
  await page.screenshot({ path: "test-results/equipment.png" });
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.waitForFunction(
    () => !!document.pointerLockElement && window.__game.input.locked,
  );
  const armorSaved = await page.evaluate(async () => {
    await window.__game.save();
    return window.__game.inventory.equipment.slots;
  });
  await page.reload();
  await page.getByRole("button", { name: /QA Jade Harbor/ }).click();
  await page.waitForFunction(() => window.__game?.active);
  assert.deepEqual(
    await page.evaluate(() => window.__game.inventory.equipment.slots),
    armorSaved,
    "equipment persists",
  );
  await page.evaluate(() => (window.__game.input.onLook = undefined));
  await page.evaluate(() => {
    const g = window.__game;
    // Use an open road segment; the new lantern canopy at z=24 catches a fall.
    g.body.position = { x: 0.5, y: 29, z: 32.5 };
    g.body.velocity = { x: 0, y: 0, z: 0 };
    g.body.fallStart = 29;
    g.health = 20;
    g.damageCooldown = 0;
  });
  await page.waitForFunction(() => window.__game.health < 20, null, {
    timeout: 6000,
  });
  await page.evaluate(() => {
    window.__game.damageCooldown = 0;
    window.__game.damage(99);
  });
  await page.getByRole("button", { name: "Return to Jade Harbor" }).waitFor();
  assert(
    await page.evaluate(() => window.__game.entities.drops.length > 0),
    "death creates recoverable drops",
  );
  await page.getByRole("button", { name: "Return to Jade Harbor" }).click();
  await page.waitForFunction(
    () => !window.__game.dead && window.__game.health === 20,
  );
  await page.evaluate(() => {
    const g = window.__game;
    g.time = 0.68;
    g.mode = "creative";
    g.yaw = 0;
    g.pitch = 0.05;
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: "test-results/night.png" });
  // Verify the irreversible one-life rule through creation, UI, save and reload.
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Save & return home" }).click();
  await page.getByRole("button", { name: "Create a world" }).click();
  await page.locator("#world-name").fill("QA One Life");
  await page.locator("#world-mode").selectOption("hardcore");
  await page.getByRole("button", { name: "Enter your world" }).click();
  await page.waitForFunction(
    () => window.__game?.active && window.__game.mode === "hardcore",
  );
  await page.evaluate(() => {
    window.__game.damageCooldown = 0;
    window.__game.damage(99);
  });
  assert.equal(await page.evaluate(() => window.__game.mode), "spectator");
  assert(await page.evaluate(() => window.__game.hardcoreEnded));
  await page.evaluate(async () => {
    window.__game.pause();
    await window.__game.save();
  });
  assert.equal(
    await page.locator("#change-mode").count(),
    0,
    "hardcore mode cannot be restored by menu",
  );
  await page.reload();
  await page.getByRole("button", { name: /QA One Life/ }).click();
  await page.waitForFunction(() => window.__game.active);
  assert.equal(await page.evaluate(() => window.__game.mode), "spectator");
  assert(
    await page.evaluate(() => window.__game.hardcoreEnded),
    "one-life rule persists after reload",
  );
  assert.deepEqual(errors, [], "no uncaught browser errors");
  const result = {
    status: "passed",
    checks: [
      "menu renders",
      "world creation",
      "pointer lock",
      "keyboard movement",
      "mouse mining",
      "mouse placement",
      "creative catalog",
      "IndexedDB edits reload",
      "inventory reload",
      "survival mining and drop pickup",
      "shaped crafting UI",
      "recipe-book tool crafting",
      "kiln input/fuel/output",
      "NPC trading transaction",
      "eating",
      "armor crafting and equipping",
      "armor IndexedDB reload",
      "fall damage",
      "death item drops and respawn",
      "night rendering",
      "hardcore creation and permanent spectator death",
      "hardcore IndexedDB reload",
      "no uncaught browser exceptions",
    ],
    performance: await page.evaluate(() => ({
      fps: window.__game.fps,
      chunks: window.__game.world.chunks.size,
      triangles: window.__game.view.renderer.info.render.triangles,
      drawCalls: window.__game.view.renderer.info.render.calls,
    })),
    errors,
  };
  await writeFile(
    "test-results/browser-results.json",
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result, null, 2));
} catch (e) {
  console.log(
    "FAIL_STATE",
    await page.evaluate(() => {
      const g = window.__game;
      return {
        tick: g?.tickCount,
        progress: g?.mineProgress,
        key: g?.mineKey,
        hit: g?.hit,
        p: g?.body.position,
        left: g?.input.left,
        locked: g?.input.locked,
        screen: g?.ui.screen,
        pitch: g?.pitch,
        yaw: g?.yaw,
        hunger: g?.hunger,
        held: g?.inventory.held,
        armor: g?.inventory.equipment.slots,
        cooldown: g?.cooldown,
        edits: g ? Object.fromEntries(g.world.edits) : {},
      };
    }),
  );
  await page.screenshot({ path: "test-results/failure.png" });
  console.error("BROWSER ERRORS", errors);
  throw e;
} finally {
  await browser.close();
  server?.kill();
}
