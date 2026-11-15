const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = p => fs.readFileSync(path.join(root, p), "utf8");

test("GpuTimer has idempotent final disposal and rejects new work afterward", () => {
  const s = read("src/render/gpu-timer.ts");
  assert.match(s, /private disposed = false/);
  assert.match(s, /begin\(\)\s*\{\s*if\s*\(this\.disposed\s*\|\|/);
  assert.match(s, /dispose\(\)\s*\{\s*if\s*\(this\.disposed\)\s*return/);
  assert.match(s, /this\.clearQueries\(\)/);
});

test("View unregisters context listeners and disposes owned renderer resources", () => {
  const s = read("src/render/renderer.ts");
  assert.match(s, /removeEventListener\("webglcontextlost",this\.handleContextLost\)/);
  assert.match(s, /removeEventListener\("webglcontextrestored",this\.handleContextRestored\)/);
  assert.match(s, /for\(const geometry of geometries\)geometry\.dispose\(\)/);
  assert.match(s, /for\(const material of materials\)material\.dispose\(\)/);
  assert.match(s, /this\.atlas\.texture\.dispose\(\)/);
  assert.match(s, /this\.renderer\.dispose\(\)/);
  assert.match(s, /this\.clouds\.clear\(\);this\.hand\.clear\(\);this\.heldModel\.clear\(\)/);
});

test("EntityView releases shared geometry and cached materials only at final teardown", () => {
  const s = read("src/render/entity-view.ts");
  assert.match(s, /dispose\(\)\s*\{[\s\S]*?this\.clear\(\)[\s\S]*?this\.geometry\.dispose\(\)/);
  assert.match(s, /for\(const material of this\.materials\.values\(\)\)material\.dispose\(\)/);
  assert.match(s, /if\(this\.disposed\)return/);
});

test("Effects removes scene objects and disposes geometry/material allocations", () => {
  const s = read("src/render/effects.ts");
  assert.match(s, /this\.scene\.remove\(this\.mesh,this\.rain\)/);
  assert.match(s, /this\.mesh\.geometry\.dispose\(\)/);
  assert.match(s, /this\.rain\.geometry\.dispose\(\)/);
  assert.match(s, /this\.particles\.length=0/);
});

test("UI owns and removes delegated event listeners and transient timer", () => {
  const s = read("src/ui/ui.ts");
  assert.match(s, /private removers:Array<\(\)=>void>=\[\]/);
  assert.match(s, /target\.removeEventListener\(type,listener,options\)/);
  assert.match(s, /for\(const remove of this\.removers\)remove\(\)/);
  assert.match(s, /window\.clearTimeout\(this\.toastTimer\)/);
});

test("Game owns one cancellable RAF and awaits save before releasing resources", () => {
  const s = read("src/core/game.ts");
  assert.match(s, /private frameHandle:number\|null=null/);
  assert.match(s, /cancelAnimationFrame\(this\.frameHandle\)/);
  assert.match(s, /if\(this\.disposed\)return/);
  assert.match(s, /dispose\(\):Promise<void>\{[\s\S]*?if\(this\.disposeTask\)return this\.disposeTask/);
  assert.match(s, /await\(this\.saveTask\?\?this\.save\(\)\)/);
  for (const resource of ["this.ui.dispose()", "this.entities.dispose()", "this.world.dispose()", "this.entityView.dispose()", "this.effects.dispose()", "this.view.dispose()", "this.audio.dispose()"])
    assert.ok(s.includes(resource), `Game teardown must call ${resource}`);
});

test("World disposal invalidates outstanding work and terminates generation worker", () => {
  const s = read("src/world/world.ts");
  const body = s.slice(s.indexOf("  dispose() {"));
  assert.match(body, /this\.disposed\s*=\s*true/);
  assert.match(body, /this\.epoch\+\+/);
  assert.match(body, /this\.worker\.terminate\(\)/);
  assert.match(body, /this\.chunks\.clear\(\)/);
});


test("Lighting releases evicted-column light entries and staged work", () => {
  const s = read("src/world/lighting.ts");
  assert.match(s, /private blockLightChunks=new Map/);
  assert.match(s, /pruneUnloaded\(chunkKeys:readonly string\[\]\)/);
  assert.match(s, /for\(const sectionKeyValue of sections\)[\s\S]*?this\.blockLightSections\.delete\(sectionKeyValue\)/);
  assert.match(s, /this\.sky\.delete\(key\)/);
  assert.match(s, /this\.job=undefined/);
  assert.match(s, /this\.blockLightChunks\.clear\(\)/);
});

test("Game prunes lighting as soon as streaming evicts columns", () => {
  const s = read("src/core/game.ts");
  assert.match(s, /if\(evicted\.length\)this\.lighting\.pruneUnloaded\(evicted\)/);
  assert.match(s, /this\.lighting\.dispose\(\);this\.world\.dispose\(\)/);
});

test("World detaches worker callbacks before terminating it", () => {
  const s = read("src/world/world.ts");
  assert.match(s, /this\.worker\.onmessage=null;this\.worker\.onerror=null;this\.worker\.terminate\(\)/);
});


test("Lighting closes staged generators before dropping their cache references", () => {
  const s = read("src/world/lighting.ts");
  assert.match(s, /private cancelJob\(\)\{if\(!this\.job\)return;try\{this\.job\.return\(false\)/);
  assert.match(s, /this\.cancelJob\(\)/);
  assert.match(s, /new Map<string,string\[\]>\(\)/);
  assert.match(s, /blockLightSections=new Map<string,Uint8Array>\(\)/);
  assert.match(s, /new Int32Array\(4096\)/);
});

test("Simulation and automation release world-bound registries and entity-array aliases", () => {
  const simulation = read("src/game/simulation.ts");
  const automation = read("src/game/automation.ts");
  assert.match(simulation, /dispose\(\)\{[\s\S]*?this\.automation\.dispose\(\)[\s\S]*?this\.specials\.clear\(\)[\s\S]*?this\.queue\.clear\(\)/);
  assert.match(automation, /dispose\(\)\{[\s\S]*?this\.drops\.length=0[\s\S]*?Object\.keys\(this\.hoppers\)/);
});

test("GpuTimer runtime disposal closes an active query and prevents new queries", () => {
  const ts = require("typescript");
  const source = read("src/render/gpu-timer.ts");
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", js)(require, module, module.exports);
  let created = 0, deleted = 0, ended = 0;
  const gl = {
    QUERY_RESULT_AVAILABLE: 1, QUERY_RESULT: 2,
    getExtension: () => ({ TIME_ELAPSED_EXT: 3, GPU_DISJOINT_EXT: 4 }),
    createQuery: () => ({ id: ++created }), beginQuery: () => {}, endQuery: () => { ended++; },
    deleteQuery: () => { deleted++; }, getQueryParameter: () => false, getParameter: () => false,
  };
  const timer = new module.exports.GpuTimer(gl);
  timer.begin(); timer.begin(); timer.begin();
  assert.equal(timer.begin(), true);
  timer.dispose();
  assert.equal(ended, 1);
  assert.equal(deleted, 1);
  assert.equal(timer.begin(), false);
  assert.equal(timer.poll(100), null);
  timer.dispose();
  assert.equal(deleted, 1);
});

test("Lighting runtime pruning removes only the evicted chunk and closes staged work", () => {
  const ts = require("typescript");
  const source = read("src/world/lighting.ts");
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  const mocks = {
    "./blocks": { emits: () => 0, block: () => ({ opaque: false }) },
    "../core/coords": { blockKey: (x,y,z) => `${x},${y},${z}`, index: () => 0, MIN_Y: -64, MAX_Y: 320, sectionKey: (x,y,z) => `${x},${y},${z}`, chunkKey: (x,z) => `${x},${z}`, chunkCoord: n => Math.floor(n/16), localCoord: n => ((n%16)+16)%16 },
  };
  new Function("require", "module", "exports", js)((id) => mocks[id] ?? require(id), module, module.exports);
  const world = { navRevision: 7, chunks: new Map(), dirty: new Set(), loaded: () => false, get: () => 0 };
  const light = new module.exports.Lighting(world);
  light.blockLight = new Map([["1,2,3", 12], ["17,2,3", 8]]);
  light.sky = new Map([["0,0", new Int16Array(256)], ["1,0", new Int16Array(256)]]);
  light.blockLightChunks = new Map([["0,0", ["0,0,0"]], ["1,0", ["1,0,0"]]]);
  let returned = false;
  light.job = { next: () => ({ done: false }), return: () => { returned = true; return { done: true, value: false }; } };
  light.pruneUnloaded(["0,0"]);
  assert.equal(returned, true);
  assert.equal(light.pending, false);
  assert.equal(light.blockLight.has("1,2,3"), false);
  assert.equal(light.blockLight.get("17,2,3"), 8);
  assert.equal(light.sky.has("0,0"), false);
  assert.equal(light.sky.has("1,0"), true);
  assert.equal(light.signature, -1);
  light.dispose();
  assert.equal(light.blockLight.size, 0);
  assert.equal(light.sky.size, 0);
  assert.deepEqual(light.sample(0, 1, 0), [1, 0]);
});
