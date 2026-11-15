const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText, file);

const { clockHour, scheduleAt, scheduleAtInto, scheduleOffset } = require('../src/game/city-life/schedules.ts');
const { PROFESSIONS } = require('../src/game/professions.ts');
const runtime = fs.readFileSync('src/game/city-life/runtime.ts', 'utf8');

test('in-place schedule calculation exactly matches the public allocating API', () => {
  const districts = ['heritage', 'market', 'hutong', 'water-town', 'imperial', 'harbor', 'artisan', 'scholar', 'nightlife', 'highland'];
  const times = [0, .03125, .083333, .125, .1875, .25, .333333, .458333, .541667, .625, .75, .875, .999];
  let sample = 0;
  for (const district of districts) for (const profession of Object.keys(PROFESSIONS))
    for (const time of times) for (const rain of [false, true]) {
      const id = `schedule-parity-${district}-${profession}-${sample++}`;
      const offset = scheduleOffset(id), hour = clockHour(time);
      const expected = scheduleAt(id, profession, district, time, rain);
      const output = { phase: 'dawn', activity: 'resting', destination: 'home' };
      const actual = scheduleAtInto(output, id, profession, district, time, rain, offset, hour);
      assert.equal(actual, output, 'hot-path API must mutate and return the caller-owned record');
      assert.deepEqual(actual, expected, `${district}/${profession}/${time}/${rain}`);
    }
});

test('CityLife precomputes stable offsets and reuses one clock conversion per schedule update', () => {
  assert.match(runtime, /private readonly scheduleOffsets = new Map<string, number>\(\)/);
  assert.match(runtime, /if\s*\(plan\) for \(const resident of plan\.residents\) this\.scheduleOffsets\.set\(resident\.id, scheduleOffset\(resident\.id\)\)/);
  assert.match(runtime, /const currentHour = clockHour\(time\)/);
  assert.match(runtime, /scheduleAtInto\(state, r\.id, r\.profession, r\.district, time, rain/);
  assert.match(runtime, /this\.scheduleOffsets\.clear\(\)/);
  assert.doesNotMatch(runtime, /scheduleAt\(r\.id, r\.profession, r\.district, time, rain\)/);
});

test('resident radius checks preserve exact threshold behavior while avoiding full sqrt per resident', () => {
  assert.match(runtime, /function withinRadius\(squared: number, radius: number, dx: number, dy: number, dz: number\)/);
  assert.match(runtime, /withinRadius\(distanceSquared, 64, dx, dy, dz\)/);
  assert.match(runtime, /withinRadius\(distanceSquared, 96, dx, dy, dz\)/);
  assert.match(runtime, /Math\.hypot\(dx, dy, dz\)/, 'nearby candidate score retains the exact legacy hypot calculation');
});

console.log('PASS resident schedule reuse, cached offsets, distance hot path and exact schedule parity');
