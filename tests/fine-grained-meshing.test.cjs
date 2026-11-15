const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const mesher = read('src/render/mesher.ts');
const renderer = read('src/render/renderer.ts');

test('meshing uses a shared bounded work budget for voxel scans and face processing', () => {
  assert.match(mesher, /export const MESH_SLICE_WORK_BUDGET = 64/);
  assert.match(mesher, /if \(sliceWork >= MESH_SLICE_WORK_BUDGET\)/);
  assert.equal((mesher.match(/if \(sliceWork >= MESH_SLICE_WORK_BUDGET\)/g) || []).length, 2,
    'both voxel traversal and face traversal must be preemptible');
  assert.doesNotMatch(mesher, /MESH_SLICE_CELL_BUDGET|sliceCells/);
});

test('meshing preserves the shared frame budget and round-robin active-job scheduler', () => {
  assert.match(renderer, /const meshBudgetMs=Math\.max\(1,Math\.min\(7,this\.meshAdmissionHeadroomMs\*0\.5\)\)/,
    'meshing uses measured prior-frame CPU headroom with a 1–7 ms bounded budget');
  assert.match(renderer, /index\+\+;\s*if\(index>=nearest\.length\)index=0/);
  assert.match(renderer, /if\(performance\.now\(\)-started>meshBudgetMs\)break/);
  assert.match(renderer, /iterator:meshChunkSteps\(world,c,this\.lighting,sy\)/);
});

test('meshing retains atomic section replacement and stale-job cancellation', () => {
  assert.match(renderer, /const completed=this\.advanceMeshCommit\(world,commit\)/);
  assert.match(renderer, /job\.iterator\.return\?\.\(undefined as unknown as MeshData\[\]\)/);
  assert.match(renderer, /this\.disposePendingCommit\(commit\)/);
});
