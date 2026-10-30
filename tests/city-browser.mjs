import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const server = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "4177"],
  { stdio: ["ignore", "pipe", "pipe"] },
);
let browser, page;
const checks = [],
  errors = [];
const passed = (name) => {
  checks.push(name);
  console.log("PASS", name);
};
async function ready() {
  await page.waitForFunction(
    () => {
      const g = window.__game;
      if (!g?.active) return false;
      const cx = Math.floor(g.body.position.x / 16),
        cz = Math.floor(g.body.position.z / 16),
        r = g.settings.distance;
      for (let dz = -r; dz <= r; dz++)
        for (let dx = -r; dx <= r; dx++)
          if (
            dx * dx + dz * dz <= (r + 0.5) ** 2 &&
            (!g.world.chunks.has(`${cx + dx},${cz + dz}`) ||
              !g.view.groups.has(`${cx + dx},${cz + dz}`))
          )
            return false;
      return g.world.pending.size === 0 && g.world.dirty.size === 0;
    },
    null,
    { timeout: 90000 },
  );
}
async function create(name, seed) {
  await page.locator('[data-action="new"]').click();
  await page.locator("#world-name").fill(name);
  await page.locator("#world-seed").fill(seed);
  await page.locator('[data-action="create"]').click();
  await page.waitForFunction(() => window.__game?.active);
  await page.evaluate(() => {
    const g = window.__game;
    g.settings.distance = 3;
    g.applySettings();
  });
  await ready();
}
async function fixture(position, pitch = -0.9, flying = false) {
  await page.evaluate(
    ({ position, pitch, flying }) => {
      const g = window.__game;
      g.input.onLook = undefined;
      g.input.keys.clear();
      g.mode = "creative";
      g.body.flying = flying;
      g.body.position = { ...position };
      g.previous = { ...position };
      g.body.velocity = { x: 0, y: 0, z: 0 };
      g.yaw = 0;
      g.pitch = pitch;
      const cx = Math.floor(position.x / 16),
        cz = Math.floor(position.z / 16);
      for (let z = cz - 1; z <= cz + 1; z++)
        for (let x = cx - 1; x <= cx + 1; x++) g.world.ensure(x, z, true);
      g.ui.show("none");
      g.target();
    },
    { position, pitch, flying },
  );
  await page.waitForTimeout(200);
}
async function menu() {
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Save & return home" }).click();
  await page.locator('[data-action="new"]').waitFor();
}
async function disk(id) {
  return page.evaluate(async (id) => {
    const { loadSave } = await import("/src/persistence/saves.ts");
    return loadSave(id);
  }, id);
}
try {
  await new Promise((ok, fail) => {
    server.stdout.on("data", (b) => {
      if (b.toString().includes("Local:")) ok();
    });
    server.on("error", fail);
    server.on("exit", (c) => fail(new Error("server " + c)));
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
  const context = await browser.newContext({
    viewport: { width: 960, height: 700 },
  });
  const attach = async () => {
    page = await context.newPage();
    page.setDefaultTimeout(60000);
    page.on("pageerror", (e) => { errors.push(e.message); console.log("PAGE_ERROR",e.message); });
    await page.goto("http://127.0.0.1:4177");
  };
  await attach();
  await create("City matrix A", "jade-harbor");
  await page.evaluate(() => window.__game.world.ensure(0, -3, true));
  const idA = await page.evaluate(() => window.__game.meta.id);
  assert(
    await page.evaluate(() => {
      const g = window.__game;
      return (
        Math.abs(g.body.position.x - 0.5) < 0.1 &&
        Math.abs(g.body.position.z - 24.5) < 0.1 &&
        g.world.get(0, 35, -45) !== 0
      );
    }),
  );
  passed("new world: safe Chinatown spawn and guaranteed editable panda");
  await page.waitForFunction(() => window.__game.body.grounded);
  const ground = await page.evaluate(() => window.__game.body.position.y);
  await page.keyboard.press("Space");
  await page.waitForFunction(
    (y) => window.__game.body.position.y > y + 0.5,
    ground,
  );
  await page.waitForFunction(() => window.__game.body.grounded);
  passed("real Space input jumps and lands");
  const startZ = await page.evaluate(() => window.__game.body.position.z);
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(650);
  await page.keyboard.up("KeyW");
  assert(
    (await page.evaluate(() => window.__game.body.position.z)) < startZ - 1,
  );
  const yaw = await page.evaluate(() => window.__game.yaw);
  await page.mouse.move(520, 350);
  await page.mouse.move(570, 350);
  await page.waitForTimeout(200);
  if ((await page.evaluate(() => window.__game.yaw)) === yaw) {
    await page.evaluate(() =>
      document.dispatchEvent(
        new MouseEvent("mousemove", {
          movementX: 50,
          movementY: 10,
          bubbles: true,
        }),
      ),
    );
  }
  assert.notEqual(await page.evaluate(() => window.__game.yaw), yaw);
  passed("real WASD and camera input handler (relative mouse event fixture)");
  // Natural ground is generated, not injected. Only player positioning is a test fixture.
  const terrain = await page.evaluate(async () => {
    const { terrainHeight } = await import("/src/world/generator.ts");
    const { seedNumber } = await import("/src/world/noise.ts");
    return terrainHeight(420, 60, seedNumber(window.__game.meta.seed));
  });
  await fixture({ x: 420.5, y: terrain + 1.1, z: 60.5 });
  await page.waitForFunction(() => window.__game.hit?.x > 400);
  const natural = await page.evaluate(() => window.__game.hit);
  await page.mouse.down();
  await page.waitForFunction(
    (h) => window.__game.world.get(h.x, h.y, h.z) === 0,
    natural,
  );
  await page.mouse.up();
  passed("real mouse mines a generated natural block outside the city");
  // Place on three separate street surfaces, including a chunk border.
  const placed = [];
  for (const pos of [
    { x: 0.5, y: 21.1, z: 31.5 },
    { x: 2.5, y: 21.1, z: 31.5 },
    { x: 15.5, y: 21.1, z: 49.5 },
  ]) {
    await fixture(pos);
    await page.keyboard.press("Digit2");
    await page.waitForFunction(() => window.__game.hit?.y === 20);
    const h = await page.evaluate(() => window.__game.hit);
    const p = { x: h.x + h.normal.x, y: h.y + h.normal.y, z: h.z + h.normal.z };
    await page.mouse.click(480, 350, { button: "right" });
    await page.waitForFunction(
      (p) => window.__game.world.get(p.x, p.y, p.z) === 11,
      p,
    );
    placed.push({ ...p, value: 11 });
  }
  passed(
    "real hotbar and right-click place three blocks, including a chunk edge",
  );
  await fixture({ x: 0.5, y: 33.4, z: -40.5 }, 0, true);
  await page.waitForFunction(() =>
    [48, 49, 64, 65].includes(window.__game.hit?.value),
  );
  const panda = await page.evaluate(() => window.__game.hit);
  await page.mouse.down();
  await page.waitForFunction(
    (h) => window.__game.world.get(h.x, h.y, h.z) === 0,
    panda,
  );
  await page.mouse.up();
  passed("real mouse mines a sculpture voxel");
  const fixtures = await page.evaluate(async () => {
    const g = window.__game;
    const house = g.world.cityPlan.structures.find(
      (s) => s.kind === "shophouse",
    );
    const houseY = (house.baseY ?? 20) + 3;
    const edits = [
      { x: house.x1, y: houseY, z: house.z1, value: 0 },
      { x: 7, y: 24, z: -43, value: 48 },
      { x: -16, y: 25, z: -1, value: 53 },
      { x: -17, y: 25, z: -1, value: 9 },
    ];
    g.world.ensure(Math.floor(house.x1 / 16), Math.floor(house.z1 / 16), true);
    if (!g.world.get(house.x1, houseY, house.z1))
      throw Error("house fixture missing");
    for (const e of edits) g.world.set(e.x, e.y, e.z, e.value);
    return edits;
  });
  const expected = [
    { ...natural, value: 0 },
    ...placed,
    { ...panda, value: 0 },
    ...fixtures,
  ];
  // Travel fixtures advance the player hundreds of blocks; normal streaming, workers and eviction run unchanged.
  const travels = [];
  for (const [x, z] of [
    [300, 0],
    [-300, 0],
    [0, -300],
    [0, 300],
  ]) {
    await fixture({ x: x + 0.5, y: 45, z: z + 0.5 }, 0, true);
    await page.evaluate(() => {
      window.__game.mode = "spectator";
    });
    await ready();
    assert(
      await page.evaluate(() => {
        const g = window.__game;
        return [...g.world.chunks.values()].every(
          (c) => c.blocks.get(0,-64,0) === 36 && c.blocks.some((v) => v !== 0),
        );
      }),
    );
    travels.push({
      x,
      z,
      chunks: await page.evaluate(() => window.__game.world.chunks.size),
    });
  }
  assert.equal(
    await page.evaluate(() => window.__game.world.chunks.has("-1,-1")),
    false,
  );
  await fixture({ x: 0.5, y: 21.1, z: 24.5 });
  await ready();
  assert.equal(
    await page.evaluate(() => window.__game.world.get(-16, 25, -1)),
    53,
  );
  assert.equal(
    await page.evaluate(() => window.__game.world.get(-17, 25, -1)),
    9,
  );
  passed(
    "four 300-block travel directions fully stream and negative-edge edits survive eviction",
  );
  await page.evaluate(() => {
    const g = window.__game;
    g.inventory.selected = 4;
    g.yaw = 0.37;
    g.pitch = -0.23;
  });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Save world", exact: true }).click();
  await page.getByText("Your world is saved.", { exact: true }).waitFor();
  const savedA = await disk(idA);
  assert.equal(savedA.player.selected, 4);
  for (const e of expected)
    assert.equal(savedA.edits[`${e.x},${e.y},${e.z}`], e.value);
  passed(
    "manual save atomically stores natural, house, panda and placed edits with player state",
  );
  await page.close();
  await attach();
  // Suppress synthetic pointer-lock acquisition deltas before checking restored orientation.
  await page.waitForFunction(() => window.__game);
  await page.evaluate(() => {
    window.__game.input.onLook = undefined;
  });
  await page.getByRole("button", { name: /City matrix A/ }).click();
  await ready();
  assert.equal(await page.evaluate(() => window.__game.inventory.selected), 4);
  assert(
    Math.abs(
      (await page.evaluate(() => window.__game.body.position.z)) -
        savedA.player.position.z,
    ) < 0.05,
  );
  assert.equal(await page.evaluate(() => window.__game.yaw), 0.37);
  assert(
    await page.evaluate((expected) => {
      const w = window.__game.world;
      for (const e of expected) {
        w.ensure(Math.floor(e.x / 16), Math.floor(e.z / 16), true);
        if (w.get(e.x, e.y, e.z) !== e.value) return false;
      }
      return true;
    }, expected),
  );
  passed(
    "closing and reopening the tab restores edits before regenerated chunks are meshed",
  );
  // Advance the actual periodic autosave deadline; verify the committed IndexedDB record before reload.
  const oldRevision = (await disk(idA)).revision;
  await page.evaluate(() => {
    const g = window.__game;
    g.inventory.selected = 6;
    g.world.set(1, 24, 25, 48);
    g.lastAuto = performance.now() - 8100;
  });
  await page.waitForFunction(
    (rev) => window.__game.saveRevision > rev,
    oldRevision,
  );
  const auto = await disk(idA);
  assert.equal(auto.player.selected, 6);
  assert.equal(auto.edits["1,24,25"], 48);
  await page.reload();
  await page.getByRole("button", { name: /City matrix A/ }).click();
  await ready();
  assert.equal(
    await page.evaluate(() => window.__game.world.get(1, 24, 25)),
    48,
  );
  passed(
    "completed periodic autosave survives reload with newest block and selected hotbar",
  );
  await page.keyboard.press("Escape");
  await page.evaluate(() => {
    window.__originalOpen = indexedDB.open;
    indexedDB.open = function () {
      throw new DOMException("QA storage quota failure", "QuotaExceededError");
    };
    window.__game.world.set(2, 25, 26, 49);
  });
  await page.getByRole("button", { name: "Save world", exact: true }).click();
  await page
    .getByText("Save failed · changes still in memory", { exact: true })
    .waitFor();
  assert(await page.evaluate(() => window.__game.world.dirtyEdits.size > 0));
  await page.evaluate(() => {
    indexedDB.open = window.__originalOpen;
    delete window.__originalOpen;
  });
  await page.getByRole("button", { name: "Save world", exact: true }).click();
  await page.getByText("Your world is saved.", { exact: true }).waitFor();
  assert.equal((await disk(idA)).edits["2,25,26"], 49);
  passed(
    "injected IndexedDB failure shows failure, retains edits, and retries successfully",
  );
  await page.getByRole("button", { name: "Save & return home" }).click();
  await create("City matrix B", "different-city");
  const idB = await page.evaluate(() => window.__game.meta.id);
  assert.notEqual(idA, idB);
  assert.equal(
    await page.evaluate(() => window.__game.world.edits.has("2,25,26")),
    false,
  );
  assert.equal(await page.evaluate(() => window.__game.inventory.selected), 0);
  await menu();
  passed("two named differently seeded worlds stay isolated");
  const reset = page.locator(`[data-action="reset"][data-id="${idA}"]`);
  page.once("dialog", (d) => d.dismiss());
  await reset.click();
  assert.equal((await disk(idA)).edits["2,25,26"], 49);
  page.once("dialog", (d) => d.accept());
  await reset.click();
  await page.waitForTimeout(200);
  await page.locator(`[data-action="load"][data-id="${idA}"]`).click();
  await ready();
  assert.equal(await page.evaluate(() => window.__game.world.edits.size), 0);
  await page.evaluate(() => window.__game.world.ensure(0, -3, true));
  assert.equal(
    await page.evaluate(() => window.__game.world.get(0, 35, -45)),
    48,
  );
  assert.equal((await disk(idB)).seed, "different-city");
  passed(
    "confirmed reset regenerates the original city and panda; cancel and other slots are preserved",
  );
  assert.deepEqual(errors, []);
  passed("no uncaught browser exceptions");
  await mkdir("test-results", { recursive: true });
  const result = {
    status: "passed",
    checks,
    travels,
    errors,
    fixtureNote:
      "Natural mining, sculpture mining, placement, movement, jump, hotbar and save/reset actions use real browser input. Relative mouse movement uses a DOM event because headless pointer-lock deltas are zero. Position fixtures accelerate travel; direct voxel edits cover additional house/boundary cases. Autosave deadline is advanced; IndexedDB failure is injected.",
  };
  await writeFile(
    "test-results/city-browser-results.json",
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result, null, 2));
} catch (e) {
  if (page && !page.isClosed()) {
    console.log(
      "FAIL_STATE",
      await page.evaluate(() => {
        const g = window.__game;
        return {
          screen: g?.ui.screen,
          position: g?.body.position,
          hit: g?.hit,
          active: g?.active,
          saveRevision: g?.saveRevision,
          locked: g?.input.locked,
          keys: [...(g?.input.keys ?? [])],
          fps:g.fps,chunks:g.world.chunks.size,groups:[...g.view.groups.keys()],dirty:[...g.world.dirty].slice(0,12),dirtyCount:g.world.dirty.size,pending:[...g.world.pending],saveStatus:document.querySelector('#save-status')?.textContent,

        };
      }),
    );
    await mkdir("test-results", { recursive: true });
    await page.screenshot({ path: "test-results/city-browser-failure.png" });
  }
  throw e;
} finally {
  await browser?.close();
  server.kill();
}
