const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const renderer = read('src/render/renderer.ts');
const world = read('src/world/world.ts');
const lighting = read('src/world/lighting.ts');

test('meshing uses a retained binary min-heap instead of rescanning the dirty Set per batch', () => {
  assert.match(renderer, /private readonly meshQueueHeap:NearestSection\[\]=\[\]/);
  assert.match(renderer, /private pushMeshQueue\(entry:NearestSection\)/);
  assert.match(renderer, /private popMeshQueue\(heap:NearestSection\[\]=this\.meshQueueHeap\):NearestSection\|undefined/);
  assert.match(renderer, /private readonly meshQueueBackgroundHeap:NearestSection\[\]=\[\]/);
  assert.match(renderer, /private popNextMeshQueue\(\)/);
  assert.match(renderer, /this\.pushMeshQueue\(entry\)/);
  assert.match(renderer, /this\.popNextMeshQueue\(\)/);
  assert.match(renderer, /this\.popMeshQueue\(this\.meshQueueBackgroundHeap\)/);
  assert.match(renderer, /while\(nearest\.length<limit&&\(this\.meshQueueHeap\.length\|\|this\.meshQueueBackgroundHeap\.length\)\)/);
  assert.match(renderer, /this\.meshQueueForegroundStreak<3/);
  assert.match(renderer, /reserveBackground/);
  assert.doesNotMatch(renderer, /const batchPending=nearest\.some/);
  assert.equal((renderer.match(/world\.dirty\.values\(\)/g) || []).length, 1,
    'the full dirty Set iterator is created only when a queue scan is initialized');
});

test('new lighting dirty sections are journaled for incremental admission without relying on navRevision', () => {
  assert.match(world, /dirtyAddRevision = 0/);
  assert.match(world, /this\.dirtyAddRevision\+\+/);
  assert.match(world, /this\.dirtyAddQueueSet\.add\(key\)/);
  assert.match(world, /this\.dirtyAddQueue\.push\(key\)/);
  assert.match(renderer, /dirtyScanAddCursor/);
  assert.match(renderer, /while\(this\.dirtyScanAddCursor<addQueue\.length&&admittedThisFrame<admissionLimit\)/);
  assert.match(renderer, /admissionHardCap=256/);
  assert.match(renderer, /admissionBudgetMs/);
  assert.doesNotMatch(renderer, /dirtyScanAddRevision!==currentAddRevision/);
  assert.match(lighting, /this\.world\.markSection\(cx,sy,cz\)/);
  assert.doesNotMatch(lighting, /this\.world\.dirty\.add\(/);
});

test('world invalidation and clear release work while camera changes only refresh priorities', () => {
  assert.match(renderer, /const cameraCellChanged=this\.dirtyScanCameraCell!==cameraCell/);
  assert.match(renderer, /this\.refreshMeshQueueFacing\(world,eye,cameraCellChanged\|\|this\.evictionQueueRefresh\)/);
  assert.match(renderer, /this\.resetMeshQueue\(world,cameraCell\)/);
  assert.match(renderer, /this\.meshQueueHeap\.length=0/);
  assert.match(renderer, /this\.meshQueueBackgroundHeap\.length=0/);
  assert.match(renderer, /this\.nearestSections\.length=0/);
});
