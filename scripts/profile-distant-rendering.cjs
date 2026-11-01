const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=process.cwd(),ts=require(path.join(root,'node_modules/typescript'));
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText.replace(/import\.meta\.url/g,'"file:///generation.worker.ts"'),f);
const {World}=require(path.join(root,'src/world/world.ts')),{Atmosphere}=require(path.join(root,'src/render/atmosphere.ts')),{DistantWorld}=require(path.join(root,'src/render/distant-world.ts'));
const output=process.env.DISTANT_PROFILE_OUTPUT||'test-results/distant-rendering/results.json',rows=[];
for(const seed of ['jade-harbor','different-city','长江玉港']){
 const began=performance.now(),w=new World(seed,{},false,10);const planningMs=performance.now()-began;
 for(const quality of (process.env.DISTANT_PROFILE_QUALITIES||'high,medium,low').split(','))for(let lap=0;lap<3;lap++){
  const atmosphere=new Atmosphere(),empty=new Set(),start=performance.now(),d=new DistantWorld(w,atmosphere,require(path.join(root,'src/render/graphics.ts')).graphicsProfile(quality));const constructorMs=performance.now()-start,slices=[];
  for(let i=0;i<4096&&!d.stats.ready;i++){const t=performance.now();d.update({x:0,y:30,z:0},empty,atmosphere,0);slices.push(performance.now()-t);}
  if(!d.stats.ready)throw Error('build never ready');const sorted=[...slices].sort((a,b)=>a-b),row={seed,quality,lap,worldPlanningMs:planningMs,constructorMs,largestUpdateMs:Math.max(...slices),p95UpdateMs:sorted[Math.floor(sorted.length*.95)],stats:{...d.stats},geometries:d.group.children.filter(x=>x.geometry).length};rows.push(row);console.log('BUILD',JSON.stringify(row));d.dispose();
 }
 w.dispose();
}
const manifest=JSON.parse(fs.readFileSync('dist/release-integrity.json','utf8'));fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify({source:crypto.createHash('sha256').update(JSON.stringify(manifest.source)).digest('hex'),rows},null,2));
