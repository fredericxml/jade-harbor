import {beforeAll,afterAll,afterEach,it,expect,vi} from "vitest";
import * as THREE from "three";
import ts from "typescript";
import {Game} from "../src/core/game";
import {World} from "../src/world/world";
import {Entities,spawnEntity} from "../src/game/entities";
import {EntityView} from "../src/render/entity-view";
import {Effects} from "../src/render/effects";
import {View} from "../src/render/renderer";
import {BlockColumn} from "../src/world/sections";
import {Metrics} from "../src/core/metrics";
import {Atmosphere} from "../src/render/atmosphere";
import {DistantWorld,distantPlan} from "../src/render/distant-world";
import {GRAPHICS_QUALITIES,GRAPHICS_PROFILES,graphicsProfile,graphicsQuality,effectivePixelRatio,rendererDiagnostics} from "../src/render/graphics";
import frozen from "./fixtures/baseline-v2.0.0.json";
const raw=import.meta.glob<string>("../src/**/*.ts",{query:"?raw",import:"default",eager:true});
const hash=async(value:Uint8Array|string)=>[...new Uint8Array(await crypto.subtle.digest("SHA-256",typeof value==="string"?new TextEncoder().encode(value):Uint8Array.from(value)))].map(n=>n.toString(16).padStart(2,"0")).join("");
let world:World;
beforeAll(()=>{world=new World("jade-harbor",{},false,10);});
afterAll(()=>world.dispose());afterEach(()=>vi.unstubAllGlobals());
function finish(d:DistantWorld){const a=new Atmosphere(),empty=new Set<string>();for(let i=0;i<4096&&!d.stats.ready;i++)d.update({x:0,y:60,z:0},empty,a,0);expect(d.stats.ready).toBe(true);}
it("preserves all authoritative world/game/player/persistence bytes and actual Game tick/Travel bodies from 2.0.0",async()=>{
 for(const [file,digest]of Object.entries(frozen.files))expect(await hash(raw["../"+file]),file).toBe(digest);
 const ast=ts.createSourceFile("game.ts",raw["../src/core/game.ts"],ts.ScriptTarget.ES2022,true),cl=ast.statements.find(ts.isClassDeclaration)!;
 for(const [name,digest]of Object.entries(frozen.methods)){const method=cl.members.find(m=>m.name?.getText(ast)===name)!;expect(await hash(method.getText(ast)),name).toBe(digest);}
});
it("exposes frozen finite presentation capabilities and a deterministic Medium fallback",()=>{
 expect(GRAPHICS_QUALITIES).toEqual(["low","medium","high"]);
 for(const q of GRAPHICS_QUALITIES){const p=graphicsProfile(q);expect(p).toBe(GRAPHICS_PROFILES[q]);expect(Object.isFrozen(p)).toBe(true);for(const v of Object.values(p))if(typeof v==="number")expect(Number.isFinite(v)&&v>0).toBe(true);expect(Object.keys(p).some(k=>/simulation|population|tick|navigation|seed/i.test(k))).toBe(false);}
 for(const bad of[undefined,null,"",{},"ultra",0,NaN])expect(graphicsQuality(bad)).toBe("medium");
 expect(GRAPHICS_PROFILES.high).toMatchObject({renderScale:1,dprCap:1.6,distantTerrainStep:16,crownBuildingsPerDistrict:4,rainParticleCount:300,cloudCount:28});
});
it.each([.1,.5,1,1.25,1.6,2,3])("never supersamples device DPR %s and scales monotonically",dpr=>{
 const values=GRAPHICS_QUALITIES.map(q=>effectivePixelRatio(graphicsProfile(q),dpr));expect(values.every(n=>n>0&&n<=dpr)).toBe(true);expect(values[0]).toBeLessThanOrEqual(values[1]);expect(values[1]).toBeLessThanOrEqual(values[2]);
});
it("keeps invalid DPR finite and bounds ordinary high-DPI drawing buffers",()=>{
 for(const dpr of[NaN,Infinity,0,-1])expect(effectivePixelRatio(GRAPHICS_PROFILES.high,dpr)).toBe(1);
 expect(GRAPHICS_QUALITIES.map(q=>effectivePixelRatio(graphicsProfile(q),2))).toEqual([.7,1.1,1.6]);
});
it.each([undefined,"invalid","high","low"])("migrates old settings without changing the five existing controls (%s)",quality=>{
 let stored="";vi.stubGlobal("localStorage",{setItem:(_key:string,value:string)=>{stored=value;}});
 const g=Object.create(Game.prototype) as Game,old={fov:91,sensitivity:7,distance:8,simulationDistance:5,volume:46};const setter=vi.fn(),rain=vi.fn();Object.assign(g,{settings:{...old,graphicsQuality:quality},view:{setGraphicsProfile:setter,camera:{updateProjectionMatrix:vi.fn()}},effects:{setRainCount:rain},audio:{}});g.applySettings();
 expect(g.settings).toEqual({...old,graphicsQuality:graphicsQuality(quality)});expect(JSON.parse(stored)).toEqual(g.settings);expect(setter).toHaveBeenCalledWith(graphicsProfile(quality));expect(rain).toHaveBeenCalledWith(graphicsProfile(quality).rainParticleCount);
});
it("handles restricted/throwing GPU diagnostics and detects a known software renderer",()=>{
 const gl={VENDOR:1,RENDERER:2,VERSION:3,getParameter:(k:number)=>k===3?"WebGL 2.0":"WebKit",getExtension:()=>null} as unknown as WebGL2RenderingContext;
 expect(rendererDiagnostics(gl)).toMatchObject({restricted:true,software:false,unmaskedRenderer:"unavailable/restricted"});
 const throws={...gl,getParameter:()=>{throw Error("privacy");},getExtension:()=>{throw Error("privacy");}} as unknown as WebGL2RenderingContext;expect(rendererDiagnostics(throws).restricted).toBe(true);
 const software={...gl,getExtension:()=>({UNMASKED_VENDOR_WEBGL:4,UNMASKED_RENDERER_WEBGL:5}),getParameter:(n:number)=>n===5?"ANGLE SwiftShader Device":"WebGL 2.0"} as unknown as WebGL2RenderingContext;expect(rendererDiagnostics(software)).toMatchObject({restricted:false,software:true});
});
it("retains byte-identical High positions/colors/kinds and equivalent normals with conservative bounds",async()=>{
 const lod=new DistantWorld(world,new Atmosphere(),GRAPHICS_PROFILES.high);finish(lod);
 for(const [i,node]of lod.group.children.entries()){
  const g=(node as THREE.Mesh).geometry,reference=frozen.geometry["jade-harbor"][i];expect(node.name).toBe(reference.name);
  for(const [key,digest]of Object.entries(reference.attributes)){const a=g.attributes[key].array;expect(await hash(new Uint8Array(a.buffer,a.byteOffset,a.byteLength)),key).toBe(digest);}
  const expected=g.clone();expected.computeVertexNormals();const a=g.attributes.normal.array,b=expected.attributes.normal.array;let delta=0;for(let j=0;j<a.length;j++)delta=Math.max(delta,Math.abs(a[j]-b[j]));expect(delta).toBeLessThan(1e-6);
  const p=g.attributes.position;for(let j=0;j<p.count;j++){const v=new THREE.Vector3().fromBufferAttribute(p,j);expect(g.boundingBox!.containsPoint(v)).toBe(true);expect(g.boundingSphere!.distanceToPoint(v)).toBeLessThan(1e-5);}expected.dispose();
 }
 lod.dispose();
});
it("keeps every major anchor on lower profiles while reducing only render samples and crown count",()=>{
 const plans=GRAPHICS_QUALITIES.map(q=>distantPlan(world,graphicsProfile(q))!);for(const p of plans){expect(p.boxes.some(b=>b.id.startsWith("imperial-complex"))).toBe(true);expect(p.boxes.some(b=>b.id.startsWith("harbor-front"))).toBe(true);expect(p.boxes.some(b=>b.id.startsWith("ridge:"))).toBe(true);}
 expect(plans[0].width*plans[0].depth).toBeLessThan(plans[1].width*plans[1].depth);expect(plans[1].width*plans[1].depth).toBeLessThan(plans[2].width*plans[2].depth);
 expect(plans[0].boxes.length).toBeLessThan(plans[1].boxes.length);expect(plans[1].boxes.length).toBeLessThan(plans[2].boxes.length);
});
it("keeps one graph/texture during replacement, cancels pending work and disposes old geometry once",()=>{
 const lod=new DistantWorld(world,new Atmosphere());finish(lod);const group=lod.group,texture=lod.texture,old=group.children.map(n=>(n as THREE.Mesh).geometry);let disposed=0;for(const g of old)g.addEventListener("dispose",()=>disposed++);
 for(const q of["low","medium","low","high","medium"]){lod.setProfile(graphicsProfile(q));expect(lod.group).toBe(group);expect(lod.texture).toBe(texture);expect(lod.group.children).toHaveLength(2);expect(lod.stats.ready).toBe(false);}
 finish(lod);expect(disposed).toBe(2);expect(lod.stats.quality).toBe("medium");expect(lod.group.children).toHaveLength(2);
 let finalDisposed=0;for(const n of group.children)(n as THREE.Mesh).geometry.addEventListener("dispose",()=>finalDisposed++);lod.dispose();lod.dispose();expect(finalDisposed).toBe(2);expect(group.children).toHaveLength(0);
});
it("culls conservatively and applies resident tiers without changing entity state or identities",()=>{
 const scene=new THREE.Scene(),view=new EntityView(scene),camera=new THREE.PerspectiveCamera(75,1,.06,960);camera.position.set(8,2,8);camera.lookAt(8,2,-100);camera.updateProjectionMatrix();
 const entities=new Entities(world,{entities:[],drops:[]}),positions=[{x:8,y:1,z:3},{x:8,y:1,z:-15},{x:8,y:1,z:-50},{x:8,y:1,z:80},{x:8,y:1,z:9}];entities.list=positions.map(p=>spawnEntity("villager",p));
 // Isolated render fixtures use real entity shapes; browser integration uses
 // all4,080 original persistent identities and their untouched active set.
 for(const p of positions)world.ensure(Math.floor(p.x/16),Math.floor(p.z/16),true);
 const before=JSON.stringify(entities.list);view.update(entities,1,camera,GRAPHICS_PROFILES.low);expect(view.stats).toMatchObject({full:2,mid:1,far:1,culled:1});const lowParts=view.stats.parts;
 expect(view.civilians.instanceMatrix.updateRanges).toEqual([{start:0,count:lowParts*16}]);expect(view.civilians.instanceColor!.updateRanges).toEqual([{start:0,count:lowParts*3}]);
 view.update(entities,1,camera,GRAPHICS_PROFILES.high);expect(view.stats).toMatchObject({full:4,mid:0,far:0,culled:1});expect(view.stats.parts).toBeGreaterThan(lowParts);expect(JSON.stringify(entities.list)).toBe(before);expect(view.models.size).toBe(0);expect(scene.children.filter(n=>n===view.civilians)).toHaveLength(1);view.clear();expect(view.civilians.count).toBe(0);entities.dispose();
});
it("reuses particle arrays, bounds rain count and performs no clear-weather rain upload",()=>{
 const effects=new Effects(new THREE.Scene()),particles=effects.particles;effects.burst({x:0,y:1,z:0},"#abcdef");for(const q of GRAPHICS_QUALITIES){const count=graphicsProfile(q).rainParticleCount;effects.setRainCount(count);effects.update(.01,{x:1,y:2,z:3},true,1);expect(effects.rain.geometry.drawRange.count).toBe(count);expect(effects.particles).toBe(particles);expect(effects.rainData.every(Number.isFinite)).toBe(true);}
 const attribute=effects.rain.geometry.attributes.position as THREE.BufferAttribute,version=attribute.version;effects.update(.8,{x:0,y:0,z:0},false,2);effects.update(.1,{x:0,y:0,z:0},false,3);expect(effects.particles).toHaveLength(0);expect(attribute.version).toBe(version);expect(effects.rain.visible).toBe(false);
 effects.setRainCount(NaN);expect(effects.rainCount).toBe(300);effects.setRainCount(999);expect(effects.rainCount).toBe(300);
});

