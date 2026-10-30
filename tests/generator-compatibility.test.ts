import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import "fake-indexeddb/auto";
import { DATABASE_NAME, freshWorld, writeSave, loadSave, validateSave, resetSave } from "../src/persistence/saves";
import { World } from "../src/world/world";
import { B } from "../src/world/blocks";
import { BlockColumn } from "../src/world/sections";
import { createGenerator, generatorFor, generateChunk, requireGeneratorVersion } from "../src/world/generator";
import { createGenerationSession, type GenerationRequest } from "../src/world/generation-protocol";

afterEach(() => vi.unstubAllGlobals());
async function tamper(store: string, fn: (store: IDBObjectStore) => void) {
  await new Promise<void>((resolve, reject) => { const r = indexedDB.open(DATABASE_NAME, 1); r.onsuccess = () => {
    const db = r.result, tx = db.transaction(store, "readwrite"); fn(tx.objectStore(store)); tx.oncomplete = () => { db.close(); resolve(); }; tx.onabort = () => reject(tx.error);
  }; r.onerror = () => reject(r.error); });
}
class FakeWorker {
  static latest: FakeWorker;
  requests: GenerationRequest[] = [];
  onmessage?: (e: { data: ReturnType<ReturnType<typeof createGenerationSession>["run"]> }) => void;
  onerror?: () => void;
  terminated = false;
  private session=createGenerationSession();
  constructor() { FakeWorker.latest = this; }
  postMessage(request: GenerationRequest) { this.requests.push(request); }
  terminate() { this.terminated = true; this.session.dispose(); }
  prime(seed:string,generator:number) { this.session.run({cx:0,cz:0,seed,generator,epoch:0,ticket:0}); }
  finish(request: GenerationRequest) { this.onmessage?.({ data: this.session.run(request) }); }
}
it("defaults new worlds to v10, rejects all unsupported versions and keeps v3 exports valid", () => {
  expect(freshWorld("new", "jade-harbor", "creative").generator).toBe(10);
  for (const version of [3, 4, 5, 6, 7, 8, 9, 10]) {
    const save = { ...freshWorld("supported", "jade-harbor", "creative"), generator: version };
    expect(validateSave(JSON.parse(JSON.stringify(save))).generator).toBe(version);
  }
  for (const v of [0, 1, 2, 11, 3.5, NaN, Infinity, "3", null, undefined]) {
    expect(() => requireGeneratorVersion(v)).toThrow();
    expect(() => validateSave({ ...freshWorld("bad", "a", "creative"), generator: v })).toThrow();
  }
  expect(() => new World("a", {}, false, 11)).toThrow();
});
async function roundTripGenerator(version:number,canonical?:ReturnType<typeof createGenerator>,preparedWorld?:World) {
  const save = { ...freshWorld("durability", "jade-harbor", "creative"), generator: version };
  const world = preparedWorld ?? new World(save.seed, {}, false, version), gen = canonical ?? createGenerator(save.seed, version);
  const positions = [[200, 18, 530], [160, gen.terrainHeight(160, -630), -630], [1, -32, -43], [-1, -1, -1], [-16, 319, -16],
    [15, -63, 16], [328, 23, 0], [0, 35, -45], [0, 34, -430], [360, -31, 112]];
  let revision = await writeSave(save);
  for (let i = 0; i < positions.length; i++) { const [x, y, z] = positions[i]; world.ensure(Math.floor(x / 16), Math.floor(z / 16), true); world.set(x, y, z, i % 2 ? B.Red : B.Air); }
  const captured = world.captureChanges();
  revision = await writeSave(save, captured.chunks, revision); world.acknowledgeChanges(captured.revisions);
  world.stream(-10000, 10000, 0);
  for (let i = 0; i < positions.length; i++) { const [x, y, z] = positions[i]; world.ensure(Math.floor(x / 16), Math.floor(z / 16), true); expect(world.get(x, y, z)).toBe(i % 2 ? B.Red : B.Air); }
  world.dispose();
  const loaded = await loadSave(save.id), imported = validateSave(JSON.parse(JSON.stringify(loaded)));
  expect(imported.generator).toBe(version); expect(imported.revision).toBe(revision);
  const reopened = new World(imported.seed, imported.edits, false, imported.generator);
  for (let i = 0; i < positions.length; i++) { const [x, y, z] = positions[i]; reopened.ensure(Math.floor(x / 16), Math.floor(z / 16), true); expect(reopened.get(x, y, z)).toBe(i % 2 ? B.Red : B.Air); }
  expect(reopened.generatorVersion).toBe(version); reopened.dispose();

}
for(const version of[3,4,5,6,7,8,9,10])describe(`generator ${version} durability`,()=>{
  let canonical:ReturnType<typeof createGenerator>|undefined,preparedWorld:World;
  // Keep every write/evict/independently cold-reopen comparison. These are
  // functional integration cases; separate profiles measure cold planning cost.
  beforeAll(()=>{canonical=createGenerator("jade-harbor",version);preparedWorld=new World("jade-harbor",{},false,version);},20000);
  afterAll(()=>{preparedWorld.dispose();canonical=undefined;});
  it(`round-trips generator ${version} and edits in every geographic and vertical boundary through eviction and reopen`,()=>roundTripGenerator(version,canonical,preparedWorld),30000);
});

