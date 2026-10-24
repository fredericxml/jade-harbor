import { it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { DATABASE_NAME, freshWorld, writeSave, loadSave, encodeEdits, renameSave, resetSave } from '../src/persistence/saves';
import { World } from '../src/world/world';
import { B } from '../src/world/blocks';
import { spawnEntity } from '../src/game/entities';
async function tamper(store:string, operation:(s:IDBObjectStore)=>void) {
  await new Promise<void>((resolve,reject)=>{
    const r=indexedDB.open(DATABASE_NAME,1);
    r.onsuccess=()=>{const db=r.result,tx=db.transaction(store,'readwrite');operation(tx.objectStore(store));tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);};
  });
}
it('commits player, equipment, chests, kiln and NPC state in one coherent revision',async()=>{
  const d=freshWorld('atomic','jade-harbor','survival');
  d.player.slots[0]={id:B.Red,count:11};
  d.simulation={containers:{'1,21,1':Array.from({length:27},(_,i)=>i?null:{id:B.Jade,count:3})},furnaces:{'2,21,1':{slots:[{id:B.Iron,count:2},null,{id:102,count:1}],burn:6,progress:2,recipe:B.Iron}},entities:[spawnEntity('villager',{x:0.5,y:21,z:24.5})],drops:[]};
  await writeSave(d); const r=await loadSave(d.id);
  expect(r.player).toEqual(d.player); expect(r.simulation).toMatchObject(d.simulation!);
  await renameSave(d.id,'A new name'); expect((await loadSave(d.id)).player).toEqual(d.player);expect((await loadSave(d.id)).name).toBe('A new name');
});
it('detects missing component records and preserves the world rather than silently resetting',async()=>{
  const d=freshWorld('missing','a','creative');await writeSave(d);
  await tamper('players',s=>s.delete(d.id));
  await expect(loadSave(d.id)).rejects.toThrow('damaged');
});
it('detects missing and altered edited chunk records',async()=>{
  const d=freshWorld('corrupt','a','creative');d.edits={'1,25,1':B.Red};await writeSave(d);
  await tamper('chunks',s=>s.put({worldId:d.id,key:'0,1,0',entries:encodeEdits({'1,25,1':B.Gold})[0].entries}));
  await expect(loadSave(d.id)).rejects.toThrow('damaged');
  await writeSave(d);await tamper('chunks',s=>s.delete([d.id,'0,1,0']));
  await expect(loadSave(d.id)).rejects.toThrow('damaged');
});
it('rejects invalid delta before any metadata is committed',async()=>{
  const d=freshWorld('bad','a','creative');const rev=await writeSave(d);
  await expect(writeSave({...d,time:.8},[{key:'0,1,0',entries:new Uint16Array([300,9999,300,1])}],rev)).rejects.toThrow();
  expect((await loadSave(d.id)).time).toBe(d.time);
});
it('pins edited columns during eviction until the captured revision commits',()=>{
  const w=new World('a',{},false);w.ensure(0,0,true);w.set(1,25,1,B.Red);
  let requested=0;w.onEvictionPending=()=>requested++;
  w.stream(1000,1000,2);expect(w.chunks.has('0,0')).toBe(true);expect(requested).toBe(1);
  const snap=w.captureChanges();w.set(2,25,1,B.Gold);w.acknowledgeChanges(snap.revisions);
  w.stream(1000,1000,2);expect(w.chunks.has('0,0')).toBe(true);
  w.acknowledgeChanges(w.captureChanges().revisions);w.stream(1000,1000,2);expect(w.chunks.has('0,0')).toBe(false);
});

it('reset atomically recovers a world with a missing component record',async()=>{
  const d=freshWorld('recover-component','recovery-seed','survival');d.edits={'1,25,1':B.Red};await writeSave(d);
  await tamper('players',s=>s.delete(d.id));
  await expect(loadSave(d.id)).rejects.toThrow('damaged');
  const fresh=await resetSave(d.id);
  expect(fresh.seed).toBe('recovery-seed');expect(fresh.mode).toBe('survival');
  expect((await loadSave(d.id)).edits).toEqual({});
});
it('reset atomically recovers a world with a missing checkpoint',async()=>{
  const d=freshWorld('recover-checkpoint','checkpoint-seed','creative');await writeSave(d);
  await tamper('checkpoints',s=>s.delete(d.id));
  await expect(loadSave(d.id)).rejects.toThrow('damaged');
  await expect(resetSave(d.id)).resolves.toMatchObject({id:d.id,seed:'checkpoint-seed'});
  await expect(loadSave(d.id)).resolves.toMatchObject({id:d.id,seed:'checkpoint-seed',edits:{}});
});
