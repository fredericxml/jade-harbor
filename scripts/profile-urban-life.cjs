// Matched v6/v7 engineering observations. CPU samples are not browser FPS.
const fs = require('node:fs'), ts = require('typescript');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText.replace(/import\.meta\.url/g, '"file:///generation.worker.ts"'), f);
const { World } = require('../src/world/world.ts'), { Entities } = require('../src/game/entities.ts'), { Inventory } = require('../src/game/inventory.ts');
const { Lighting } = require('../src/world/lighting.ts'), { meshChunk } = require('../src/render/mesher.ts');
const { freshWorld, validateSave } = require('../src/persistence/saves.ts');
const { createPopulation } = require('../src/game/city-life/population.ts');
const { nearestRoadPoint } = require('../src/world/metropolis/plan.ts'), { safeActivityPoint } = require('../src/game/city-life/runtime.ts');
const hour = h => ((h - 6) / 24 + 1) % 1;
const quantile = (a, p) => [...a].sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * p))] ?? 0;
const ensure = (w, p, r = 3) => { for (let z = -r; z <= r; z++) for (let x = -r; x <= r; x++) w.ensure(Math.floor(p.x / 16) + x, Math.floor(p.z / 16) + z, true); };
function frontHit(a, b, r) {
  let lo = 0, hi = 1;
  for (const axis of ['x', 'z']) { const d = b[axis] - a[axis]; if (!d) { if (a[axis] < r[`${axis}1`] || a[axis] > r[`${axis}2`]) return false; } else {
    const u = (r[`${axis}1`] - a[axis]) / d, v = (r[`${axis}2`] - a[axis]) / d; lo = Math.max(lo, Math.min(u, v)); hi = Math.min(hi, Math.max(u, v)); if (lo > hi) return false;
  } }
  return true;
}
function frontage(density) {
  const before = density.baseUrban, rows = new Map(before.districts.map(d => [d.id, { district: d.id, samples: 0, before: 0, after: 0 }]));
  for (const road of before.roads.filter(r => !r.owner)) { let traveled = 0, next = 4;
    for (let i = 1; i < road.points.length; i++) { const a = road.points[i - 1], b = road.points[i], dx = b.x - a.x, dz = b.z - a.z, n = Math.hypot(dx, dz); if (!n) continue;
      for (; next <= traveled + n; next += 8) {
        const t = (next - traveled) / n, p = { x: a.x + dx * t, z: a.z + dz * t }, d = before.districts.find(d => p.x >= d.bounds.x1 && p.x <= d.bounds.x2 && p.z >= d.bounds.z1 && p.z <= d.bounds.z2); if (!d) continue;
        for (const side of [-1, 1]) { const nx = -dz / n * side, nz = dx / n * side, from = { x: p.x + nx * (road.half + 1), z: p.z + nz * (road.half + 1) }, to = { x: p.x + nx * (road.half + 25), z: p.z + nz * (road.half + 25) }, row = rows.get(d.id);
          if (density.openSpaces.some(s => from.x >= s.bounds.x1 && from.x <= s.bounds.x2 && from.z >= s.bounds.z1 && from.z <= s.bounds.z2)) continue;
          row.samples++; if (before.lots.some(l => frontHit(from, to, l))) row.before++; if (density.urban.lots.some(l => frontHit(from, to, l))) row.after++;
        }
      } traveled += n;
    }
  }
  return [...rows.values()].map(r => ({ ...r, beforeFraction: r.before / r.samples, afterFraction: r.after / r.samples }));
}
function sample(w, es, p, time, ticks = 1200) {
  const inv = new Inventory(), entity = [], nav = [], schedules = [], events = [], initial = new Map(es.list.map(e => [e.id, { ...e.body.position }])), walked = new Map();
  let active = 0, jobs = 0, nodes = 0, previous = es.life.metrics.updates, searches = es.navigation.searchesStarted;
  const cap = es.life.plan.presence?.active ?? 16;
  for (let i = 0; i < ticks; i++) {
    es.tick(.05, p, inv, (time + i * .05 / 1200) % 1, false, () => {}, () => {}); entity.push(es.tickMs); nav.push(es.navigation.solveMs);
    if (es.life.metrics.updates !== previous) { schedules.push(es.life.metrics.scheduleMs); events.push(es.life.metrics.eventMs); previous = es.life.metrics.updates; }
    active = Math.max(active, es.life.metrics.active); jobs = Math.max(jobs, es.navigation.agents.size); nodes = Math.max(nodes, es.navigation.expandedLastTick);
    if (active > cap || jobs > cap + 6 || nodes > 96) throw Error('Urban runtime budget exceeded');
    if (i % 20 === 0) for (const id of es.life.active) { const e = es.list.find(e => e.id === id), a = initial.get(id); if (a) walked.set(id, (walked.get(id) ?? 0) + Math.hypot(e.body.position.x - a.x, e.body.position.z - a.z)); initial.set(id, { ...e.body.position }); }
  }
  return { ticks, simulatedSeconds: ticks * .05, residents: es.list.filter(e => e.kind === 'villager').length, activePeak: active, navJobsPeak: jobs, nodesPerTickPeak: nodes, movingOver4m: [...walked.values()].filter(n => n > 4).length,
    searchesPerSimulatedSecond: (es.navigation.searchesStarted - searches) / (ticks * .05), entityP50: quantile(entity, .5), entityP95: quantile(entity, .95), navP95: quantile(nav, .95), scheduleP95: quantile(schedules, .95), eventP95: quantile(events, .95),
    pathNodes: [...es.navigation.agents.values()].reduce((n, a) => n + a.path.length, 0), chunks: w.chunks.size, pending: w.pending.size, heapBytes: process.memoryUsage().heapUsed };
}
const report = { recordedAt: new Date().toISOString(), node: process.version, platform: process.platform, plans: [], generation: [], scenarios: [], roam: [], disposals: [] };
for (const seed of ['jade-harbor', 'different-city', '长江玉港']) {
  const t = performance.now(), w = new World(seed, {}, false, 7), density = w.densityPlan, planMs = performance.now() - t;
  const start = performance.now(), es = new Entities(w, undefined, hour(10)), activationMs = performance.now() - start;
  const save = freshWorld('Urban profile', seed, 'creative'); save.generator = 7; save.simulation = es.serialize(); validateSave(save);
  report.plans.push({ seed, planMs, activationMs, lots: density.urban.lots.length, added: density.infill.length, neighborhoods: es.life.plan.presence.neighborhoods.length, hubs: es.life.plan.presence.neighborhoods.filter(n=>n.kind!=="street").length, roads: density.urban.roads.length, maxLocalLots: Math.max(...[...density.urban.lotsByChunk.values()].map(v=>v.length)), maxLocalRoads: Math.max(...[...density.urban.roadsByChunk.values()].map(v=>v.length)), residents: es.life.plan.residents.length, saveBytes: Buffer.byteLength(JSON.stringify(save)), districts: density.districts, diagnostics: density.diagnostics, frontage: frontage(density) });
  console.log('PLAN', JSON.stringify(report.plans.at(-1))); es.dispose(); w.dispose();
}
const scenes = [['avenue', { x: .5, y: 21.002, z: 24.5 }, 10], ['market', { x: -223.5, y: 25.002, z: -215.5 }, 9], ['harbor', { x: 120.5, y: 18.002, z: 340.5 }, 8], ['nightlife', { x: .5, y: 21.002, z: 180.5 }, 20], ['highland', { x: -223.5, y: 25.002, z: -343.5 }, 10]];
// Resolve ordinary standing height from actual street metadata and voxels.
{
  const w = new World('jade-harbor', {}, false, 7);
  for (const [, p] of scenes) {
    const q = w.metropolisPlan.roads.filter(r => !r.owner).map(r => nearestRoadPoint(r, p.x, p.z)).sort((a, b) => a.distance - b.distance)[0];
    ensure(w, p, 1); const safe = safeActivityPoint(w, { ...p, y: Math.round(q.y * 2) / 2 + 1.002 }); if (!safe) throw Error('CPU scene lacks an actual standing surface'); Object.assign(p, safe);
  }
  w.dispose();
}
for (const [name, p, h] of scenes) for (const version of [6, 7]) {
  const w = new World('jade-harbor', {}, false, version), times = [];
  for (let z = -1; z <= 1; z++) for (let x = -1; x <= 1; x++) { const t = performance.now(); w.ensure(Math.floor(p.x / 16) + x, Math.floor(p.z / 16) + z, true); times.push(performance.now() - t); }
  const light = new Lighting(w), lt = performance.now(); light.rebuild(); const lightingMs = performance.now() - lt, mt = performance.now(); let triangles = 0, meshes = 0;
  for (const c of w.chunks.values()) for (const mesh of meshChunk(w, c, light)) { triangles += mesh.indices.length / 3; meshes++; }
  report.generation.push({ version, name, columns: 9, generationMs: times.reduce((a, b) => a + b, 0), columnP50: quantile(times, .5), columnP95: quantile(times, .95), lightingMs, meshingMs: performance.now() - mt, triangles, meshes, blockBytes: [...w.chunks.values()].reduce((n, c) => n + c.blocks.byteLength, 0) }); w.dispose();
}
for (const seed of ['jade-harbor', 'different-city']) for (const version of [6, 7]) {
  const probe = new World(seed, {}, false, version), expectedResidents = createPopulation(probe).residents.length, sites = probe.landmarkPlan.sites;
  const fixtures = [...scenes, ...sites.filter(s => ['archaeology', 'ridge-fortification', 'scenic-landscape'].includes(s.id)).map(s => [s.id, { ...s.entry, x: s.entry.x + .5, y: s.entry.y + 1.002, z: s.entry.z + .5 }, 10])]; probe.dispose();
  for (const [name, position, h] of fixtures) { const w = new World(seed, {}, false, version), es = new Entities(w, undefined, hour(h)); ensure(w, position);
    const row = { version, seed, name, ...sample(w, es, position, hour(h)) }; report.scenarios.push(row); console.log('PROFILE', JSON.stringify(row)); es.dispose(); w.dispose();
  }
  if (version === 6) continue;
  const w = new World(seed, {}, false, version), es = new Entities(w, undefined, hour(10));
  for (let lap = 0; lap < 4; lap++) for (const [name, position, h] of [...fixtures, fixtures[0]]) {
    ensure(w, position); w.stream(position.x, position.z, 3); const row = { seed, lap, name, ...sample(w, es, position, hour(h), 120), pinned: w.evictionBlocked };
    if (row.residents !== expectedResidents || row.chunks > 256 || new Set(es.list.map(e => e.id)).size !== es.list.length) throw Error('Long-roam accumulation'); report.roam.push(row);
  }
  const before = process.memoryUsage().heapUsed; es.dispose(); w.dispose(); global.gc?.();
  report.disposals.push({ seed, heapBefore: before, heapAfterGC: process.memoryUsage().heapUsed, chunks: w.chunks.size, navigation: es.navigation.agents.size, entities: es.list.length, plans: w.planCount });
}
{
  const w = new World('jade-harbor', {}, false, 7), es = new Entities(w, undefined, hour(18)), p = { x: .5, y: 21.002, z: -10.5 }; ensure(w, p);
  es.list.filter(e => e.kind === 'villager').slice(0, 80).forEach((e, i) => { e.body.position = { ...p, x: p.x - 7 + i % 8 * 2, z: p.z + Math.floor(i / 8) * 2 }; });
  const row = { version: 7, seed: 'jade-harbor', name: 'activation-stress', fixture: '80 actors concentrated only to exercise 48-active cap; not natural visual placement', ...sample(w, es, p, hour(18), 600) };
  if (row.activePeak !== 48) throw Error('Concentration failed to exercise active cap'); report.scenarios.push(row); console.log('STRESS', JSON.stringify(row)); es.dispose(); w.dispose();
}
fs.mkdirSync('test-results/urban-life', { recursive: true }); fs.writeFileSync('test-results/urban-life/performance.json', JSON.stringify(report, null, 2) + '\n');
console.log('PASS matched generation, finite populations, CPU/navigation budgets, 72 repeat region visits and disposal');
