#!/usr/bin/env node
const fs=require('node:fs'),assert=require('node:assert/strict'),ts=require('typescript');
const raw=fs.readFileSync('src/core/game.ts','utf8');
const start=raw.indexOf('    this.ui.onChange = (el) => {');
const end=raw.indexOf('\n    };',start);
assert(start>0&&end>start);
const source=raw.slice(start,end+7);
const compiled=ts.transpileModule(`class GameModeActions {bindMode() {${source}}}`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
const Actions=Function('findSafeStand',compiled+';return GameModeActions')(()=>({x:5.5,y:35,z:5.5}));
let runs=0;const modes=['creative','survival','adventure','spectator','hardcore'];
for(const from of modes)for(const to of modes){
 const game=new Actions();let saved=0,paused=0;
 game.ui={pause(){paused++}};game.settings={};game.hardcoreEnded=false;game.mode=from;
 game.body={flying:from==='creative'||from==='spectator',position:{x:1,y:25,z:1},velocity:{x:3,y:4,z:5},grounded:true,fallStart:50};
 game.world={};game.previous={...game.body.position};game.view={hand:{visible:true}};
 game.crouching=true;game.jumpRequest=true;game.meta={name:'test'};
 game.save=()=>{saved++;return Promise.resolve(true)};game.safeSpawn=()=>{throw Error('Unexpected fallback')};
 game.bindMode();game.ui.onChange({id:'change-mode',value:to});
 assert.equal(game.mode,to,`${from}->${to} mode`);
 assert.equal(game.body.flying,to==='spectator',`${from}->${to} flying`);
 assert.equal(game.view.hand.visible,to!=='spectator');
 assert.equal(game.body.grounded,false);assert.deepEqual(game.body.velocity,{x:0,y:0,z:0});
 assert.equal(game.crouching,false);assert.equal(game.jumpRequest,false);
 assert.equal(saved,1);assert.equal(paused,1);
 if(from==='spectator'&&to!=='spectator')assert.deepEqual(game.body.position,{x:5.5,y:35,z:5.5});
 runs++;
}
const locked=new Actions();locked.ui={pause(){throw Error('Should not open pause')}};
locked.hardcoreEnded=true;locked.mode='spectator';locked.bindMode();
locked.ui.onChange({id:'change-mode',value:'creative'});assert.equal(locked.mode,'spectator');
console.log(`PASS Game.onChange handler: ${runs} mode transitions plus Hardcore lock, save triggers, velocity resets, spectator stand safety`);
