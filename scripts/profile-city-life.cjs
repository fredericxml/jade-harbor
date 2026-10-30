// Actual fixed-tick entity/navigation work. Rendering is measured separately by
// the browser harness; these CPU point samples are not hardware FPS promises.
const fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText.replace(/import\.meta\.url/g,'"file:///generation.worker.ts"'),f);
const {World}=require('../src/world/world.ts'),{Entities}=require('../src/game/entities.ts'),{Inventory}=require('../src/game/inventory.ts');
const hour=h=>((h-6)/24+1)%1;
const quantile=(a,p)=>[...a].sort((x,y)=>x-y)[Math.min(a.length-1,Math.floor(a.length*p))]??0;
function ensure(w,p,r=3){for(let z=-r;z<=r;z++)for(let x=-r;x<=r;x++)w.ensure(Math.floor(p.x/16)+x,Math.floor(p.z/16)+z,true);}
function point(es,id){return es.life.plan.spaces.find(s=>s.district===id).position;}
function sample(w,es,p,time,ticks=600){
 const inv=new Inventory(),entity=[],navigation=[],schedule=[],events=[];let active=0,jobs=0,nodes=0,previous=es.life.metrics.updates,searches=es.navigation.searchesStarted;
 for(let i=0;i<ticks;i++){
  es.tick(.05,p,inv,(time+i*.05/1200)%1,false,()=>{},()=>{});entity.push(es.tickMs);navigation.push(es.navigation.solveMs);
  if(es.life.metrics.updates!==previous){schedule.push(es.life.metrics.scheduleMs);events.push(es.life.metrics.eventMs);previous=es.life.metrics.updates;}
  active=Math.max(active,es.life.metrics.active);jobs=Math.max(jobs,es.navigation.agents.size);nodes=Math.max(nodes,es.navigation.expandedLastTick);
  if(active>16||jobs>22||nodes>96)throw Error('Living-city runtime budget exceeded');
 }
 return {ticks,simulatedSeconds:ticks*.05,residents:es.list.filter(e=>e.kind==='villager').length,activePeak:active,navJobsPeak:jobs,nodesPerTickPeak:nodes,
  searchesPerSimulatedSecond:(es.navigation.searchesStarted-searches)/(ticks*.05),entityP50:quantile(entity,.5),entityP95:quantile(entity,.95),navP95:quantile(navigation,.95),
  scheduleUpdateP95:quantile(schedule,.95),eventUpdateP95:quantile(events,.95),eventParticipants:es.life.event?.participants.length??0,
  pathNodes:[...es.navigation.agents.values()].reduce((n,a)=>n+a.path.length,0),chunks:w.chunks.size,heapBytes:process.memoryUsage().heapUsed};
}
const report={recordedAt:new Date().toISOString(),node:process.version,platform:process.platform,scenarios:[],roam:[],disposals:[]};
for(const seed of ['jade-harbor','different-city']){
 const probe=new World(seed,{},false,6),probeEntities=new Entities(probe),p=probe.landmarkPlan;
 const scenes=[['panda',point(probeEntities,'heritage'),hour(12)],['market',point(probeEntities,'market'),hour(9)],['nightlife',point(probeEntities,'nightlife'),hour(20)],['harbor',point(probeEntities,'harbor'),hour(8)],
  ['palace',probeEntities.life.plan.residents.find(r=>r.landmark==='imperial-complex').workplace,hour(15)],['wall',probeEntities.life.plan.residents.find(r=>r.landmark==='ridge-fortification').workplace,hour(15)],
  ['garden',probeEntities.life.plan.residents.find(r=>r.landmark==='scenic-landscape').workplace,hour(16)]];
 probeEntities.dispose();probe.dispose();
 for(const [name,position,time]of scenes){
  const w=new World(seed,{},false,6),es=new Entities(w,undefined,time);ensure(w,position);
  const row={seed,name,...sample(w,es,position,time)};report.scenarios.push(row);console.log('PROFILE',JSON.stringify(row));es.dispose();w.dispose();
 }
 const w=new World(seed,{},false,6),es=new Entities(w,undefined,hour(12));
 for(let lap=0;lap<4;lap++)for(const [name,position,time]of [...scenes,scenes[0]]){
  ensure(w,position);w.stream(position.x,position.z,3);
  const row={seed,lap,name,...sample(w,es,position,time,80),pinned:w.evictionBlocked};
  if(row.residents!==36||row.chunks>256||new Set(es.list.map(e=>e.id)).size!==es.list.length)throw Error('Long-roam accumulation');report.roam.push(row);
 }
 const before=process.memoryUsage().heapUsed;es.dispose();w.dispose();global.gc?.();
 report.disposals.push({seed,heapBefore:before,heapAfterGC:process.memoryUsage().heapUsed,chunks:w.chunks.size,navigation:es.navigation.agents.size,entities:es.list.length});
}
// Explicit concentration stress is separate from the natural district layout.
{
 const w=new World('jade-harbor',{},false,6),es=new Entities(w,undefined,hour(18)),p=point(es,'heritage');ensure(w,p);
 es.list.filter(e=>e.kind==='villager').forEach((e,i)=>{e.body.position={...p,x:p.x-7+i%8*2,z:p.z+Math.floor(i/8)*2};});
 const row={seed:'jade-harbor',name:'activation-stress',fixture:'36 residents concentrated for budget testing; not natural crowd placement',...sample(w,es,p,hour(18),400)};
 report.scenarios.push(row);console.log('PROFILE',JSON.stringify(row));es.dispose();w.dispose();
}
fs.mkdirSync('test-results/city-life',{recursive:true});fs.writeFileSync('test-results/city-life/performance.json',JSON.stringify(report,null,2)+'\n');
console.log('PASS finite population, active/route/node caps, 64 region visits and disposal');