it.each([3, 4, 5, 6, 7, 8, 9, 10])("reset/recovery retains generator %i even when components and checkpoints are damaged", async version => {
  const save = { ...freshWorld("recover", "jade-harbor", "creative"), generator: version, edits: { "0,35,-45": B.Gold } };
  await writeSave(save); await tamper("players", s => s.delete(save.id)); await tamper("checkpoints", s => s.delete(save.id));
  await expect(loadSave(save.id)).rejects.toThrow();
  expect((await resetSave(save.id)).generator).toBe(version);
  const restored = await loadSave(save.id); expect(restored.generator).toBe(version); expect(restored.edits).toEqual({});
});
it.each([3, 4, 5, 6, 7, 8, 9, 10])("rejects altered generator %i metadata and prevents base identity changes during ordinary writes", async version => {
  const save = { ...freshWorld("immutable", "jade-harbor", "creative"), generator: version };
  const revision = await writeSave(save);
  await expect(writeSave({ ...save, generator: version === 8 ? 7 : 8 }, [], revision)).rejects.toThrow("immutable");
  await expect(writeSave({ ...save, seed: "other" }, [], revision)).rejects.toThrow("immutable");
  expect((await loadSave(save.id)).generator).toBe(version);
  await tamper("worlds", s => { const r = s.get(save.id); r.onsuccess = () => s.put({ ...r.result, generator: 99 }); });
  await expect(loadSave(save.id)).rejects.toThrow(); await expect(resetSave(save.id)).rejects.toThrow("metadata");
});
describe.sequential("frozen worker/main parity across repeated version switches", () => {
  const sequence=[7,6,5,4,3,7];
  let session:ReturnType<typeof createGenerationSession>;
  beforeAll(()=>{session=createGenerationSession();});
  afterAll(()=>session.dispose());
  // Keep the same session and ordered 24-column matrix, but give each version
  // transition its own functional window; profiles measure cold planning.
  it.each(sequence.map((generator,step)=>({generator,step})))("stage $step: v$generator preserves every packed value with one worker context",({generator,step})=>{
  for (const [cx, cz] of [[0, -3], [12, 33], [-27, -36], [38, -27]]) {
    const result = session.run({ cx, cz, seed: "jade-harbor", generator, epoch: 2, ticket: 7 });
    const actual = BlockColumn.from(result.sections).serialize(), expected = generateChunk(cx, cz, "jade-harbor", generator).serialize();
    // Compare every packed value exactly, without allocating a deep matcher
    // traversal over hundreds of thousands of typed-array elements.
    const shape = (rows: typeof actual) => rows.map(s => ({ sy:s.sy, uniform:s.uniform, length:s.data?.length }));
    expect(shape(actual)).toEqual(shape(expected));
    let identical = true;
    for (let i=0;i<actual.length;i++) {
      const a=actual[i].data,b=expected[i].data;
      if(a&&b)for(let j=0;j<a.length;j++)if(a[j]!==b[j]){identical=false;break;}
    }
    expect(identical,`v${generator} worker packed payload at ${cx},${cz}`).toBe(true);
    expect(result.generator).toBe(generator); expect(result.epoch).toBe(2); expect(result.ticket).toBe(7); expect(session.size).toBe(1);
  }
  if(step===sequence.length-1) {
    session.dispose(); expect(session.size).toBe(0);
    expect(() => session.run({ cx: NaN, cz: 0, seed: "a", generator: 4, epoch: 0, ticket: 1 })).toThrow();
  }
  });
});
for(const seed of["jade-harbor","different-city","长江玉港"])describe(`frozen v8 parity fixture ${seed}`,()=>{
  let session:ReturnType<typeof createGenerationSession>;
  beforeAll(()=>{session=createGenerationSession();session.run({cx:0,cz:0,seed,generator:8,epoch:0,ticket:0});generatorFor(seed,8);},20000);
  afterAll(()=>session.dispose());
  it("compares every packed value for all four worker/main columns with one context",()=>{
  for(const [cx,cz] of [[0,-3],[12,33],[-27,-36],[38,-27]]) {
    const result=session.run({cx,cz,seed,generator:8,epoch:2,ticket:7});
    const actual=BlockColumn.from(result.sections).serialize(),expected=generateChunk(cx,cz,seed,8).serialize();
    expect(actual.map(s=>({sy:s.sy,uniform:s.uniform,length:s.data?.length}))).toEqual(expected.map(s=>({sy:s.sy,uniform:s.uniform,length:s.data?.length})));
    let equal=true;for(let i=0;i<actual.length;i++){const a=actual[i].data,b=expected[i].data;if(a&&b)for(let j=0;j<a.length;j++)if(a[j]!==b[j]){equal=false;break;}}
    expect(equal,`${seed}:${cx},${cz}`).toBe(true);expect(result.generator).toBe(8);expect(result.epoch).toBe(2);expect(result.ticket).toBe(7);expect(session.size).toBe(1);
  }
  session.dispose();expect(session.size).toBe(0);
});
});

