import { describe, it, expect } from "vitest";
import "fake-indexeddb/auto";
import { createGenerator, generatorFor, clearGeneratorCache, generateChunk, generatorCacheSizes } from "../src/world/generator";
import { createGenerationSession } from "../src/world/generation-protocol";
import { BlockColumn } from "../src/world/sections";
import { World } from "../src/world/world";
import { B } from "../src/world/blocks";
import { freshWorld, validateSave, writeSave, loadSave, resetSave } from "../src/persistence/saves";

const expected: Record<string, Record<string,string>> = {
  "jade-harbor": {"0,-3":"e66c805303d40070", "4,13":"ac5cadf53c1a2132", "-12,18":"ad9d5d7dd9ae1046"},
  "different-city": {"0,-3":"d2d00b68da52a1af", "4,13":"ff8f8137c3aabcf6", "-12,18":"7c8eb2c8c308619c"},
};
async function fingerprint(c:BlockColumn) {
  const payload=JSON.stringify(c.serialize().map(s=>({sy:s.sy,uniform:s.uniform,data:s.data?Array.from(s.data):null})));
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(payload)))].map(b=>b.toString(16).padStart(2,"0")).join("");
}
describe("single world generator", () => {
  it.each(Object.entries(expected).flatMap(([seed,cols])=>Object.entries(cols).map(([key,prefix])=>({seed,key,prefix}))))("preserves released voxel geometry for $seed@$key",async ({seed,key,prefix})=>{
    const [x,z]=key.split(",").map(Number),generator=createGenerator(seed);
    expect((await fingerprint(generator.generate(x,z))).startsWith(prefix)).toBe(true);
  },30000);
  it("matches worker/main generation, keeps tickets and rejects malformed coordinates",async ()=>{
    const worker=createGenerationSession(),seed="jade-harbor",request={cx:0,cz:-3,seed,epoch:2,ticket:14};
    const result=worker.run(request);
    expect(result).toMatchObject({cx:0,cz:-3,epoch:2,ticket:14});
    expect(Object.hasOwn(result,"generator")).toBe(false);
    expect(await fingerprint(BlockColumn.from(result.sections))).toBe(await fingerprint(generateChunk(0,-3,seed)));
    expect(worker.size).toBe(1);
    expect(()=>worker.run({...request,cx:NaN})).toThrow();
    worker.dispose();expect(worker.size).toBe(0);
  },30000);
  it("uses deterministic per-seed plans and bounded offline caches",()=>{
    const a=generatorFor("jade-harbor"),b=generatorFor("jade-harbor"),different=createGenerator("different-city");
    expect(a).toBe(b);
    expect(a.generate(0,-3).serialize()).not.toEqual(different.generate(0,-3).serialize());
    expect(generatorCacheSizes().contexts).toBeLessThanOrEqual(4);
    clearGeneratorCache("jade-harbor");
    expect(generatorFor("jade-harbor")).not.toBe(a);
  });
  it("keeps current world edits and deterministic generated blocks",()=>{
    const world=new World("jade-harbor",{},false);
    world.ensure(0,-3,true);
    const original=world.get(0,35,-45);
    world.set(0,35,-45,B.Gold);expect(world.get(0,35,-45)).toBe(B.Gold);
    world.dispose();
    const reopened=new World("jade-harbor",{"0,35,-45":B.Gold},false);
    reopened.ensure(0,-3,true);expect(reopened.get(0,35,-45)).toBe(B.Gold);
    reopened.dispose();expect(original).toBeDefined();
  },30000);
});
describe("single-generator saves",()=>{
  it("writes an unversioned generator layout while retaining explicit save schema",()=>{
    const save=freshWorld("Current world","jade-harbor","creative");
    expect(save.version).toBe(1);
    expect(Object.hasOwn(save,"generator")).toBe(false);
    expect(validateSave(save)).toEqual(save);
  });
  it("rejects generator selectors from obsolete save layouts",()=>{
    const save=freshWorld("Imported","jade-harbor","creative");
    expect(()=>validateSave({...save,generator:10})).toThrow(/unsupported terrain layout/i);
    expect(()=>validateSave({...save,generator:9})).toThrow(/unsupported terrain layout/i);
  });
  it("round-trips new saves and resets in the unified schema",async()=>{
    const save=freshWorld("Persistence","jade-harbor","creative");
    save.edits["0,35,-45"]=B.Gold;
    const revision=await writeSave(save);expect(revision).toBeGreaterThan(0);
    const loaded=await loadSave(save.id);
    expect(loaded.edits["0,35,-45"]).toBe(B.Gold);
    expect(Object.hasOwn(loaded,"generator")).toBe(false);
    const reset=await resetSave(save.id);
    expect(reset.edits).toEqual({});
    expect(reset.seed).toBe(save.seed);
  },30000);
});