it("disposes an actually allocated partial replacement when a newer profile supersedes it",()=>{
 const a=new Atmosphere(),empty=new Set<string>(),lod=new DistantWorld(world,a);finish(lod);lod.setProfile(GRAPHICS_PROFILES.low);
 const owned=lod as unknown as {pending:THREE.BufferGeometry[]};for(let i=0;i<4096&&!owned.pending.length;i++)lod.update({x:0,y:50,z:0},empty,a,0);
 expect(owned.pending.length).toBeGreaterThan(0);let disposed=0;for(const g of owned.pending)g.addEventListener("dispose",()=>disposed++);const pending=owned.pending.length;
 lod.setProfile(GRAPHICS_PROFILES.medium);expect(disposed).toBe(pending);expect(owned.pending).toHaveLength(0);finish(lod);expect(lod.stats.quality).toBe("medium");lod.dispose();
});
it("keeps mesh topology revision stable on remesh and releases cached signed-height keys on eviction",()=>{
 const w=new World("queue-fixture",{},false,3),blocks=new BlockColumn();blocks.set(2,2,2,22);w.chunks.set("0,0",{cx:0,cz:0,blocks,revision:0});w.dirty.add("0,0,0");
 const v=Object.create(View.prototype) as View,camera=new THREE.PerspectiveCamera();camera.position.set(2,2,2);
 Object.assign(v,{camera,scene:new THREE.Scene(),groups:new Map(),sections:new Map(),meshed:new Set(),deferred:new Set(),meshRevision:0,verticalRadius:64,lastSectionY:Infinity,lastSurfaceY:Infinity,sectionCoordinates:new Map(),surfaceX:NaN,surfaceZ:NaN,metrics:new Metrics(),materials:[new THREE.MeshBasicMaterial(),new THREE.MeshBasicMaterial(),new THREE.MeshBasicMaterial()]});
 v.rebuild(w,6);expect(v.meshed.has("0,0,0")).toBe(true);const revision=v.meshRevision;let disposed=0;v.sections.get("0,0,0")!.traverse(n=>{if(n instanceof THREE.Mesh)n.geometry.addEventListener("dispose",()=>disposed++);});w.dirty.add("0,0,0");v.rebuild(w,6);expect(v.meshRevision).toBe(revision);expect(disposed).toBe(1);
 v.remove("0,0");expect(v.meshRevision).toBeGreaterThan(revision);expect(v.sections.size+v.groups.size+v.meshed.size).toBe(0);expect((v as unknown as {sectionCoordinates:Map<string,unknown>}).sectionCoordinates.size).toBe(0);for(const material of v.materials)material.dispose();w.dispose();
});

