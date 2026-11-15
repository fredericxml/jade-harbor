/** Linux engine smoke; unavailable WebGL is reported, never counted as gameplay. */
import {firefox,webkit} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {devApp,continueInBrowser} from './browser-harness.mjs';
import {verifyReleaseManifest} from '../scripts/release-integrity.mjs';
verifyReleaseManifest();const out=process.env.ENGINE_OUTPUT??'test-results/browser-engines';await mkdir(out,{recursive:true});const server=await devApp(Number(process.env.ENGINE_PORT??4291)),rows=[];
try{
 for(const [name,engine]of[['firefox',firefox],['webkit',webkit]]){
  let browser;
  try{
   try{browser=await engine.launch({headless:true});}catch(error){rows.push({engine:name,status:'unavailable-launch',reason:String(error).slice(0,2500)});continue;}
   const page=await browser.newPage({viewport:{width:640,height:360}}),errors=[];page.setDefaultTimeout(120000);page.on('pageerror',e=>errors.push(e.message));await page.goto(server.url);await page.waitForFunction(()=>!!window.__game||!!document.querySelector('.fatal-error'));
   const fatal=await page.locator('.fatal-error').count();
   if(fatal){const code=await page.locator('.fatal-error').getAttribute('data-startup-error-code');assert(['webgl2-unavailable','webgl2-context-lost'].includes(code),'application failure: '+await page.locator('.fatal-error').innerText());assert(await page.getByRole('button',{name:'Reload game'}).isVisible());rows.push({engine:name,browser:browser.version(),status:'unavailable-webgl2',code,checks:['explicit graphics startup diagnostic and recovery action rendered'],errors});continue;}
   await continueInBrowser(page);assert.equal(await page.evaluate(()=>window.__game.settings.graphicsQuality),'high');await page.locator('[data-action="settings"]').click();await page.locator('#graphicsQuality').selectOption('low');await page.waitForFunction(()=>document.querySelector('canvas').width===Math.floor(640*.7));await page.setViewportSize({width:720,height:400});await page.waitForFunction(()=>window.__game.view.canvas.width===Math.floor(720*.7)&&window.__game.view.camera.aspect===1.8);assert.deepEqual(errors,[]);
   const state=await page.evaluate(()=>({gpu:window.__game.view.gpu,capabilities:window.__game.view.capabilities,buffer:{width:window.__game.view.canvas.width,height:window.__game.view.canvas.height}}));rows.push({engine:name,browser:browser.version(),status:'passed-boot-settings-resize',checks:['real WebGL2 startup','High default','manual Low selection','actual drawing-buffer resize and camera aspect'],state,errors});
  }finally{await browser?.close();}
 }
 verifyReleaseManifest();await writeFile(out+'/results.json',JSON.stringify({status:'completed',rows,note:'Linux Playwright engine smoke only; not physical Firefox devices or Apple Safari/iOS certification. Unavailable engine/WebGL rows are explicit and do not count as gameplay passes.'},null,2));console.log('ENGINE CHECK COMPLETE',JSON.stringify(rows.map(r=>({engine:r.engine,status:r.status}))));
}finally{await server.close();}
