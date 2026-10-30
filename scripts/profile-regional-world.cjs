// Bounded CPU observations, not a hardware FPS certification.
const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText.replace(/import\.meta\.url/g,'"file:///generation.worker.ts"'),f);
const {World}=require('../src/world/world.ts'),{Entities}=require('../src/game/entities.ts'),{Inventory}=require('../src/game/inventory.ts'),{travelDestinations,safeTravelArrival}=require('../src/game/city-life/travel.ts'),{measureRegionalLandUse,regionalLandUseAt}=require('../src/world/regions/land-use.ts'),{freshWorld,validateSave}=require('../src/persistence/saves.ts');
const quantile=(a,p)=>[...a].sort((a,b)=>a-b)[Math.min(a.length-1,Math.floor(a.length*p))]??0;
require('node:child_process').execFileSync(process.execPath,['scripts/verify-dist.mjs'],{stdio:'inherit'});
const verifiedSource=require('node:crypto').createHash('sha256').update(JSON.stringify(JSON.parse(fs.readFileSync('dist/release-integrity.json','utf8')).source)).digest('hex');
const report={verifiedSource,recordedAt:new Date().toISOString(),node:process.version,seeds:[],generation:[],scenarios:[],visits:[],disposal:[]};
for(const seed of ['jade-harbor','different-city','长江玉港','china-coast','lotus-42']){
  const t=performance.now(),w=new World(seed,{},false,9),es=new Entities(w,undefined,1/6),planMs=performance.now()-t,m=measureRegionalLandUse(w.macroPlan,w.regionalPlan);
  assert(m.genericForest<.05);assert.equal(es.list.filter(e=>e.kind==='villager').length,4080);
  let extendedTotal=0,extendedForest=0;for(let z=-880;z<800;z+=8)for(let x=-800;x<800;x+=8){extendedTotal++;if(regionalLandUseAt(w.macroPlan,w.regionalPlan,x,z)==="wild-forest")extendedForest++;}
  const legacyEnvelopeAudit={bounds:{x1:-800,x2:800,z1:-880,z2:800},step:8,total:extendedTotal,genericForest:extendedForest/extendedTotal};
  assert(legacyEnvelopeAudit.genericForest<.05);
  const save=freshWorld('Profile',seed,'creative');save.simulation=es.serialize();validateSave(save);
  const routes=w.regionalPlan.sites.flatMap(s=>s.routes.flat());
  report.seeds.push({seed,planAndPopulationMs:planMs,landUse:m,legacyEnvelopeAudit,residents:es.list.length,lots:w.metropolisPlan.lots.length,plannedLandscapeCells:w.regionalPlan.landscapes.patches.length,landscapeContexts:[...new Set(w.regionalPlan.landscapes.patches.map(p=>p.context))],regionalChunks:w.regionalPlan.byChunk.size,maxLocalRouteSegments:Math.max(...[...w.regionalPlan.routesByChunk.values()].map(a=>a.length)),newRegions:w.regionalPlan.sites.map(s=>({id:s.id,anchor:s.reservation.anchor,buildings:s.buildings.length,publicPoints:s.loop.length})),routeExtents:{x1:Math.min(...routes.map(p=>p.x)),x2:Math.max(...routes.map(p=>p.x)),z1:Math.min(...routes.map(p=>p.z)),z2:Math.max(...routes.map(p=>p.z))},saveBytes:Buffer.byteLength(JSON.stringify(save))});es.dispose();w.dispose();console.log('PLAN',seed,m.genericForest);
}
for(const version of[8,9]) {
  const w=new World('jade-harbor',{},false,version),es=new Entities(w,undefined,1/6),registry=travelDestinations(w),inv=new Inventory();
  for(const d of registry.filter(d=>d.id!=='district:panda-plaza'&&d.id!=='district:heritage'&&d.category!=='landmark')) {
    let generation=0;
    for(const key of w.stream(d.arrival.x,d.arrival.z,3)){};
    for(let z=-3;z<=3;z++)for(let x=-3;x<=3;x++)if(x*x+z*z<=12.25){const t=performance.now();w.ensure(Math.floor(d.arrival.x/16)+x,Math.floor(d.arrival.z/16)+z,true);generation+=performance.now()-t;}
    const p=safeTravelArrival(w,d);assert(p,d.id);const entity=[],nav=[],life=[],walked=new Map(),last=new Map();let active=0,jobs=0,nodes=0;
    for(let i=0;i<1200;i++){
      es.tick(.05,p,inv,(10-6)/24+i*.05/1200,false,()=>{},()=>{});entity.push(es.tickMs);nav.push(es.navigation.solveMs);life.push(es.life.metrics.scheduleMs);
      active=Math.max(active,es.life.active.size);jobs=Math.max(jobs,es.navigation.agents.size);nodes=Math.max(nodes,es.navigation.expandedLastTick);
      assert(active<=96);assert(jobs<=102);assert(nodes<=96);assert.equal(new Set(es.list.map(e=>e.id)).size,es.list.length);
      if(i%20===0)for(const e of es.list.filter(e=>es.life.active.has(e.id))){const old=last.get(e.id);if(old)walked.set(e.id,(walked.get(e.id)??0)+Math.hypot(old.x-e.body.position.x,old.z-e.body.position.z));last.set(e.id,{...e.body.position});}
    }
    const row={version,destination:d.id,simulatedSeconds:60,preparationGenerationMs:generation,entityP50:quantile(entity,.5),entityP95:quantile(entity,.95),navP95:quantile(nav,.95),scheduleP95:quantile(life,.95),activePeak:active,navJobsPeak:jobs,expandedPeak:nodes,movingOver4m:[...walked.values()].filter(x=>x>4).length,columns:w.chunks.size};report.scenarios.push(row);console.log('SCENE',JSON.stringify(row));
  }
  for(let turn=0;turn<3;turn++)for(const d of registry){w.stream(d.arrival.x,d.arrival.z,2);for(let z=-1;z<=1;z++)for(let x=-1;x<=1;x++)w.ensure(Math.floor(d.arrival.x/16)+x,Math.floor(d.arrival.z/16)+z,true);es.life.reactivate();es.tick(.05,d.arrival,inv,.2,false,()=>{},()=>{});assert(w.chunks.size<=256);assert(w.pending.size<=8);assert(es.life.active.size<=96);report.visits.push({version,id:d.id,columns:w.chunks.size,active:es.life.active.size,jobs:es.navigation.agents.size});}
  es.dispose();w.dispose();global.gc?.();report.disposal.push({version,columns:w.chunks.size,pending:w.pending.size,entities:es.list.length,agents:es.navigation.agents.size,heapBytes:process.memoryUsage().heapUsed});assert.equal(w.chunks.size,0);assert.equal(es.list.length,0);assert.equal(es.navigation.agents.size,0);
}
fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/regional-world-profile.json',JSON.stringify({status:'passed',...report},null,2));