it("coalesces rapid backbuffer changes before the next draw and retains the final profile",()=>{
 vi.stubGlobal("innerWidth",960);vi.stubGlobal("innerHeight",600);vi.stubGlobal("devicePixelRatio",2);
 const v=Object.create(View.prototype) as View,calls:unknown[][]=[],canvas={style:{width:"960px",height:"600px"}};
 Object.assign(v,{graphicsProfile:GRAPHICS_PROFILES.high,canvas,camera:new THREE.PerspectiveCamera(),viewmodelCamera:new THREE.PerspectiveCamera(),clouds:new THREE.Group(),drawingWidth:960,drawingHeight:600,drawingRatio:1.6,drawingSizePending:false,hand:{visible:false},scene:new THREE.Scene(),worldRenderStats:{triangles:0,calls:0},renderer:{setDrawingBufferSize(...args:unknown[]){calls.push(args);},clear(){},render(){},info:{render:{triangles:0,calls:0}}}});
 for(const q of["low","high","medium","high","low"])v.setGraphicsProfile(graphicsProfile(q));expect(calls).toHaveLength(0);v.render();expect(calls).toEqual([[960,600,.7]]);v.render();expect(calls).toHaveLength(1);
 vi.stubGlobal("innerWidth",1100);vi.stubGlobal("innerHeight",680);v.resize();expect(calls).toHaveLength(1);v.render();expect(calls).toEqual([[960,600,.7],[1100,680,.7]]);expect(v.camera.aspect).toBe(1100/680);
});
