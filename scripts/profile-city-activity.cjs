// Comparative CPU observations. Browser latency and real-time visible activity
// have separate UI-driven tests; this is not a hardware GPU/FPS certificate.
const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict'),crypto=require('node:crypto');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText.replace(/import\.meta\.url/g,'"file:///generation.worker.ts"'),f);
const {World}=require('../src/world/world.ts'),{Entities}=require('../src/game/entities.ts'),{Inventory}=require('../src/game/inventory.ts');
const {journalPlaces,travelDestinations,travelColumns,safeTravelArrival}=require('../src/game/city-life/travel.ts'),{measureRegionalLandUse}=require('../src/world/regions/land-use.ts');
const {planBuilding}=require('../src/world/metropolis/quality.ts');
const {planRichBuilding,drawRichLot,FACADE_GRAMMARS}=require('../src/world/metropolis/richness.ts'),{VoxelWriter}=require('../src/world/city/writer.ts'),{BlockColumn}=require('../src/world/sections.ts');
const {verifyReleaseManifest}=require('./release-integrity.mjs');verifyReleaseManifest();
const source=crypto.createHash('sha256').update(JSON.stringify(JSON.parse(fs.readFileSync('dist/release-integrity.json','utf8')).source)).digest('hex');
const q=(a,p)=>[...a].sort((a,b)=>a-b)[Math.min(a.length-1,Math.floor(a.length*p))]??0;
const report={status:'running',source,recordedAt:new Date().toISOString(),node:process.version,plans:[],architecture:[],scenarios:[],visits:[],disposal:[]};
const facade=d=>d.facadeGrammar??(d.family==='cargo-warehouse'?'loading-bay':d.family.includes('arcade')?'arcade':['court','paired-court','work-court'].includes(d.massing)?'court-gate':d.balcony?'balcony-lattice':'post-and-window');
const frontage=d=>d.frontage??(d.family.includes('arcade')?'arcade':['court','paired-court','work-court'].includes(d.massing)?'gate':d.seed%3===0?'awning':'flush');
const shape=d=>[d.roofGrammar??d.roof,d.axis??0,d.floors,facade(d)].join(':');
const full=(lot,d)=>{const a=d.roofGrammar?planRichBuilding(lot,d):planBuilding(lot,d);return JSON.stringify([a.volumes,a.roofs.map(r=>({...r,level:r.level-lot.baseY,support:r.support===undefined?undefined:r.support-lot.baseY})),a.story,d.bay,d.wall,d.tile,d.sign,d.balcony,...(d.roofGrammar?[d.facadeGrammar,d.frontage,d.rhythm,d.cornerStyle,d.trim]:[d.seed%2,d.seed%3])]);};
for(const seed of ['jade-harbor','different-city','长江玉港','china-coast','lotus-42']) {
  const t=performance.now(),w=new World(seed,{},false,10),e=new Entities(w,undefined,1/6);
  const planningMs=performance.now()-t,landUse=measureRegionalLandUse(w.macroPlan,w.regionalPlan);assert(landUse.genericForest<.05);
  report.plans.push({seed,planningAndPopulationMs:planningMs,generatorPlanningMs:w.inspectTerrain(0,0).planMs,lots:w.metropolisPlan.lots.length,residents:e.life.plan.residents.length,activeCap:e.life.plan.presence.active,landUse,regions:w.regionalPlan.sites.map(s=>({id:s.id,buildings:s.buildings.length}))});e.dispose();w.dispose();console.log('PLAN',seed,planningMs.toFixed(1));
}
for(const version of [9,10]) {
  const w=new World('jade-harbor',{},false,version),e=new Entities(w,undefined,1/6),inv=new Inventory(),plan=w.metropolisPlan;
  for(const district of plan.districts) {
    const lots=plan.lots.filter(l=>l.districtId===district.id),ds=lots.map(l=>w.densityPlan.designs.get(l.id));let pairs=0,nearDuplicates=0,exactDuplicates=0;
    for(const lot of lots){const other=lots.filter(b=>b.id!==lot.id).sort((a,b)=>Math.hypot(a.x1-lot.x1,a.z1-lot.z1)-Math.hypot(b.x1-lot.x1,b.z1-lot.z1))[0];if(!other||lot.id>other.id)continue;pairs++;const a=w.densityPlan.designs.get(lot.id),b=w.densityPlan.designs.get(other.id);if(shape(a)===shape(b))nearDuplicates++;if(full(lot,a)===full(other,b))exactDuplicates++;}
    report.architecture.push({version,district:district.id,lots:lots.length,roofGrammars:new Set(ds.map(d=>d.roofGrammar??d.roof)).size,roofAxes:new Set(ds.map(d=>d.axis??0)).size,massings:new Set(ds.map(d=>d.composition??d.massing)).size,facadeGrammars:new Set(ds.map(facade)).size,frontages:new Set(ds.map(frontage)).size,heightCounts:Object.fromEntries([...new Set(ds.map(d=>d.floors))].sort().map(f=>[f,ds.filter(d=>d.floors===f).length])),nearestPairs:pairs,nearDuplicates,exactDuplicates,uniqueCoarseShapes:new Set(ds.map(shape)).size});
  }
  if(version===10) {
    const sourceLot=plan.lots.find(l=>l.facing===0),lot={...sourceLot,x1:1,x2:12,z1:1,z2:12,baseY:20,facing:0},base={...w.densityPlan.designs.get(sourceLot.id),floors:2,composition:'hall',roofGrammar:'gable',rise:4,eave:1,bay:5,rhythm:0,balcony:false,footprint:[{u:0,v:0,w:12,d:12,floors:2}]},outcomes=new Set();
    for(const axis of [0,1])for(const facadeGrammar of FACADE_GRAMMARS)for(const frontage of ['flush','shop-canopy','arcade','recessed-porch']){const d={...base,axis,facadeGrammar,frontage},c=new BlockColumn();drawRichLot(new VoxelWriter(c,0,0),lot,d,planRichBuilding(lot,d));const b=Buffer.alloc(16*16*48*2);let i=0;for(let y=20;y<68;y++)for(let z=0;z<16;z++)for(let x=0;x<16;x++){b.writeUInt16LE(c.get(x,y,z),i);i+=2;}outcomes.add(crypto.createHash('sha256').update(b).digest('hex'));}
    report.physicalRichnessWitness={fixedBaseBuildings:1,attemptedDescendants:64,uniqueEmittedVoxelOutcomes:outcomes.size,changedDimensions:['ridge axis','facade grammar','street relationship'],fixed:['lot','massing','height','palette','roof family'],includesUnusedConfiguration:false};assert(outcomes.size>=25);
  }
  const registry=journalPlaces(w).filter(d=>d.category==='region'||d.category==='district'&&!['district:panda-plaza','district:heritage'].includes(d.id)).map(d=>({...d,arrival:d.discoveryPosition}));
  for(const d of registry) {
    const hour=d.id==='district:nightlife'?18:d.id==='district:scholar'?14:d.id==='district:harbor'?8:10,time=(hour-6)/24;
    w.stream(d.arrival.x,d.arrival.z,3);const generation=[];
    for(let z=-3;z<=3;z++)for(let x=-3;x<=3;x++)if(x*x+z*z<=12.25){const t=performance.now();w.ensure(Math.floor(d.arrival.x/16)+x,Math.floor(d.arrival.z/16)+z,true);generation.push(performance.now()-t);}
    const arrival=safeTravelArrival(w,d);assert(arrival,d.id);e.life.reactivate();
    const ticks=[],nav=[],schedules=[],lastPurpose=new Map(),outfits=new Set(),roles=new Set(),actions=new Set();let moments=0,actorSamples=0,moving=0,acting=0,activePeak=0,expandedPeak=0,jobsPeak=0;
    const walked=new Map(),last=new Map();
    for(let i=0;i<1200;i++) {
      e.tick(.05,arrival,inv,time,false,()=>{},()=>{});ticks.push(e.tickMs);nav.push(e.navigation.solveMs);schedules.push(e.life.metrics.scheduleMs);
      activePeak=Math.max(activePeak,e.life.active.size);expandedPeak=Math.max(expandedPeak,e.navigation.expandedLastTick);jobsPeak=Math.max(jobsPeak,e.navigation.agents.size);
      assert(activePeak<=96);assert(expandedPeak<=96);assert(jobsPeak<=102);
      for(const actor of e.list.filter(a=>e.life.active.has(a.id))) {
        const s=e.life.states.get(actor.id),r=e.life.plan.byId.get(actor.id),speed=Math.hypot(actor.body.velocity.x,actor.body.velocity.z),pose=version===10?s.taskActing:s.arrived&&s.pauseUntil>e.elapsed&&r.circuit?.dwellPoints?.includes(s.circuitIndex),index=version===10?s.taskIndex:s.circuitIndex;
        const pause=pose&&speed<=.2,key=pause?`${index}:${version===10?s.taskAction:r.circuit.routine}`:'';
        if(key&&lastPurpose.get(actor.id)!==key)moments++;lastPurpose.set(actor.id,key);
        if(r.task){outfits.add(r.task.look.fingerprint);roles.add(r.task.role);if(pause)actions.add(s.taskAction);}
        actorSamples++;if(speed>.2)moving++;else if(pause)acting++;
        if(i%20===0){const p=last.get(actor.id);if(p)walked.set(actor.id,(walked.get(actor.id)??0)+Math.hypot(actor.body.position.x-p.x,actor.body.position.z-p.z));last.set(actor.id,{...actor.body.position});}
      }
    }
    const row={version,id:d.id,simulatedSeconds:60,hour,entityP50:q(ticks,.5),entityP95:q(ticks,.95),navP95:q(nav,.95),scheduleP95:q(schedules,.95),columnGenerationP95:q(generation,.95),purposefulPauseStarts:moments,actorSamples,movingRatio:moving/actorSamples,roleActionRatio:acting/actorSamples,unclassifiedIdleRatio:1-(moving+acting)/actorSamples,movingOver4m:[...walked.values()].filter(v=>v>4).length,roleDiversity:roles.size,appearanceDiversity:outfits.size,actions:[...actions],activePeak,expandedPeak,jobsPeak,columns:w.chunks.size};report.scenarios.push(row);fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/city-activity-profile-progress.json',JSON.stringify(report,null,2));console.log('SCENE',JSON.stringify(row));
  }
  const all=travelDestinations(w);
  for(let lap=0;lap<3;lap++)for(const d of all){w.stream(d.arrival.x,d.arrival.z,2);for(const c of travelColumns(d))w.ensure(c.cx,c.cz,true);e.life.reactivate();e.tick(.05,d.arrival,inv,1/6,false,()=>{},()=>{});assert.equal(new Set(e.list.map(e=>e.id)).size,e.list.length);assert(w.chunks.size<=256);assert(e.life.active.size<=96);report.visits.push({version,id:d.id,columns:w.chunks.size,pending:w.pending.size,active:e.life.active.size,jobs:e.navigation.agents.size,heapBytes:process.memoryUsage().heapUsed});}
  e.dispose();w.dispose();global.gc?.();report.disposal.push({version,columns:w.chunks.size,pending:w.pending.size,entities:e.list.length,agents:e.navigation.agents.size,heapBytes:process.memoryUsage().heapUsed});assert.equal(w.chunks.size,0);assert.equal(e.list.length,0);assert.equal(e.navigation.agents.size,0);
}
report.activityComparison=report.scenarios.filter(s=>s.version===10).map(now=>{const old=report.scenarios.find(s=>s.version===9&&s.id===now.id);return{id:now.id,before:old.purposefulPauseStarts,after:now.purposefulPauseStarts,ratio:old.purposefulPauseStarts?now.purposefulPauseStarts/old.purposefulPauseStarts:null,beforeIdle:old.unclassifiedIdleRatio,afterIdle:now.unclassifiedIdleRatio};});
for(const row of report.activityComparison)assert(row.before===0||row.ratio>=5,`${row.id}: less than 5x completed observable role actions`);
verifyReleaseManifest();report.status='passed';fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/city-activity-profile.json',JSON.stringify(report,null,2));
