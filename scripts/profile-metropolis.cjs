// Real generation, lighting and meshing; run from the repository root.
const fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText.replace(/import\.meta\.url/g,'"file:///generation.worker.ts"'),file);
const {createV5Generator}=require('../src/world/generator-v5.ts');
const {World}=require('../src/world/world.ts'),{Lighting}=require('../src/world/lighting.ts'),{meshChunk}=require('../src/render/mesher.ts');
const seed='jade-harbor',g=createV5Generator(seed),p=g.metropolis;
const report={recordedAt:new Date().toISOString(),node:process.version,platform:process.platform,architecture:process.arch,seed,generator:5,
  planMs:g.planMs,lots:p.lots.length,roads:p.roads.length,blocks:p.blocks.length,roadPoints:p.roads.reduce((n,r)=>n+r.points.length,0),
  index:{lotChunks:p.lotsByChunk.size,roadChunks:p.roadsByChunk.size,maxLotsPerChunk:Math.max(...[...p.lotsByChunk.values()].map(x=>x.length)),maxRoadsPerChunk:Math.max(...[...p.roadsByChunk.values()].map(x=>x.length))},districts:[]};
for(const d of p.districts){
  const lots=p.lots.filter(l=>l.districtId===d.id),lot=lots.find(l=>l.archetype===d.archetypes[0][0])??lots[0],x=Math.floor((lot.x1+lot.x2)/32),z=Math.floor((lot.z1+lot.z2)/32);
  const samples=[];
  for(const version of [4,5]){
    const world=new World(seed,{},false,version),times=[],started=performance.now();
    for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const t=performance.now();world.ensure(x+dx,z+dz,true);times.push(performance.now()-t);}
    const generationMs=performance.now()-started,l=new Lighting(world),t=performance.now();l.rebuild();const lightingMs=performance.now()-t,m=performance.now();let triangles=0,meshes=0;
    for(const chunk of world.chunks.values())for(const mesh of meshChunk(world,chunk,l)){triangles+=mesh.indices.length/3;meshes++;}
    samples.push({version,columns:world.chunks.size,generationMs,medianColumnMs:times.sort((a,b)=>a-b)[4],lightingMs,meshingMs:performance.now()-m,triangles,meshes,blockBytes:[...world.chunks.values()].reduce((n,c)=>n+c.blocks.byteLength,0)});world.dispose();
  }
  const counts=key=>Object.fromEntries([...new Set(lots.map(l=>l[key]))].map(v=>[v,lots.filter(l=>l[key]===v).length]));
  report.districts.push({id:d.id,name:d.name,lotCount:lots.length,archetypes:counts('archetype'),floors:counts('floors'),roofFamilies:counts('roofFamily'),facades:counts('facade'),position:{x:lot.x1,z:lot.z1},samples});
  console.log('PROFILE',d.id,JSON.stringify(samples));
}
fs.mkdirSync('test-results/metropolis',{recursive:true});fs.writeFileSync('test-results/metropolis/performance.json',JSON.stringify(report,null,2)+'\n');
console.log('PLAN',JSON.stringify({ms:report.planMs,lots:report.lots,roads:report.roads,index:report.index}));
