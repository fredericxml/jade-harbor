// Same-coordinate, full-column CPU comparison. Run from the repository root.
const fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText.replace(/import\.meta\.url/g,'"file:///generation.worker.ts"'),f);
const {createV5Generator}=require('../src/world/generator-v5.ts'),{createRealizationPlan}=require('../src/world/landmarks/plan.ts');
const {World}=require('../src/world/world.ts'),{Lighting}=require('../src/world/lighting.ts'),{meshChunk}=require('../src/render/mesher.ts');
const seed='jade-harbor',base=createV5Generator(seed),started=performance.now(),plan=createRealizationPlan(base.plan,base.landmarks,base.metropolis),landmarkPlanMs=performance.now()-started;
const report={recordedAt:new Date().toISOString(),node:process.version,platform:process.platform,seed,generator:6,basePlanMs:base.planMs,landmarkPlanMs,diagnostics:plan.diagnostics,wallNodes:plan.wallWalk.length,sites:[]};
for(const site of plan.sites){
 const x=Math.floor(site.reservation.anchor.x/16),z=Math.floor(site.reservation.anchor.z/16),samples=[];
 for(const version of [5,6]){
  const w=new World(seed,{},false,version),times=[],t=performance.now();
  for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const s=performance.now();w.ensure(x+dx,z+dz,true);times.push(performance.now()-s);}
  const generationMs=performance.now()-t,l=new Lighting(w),ls=performance.now();l.rebuild();const lightingMs=performance.now()-ls,ms=performance.now();let triangles=0,meshes=0;
  for(const c of w.chunks.values())for(const part of meshChunk(w,c,l)){triangles+=part.indices.length/3;meshes++;}
  samples.push({version,columns:w.chunks.size,generationMs,medianColumnMs:times.sort((a,b)=>a-b)[4],lightingMs,meshingMs:performance.now()-ms,triangles,meshes,blockBytes:[...w.chunks.values()].reduce((n,c)=>n+c.blocks.byteLength,0)});w.dispose();
 }
 report.sites.push({id:site.id,name:site.name,anchor:site.reservation.anchor,samples});console.log('PROFILE',site.id,JSON.stringify(samples));
}
fs.mkdirSync('test-results/landmarks',{recursive:true});fs.writeFileSync('test-results/landmarks/performance.json',JSON.stringify(report,null,2)+'\n');
console.log('PLAN',JSON.stringify({baseMs:report.basePlanMs,landmarkMs:landmarkPlanMs,...plan.diagnostics}));
