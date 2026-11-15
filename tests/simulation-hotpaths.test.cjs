#!/usr/bin/env node
"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const ts=require("typescript");
require.extensions[".ts"]=(module,filename)=>{
  const source=fs.readFileSync(filename,"utf8");
  const output=ts.transpileModule(source,{fileName:filename,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  module._compile(output,filename);
};
const {selectTopK,selectTopKInto}=require("../src/game/city-life/active-actors.ts");

test("reusable top-K output matches stable full-sort reference across randomized ties and limits",()=>{
  let seed=0x12345678;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/0x100000000;};
  const compare=(a,b)=>a.score-b.score||a.id.localeCompare(b.id);
  const out=[];
  for(let trial=0;trial<600;trial++){
    const count=Math.floor(random()*220),items=Array.from({length:count},(_,i)=>({id:`${String(Math.floor(random()*20)).padStart(2,"0")}:${i}`,score:Math.floor(random()*12)}));
    const limit=[0,1,2,3,16,32,64,96,count,count+1][Math.floor(random()*10)];
    const expected=[...items].sort(compare).slice(0,Math.max(0,Math.floor(limit)));
    const actual=selectTopKInto(items,limit,compare,out);
    assert.equal(actual,out);
    assert.deepEqual(actual,expected,`trial ${trial}, limit ${limit}`);
  }
});

test("top-K output array identity is reused across consecutive calls",()=>{
  const out=[],items=Array.from({length:4000},(_,i)=>({id:String(i),score:(i*7919)%4000}));
  const compare=(a,b)=>a.score-b.score||a.id.localeCompare(b.id);
  selectTopKInto(items,96,compare,out);const identity=out;
  selectTopKInto(items.slice(500),96,compare,out);
  assert.equal(out,identity);
  assert.deepEqual(out,[...items.slice(500)].sort(compare).slice(0,96));
});

test("navigation hot loops use module-level direction/sample tables instead of per-node nested literals",()=>{
  const source=fs.readFileSync(path.join(__dirname,"../src/game/navigation/pathfinder.ts"),"utf8");
  assert.match(source,/const NAV_DIRECTIONS\s*=\s*\[\[1,0\],\[-1,0\],\[0,1\],\[0,-1\]\]/);
  assert.match(source,/const TRAVERSE_FRACTIONS\s*=\s*\[\.25,\.5,\.75,1\]/);
  assert.match(source,/const STAND_HAZARD_OFFSETS\s*=/);
  assert.doesNotMatch(source,/for\(const \[dx,dz\] of \[\[1,0\],\[-1,0\],\[0,1\],\[0,-1\]\]\)/);
});

test("city-life hot selection reuses candidate, ranked, public-cell and event buffers",()=>{
  const source=fs.readFileSync(path.join(__dirname,"../src/game/city-life/runtime.ts"),"utf8");
  for(const field of ["candidateEntries","rankedEntries","publicCells","eventEligible"])assert.match(source,new RegExp(`private readonly ${field}`));
  assert.match(source,/selectTopKInto\(this\.candidateEntries/);
  assert.match(source,/scheduleAtInto\(state, r\.id, r\.profession, r\.district, time, rain/);
  assert.match(source,/const phase = s\.phase, destination = s\.destination/);
  assert.doesNotMatch(source,/candidates\.map\(entity => \(\{ entity, score:/);
});

test("navigation stores its last position in place instead of replacing the vector each steer tick",()=>{
  const source=fs.readFileSync(path.join(__dirname,"../src/game/navigation/pathfinder.ts"),"utf8");
  assert.match(source,/if\(a\.last\)\{a\.last\.x=p\.x;a\.last\.y=p\.y;a\.last\.z=p\.z;\}else a\.last=\{\.\.\.p\}/);
});

test("CityLife preserves exact active-resident selection while reusing ranking buffers",()=>{
  const {CityLife}=require("../src/game/city-life/runtime.ts");
  const {spawnEntity}=require("../src/game/entities.ts");
  const list=[],byId=new Map();
  for(let i=0;i<4080;i++){
    const x=(i%64-32)*.72,z=(Math.floor(i/64)-32)*.72;
    const e={...spawnEntity("villager",{x,y:21,z}),id:`resident:${String(i).padStart(4,"0")}`};
    list.push(e);
    byId.set(e.id,{id:e.id,profession:"resident",district:"market",home:{x,y:21,z},workplace:{x,y:21,z},public:{x,y:21,z},workLoop:[{x,y:21,z}],circuit:undefined,task:undefined,landmark:undefined});
  }
  const world={terrainLayout:7,loaded:()=>true,get:()=>0};
  const life=Object.create(CityLife.prototype);
  Object.assign(life,{
    world,plan:{byId,spaces:[],presence:{active:96}},
    states:new Map(),active:new Set(),activeActors:[],event:undefined,
    metrics:{updates:0,scheduleMs:0,eventMs:0,active:0,mid:0,far:0,relocations:0,fallbacks:0},
    nextUpdate:0,lastTime:NaN,taskActors:[],nextTaskUpdate:0,
    candidateEntries:[],rankedEntries:[],publicCells:new Map(),eventEligible:[],
    purposeMetrics:{completedActions:0,updates:0}
  });
  const nav={agents:new Map()};
  const player={x:0,y:21,z:0},time=17/24; // 23:00 game clock
  life.prepare(list,player,time,false,1,nav);
  const expected=list.map(entity=>({entity,score:Math.hypot(entity.body.position.x,entity.body.position.y-player.y,entity.body.position.z)}))
    .sort((a,b)=>a.score-b.score||(a.entity.id<b.entity.id?-1:a.entity.id>b.entity.id?1:0)).slice(0,96).map(x=>x.entity.id);
  assert.deepEqual([...life.activeActors].map(e=>e.id),list.filter(e=>life.active.has(e.id)).map(e=>e.id));
  assert.deepEqual([...life.active].sort(),[...expected].sort());
  const candidateBuffer=life.candidateEntries,rankedBuffer=life.rankedEntries,cellBuffer=life.publicCells,eventBuffer=life.eventEligible;
  life.prepare(list,player,time,false,3,nav);
  assert.equal(life.candidateEntries,candidateBuffer);
  assert.equal(life.rankedEntries,rankedBuffer);
  assert.equal(life.publicCells,cellBuffer);
  assert.equal(life.eventEligible,eventBuffer);
});

test("navigation reuses an agent's last-position vector across steering ticks",()=>{
  const {Navigation}=require("../src/game/navigation/pathfinder.ts");
  const world={navRevision:0};
  const nav=new Navigation(world);
  const target={x:5,y:21,z:0},position={x:0,y:21,z:0};
  const agent={path:[{x:5,y:21,z:0}],index:0,target:"5,42,0",retry:0,status:"ready",revision:0,stuck:0};
  nav.agents.set("npc",agent);
  assert.equal(nav.steer("npc",position,target,.05),agent.path[0]);
  const last=agent.last;
  position.x=.1;
  assert.equal(nav.steer("npc",position,target,.05),agent.path[0]);
  assert.equal(agent.last,last);
  assert.equal(last.x,.1);
});

test("CityLife preserves public-space and close-interaction priority",()=>{
  const {CityLife}=require("../src/game/city-life/runtime.ts");
  const {spawnEntity}=require("../src/game/entities.ts");
  const list=[],byId=new Map();
  for(let i=0;i<600;i++){
    const x=(i%30-15)*1.6,z=(Math.floor(i/30)-10)*1.4;
    const e={...spawnEntity("villager",{x,y:21,z}),id:`v8:${String(i).padStart(3,"0")}`};
    list.push(e);byId.set(e.id,{id:e.id,profession:"resident",district:"market",home:{x,y:21,z},workplace:{x,y:21,z},public:{x,y:21,z},workLoop:[{x,y:21,z}]});
  }
  const urban={panda:{x1:-5,x2:5,z1:-5,z2:5},roadsByChunk:new Map()};
  const world={terrainLayout:8,metropolisPlan:urban,loaded:()=>true,get:()=>0};
  const life=Object.create(CityLife.prototype);
  Object.assign(life,{world,plan:{byId,spaces:[],presence:{active:48}},states:new Map(),active:new Set(),activeActors:[],event:undefined,
    metrics:{updates:0,scheduleMs:0,eventMs:0,active:0,mid:0,far:0,relocations:0,fallbacks:0},nextUpdate:0,lastTime:NaN,taskActors:[],nextTaskUpdate:0,
    candidateEntries:[],rankedEntries:[],publicCells:new Map(),eventEligible:[],purposeMetrics:{completedActions:0,updates:0}});
  life.prepare(list,{x:0,y:21,z:0},17/24,false,1,{agents:new Map()});
  const expected=list.map(entity=>{
    const p=entity.body.position,d=Math.hypot(p.x,p.y-21,p.z);
    let score=d;
    if(d>12){if(p.x>=-5&&p.x<=5&&p.z>=-5&&p.z<=5&&Math.abs(p.y-21)<2)score-=80;}
    else score-=200;
    return {id:entity.id,score};
  }).sort((a,b)=>a.score-b.score||(a.id<b.id?-1:a.id>b.id?1:0)).slice(0,48).map(x=>x.id).sort();
  assert.deepEqual([...life.active].sort(),expected);
});
