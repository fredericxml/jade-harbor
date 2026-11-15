#!/usr/bin/env node
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {Entities,spawnEntity}=require('../src/game/entities.ts');
const residents=Array.from({length:4080},(_,i)=>({...spawnEntity('villager',{x:i%80+.5,y:21,z:Math.floor(i/80)+.5},`Resident ${i}`),id:`resident:${i}`}));
const active=residents.filter((_,i)=>i%42===0).slice(0,96),panda=spawnEntity('panda',{x:.5,y:21,z:.5},'Panda'),spirit=spawnEntity('spirit',{x:1.5,y:21,z:.5},'Spirit');
const entities=Object.create(Entities.prototype);
entities.list=[...residents,panda,spirit];entities.drops=[{position:{x:2,y:21,z:2}}];entities.life={active:new Set(active.map(e=>e.id)),activeActors:[],states:new Map()};
entities.world={loaded:()=>true};entities.navigation={agents:new Map()};
const rendered=entities.renderActors();
assert.equal(entities.residentPopulation.length,4080);
// A persistent but inactive resident is physically absent from the current
// actor set and must not intercept the ray ahead of a selected resident.
residents[0].body.position={x:2,y:21,z:0};
residents[1].body.position={x:1,y:21,z:0};
assert.equal(entities.target({x:0,y:21,z:0},{x:1,y:0,z:0},4),residents[0]);
assert.equal(rendered.length,98);
assert.deepEqual(rendered.slice(0,96),active);
assert.deepEqual(rendered.slice(96),[panda,spirit]);
assert.equal(entities.life.activeActors.length,96);
assert.deepEqual(entities.life.activeActors,active);
let loaded=0;entities.world.loaded=()=>{loaded++;return true;};entities.radius=64;
const simulated=entities.simulationActors({x:.5,y:21,z:.5});
assert(simulated.length<=98);
assert(loaded<=simulated.length+8,'far active residents should be distance-rejected before chunk lookup');
const occupants=entities.occupantPositions;
assert.equal(occupants.length,99,'cached occupants include 96 active residents, two encounter actors and one loaded drop');
assert.equal(occupants.includes(residents[1].body.position),false,'inactive persistent residents are not physical occupants');
assert.equal(entities.occupantPositions,occupants,'occupant position references are cached, not copied per tick');
const replacement=[...residents.slice(0,4),panda];entities.list=replacement;
assert.equal(entities.renderActors().length,2,'public list replacement rebuilds the actor index');
assert.equal(entities.residentPopulation.length,4);
console.log('PASS actor index regression: 4,080 persistent residents, 96 active residents, bounded render/simulation iteration, cached occupants and list replacement');
