const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('distant water classification keeps fully wet/dry cells decisive and probes mixed shore cells',()=>{
  const source=read('src/render/distant-water.ts');
  const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{}};new Function('exports','require','module','__filename','__dirname',js)(mod.exports,require,mod,__filename,__dirname);
  const classify=mod.exports.classifyDistantWaterCell;
  assert.equal(classify(true,true,true,true,false),true);
  assert.equal(classify(false,false,false,false,false),false);
  assert.equal(classify(true,false,true,false,true),true);
  assert.equal(classify(true,false,false,false,false),false);
});

test('far water is a separate transparent draw and does not tint opaque terrain or structures',()=>{
  const material=read('src/render/material.ts'),world=read('src/render/distant-world.ts');
  assert.match(material,/export function distantWaterMaterial/);
  assert.match(material,/transparent:\s*true/);
  assert.match(material,/depthWrite:\s*false/);
  assert.match(material,/depthTest:\s*true/);
  assert.match(material,/vertexColors:\s*true/);
  assert.match(material,/name:\s*"JadeHarborDistantWater"/);
  assert.match(world,/private distantWater\?:THREE\.Mesh/);
  assert.match(world,/this\.distantWater=waterGeometry\?new THREE\.Mesh\(waterGeometry,this\.waterMaterial\)/);
  assert.match(world,/this\.group\.add\(this\.terrain\);if\(this\.distantWater\)this\.group\.add\(this\.distantWater\)/);
  assert.match(world,/this\.group\.add\(this\.anchors\)/);
  assert.match(world,/this\.publishTerrainWater\(ground,waterGeometry/);
  assert.match(world,/this\.distantWater\.renderOrder=-1/);
  assert.match(world,/waterTriangles:0/);
  assert.match(world,/wu\.waterTint\.value\.copy\(atmosphere\.water\)/);
  assert.match(world,/this\.waterMaterial\.dispose\(\)/);
});

test('distant water uses near-water atmosphere tint, soft alpha, fog and detailed coverage mask',()=>{
  const shader=read('src/render/shader-quality.ts');
  assert.match(shader,/export const DISTANT_WATER_FRAGMENT_SHADER/);
  const far=shader.slice(shader.indexOf('export const DISTANT_WATER_FRAGMENT_SHADER'),shader.indexOf('/** Radius is embedded'));
  for(const term of ['waterTint','fogColor','fogNear','fogFar','coverage','covered(sy,cell)','gl_FragColor=vec4(color,.46)'])assert.ok(far.includes(term),`missing far water contract ${term}`);
  assert.ok(!far.includes('distanceSquared<576.'),'far water must not create a hard inner-radius hole');
  assert.ok(far.includes('distanceSquared>518400.'),'far water retains the outer render radius');
});

test('distant terrain has no fixed 24-block exclusion; coverage owns near/far transitions',()=>{
  const shader=read('src/render/shader-quality.ts');
  const start=shader.indexOf('export function distantFragmentShader');
  const far=shader.slice(start);
  assert.ok(far.includes('covered(sy,cell)'));
  assert.ok(!far.includes('distanceSquared<576.'),'fixed 24-block discard caused proxy holes before detailed meshes were ready');
  assert.ok(far.includes('distanceSquared>${maxDistanceSquared}'));
});

test('coarse water cells are split from terrain and shoreline probes are incremental build work',()=>{
  const world=read('src/render/distant-world.ts');
  assert.match(world,/const cellWater=new Uint8Array\(plan\.width\*plan\.depth\)/);
  assert.match(world,/classifyDistantWaterCell\(wa,wb,wc,wd,centerWater\)/);
  assert.match(world,/Only shoreline cells need a center probe/);
  assert.match(world,/\n      yield;\n    }\n    const terrain=new DistantBuffer/);
  assert.match(world,/const terrain=new DistantBuffer\(\(plan\.width\*plan\.depth-waterCellCount\)\*6\)/);
  assert.match(world,/const water=waterCellCount\?new DistantBuffer\(waterCellCount\*6\):undefined/);
  assert.match(world,/if\(isWater\)waterAt\+=6;else at\+=6/);
  assert.match(world,/this\.publishTerrainWater\(ground,waterGeometry,terrain\.count\/3,water\?water\.count\/3:0\)/);
  assert.match(world,/this\.stats\.waterTriangles=waterTriangles/);
  assert.match(world,/this\.distantWater\?\.geometry\.dispose\(\)/);
});
test('consolidated rendering release coverage for distant water continuity', () => {
  const pkg=JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname,'../package.json'),'utf8'));
  assert.ok(pkg.scripts['test:rendering']?.includes('tests/distant-water-continuity.test.cjs'), 'Behavioral test must remain in its subsystem suite');
  assert.ok(pkg.scripts['test:regression']?.includes('npm run test:rendering'), 'Regression must execute the subsystem');
  assert.ok(pkg.scripts['test:performance']?.includes('npm run test:rendering'), 'Performance verification must execute rendering');
});
