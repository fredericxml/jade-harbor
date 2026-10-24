import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir,writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const server=spawn(process.execPath,["node_modules/vite/bin/vite.js","--host","127.0.0.1","--port","4181"],{stdio:["ignore","pipe","pipe"]});
const checks=[],errors=[];let browser,page;
const passed=name=>{checks.push(name);console.log("PASS",name);};
async function ticks(n){const start=await page.evaluate(()=>window.__game.tickCount);await page.waitForFunction(s=>window.__game.tickCount>=s,start+n,{timeout:45000});}
async function station(id,screen){
  if(await page.evaluate(()=>window.__game.ui.screen!=="none"))await page.locator('[data-action="resume"]').click();
  await page.evaluate(id=>{const g=window.__game;g.world.set(0,21,21,id);g.body.position={x:.5,y:21.002,z:24.5};g.previous={...g.body.position};g.body.velocity={x:0,y:0,z:0};g.yaw=0;g.pitch=Math.atan2(-1.11,3);g.input.onLook=undefined;},id);
  if(!await page.evaluate(()=>!!document.pointerLockElement))await page.locator("canvas").click();
  await ticks(6);await page.keyboard.press("KeyF");await page.waitForFunction(s=>window.__game.ui.screen===s,screen);
}
try {
  await new Promise((ok,fail)=>{server.stdout.on("data",b=>{if(b.toString().includes("Local:"))ok();});server.on("error",fail);server.on("exit",c=>fail(new Error("server "+c)));});
  browser=await chromium.launch({headless:true,args:["--no-sandbox","--use-angle=swiftshader","--enable-unsafe-swiftshader","--disable-dev-shm-usage"]});
  page=await browser.newPage({viewport:{width:1280,height:900}});page.setDefaultTimeout(60000);page.on("pageerror",e=>{errors.push(e.message);console.log("PAGE_ERROR",e.message);});
  await mkdir("test-results/upgrade",{recursive:true});await page.goto("http://127.0.0.1:4181");
  await page.getByRole("button",{name:"Create a world"}).click();await page.locator("#world-name").fill("Apothecary integration");await page.locator("#world-mode").selectOption("survival");await page.getByRole("button",{name:"Enter your world"}).click();
  await page.waitForFunction(()=>window.__game.active);
  // Explicit integration fixture: safe pad and ingredients, not the no-cheat progression acceptance.
  await page.evaluate(()=>{const g=window.__game;g.settings.distance=3;g.applySettings();g.entities.list=[];g.inventory.slots=Array(36).fill(null);
    g.inventory.add(130,1,100);g.inventory.add(103,8);g.inventory.add(102,2);g.inventory.slots[12]={id:160,count:1};g.inventory.slots[13]={id:109,count:1};g.inventory.slots[14]={id:16,count:1};g.xp=40;g.time=.24;
    for(let x=-4;x<=16;x++)for(let z=18;z<=28;z++){g.world.set(x,20,z,13);for(let y=21;y<=24;y++)g.world.set(x,y,z,0);}
  });
  await station(66,"enchant");
  await page.locator('[data-action="enchant"][data-id="efficiency"]').click();
  assert.deepEqual(await page.evaluate(()=>({xp:window.__game.xp,jade:window.__game.inventory.count(103),rank:window.__game.inventory.held.enchants.efficiency})),{xp:32,jade:7,rank:1});
  await page.screenshot({path:"test-results/upgrade/inscription.png"});passed("real workstation use and inscription button consume XP/jade and modify selected tool");
  await station(68,"anvil");await page.locator('[data-action="repair"]').click();
  assert.deepEqual(await page.evaluate(()=>({xp:window.__game.xp,iron:window.__game.inventory.count(102),d:window.__game.inventory.held.durability,rank:window.__game.inventory.held.enchants.efficiency})),{xp:30,iron:1,d:160,rank:1});passed("real anvil repair consumes matching material and preserves inscription");
  await station(67,"brew");
  for(const [source,target] of [[12,0],[13,1],[14,2]]) {await page.locator(`[data-action="slot"][data-index="${source}"]`).click();await page.locator(`[data-action="brew-slot"][data-index="${target}"]`).click();}
  await ticks(25);assert.equal(await page.evaluate(()=>window.__game.simulation.brewers["0,21,21"].progress),0);
  await page.evaluate(()=>window.__game.world.set(3,20,21,5));await ticks(45);
  await page.keyboard.press("Escape");const saved=await page.evaluate(async()=>{const g=window.__game;await g.save();return {id:g.meta.id,brew:structuredClone(g.simulation.brewers["0,21,21"]),slots:structuredClone(g.inventory.slots)};});
  assert(saved.brew.progress>0 && saved.brew.progress<6);await page.reload();await page.locator(`[data-action="load"][data-id="${saved.id}"]`).click();
  await page.waitForFunction(()=>window.__game.active);assert.deepEqual(await page.evaluate(()=>window.__game.inventory.held.enchants),{efficiency:1});
  const progress=await page.evaluate(()=>window.__game.simulation.brewers["0,21,21"].progress);assert(progress>=saved.brew.progress && progress<6);
  await station(67,"brew");await page.waitForFunction(()=>window.__game.simulation.brewers["0,21,21"].slots[3]?.id===162,null,{timeout:45000});
  await page.screenshot({path:"test-results/upgrade/apothecary.png"});
  await page.locator('[data-action="brew-slot"][data-index="3"]').click();await page.locator('[data-action="slot"][data-index="4"]').click();
  assert.equal(await page.evaluate(()=>window.__game.inventory.slots[4].id),162);passed("kettle requires nearby water, advances with real ticks, resumes saved work and transfers exact output through UI");
  await page.locator('[data-action="resume"]').click();await page.evaluate(()=>{const g=window.__game;g.pitch=.7;g.yaw=0;g.input.onLook=undefined;});
  await page.keyboard.press("Digit5");await ticks(6);await page.keyboard.press("KeyF");await page.waitForFunction(()=>window.__game.status.has("speed"));
  assert.equal(await page.evaluate(()=>window.__game.inventory.count(160)),1);assert.equal(await page.evaluate(()=>window.__game.inventory.count(162)),0);
  await page.keyboard.down("KeyD");await ticks(12);const speed=await page.evaluate(()=>window.__game.body.velocity.x);await page.keyboard.up("KeyD");assert(speed>5.3,"speed infusion alters actual walking velocity");
  await page.waitForFunction(()=>document.querySelector("#hud").textContent.includes("Swift current"));passed("drinking consumes infusion, returns flask, displays timer and increases real movement speed");
  await page.keyboard.press("Escape");const remaining=await page.evaluate(async()=>{await window.__game.save();return window.__game.status.list[0].remaining;});
  await page.reload();await page.locator(`[data-action="load"][data-id="${saved.id}"]`).click();await page.waitForFunction(()=>window.__game.active);
  assert(await page.evaluate(r=>window.__game.status.has("speed") && window.__game.status.list[0].remaining<=r && window.__game.status.list[0].remaining>r-2,remaining));passed("active effect duration and item metadata survive a full page reload");
  // Mode fixture exercises the real Game tick, rather than calling StatusEffects directly.
  for(const mode of ["creative","spectator"]){
    await page.evaluate(mode=>{const g=window.__game;g.mode=mode;g.health=20;g.status.apply("poison");},mode);
    await ticks(45);assert.equal(await page.evaluate(()=>window.__game.health),20);
  }
  await page.evaluate(()=>{const g=window.__game;g.mode="survival";g.hunger=10;});
  await ticks(45);assert(await page.evaluate(()=>window.__game.health<20));
  passed("real game ticks suppress poison damage in Creative and Spectator and restore it in Survival");
  assert.deepEqual(errors,[]);passed("no browser exceptions");
  const result={status:"passed",checks,errors,fixtureNote:"A safe pad, station blocks and ingredients are fixtures. Opening stations, enchanting, repairing, slot transfers, consuming, walking and reload use real browser input. This is not the full no-cheat Survival playthrough."};
  await writeFile("test-results/progression-browser-results.json",JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
} catch(e){console.error(e);if(page){console.log(await page.evaluate(()=>({screen:window.__game?.ui.screen,hit:window.__game?.hit,toast:document.querySelector('#toast')?.textContent})).catch(()=>null));await page.screenshot({path:"test-results/upgrade/failure.png"}).catch(()=>{});}process.exitCode=1;
}finally{await browser?.close();server.kill();}
