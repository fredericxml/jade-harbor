import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir,writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const server=spawn(process.execPath,["node_modules/vite/bin/vite.js","--host","127.0.0.1","--port","4182"],{stdio:["ignore","pipe","pipe"]});
let browser,page;const checks=[],errors=[];const passed=n=>{checks.push(n);console.log("PASS",n);};
async function ticks(n){const t=await page.evaluate(()=>window.__game.tickCount);await page.waitForFunction(t=>window.__game.tickCount>=t,t+n,{timeout:60000});}
async function position(x,y,z,tx,ty,tz){await page.evaluate(p=>{const g=window.__game;g.input.keys.clear();g.input.onLook=undefined;g.body.position={x:p.x,y:p.y,z:p.z};g.previous={...g.body.position};g.body.velocity={x:0,y:0,z:0};g.body.flying=false;const dx=p.tx-p.x,dz=p.tz-p.z;g.yaw=Math.atan2(-dx,-dz);g.pitch=Math.atan2(p.ty-p.y-1.61,Math.hypot(dx,dz));},{x,y,z,tx,ty,tz});await ticks(6);}
try{
  await new Promise((ok,fail)=>{server.stdout.on("data",b=>{if(b.toString().includes("Local:"))ok();});server.on("error",fail);});
  browser=await chromium.launch({headless:true,args:["--no-sandbox","--use-angle=swiftshader","--enable-unsafe-swiftshader","--disable-dev-shm-usage"]});page=await browser.newPage({viewport:{width:1280,height:900}});page.setDefaultTimeout(60000);page.on("pageerror",e=>errors.push(e.message));
  await mkdir("test-results/upgrade",{recursive:true});await page.goto("http://127.0.0.1:4182");await page.getByRole("button",{name:"Create a world"}).click();await page.locator("#world-name").fill("Working courtyard");await page.getByRole("button",{name:"Enter your world"}).click();await page.waitForFunction(()=>window.__game.active);
  // An explicit factory fixture isolates machine behavior; interaction and elapsed ticks are real.
  await page.evaluate(()=>{const g=window.__game;g.settings.distance=3;g.applySettings();g.entities.list=[];g.inventory.slots=Array(36).fill(null);g.inventory.slots[0]={id:168,count:1};g.inventory.slots[9]={id:103,count:2};
    for(let cx=0;cx<=1;cx++)g.world.ensure(cx,0,true);
    for(let x=10;x<=21;x++)for(let z=1;z<=13;z++){g.world.set(x,25,z,13);for(let y=26;y<=32;y++)g.world.set(x,y,z,0);}
    for(const [x,y,z,id,state] of [[15,29,3,25,0],[15,28,3,69,0],[15,27,3,24,0],[15,26,3,69,2],[16,26,3,25,0],[14,27,3,69,2],[14,28,3,25,0],[14,26,7,70,6],[15,26,7,34,0],[16,26,7,35,0],[14,26,10,71,0],[15,26,10,34,0],[16,26,10,27,0],[16,27,10,27,8],[11,26,4,69,0]])g.world.set(x,y,z,id+(state<<8));
    g.containers["15,29,3"]=Array(27).fill(null);g.containers["15,29,3"][0]={id:19,count:2};g.containers["14,28,3"]=Array(27).fill(null);g.containers["14,28,3"][0]={id:101,count:1};
    g.simulation.indexChunks();
  });
  await position(11.5,26.002,7.5,11.5,26.5,4.5);await page.keyboard.press("KeyF");await page.waitForFunction(()=>window.__game.ui.screen==="hopper");
  await page.locator('[data-action="slot"][data-index="9"]').click();await page.locator('[data-action="hopper-slot"][data-index="0"]').click();await page.locator('[data-action="hopper-direction"]').click();
  assert.equal(await page.evaluate(()=>window.__game.world.get(11,26,4)>>8),1);assert.equal(await page.evaluate(()=>window.__game.simulation.automation.hoppers["11,26,4"].slots[0].count),2);
  await page.screenshot({path:"test-results/upgrade/hopper.png"});passed("right-click opens a real hopper; slot clicks store items and direction button rotates its output");
  await page.locator('[data-action="resume"]').click();await page.waitForFunction(()=>window.__game.containers["16,26,3"]?.[0]?.count===2,null,{timeout:60000});
  assert.equal(await page.evaluate(()=>window.__game.containers["16,26,3"][0].id),102);passed("live hopper factory feeds kiln ore/fuel and transfers two ingots across the x=16 chunk boundary");
  const lampStates=new Set();for(let n=0;n<8;n++){await ticks(10);lampStates.add(await page.evaluate(()=>window.__game.world.get(16,26,7)>>8));}assert.deepEqual([...lampStates].sort(),[0,1]);passed("festival timer repeatedly switches a wire-connected lamp with real simulation time");
  await position(14.5,26.002,12.4,14.5,27,9);await page.evaluate(()=>{window.__game.yaw=0;window.__game.pitch=0;});await page.keyboard.down("KeyW");
  await page.waitForFunction(()=>!!((window.__game.world.get(16,26,10)>>8)&4),null,{timeout:15000});await page.keyboard.up("KeyW");
  await page.keyboard.down("KeyS");await page.waitForFunction(()=>window.__game.body.position.z>12.2);await page.keyboard.up("KeyS");await ticks(6);assert.equal(await page.evaluate(()=>(window.__game.world.get(16,26,10)>>8)&4),0);passed("walking onto a pressure plate opens both door halves; stepping off closes the gate");
  await page.evaluate(()=>{const g=window.__game;g.mode="survival";g.inventory.selected=0;g.world.set(19,25,10,5);});
  await position(19.5,26.002,12.5,19.5,25.9,10.5);await page.keyboard.press("KeyF");await page.waitForFunction(()=>window.__game.inventory.held?.id===169);
  assert.equal(await page.evaluate(()=>window.__game.world.get(19,25,10)),0);
  await position(19.5,26.002,12.5,20.5,25.99,10.5);await page.keyboard.press("KeyF");await page.waitForFunction(()=>window.__game.inventory.held?.id===168);assert(await page.evaluate(()=>[...window.__game.world.edits].some(([key,v])=>key!=="19,25,10"&&(v&255)===5)));
  passed("actual bucket use collects a source and places water while returning the empty vessel");
  await page.keyboard.press("Escape");const saved=await page.evaluate(async()=>{await window.__game.save();return {id:window.__game.meta.id,clock:window.__game.simulation.elapsed};});await page.reload();await page.locator(`[data-action="load"][data-id="${saved.id}"]`).click();await page.waitForFunction(()=>window.__game.active);
  assert.equal(await page.evaluate(()=>window.__game.containers["16,26,3"][0].count),2);assert.equal(await page.evaluate(()=>window.__game.simulation.automation.hoppers["11,26,4"].slots[0].count),2);assert(await page.evaluate(t=>window.__game.simulation.elapsed>=t,saved.clock));passed("reload preserves machine contents, processed output and simulation clock");
  assert.deepEqual(errors,[]);passed("no browser exceptions");
  const result={status:"passed",checks,errors,fixtureNote:"Factory and circuit blocks plus raw inputs are fixtures. Machine UI, pressure plate walking, bucket use and reload use real inputs; machines process using the game loop. Not a full unassisted Survival playthrough."};await writeFile("test-results/automation-browser-results.json",JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}catch(e){console.error(e);if(page){console.log(await page.evaluate(()=>({screen:window.__game?.ui.screen,position:window.__game?.body.position,hit:window.__game?.hit,held:window.__game?.inventory.held,toast:document.querySelector('#toast')?.textContent})).catch(()=>null));await page.screenshot({path:"test-results/upgrade/automation-failure.png"}).catch(()=>{});}process.exitCode=1;
}finally{await browser?.close();server.kill();}
