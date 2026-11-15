#!/usr/bin/env node
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  module._compile(output, filename);
};

const { GRAPHICS_PROFILES, graphicsProfile, graphicsQuality } = require("../src/render/graphics.ts");
const { AdaptiveResolution } = require("../src/render/adaptive-resolution.ts");
const { Simulation } = require("../src/game/simulation.ts");
const { B } = require("../src/world/blocks.ts");
const { stateOf } = require("../src/core/coords.ts");
const { freshWorld, validateSave } = require("../src/persistence/saves.ts");
const { cloneStack } = require("../src/game/stack.ts");

function extractClassMethod(file, className, methodName) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.ES2022, true);
  const declaration = ast.statements.find(statement =>
    ts.isClassDeclaration(statement) && statement.name?.text === className);
  assert.ok(declaration, `missing class ${className} in ${file}`);
  const method = declaration.members.find(member =>
    member.name && member.name.getText(ast).replace(/^['"]|['"]$/g, "") === methodName);
  assert.ok(method, `missing method ${className}.${methodName}`);
  return method.getText(ast);
}

const applySettingsMethod = extractClassMethod("src/core/game.ts", "Game", "applySettings");
const applySettingsJs = ts.transpileModule(`class SettingsHarness { ${applySettingsMethod} }`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;
const { clamp } = require("../src/core/coords.ts");
const { frameRateLimit } = require("../src/render/frame-pacer.ts");
const { touchMode, touchSensitivity } = require("../src/ui/touch-controls.ts");
const SettingsHarness = Function(
  "clamp", "frameRateLimit", "touchMode", "touchSensitivity",
  "graphicsQuality", "graphicsProfile", "localStorage",
  `${applySettingsJs}; return SettingsHarness;`,
)(clamp, frameRateLimit, touchMode, touchSensitivity, graphicsQuality, graphicsProfile, {
  setItem() {},
});

function settingsFixture(quality, adaptiveEnabled) {
  const game = new SettingsHarness();
  const presentation = { profile: null, scale: null, gpuTiming: null, rainCount: null };
  const simulationSentinel = { tick: 0, weather: "rain", elapsed: 17.5, authoritative: { seed: "graphics-parity" } };
  const entitiesSentinel = { ids: ["resident-a", "resident-b"], positions: [[1, 20, 1], [2, 20, 2]], schedules: [3, 8] };
  const worldSentinel = { edits: new Map([["1,20,1", B.Stone]]), chunks: new Map([["0,0", { revision: 4 }]]), dirty: new Set(["0,0"]), pending: new Set(["1,0"]) };
  Object.assign(game, {
    settings: {
      graphicsQuality: quality,
      adaptiveResolution: adaptiveEnabled,
      frameRateLimit: 0,
      fov: 75,
      sensitivity: 4,
      distance: 5,
      simulationDistance: 4,
      volume: 30,
      touchControls: "auto",
      touchSensitivity: 1,
    },
    adaptive: new AdaptiveResolution(),
    view: {
      setGpuTimingEnabled(value) { presentation.gpuTiming = value; },
      setResolutionScale(value) { presentation.scale = value; },
      setGraphicsProfile(value) { presentation.profile = value; },
      camera: { fov: 0, updateProjectionMatrix() {} },
      distance: 0,
    },
    effects: { setRainCount(value) { presentation.rainCount = value; } },
    audio: { volume: 0 },
    input: { mouseSensitivity: 0 },
    ui: { touchControls: { configure() {} } },
    browser: { refresh() {} },
    simulation: simulationSentinel,
    entities: entitiesSentinel,
    world: worldSentinel,
  });
  return { game, presentation, simulationSentinel, entitiesSentinel, worldSentinel };
}

function createSimulationScenario() {
  const cells = new Map();
  const edits = new Map();
  const key = (x, y, z) => `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
  const world = {
    chunks: new Map(),
    edits,
    loaded: () => true,
    get(x, y, z) { return cells.get(key(x, y, z)) ?? B.Air; },
    set(x, y, z, value) {
      const k = key(x, y, z);
      cells.set(k, value);
      edits.set(k, value);
      return true;
    },
  };
  world.set(2, 20, 2, B.Rice);
  const simulation = new Simulation(world, {
    weather: "clear", weatherTimer: 2.5, elapsed: 0, tickNo: 0, cropTimer: 0,
  });
  simulation.specials.set("2,20,2", B.Rice);
  const player = { x: 0.5, y: 20, z: 0.5 };
  return { world, simulation, cells, player };
}

function runAuthoritativeScenario(quality, adaptiveEnabled) {
  const { world, simulation, cells, player } = createSimulationScenario();
  const adaptive = new AdaptiveResolution();
  adaptive.configure(adaptiveEnabled, 0);
  for (let tick = 0; tick < 300; tick++) {
    simulation.tick(0.05, player, true);
    if (adaptiveEnabled) {
      const now = (tick + 1) * 50;
      adaptive.observe(now, 50, 18, 4, null, 60);
    }
  }
  return {
    world: [...cells.entries()].sort(([a], [b]) => a.localeCompare(b)),
    edits: [...world.edits.entries()].sort(([a], [b]) => a.localeCompare(b)),
    simulation: simulation.serialize(),
    renderOnly: {
      quality,
      scale: graphicsProfile(quality).renderScale,
      adaptiveScale: adaptive.scale,
      adaptiveState: adaptive.state,
    },
  };
}

function snapshotFixture(quality, adaptiveEnabled) {
  const data = freshWorld("Graphics parity fixture", "graphics-parity-seed", "creative", "graphics-parity-id");
  data.edits = { "1,20,1": B.Stone, "2,20,2": B.Rice };
  const snapshotMethod = extractClassMethod("src/core/game.ts", "Game", "snapshot");
  const js = ts.transpileModule(`class SnapshotHarness { ${snapshotMethod} }`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const SnapshotHarness = Function("cloneStack", `${js}; return SnapshotHarness;`)(cloneStack);
  const game = new SnapshotHarness();
  Object.assign(game, {
    world: { edits: new Map(Object.entries(data.edits)) },
    saveRevision: 0,
    meta: { id: data.id, name: data.name, seed: data.seed, created: data.created },
    mode: data.mode,
    time: data.time,
    simulation: {
      weather: data.weather,
      serialize: () => ({ furnaces: {}, brewers: {}, hoppers: {}, elapsed: 0, tickNo: 0, cropTimer: 0, pendingTicks: [], weather: data.weather, weatherTimer: 180 }),
    },
    body: { position: { ...data.player.position }, flying: false },
    yaw: 0,
    pitch: 0,
    health: 20,
    hunger: 20,
    xp: 0,
    status: { list: [] },
    saturation: 5,
    exhaustion: 0,
    breath: 10,
    inventory: {
      slots: data.player.slots,
      selected: data.player.selected,
      equipment: { slots: [null, null, null, null] },
      cursor: null,
    },
    craftingGrid: Array(9).fill(null),
    spawn: { ...data.player.spawn },
    dead: false,
    entities: { serialize: () => ({ entities: [], drops: [] }) },
    containers: {},
    hardcoreEnded: false,
    achievements: new Set(),
    settings: { graphicsQuality: quality, adaptiveResolution: adaptiveEnabled },
  });
  return game.snapshot();
}

test("all six graphics/adaptive combinations produce identical authoritative simulation results", () => {
  const combinations = [];
  for (const quality of ["high", "medium", "low"])
    for (const adaptive of [false, true])
      combinations.push(runAuthoritativeScenario(quality, adaptive));
  const baseline = combinations[0];
  for (const result of combinations.slice(1)) {
    assert.deepEqual(result.world, baseline.world);
    assert.deepEqual(result.edits, baseline.edits);
    assert.deepEqual(result.simulation, baseline.simulation);
  }
  assert.equal(stateOf(baseline.world.find(([k]) => k === "2,20,2")[1]), 1,
    "the deterministic rain/crop scenario should exercise a real gameplay-state change");
  assert.equal(baseline.simulation.weather, "rain");
  assert.deepEqual(
    new Set(combinations.map(result => result.renderOnly.quality)),
    new Set(["high", "medium", "low"]),
  );
});

test("runtime settings application changes presentation controls only and survives rapid preset switching", () => {
  const fixture = settingsFixture("high", false);
  const { game, presentation, simulationSentinel, entitiesSentinel, worldSentinel } = fixture;
  const expectedSimulation = structuredClone(simulationSentinel);
  const expectedEntities = structuredClone(entitiesSentinel);
  const expectedEdits = [...worldSentinel.edits.entries()];
  const expectedChunks = [...worldSentinel.chunks.entries()];
  for (const quality of ["high", "medium", "low", "medium", "high"]) {
    game.settings.graphicsQuality = quality;
    game.applySettings();
    assert.equal(presentation.profile.quality, quality);
    assert.equal(presentation.rainCount, GRAPHICS_PROFILES[quality].rainParticleCount);
    assert.equal(game.settings.simulationDistance, 4);
    assert.deepEqual(game.simulation, expectedSimulation);
    assert.deepEqual(game.entities, expectedEntities);
    assert.deepEqual([...game.world.edits.entries()], expectedEdits);
    assert.deepEqual([...game.world.chunks.entries()], expectedChunks);
    assert.deepEqual([...game.world.dirty], ["0,0"]);
    assert.deepEqual([...game.world.pending], ["1,0"]);
  }
});

test("Adaptive Resolution remains independent from the manually selected graphics preset", () => {
  const fixture = settingsFixture("medium", true);
  const { game, presentation, simulationSentinel, entitiesSentinel, worldSentinel } = fixture;
  game.applySettings();
  assert.equal(presentation.profile.quality, "medium");
  assert.equal(presentation.gpuTiming, true);
  const before = structuredClone({ simulationSentinel, entitiesSentinel, worldSentinel: {
    edits: [...worldSentinel.edits], chunks: [...worldSentinel.chunks], dirty: [...worldSentinel.dirty], pending: [...worldSentinel.pending],
  } });
  let now = 0;
  for (let i = 0; i < 190; i++) {
    now += 100;
    const scale = game.adaptive.observe(now, 100, 4, 0, null, 60);
    game.view.setResolutionScale(scale);
  }
  assert.equal(game.settings.graphicsQuality, "medium");
  assert.ok(game.adaptive.scale >= 0.7 && game.adaptive.scale < 1,
    "a sustained presentation-pressure fixture should lower render scale without changing the selected preset");
  assert.deepEqual(game.simulation, before.simulationSentinel);
  assert.deepEqual(game.entities, before.entitiesSentinel);
  assert.deepEqual([...game.world.edits], before.worldSentinel.edits);
  assert.deepEqual([...game.world.chunks], before.worldSentinel.chunks);
  assert.deepEqual([...game.world.dirty], before.worldSentinel.dirty);
  assert.deepEqual([...game.world.pending], before.worldSentinel.pending);
});

test("Game snapshot and validated save payloads are independent of graphics and adaptive settings", () => {
  const previousNow = Date.now;
  Date.now = () => 1_800_000_000_000;
  try {
    const snapshots = [];
    for (const quality of ["high", "medium", "low"])
      for (const adaptive of [false, true])
        snapshots.push(validateSave(snapshotFixture(quality, adaptive)));
    for (const result of snapshots.slice(1)) assert.deepEqual(result, snapshots[0]);
    assert.equal(Object.hasOwn(snapshots[0], "graphicsQuality"), false);
    assert.equal(Object.hasOwn(snapshots[0], "adaptiveResolution"), false);
    assert.equal(snapshots[0].edits["1,20,1"], B.Stone);
    assert.equal(snapshots[0].edits["2,20,2"], B.Rice);
  } finally {
    Date.now = previousNow;
  }
});

test("distant skyline anchor buildings are identical across presets", () => {
  const graphics = fs.readFileSync(path.join(root, "src/render/graphics.ts"), "utf8");
  const distant = fs.readFileSync(path.join(root, "src/render/distant-world.ts"), "utf8");
  assert.doesNotMatch(graphics, /crownBuildingsPerDistrict/,
    "the graphics profile must not control how many district buildings exist in the distant skyline");
  assert.match(distant, /const CROWN_BUILDINGS_PER_DISTRICT=4/);
  assert.match(distant, /for\(let choice=0;choice<CROWN_BUILDINGS_PER_DISTRICT;choice\+\+\)/);
  assert.match(distant, /Math\.round\(choice\*3\/\(CROWN_BUILDINGS_PER_DISTRICT-1\)\)/);
});

test("the fixed Game tick does not branch on graphics quality or Adaptive Resolution", () => {
  const tick = extractClassMethod("src/core/game.ts", "Game", "tick");
  assert.doesNotMatch(tick, /graphicsQuality|graphicsProfile|GRAPHICS_PROFILES|adaptive\.|resolutionScale|dprCap/,
    "the fixed gameplay tick must not consume rendering preset or adaptive-resolution state");
  assert.match(tick, /this\.simulation\.tick\(dt, p, this\.mode !== "spectator"\)/);
  assert.match(tick, /this\.entities\.tick\(/);
});

test("authoritative gameplay and persistence modules do not import visual preset controls", () => {
  const forbidden = /(?:graphicsQuality|graphicsProfile|GRAPHICS_PROFILES|AdaptiveResolution|renderScale|dprCap)/;
  for (const directory of ["src/game", "src/world", "src/player", "src/persistence"]) {
    const walk = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(entry => {
      const relative = path.join(dir, entry.name);
      return entry.isDirectory() ? walk(relative) : entry.name.endsWith(".ts") ? [relative] : [];
    });
    for (const file of walk(directory)) {
      const source = fs.readFileSync(path.join(root, file), "utf8");
      assert.equal(forbidden.test(source), false, `${file} must not consume graphics-preset or adaptive-resolution state`);
    }
  }
});
