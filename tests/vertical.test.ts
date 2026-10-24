import {it,expect} from 'vitest';
import 'fake-indexeddb/auto';
import {BlockColumn} from '../src/world/sections';
import {World} from '../src/world/world';
import {B} from '../src/world/blocks';
import {chunkCoord,localCoord,index,MIN_Y,MAX_Y} from '../src/core/coords';
import {meshChunk} from '../src/render/mesher';
import {Lighting} from '../src/world/lighting';
import {freshWorld,writeSave,loadSave} from '../src/persistence/saves';
import {terrainHeight} from '../src/world/generator';
import {seedNumber} from '../src/world/noise';
import {moveBody,Body} from '../src/player/physics';
it('round trips all requested heights with sparse sections and negative X/Y/Z',()=>{
 const c=new BlockColumn();
 for(const y of [-64,-63,-1,0,15,16,79,80,255,319]) {c.set(15,y,0,B.Red);expect(c.get(15,y,0)).toBe(B.Red);expect(chunkCoord(y)*16+localCoord(y)).toBe(y);expect(index(15,localCoord(y),0)).toBeLessThan(4096);}
 expect(c.sections.size).toBe(8);expect(c.get(1,200,1)).toBe(0);
 const copy=BlockColumn.from(structuredClone(c.serialize()));for(const y of [-64,-63,-1,0,15,16,79,80,255,319]) expect(copy.get(15,y,0)).toBe(c.get(15,y,0));
 c.set(15,319,0,0);expect(c.sections.has(19)).toBe(false);
});
it('culls vertical section borders and dirties only affected sections',()=>{
 const w=new World('a',{},false), c={cx:-1,cz:-1,blocks:new BlockColumn(),revision:0};w.chunks.set('-1,-1',c);
 c.blocks.set(4,-1,4,B.Stone);c.blocks.set(4,0,4,B.Stone);
 expect(meshChunk(w,c,undefined,-1)[0].indices.length).toBe(30);
 expect(meshChunk(w,c,undefined,0)[0].indices.length).toBe(30);
 w.dirty.clear();w.set(-12,0,-12,0);
 expect([...w.dirty].sort()).toEqual(['-1,-1,-1','-1,0,-1']);
 expect(meshChunk(w,c,undefined,-1)[0].indices.length).toBe(36);
});
it('saves negative elevation and the highest build layer without 16-bit column-index overflow',async()=>{
 const d=freshWorld('deep','a','creative'),w=new World('a',{},false);
 for(const y of [-63,-1,0,15,16,79,80,255,319]) w.set(-17,y,-16,B.Porcelain);
 d.player.position={x:-16.5,y:-32,z:-15.5};
 await writeSave(d,w.captureChanges().chunks);const read=await loadSave(d.id),restored=new World('a',read.edits,false);restored.ensure(-2,-1,true);
 for(const y of [-63,-1,0,15,16,79,80,255,319]) expect(restored.get(-17,y,-16)).toBe(B.Porcelain);
 expect(read.player.position.y).toBe(-32);expect(w.set(0,MIN_Y,0,0)).toBe(false);expect(w.set(0,MAX_Y+1,0,1)).toBe(false);
});
it('propagates lantern light across negative vertical boundaries and shades deep roofs',()=>{
 const w=new World('a',{},false),c={cx:0,cz:0,blocks:new BlockColumn(),revision:0};w.chunks.set('0,0',c);
 w.set(3,-1,3,B.Lantern);w.set(7,80,7,B.Stone);const l=new Lighting(w);l.rebuild();
 expect(l.sample(3,0,3)[1]).toBeGreaterThan(.7);expect(l.sample(7,0,7)[0]).toBe(0);expect(l.sample(7,81,7)[0]).toBe(1);
 w.set(7,80,7,0);l.rebuild();expect(l.sample(7,0,7)[0]).toBe(1);
});
it('keeps the city at its established level while generating deeper caves and taller mountains',()=>{
 const w=new World('jade-harbor',{},false);w.ensure(0,-3,true);expect(w.get(0,35,-45)).not.toBe(0);expect(w.get(0,MIN_Y,-45)).toBe(B.Obsidian);
 let caves=0,ores=0;for(let y=-60;y<-8;y++) for(let x=0;x<16;x++) for(let z=-48;z<-32;z++){const v=w.get(x,y,z);if(!v)caves++;if([B.Jade,B.Iron,B.Gold].includes(v as never))ores++;}
 expect(caves).toBeGreaterThan(100);expect(ores).toBeGreaterThan(20);
 const n=seedNumber('jade-harbor');let max=0;for(let x=800;x<2400;x+=29)for(let z=350;z<1500;z+=31)max=Math.max(max,terrainHeight(x,z,n));expect(max).toBeGreaterThan(100);
});
it('lets a physical player descend the mine half steps to negative Y',()=>{
 const w=new World('jade-harbor',{},false);for(let z=-1;z<=10;z++)for(let x=22;x<=23;x++) w.ensure(x,z,true);
 const y=terrainHeight(360,0,seedNumber(w.seed))+1.1;
 const b:Body={position:{x:360.5,y,z:.5},velocity:{x:0,y:0,z:0},grounded:false,flying:false,fallStart:y};
 for(let i=0;i<1200;i++){b.velocity.z=2;b.velocity.y=Math.max(-20,b.velocity.y-1);moveBody(w,b,.05);}
 expect(b.position.z).toBeGreaterThan(100);expect(b.position.y).toBeLessThan(-20);
});

it('discards a light job when a column unloads during staged sky diffing',()=>{
 const w=new World('a',{},false);w.chunks.set('0,0',{cx:0,cz:0,blocks:new BlockColumn(),revision:0});w.set(2,2,2,B.Stone);
 const l=new Lighting(w);l.update(0);w.chunks.clear();
 let n=0;expect(()=>{while(l.pending && n++<100)l.update(0);}).not.toThrow();expect(l.signature).toBe('');
});
