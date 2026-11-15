const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const distant=read('src/render/distant-world.ts');
const game=read('src/core/game.ts');

function method(source,name,nextName){
  const start=source.indexOf(name);
  assert.notEqual(start,-1,`missing ${name}`);
  const end=source.indexOf(nextName,start);
  return source.slice(start,end<0?source.length:end);
}

test('terrain and water proxy publish before optional skyline-anchor generation begins',()=>{
  const build=method(distant,'private *build(plan:DistantPlan)','/** Publish the terrain/water foundation');
  const publish=build.indexOf('this.publishTerrainWater(ground,waterGeometry');
  const anchors=build.indexOf('const anchors=new DistantBuffer');
  assert.ok(publish>=0&&anchors>publish,'terrain/water must be attached before anchor geometry is allocated');
  assert.match(build,/this\.publishTerrainWater\(ground,waterGeometry,terrain\.count\/3,water\?water\.count\/3:0\);\s*yield;/);
});

test('publishing a new proxy surface replaces only terrain/water and retains existing anchors',()=>{
  const publish=method(distant,'private publishTerrainWater(','/** Reuses the bitmap');
  assert.match(publish,/this\.group\.remove\(this\.terrain\)/);
  assert.match(publish,/this\.group\.remove\(this\.distantWater\)/);
  assert.match(publish,/this\.terrain\.geometry\.dispose\(\)/);
  assert.match(publish,/this\.distantWater\.geometry\.dispose\(\)/);
  assert.match(publish,/this\.group\.add\(this\.terrain\)/);
  assert.match(publish,/if\(this\.distantWater\)this\.group\.add\(this\.distantWater\)/);
  assert.ok(!publish.includes('this.group.clear()'),'must not clear a still-valid anchor mesh');
  assert.ok(!publish.includes('this.anchors'),'terrain publication must not dispose/recreate anchors');
});

test('anchor geometry is committed independently and only then marks the full proxy ready',()=>{
  const build=method(distant,'private *build(plan:DistantPlan)','/** Publish the terrain/water foundation');
  const crown=build.indexOf('const crown=anchors.geometry()');
  const attach=build.indexOf('this.group.add(this.anchors)',crown);
  const ready=build.indexOf('this.stats.ready=true',attach);
  assert.ok(crown>=0&&attach>crown&&ready>attach);
  assert.match(build,/this\.stats\.anchorsReady=true/);
  assert.match(distant,/terrainReady:false,anchorsReady:false,ready:false/);
});

test('profile replacement keeps the old visible proxy until the new terrain stage is ready',()=>{
  const profile=method(distant,'  setProfile(profile:GraphicsProfile){','  private *build(plan:DistantPlan)');
  assert.match(profile,/this\.work\?\.return\(undefined\)/);
  assert.match(profile,/for\(const g of this\.pending\)g\.dispose\(\)/);
  assert.match(profile,/terrainReady=!!this\.terrain/);
  assert.match(profile,/anchorsReady=!!this\.anchors/);
  assert.ok(!profile.includes('this.group.clear()'));
});

test('camera movement does not restart proxy generation and coverage is reconciled during the same update',()=>{
  const update=method(distant,'  update(camera:Vec3','  dispose()');
  assert.match(update,/while\(this\.work&&slices\+\+<8&&performance\.now\(\)-begin<2\)/);
  assert.match(update,/this\.coverageIndex\?\.update\(meshed,changes,revision,changeBase,this\.world\.navRevision\)/);
  assert.match(update,/u\.cameraXZ\.value\.set\(camera\.x,camera\.z\)/);
  assert.match(update,/wu\.cameraXZ\.value\.set\(camera\.x,camera\.z\)/);
  assert.ok(!update.includes('this.work?.return'),'camera changes must not cancel the resumable generator');
});

test('F3 and performance reports distinguish terrain-ready from anchors-ready states',()=>{
  assert.match(game,/proxy terrain \$\{this\.view\.distant\?\.stats\.terrainReady\?/);
  assert.match(game,/anchors \$\{this\.view\.distant\?\.stats\.anchorsReady\?/);
  assert.match(game,/terrainReady:v\.distant\.stats\.terrainReady,anchorsReady:v\.distant\.stats\.anchorsReady/);
});
test('consolidated rendering release coverage for distant scene readiness', () => {
  const pkg=JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname,'../package.json'),'utf8'));
  assert.ok(pkg.scripts['test:rendering']?.includes('tests/distant-scene-readiness.test.cjs'), 'Behavioral test must remain in its subsystem suite');
  assert.ok(pkg.scripts['test:regression']?.includes('npm run test:rendering'), 'Regression must execute the subsystem');
  assert.ok(pkg.scripts['test:performance']?.includes('npm run test:rendering'), 'Performance verification must execute rendering');
});