it("rejects stale tickets, wrong generator responses and outputs after disposal", () => {
  vi.stubGlobal("Worker", FakeWorker);
  const world = new World("jade-harbor", {}, true, 4), worker = FakeWorker.latest;
  world.ensure(12, 33); const old = worker.requests[0];
  worker.finish({ ...old, generator: 3 }); expect(world.chunks.size).toBe(0);
  world.set(200, 18, 530, B.Gold); world.ensure(12, 33, true);
  worker.finish(old); expect(world.get(200, 18, 530)).toBe(B.Gold);
  world.ensure(0, -3); const request = worker.requests.at(-1)!;
  world.stream(10000, 10000, 0); worker.finish(request); expect(world.chunks.has("0,-3")).toBe(false);
  world.dispose(); worker.finish(old); expect(world.chunks.size).toBe(0); expect(world.planCount).toBe(0); expect(worker.terminated).toBe(true);
});
describe("pending-edit worker fixture",()=>{
  let world:World,worker:FakeWorker;
  beforeAll(()=>{vi.stubGlobal("Worker",FakeWorker);world=new World("jade-harbor");worker=FakeWorker.latest;},20000);
  afterAll(()=>world.dispose());
it("saves edits while worker generation is pending and overlays the eventual result", async () => {
  const save = freshWorld("pending", "jade-harbor", "creative");
  const revision = await writeSave(save); world.ensure(12, 33); world.set(200, 18, 530, B.Jade);
  const capture = world.captureChanges(); await writeSave(save, capture.chunks, revision); world.acknowledgeChanges(capture.revisions);
  worker.finish(worker.requests[0]); expect(world.get(200, 18, 530)).toBe(B.Jade);
  expect((await loadSave(save.id)).edits["200,18,530"]).toBe(B.Jade); world.dispose();
});
});
function boundedTravelQueues(version:number,preparedWorld?:World) {
  vi.stubGlobal("Worker", FakeWorker);
  const world = preparedWorld ?? new World("jade-harbor",{},true,version), worker = FakeWorker.latest;
  world.ensure(0, 0, true); world.set(1, 25, 1, B.Gold);
  for (let i = 0; i < 30; i++) {
    const [x, z] = [[200, 530], [160, -630], [-420, -570], [620, -430], [10000, -10000], [0, 0]][i % 6];
    world.stream(x, z, 3); expect(world.pending.size).toBeLessThanOrEqual(8); expect(world.chunks.has("0,0")).toBe(true);
    const pending = worker.requests.slice(-4); for (const request of pending) worker.finish(request);
    expect(world.chunks.size).toBeLessThanOrEqual(13);
  }
  world.dispose(); expect(world.pending.size).toBe(0);

}
for(const version of[8,9,10])describe(`bounded v${version} travel fixture`,()=>{
  let world:World;
  beforeAll(()=>{vi.stubGlobal("Worker",FakeWorker);world=new World("jade-harbor",{},true,version);FakeWorker.latest.prime(world.seed,version);},20000);
  afterAll(()=>world.dispose());
  it("keeps travel queues bounded and unsaved columns pinned through thirty macro traversals",()=>boundedTravelQueues(version,world),30000);
});

it.each(["jade-harbor","different-city","长江玉港"])("runs v9 worker/main packed generation identically (%s)",seed=>{
  const session=createGenerationSession(),result=session.run({cx:-33,cz:26,seed,generator:9,epoch:4,ticket:11}),actual=BlockColumn.from(result.sections),expected=generateChunk(-33,26,seed,9);
  for(let y=-64;y<=319;y++)for(let z=0;z<16;z++)for(let x=0;x<16;x++)if(actual.get(x,y,z)!==expected.get(x,y,z))throw Error(`Worker parity ${x},${y},${z}`);
  expect(result.generator).toBe(9);expect(result.epoch).toBe(4);expect(result.ticket).toBe(11);expect(session.size).toBe(1);session.dispose();expect(session.size).toBe(0);
},15000);
