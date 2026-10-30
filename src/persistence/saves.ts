import { ActiveEffect, validEffects, validMetadata } from "../game/progression";
import { INFUSIONS } from "../game/brewing";
import { PROFESSIONS } from "../game/professions";
import { Stack, Inventory } from "../game/inventory";
import { ARMOR_SLOTS } from "../game/equipment";
import { Vec3, MIN_Y, MAX_Y, MIN_SECTION, MAX_SECTION, sectionKey, chunkCoord, localCoord, index } from "../core/coords";
import { B, block } from "../world/blocks";
import { item } from "../game/items";
import { GENERATOR_VERSION, isGeneratorVersion } from "../world/generator";
import { CITY_SPAWN } from "../world/city/plan";
export const DATABASE_NAME = "jade-harbor-engine-v1";
export const DATABASE_VERSION = 1;
export type Mode =
  | "creative"
  | "survival"
  | "adventure"
  | "spectator"
  | "hardcore";
export type SaveData = {
  format: "jade-harbor-engine";
  version: 1;
  generator: number;
  revision?: number;
  id: string;
  name: string;
  seed: string;
  mode: Mode;
  created: number;
  updated: number;
  time: number;
  weather: string;
  edits: Record<string, number>;
  player: {
    position: Vec3;
    yaw: number;
    pitch: number;
    health: number;
    hunger: number;
    xp: number;
    effects?: ActiveEffect[];
    saturation?: number;
    exhaustion?: number;
    breath?: number;
    slots: (Stack | null)[];
    selected: number;
    armor?: (Stack | null)[];
    cursor?: Stack | null;
    grid?: (Stack | null)[];
    spawn: Vec3;
    dead?: boolean;
    flying?: boolean;
  };
  simulation?: Record<string, unknown>;
  achievements: string[];
};
export type SaveSummary = Pick<
  SaveData,
  "id" | "name" | "seed" | "mode" | "created" | "updated"
> & { generator?: number };
export type ChunkDelta = { key: string; entries: Uint16Array };
type StoredWorld = Omit<SaveData, "edits" | "player" | "simulation" | "time" | "weather" | "achievements"> & { revision: number };
type StoredChunk = ChunkDelta & { worldId: string; revision: number; version: 1 };
const COMPONENTS = ["players", "blockEntities", "entities", "worldSimulation"] as const;
const STORES = ["worlds", "chunks", ...COMPONENTS, "checkpoints"];
type Checkpoint = { worldId: string; revision: number; schema: 1; committedAt: number; chunks: Record<string, number>; metadata: number };
const TOP_LEVEL_KEYS = new Set(["format","version","generator","revision","id","name","seed","mode","created","updated","time","weather","edits","player","simulation","achievements"]);
const PLAYER_KEYS = new Set(["position","yaw","pitch","health","hunger","xp","effects","saturation","exhaustion","breath","slots","selected","armor","cursor","grid","spawn","dead","flying"]);
const SIMULATION_KEYS = new Set(["containers","furnaces","brewers","hoppers","entities","drops","elapsed","tickNo","cropTimer","pendingTicks","weather","weatherTimer","hardcoreEnded","cityLifeVersion"]);
const ENTITY_KEYS = new Set(["id","kind","name","body","health","home","goal","timer","cooldown","yaw","state","trades","profession","workplace","navStatus","knockback"]);
const BODY_KEYS = new Set(["position","velocity","grounded","flying","fallStart"]);
const DROP_KEYS = new Set(["id","stack","position","velocity","age"]);
const VEC3_KEYS = new Set(["x","y","z"]);
const STACK_KEYS = new Set(["id","count","durability","enchants","wearCounter"]);
const EFFECT_KEYS = new Set(["id","remaining","pulse"]);
const FURNACE_KEYS = new Set(["slots","burn","progress","recipe"]);
const BREWER_KEYS = new Set(["slots","fuel","progress","recipe"]);
const HOPPER_KEYS = new Set(["slots","cooldown"]);
const STORED_WORLD_KEYS = new Set(["format","version","generator","revision","id","name","seed","mode","created","updated"]);
const CHECKPOINT_KEYS = new Set(["worldId","revision","schema","committedAt","chunks","metadata"]);
const COMPONENT_RECORD_KEYS = new Set(["worldId","revision","data"]);
const STORED_CHUNK_KEYS = new Set(["worldId","key","entries","revision","version"]);
const MAX_BLOCK_ENTITIES = 16384;
const MAX_ACHIEVEMENTS = 256;
const MAX_CHECKPOINT_CHUNKS = 500000;
// Stable, inexpensive corruption detection, not a cryptographic authenticity guarantee.
export function checksum(value: unknown): number {
  let h = 2166136261;
  const active = new WeakSet<object>();
  const visit = (v: unknown, depth = 0) => {
    if (depth > 96) throw new Error("Save state is too deeply nested.");
    if (v !== null && typeof v === "object") {
      if (active.has(v)) throw new Error("Cyclic save state cannot be checksummed.");
      active.add(v);
      if (Array.isArray(v) || ArrayBuffer.isView(v)) {
        feed("["); for (const x of v as number[]) visit(x,depth+1); feed("]");
      } else {
        feed("{"); for (const k of Object.keys(v).sort()) { feed(JSON.stringify(k)); visit((v as Record<string, unknown>)[k],depth+1); } feed("}");
      }
      active.delete(v);
    } else feed(JSON.stringify(v) ?? "undefined");
  };
  const feed = (text: string) => { for (let i=0;i<text.length;i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619); };
  visit(value); return h >>> 0;
}
function plainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype=Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
function onlyKeys(value: Record<string, unknown>, allowed: ReadonlySet<string>) {
  return Object.keys(value).every((key) => allowed.has(key));
}
function timestamp(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1e15;
}
function uint32(value: unknown) {
  return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 0xffffffff;
}
function validSectionKey(key: string) {
  const k = key.split(",").map(Number);
  return k.length === 3 && k.every(Number.isInteger) && Math.abs(k[0]) <= 625000 &&
    Math.abs(k[2]) <= 625000 && k[1] >= MIN_SECTION && k[1] <= MAX_SECTION;
}
function validBlockValue(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 65535 &&
    block(Number(value)).id === (Number(value) & 255) &&
    ((Number(value) & 255) !== B.Air || Number(value) === B.Air);
}
function validateDelta(c: ChunkDelta) {
  if (!c || typeof c.key !== "string" || !validSectionKey(c.key) ||
      !(c.entries instanceof Uint16Array) || c.entries.length % 2 || c.entries.length > 8192)
    throw new Error("Damaged chunk record. Import a known-good backup or reset this world.");
  const seen = new Set<number>();
  for (let i=0;i<c.entries.length;i+=2) {
    const at=c.entries[i], v=c.entries[i+1];
    if (at >= 4096 || seen.has(at) || !validBlockValue(v))
      throw new Error("Invalid or duplicate chunk entry.");
    seen.add(at);
  }
}
function canonicalDelta(c: ChunkDelta): ChunkDelta {
  validateDelta(c);
  const pairs: [number, number][] = [];
  for (let i=0;i<c.entries.length;i+=2) pairs.push([c.entries[i],c.entries[i+1]]);
  pairs.sort((a,b)=>a[0]-b[0]);
  const entries=new Uint16Array(c.entries.length);
  for(let i=0;i<pairs.length;i++){entries[i*2]=pairs[i][0];entries[i*2+1]=pairs[i][1];}
  return { key:c.key, entries };
}
function validateCheckpoint(value: unknown, worldId: string): Checkpoint {
  const cp=value as Checkpoint;
  if (!plainRecord(cp) || !onlyKeys(cp,CHECKPOINT_KEYS) || cp.worldId !== worldId || cp.schema !== 1 ||
      !Number.isSafeInteger(cp.revision) || cp.revision < 1 || !timestamp(cp.committedAt) ||
      !plainRecord(cp.chunks) || Object.keys(cp.chunks).length > MAX_CHECKPOINT_CHUNKS ||
      !uint32(cp.metadata))
    throw new Error("Invalid save checkpoint.");
  for (const [key, value] of Object.entries(cp.chunks))
    if (!validSectionKey(key) || !uint32(value)) throw new Error("Invalid save checkpoint.");
  return cp;
}
function validateStoredChunk(value: unknown, worldId: string, revision: number): StoredChunk {
  const c=value as StoredChunk;
  validateDelta(c);
  if (!plainRecord(c) || !onlyKeys(c,STORED_CHUNK_KEYS) || c.worldId !== worldId || c.version !== 1 ||
      !Number.isSafeInteger(c.revision) || c.revision < 1 || c.revision > revision)
    throw new Error("Invalid chunk metadata.");
  return c;
}
function splitState(d: SaveData, revision: number) {
  const { edits: _, player, simulation = {}, time, weather, achievements, ...meta } = d;
  const { containers = {}, furnaces = {}, brewers = {}, hoppers = {}, entities = [], drops = [], ...sim } = simulation;
  return { meta: { ...meta, revision }, parts: { players: player, blockEntities: { containers, furnaces, brewers, hoppers }, entities: { entities, drops }, worldSimulation: { ...sim, time, weather, achievements } } };
}
export function freshWorld(
  name: string,
  seed: string,
  mode: Mode,
  id: string = crypto.randomUUID(),
): SaveData {
  const inv = mode === "creative" ? Inventory.creative() : new Inventory();
  if (mode !== "creative") {
    inv.add(105, 4);
    inv.add(107, 5);
  }
  return {
    format: "jade-harbor-engine",
    version: 1,
    generator: GENERATOR_VERSION,
    revision: 0,
    id,
    name,
    seed,
    mode,
    created: Date.now(),
    updated: Date.now(),
    time: 0.24,
    weather: "clear",
    edits: {},
    player: {
      position: { ...CITY_SPAWN },
      spawn: { ...CITY_SPAWN },
      yaw: 0,
      pitch: 0,
      health: 20,
      hunger: 20,
      xp: 0,
      slots: inv.slots,
      selected: 0,
      armor: [null, null, null, null],
      grid: Array(9).fill(null),
      cursor: null,
      dead: false,
      flying: mode === "spectator",
    },
    achievements: [],
  };
}
async function openDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    let rejected = false, request: IDBOpenDBRequest;
    try { request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION); }
    catch (error) { reject(error); return; }
    request.onupgradeneeded = () => {
      const db = request.result, tx = request.transaction!;
      const ensureStore = (name: string, options?: IDBObjectStoreParameters) =>
        db.objectStoreNames.contains(name) ? tx.objectStore(name) : db.createObjectStore(name, options);
      ensureStore("worlds", { keyPath: "id" });
      for (const name of [...COMPONENTS, "checkpoints"]) ensureStore(name, { keyPath: "worldId" });
      const chunks = ensureStore("chunks", { keyPath: ["worldId", "key"] });
      if (!chunks.indexNames.contains("worldId")) chunks.createIndex("worldId", "worldId");
    };
    request.onerror = () =>
      reject(request.error ?? new Error("Could not open browser storage."));
    request.onblocked = () => {
      rejected = true;
      reject(new Error("Close other Jade Harbor tabs to access storage."));
    };
    request.onsuccess = () => {
      if (rejected) {
        request.result.close();
        return;
      }
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
  });
}
function completion<T>(
  db: IDBDatabase,
  tx: IDBTransaction,
  value: () => T,
  error: () => unknown = () => tx.error,
) {
  return new Promise<T>((resolve, reject) => {
    tx.oncomplete = () => {
      db.close();
      try { resolve(value()); } catch(error) { reject(error); }
    };
    tx.onabort = tx.onerror = () => {
      db.close();
      reject(error() ?? new Error("Save transaction aborted."));
    };
  });
}
export async function listSaves(): Promise<SaveSummary[]> {
  const db = await openDB(),
    tx = db.transaction("worlds", "readonly"),
    request = tx.objectStore("worlds").getAll();
  return completion(db, tx, () =>
    request.result.map((d: StoredWorld) => ({
      id: d.id,
      name: d.name,
      seed: d.seed,
      generator: d.generator,
      mode: d.mode,
      created: d.created,
      updated: d.updated,
    })),
  );
}
export function encodeEdits(edits: Record<string, number>): ChunkDelta[] {
  const chunks = new Map<string, [number,number][]>();
  for (const [key, value] of Object.entries(edits)) {
    const [x, y, z] = key.split(",").map(Number),
      ck = sectionKey(chunkCoord(x),chunkCoord(y),chunkCoord(z)),
      pairs = chunks.get(ck) ?? [];
    pairs.push([index(localCoord(x), localCoord(y), localCoord(z)), value]);
    chunks.set(ck, pairs);
  }
  return [...chunks].sort(([a],[b])=>a.localeCompare(b)).map(([key, pairs]) => {
    pairs.sort((a,b)=>a[0]-b[0]);
    const entries=new Uint16Array(pairs.length*2);
    for(let i=0;i<pairs.length;i++){entries[i*2]=pairs[i][0];entries[i*2+1]=pairs[i][1];}
    return {key,entries};
  });
}
export async function loadSave(id: string): Promise<SaveData> {
  const db = await openDB(), tx = db.transaction(STORES, "readonly");
  const world = tx.objectStore("worlds").get(id), chunks = tx.objectStore("chunks").index("worldId").getAll(id), checkpoint = tx.objectStore("checkpoints").get(id);
  const records = COMPONENTS.map(name=>tx.objectStore(name).get(id));
  await completion(db,tx,()=>undefined);
  if (!world.result) throw new Error("This world is no longer available.");
  const damaged = () => new Error("Incomplete or damaged save. Existing data was kept. Import a backup or reset this world.");
  let cp: Checkpoint, meta: StoredWorld, storedChunks: StoredChunk[];
  try {
    cp = validateCheckpoint(checkpoint.result,id);
    meta = world.result as StoredWorld;
    if (!plainRecord(meta) || !onlyKeys(meta as unknown as Record<string, unknown>,STORED_WORLD_KEYS) ||
        meta.id !== id || meta.revision !== cp.revision ||
        records.some(r=>!plainRecord(r.result) || !onlyKeys(r.result,COMPONENT_RECORD_KEYS) ||
          r.result.worldId !== id || r.result.revision !== cp.revision)) throw damaged();
    storedChunks=(chunks.result as unknown[]).map(c=>validateStoredChunk(c,id,cp.revision));
  } catch { throw damaged(); }
  const parts = Object.fromEntries(COMPONENTS.map((n,i)=>[n,records[i].result.data]));
  try {
    const { time, weather, achievements, ...sim } = parts.worldSimulation;
    validateSave({ ...meta, player:parts.players, time, weather, achievements, edits:{},
      simulation:{...sim,weather,...parts.blockEntities,...parts.entities} });
  } catch { throw damaged(); }
  try { if (checksum({ meta, parts }) !== cp.metadata) throw damaged(); }
  catch { throw damaged(); }
  if (storedChunks.length !== Object.keys(cp.chunks).length) throw damaged();
  const edits: Record<string, number> = {};
  for (const c of storedChunks) {
    if (!Object.hasOwn(cp.chunks,c.key) || checksum(c.entries) !== cp.chunks[c.key]) throw damaged();
    const [cx,sy,cz] = c.key.split(",").map(Number);
    for(let i=0;i<c.entries.length;i+=2) {
      const at=c.entries[i];
      edits[`${cx*16+at%16},${sy*16+Math.floor(at/256)},${cz*16+Math.floor(at%256/16)}`]=c.entries[i+1];
    }
  }
  const { time, weather, achievements, ...sim } = parts.worldSimulation;
  return validateSave({ ...meta, player: parts.players, time, weather, achievements, edits, simulation: { ...sim, weather, ...parts.blockEntities, ...parts.entities } });
}
/** Commit a coherent player, containers, entities, simulation and dirty overlay snapshot.
 * All stores share one transaction; the checkpoint manifest becomes visible atomically. */
async function commitSave(data: SaveData, changes?: ChunkDelta[], expectedRevision?: number, allowRecovery = false) {
  data = validateSave(data);
  if (allowRecovery && changes !== undefined) throw new Error("Recovery writes must replace the complete save.");
  const deltas = (changes ?? encodeEdits(data.edits)).map(canonicalDelta);
  if (new Set(deltas.map(c=>c.key)).size !== deltas.length) throw new Error("Duplicate chunk delta.");
  const db = await openDB(), tx = db.transaction(STORES, "readwrite"), worlds = tx.objectStore("worlds"), chunks = tx.objectStore("chunks");
  let revision = 0, failure: unknown;
  const done = completion(db,tx,()=>revision,()=>failure ?? tx.error);
  const request = worlds.get(data.id), cpRequest = tx.objectStore("checkpoints").get(data.id);
  cpRequest.onsuccess = () => {
    try {
      const previous = request.result as StoredWorld | undefined;
      if (expectedRevision !== undefined && (previous?.revision ?? 0) !== expectedRevision)
        throw new Error("Another tab saved a newer copy. Export a backup, then close this tab and reopen the world.");
      if (previous && !cpRequest.result && !allowRecovery) throw new Error("Missing save checkpoint. Export your work and create a new world.");
      if (previous && (!Number.isSafeInteger(previous.revision) || previous.revision < 0 || previous.revision >= Number.MAX_SAFE_INTEGER))
        throw new Error("Invalid save revision. Reset this world or import a known-good backup.");
      if (previous && (previous.generator !== data.generator || previous.seed !== data.seed))
        throw new Error("World seed and generator are immutable. Import as a separate world.");
      revision = (previous?.revision ?? 0)+1;
      const state = splitState(data,revision);
      let manifest: Record<string,number> = {};
      if (changes) {
        const cp=validateCheckpoint(cpRequest.result,data.id);
        manifest={...cp.chunks};
      }
      const commit = () => {
        try {
          worlds.put(state.meta);
          for (const name of COMPONENTS) tx.objectStore(name).put({ worldId:data.id, revision, data:state.parts[name] });
          for (const c of deltas) {
            chunks.put({ worldId:data.id, key:c.key, entries:c.entries, revision, version:1 });
            manifest[c.key]=checksum(c.entries);
          }
          tx.objectStore("checkpoints").put({worldId:data.id, revision, schema:1, committedAt:Date.now(), chunks:manifest, metadata:checksum(state)} satisfies Checkpoint);
        } catch (e) { failure=e; tx.abort(); }
      };
      if (changes) commit();
      else {
        const cursor = chunks.index("worldId").openKeyCursor(data.id);
        cursor.onsuccess=()=>{if(cursor.result){chunks.delete(cursor.result.primaryKey);cursor.result.continue();}else commit();};
      }
    } catch (e) { failure=e; tx.abort(); }
  };
  return done;
}
export async function writeSave(data: SaveData, changes?: ChunkDelta[], expectedRevision?: number) {
  return commitSave(data,changes,expectedRevision,false);
}
async function recoveryWorldMeta(id: string) {
  const db=await openDB(),tx=db.transaction("worlds","readonly"),request=tx.objectStore("worlds").get(id);
  await completion(db,tx,()=>undefined);
  const d=request.result as StoredWorld | undefined;
  if (!d) throw new Error("This world is no longer available.");
  if (!plainRecord(d) || !onlyKeys(d as unknown as Record<string, unknown>,STORED_WORLD_KEYS) ||
      d.id !== id || d.format !== "jade-harbor-engine" || d.version !== 1 || !isGeneratorVersion(d.generator) ||
      typeof d.name !== "string" || typeof d.seed !== "string" ||
      !["creative","survival","hardcore","adventure","spectator"].includes(d.mode) ||
      !timestamp(d.created) || !timestamp(d.updated) ||
      !Number.isSafeInteger(d.revision) || d.revision < 1 || d.revision >= Number.MAX_SAFE_INTEGER)
    throw new Error("World metadata is damaged. Import a known-good backup or delete this world.");
  return d;
}
export async function deleteSave(id: string) {
  const db=await openDB(), tx=db.transaction(STORES,"readwrite");
  tx.objectStore("worlds").delete(id);
  for(const name of [...COMPONENTS,"checkpoints"]) tx.objectStore(name).delete(id);
  const store=tx.objectStore("chunks"), cursor=store.index("worldId").openKeyCursor(id);
  cursor.onsuccess=()=>{if(cursor.result){store.delete(cursor.result.primaryKey);cursor.result.continue();}};
  return completion(db,tx,()=>undefined);
}
export async function renameSave(id: string, name: string) {
  const d=await loadSave(id);
  d.name=name.trim().slice(0,64);
  if(!d.name) throw new Error("Give your world a name.");
  d.updated=Date.now();
  return writeSave(d,[],d.revision);
}
export async function resetSave(id: string) {
  // Reset is also the destructive recovery path for a world whose checkpoint,
  // component record or chunk data is damaged. Read only the independently
  // stored metadata, then atomically replace every save component.
  const old = await recoveryWorldMeta(id),
    fresh = freshWorld(old.name, old.seed, old.mode, id);
  fresh.generator = old.generator;
  fresh.revision = await commitSave(fresh, undefined, old.revision, true);
  return fresh;
}
export function validateSave(raw: unknown): SaveData {
  let d: SaveData;
  try { d = structuredClone(raw) as SaveData; }
  catch { throw new Error("Unsupported or damaged Jade Harbor save."); }
  if (
    !plainRecord(d) ||
    !onlyKeys(d as unknown as Record<string, unknown>, TOP_LEVEL_KEYS) ||
    d.version !== 1 ||
    d.format !== "jade-harbor-engine" ||
    !isGeneratorVersion(d.generator) ||
    typeof d.id !== "string" ||
    !d.id ||
    d.id.length > 160 ||
    typeof d.seed !== "string" ||
    typeof d.name !== "string" ||
    !["creative", "survival", "hardcore", "adventure", "spectator"].includes(
      d.mode,
    ) ||
    !plainRecord(d.player) ||
    !onlyKeys(d.player as unknown as Record<string, unknown>, PLAYER_KEYS) ||
    !d.edits ||
    typeof d.edits !== "object" ||
    Array.isArray(d.edits) ||
    !Array.isArray(d.achievements) || d.achievements.length > MAX_ACHIEVEMENTS ||
    new Set(d.achievements).size !== d.achievements.length ||
    d.achievements.some(a=>typeof a !== "string" || a.length > 120) ||
    !timestamp(d.created) || !timestamp(d.updated) || !["clear","rain"].includes(d.weather) ||
    (d.revision !== undefined && (!Number.isSafeInteger(d.revision) || d.revision < 0))
  )
    throw new Error("Unsupported or damaged Jade Harbor save.");
  const p = d.player;
  for (const v of [p.position, p.spawn])
    if (
      !plainRecord(v) || !onlyKeys(v,VEC3_KEYS) ||
      ![v.x, v.y, v.z].every(Number.isFinite) ||
      Math.abs(v.x) > 1e7 ||
      Math.abs(v.z) > 1e7 ||
      v.y < MIN_Y-4 ||
      v.y > MAX_Y+64
    )
      throw new Error("Invalid player position.");
  if (
    ![p.yaw, p.pitch, p.health, p.hunger, p.xp, d.time].every(
      Number.isFinite,
    ) ||
    d.time < 0 ||
    d.time >= 1 ||
    p.xp < 0 || p.xp > 1e9 || Math.abs(p.pitch) > Math.PI/2 || Math.abs(p.yaw) > 1e6 ||
    p.health < 0 ||
    p.health > 20 ||
    p.hunger < 0 ||
    p.hunger > 20 ||
    (p.flying !== undefined && typeof p.flying !== "boolean") ||
    (p.dead !== undefined && typeof p.dead !== "boolean") ||
    !Number.isInteger(p.selected) ||
    p.selected < 0 ||
    p.selected > 8
  )
    throw new Error("Invalid player status.");
  if ((p.effects !== undefined && (!Array.isArray(p.effects) ||
        p.effects.some(e=>!plainRecord(e) || !onlyKeys(e,EFFECT_KEYS)) || !validEffects(p.effects))) ||
      [p.saturation, p.exhaustion, p.breath].some(n=>n!==undefined && (!Number.isFinite(n) || n<0)) ||
      (p.saturation ?? 0)>20 || (p.exhaustion ?? 0)>=4 || (p.breath ?? 0)>10)
    throw new Error("Invalid survival state.");
  if (!Array.isArray(p.slots) || p.slots.length !== 36)
    throw new Error("Invalid inventory.");
  if (p.grid !== undefined && (!Array.isArray(p.grid) || p.grid.length !== 9))
    throw new Error("Invalid crafting grid.");
  if (
    p.armor !== undefined &&
    (!Array.isArray(p.armor) ||
      p.armor.length !== 4 ||
      p.armor.some((s, i) => s && item(s.id)?.armorSlot !== ARMOR_SLOTS[i]))
  )
    throw new Error("Invalid armor equipment.");
  for (const s of [
    ...p.slots,
    p.cursor ?? null,
    ...(p.grid ?? []),
    ...(p.armor ?? []),
  ])
    if (!validStack(s)) throw new Error("Invalid item stack.");
  if (Object.keys(d.edits).length > 500000)
    throw new Error("World edit limit exceeded.");
  for (const [k, v] of Object.entries(d.edits)) {
    const a = k.split(",").map(Number);
    if (
      a.length !== 3 ||
      !a.every(Number.isInteger) ||
      Math.abs(a[0]) > 1e7 ||
      Math.abs(a[2]) > 1e7 ||
      a[1] <= MIN_Y ||
      a[1] > MAX_Y ||
      !validBlockValue(v)
    )
      throw new Error("Invalid world block.");
  }
  validateSimulation(d.simulation, d.generator);
  d.name = d.name.slice(0, 64);
  d.seed = d.seed.slice(0, 100);
  return d;
}
/** Explicit layout upgrade in a new save slot. Existing v6 data is never
 * rewritten with a different generator; overlays and progress survive. */
export function denseCityCopy(source: SaveData, target: 7 | 8 | 9 | 10 = 8): SaveData {
  const copy = validateSave(source);
  if (copy.generator !== 6 && !(target === 8 && copy.generator === 7) && !(target === 9 && (copy.generator === 7 || copy.generator === 8)) && !(target === 10 && copy.generator >= 7 && copy.generator <= 9)) throw new Error("This city layout already uses its own saved generation rules.");
  copy.id = crypto.randomUUID(); copy.generator = target; copy.revision = 0;
  copy.name = `${copy.name.slice(0, 50)} (dense city)`;
  copy.created = copy.updated = Date.now();
  copy.player.position = { ...CITY_SPAWN }; copy.player.spawn = { ...CITY_SPAWN }; copy.player.flying = false;
  return validateSave(copy);
}
export function exportSave(d: SaveData) {
  const blob = new Blob([JSON.stringify(d)], { type: "application/json" }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = `${d.name.replace(/[^a-z0-9_-]/gi, "-")}.jadeharbor.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function validateSimulation(sim: Record<string, unknown> | undefined, generator: number) {
  if (sim === undefined) return;
  const fail = () => {
    throw new Error("Invalid world simulation data.");
  };
  if (!plainRecord(sim) || !onlyKeys(sim,SIMULATION_KEYS)) fail();
  const finite = (n: unknown) => typeof n === "number" && Number.isFinite(n);
  const vector = (p: unknown) => {
    const v = p as Vec3;
    return (
      plainRecord(v) && onlyKeys(v,VEC3_KEYS) &&
      [v.x, v.y, v.z].every(finite) &&
      Math.abs(v.x) <= 1e7 &&
      Math.abs(v.z) <= 1e7 &&
      v.y >= -100 &&
      v.y <= 1000
    );
  };
  const motion = (p: unknown, limit: number) => {
    const v = p as Vec3;
    return plainRecord(v) && onlyKeys(v,VEC3_KEYS) && [v.x, v.y, v.z].every(finite) &&
      [v.x, v.y, v.z].every(n => Math.abs(n) <= limit);
  };

  const slots = (value: unknown, size: number) =>
    Array.isArray(value) && value.length === size && value.every(validStack);
  const positionKey = (key: string) => {
    const xyz = key.split(",").map(Number);
    return (
      xyz.length === 3 &&
      xyz.every(Number.isInteger) &&
      xyz[1] > MIN_Y &&
      xyz[1] <= MAX_Y &&
      Math.abs(xyz[0]) <= 1e7 &&
      Math.abs(xyz[2]) <= 1e7
    );
  };
  if (sim.containers !== undefined) {
    if (
      !sim.containers ||
      typeof sim.containers !== "object" ||
      Array.isArray(sim.containers)
    )
      fail();
    const entries=Object.entries(sim.containers as object);
    if(entries.length>MAX_BLOCK_ENTITIES)fail();
    for (const [key, value] of entries)
      if (!positionKey(key) || !slots(value, 27)) fail();
  }
  if (sim.furnaces !== undefined) {
    if (
      !sim.furnaces ||
      typeof sim.furnaces !== "object" ||
      Array.isArray(sim.furnaces)
    )
      fail();
    const entries=Object.entries(sim.furnaces as object);
    if(entries.length>MAX_BLOCK_ENTITIES)fail();
    for (const [key, value] of entries) {
      const f = value as {
        slots: unknown;
        burn: number;
        progress: number;
        recipe: number;
      };
      if (
        !positionKey(key) ||
        !plainRecord(f) || !onlyKeys(f as unknown as Record<string, unknown>,FURNACE_KEYS) ||
        !slots(f.slots, 3) ||
        !finite(f.burn) ||
        f.burn < 0 ||
        f.burn > 32 ||
        !finite(f.progress) ||
        f.progress < 0 ||
        f.progress > 4 ||
        !Number.isInteger(f.recipe) ||
        f.recipe < 0 ||
        f.recipe > 255
      )
        fail();
    }
  }
  if (sim.brewers !== undefined) {
    if(!sim.brewers || typeof sim.brewers!=="object" || Array.isArray(sim.brewers)) fail();
    const entries=Object.entries(sim.brewers as object);
    if(entries.length>MAX_BLOCK_ENTITIES)fail();
    for(const [key,value] of entries) {
      const b=value as import("../game/brewing").Brewer;
      if(!positionKey(key) || !plainRecord(b) || !onlyKeys(b as unknown as Record<string, unknown>,BREWER_KEYS) || !slots(b.slots,4) || !finite(b.fuel) || b.fuel<0 || b.fuel>12 ||
          !finite(b.progress) || b.progress<0 || b.progress>=6 ||
          (b.recipe!==0 && !Object.hasOwn(INFUSIONS,b.recipe)) ||
          (b.slots[0] && b.slots[0].id!==160) || (b.slots[1] && !INFUSIONS[b.slots[1].id]) ||
          (b.slots[2] && b.slots[2].id!==16) || (b.slots[3] && !Object.values(INFUSIONS).includes(b.slots[3].id))) fail();
    }
  }
  if(sim.pendingTicks!==undefined && (!Array.isArray(sim.pendingTicks)||sim.pendingTicks.length>200000||
    sim.pendingTicks.some(k=>typeof k!=="string"||!/^[-]?\d+,[-]?\d+,[-]?\d+$/.test(k)||!positionKey(k))))fail();
  if(sim.hoppers!==undefined) {
    if(!sim.hoppers || typeof sim.hoppers!=="object" || Array.isArray(sim.hoppers))fail();
    const entries=Object.entries(sim.hoppers as object);
    if(entries.length>MAX_BLOCK_ENTITIES)fail();
    for(const [key,value] of entries) {
      const h=value as import("../game/automation").Hopper;
      if(!positionKey(key)||!plainRecord(h)||!onlyKeys(h as unknown as Record<string, unknown>,HOPPER_KEYS)||!slots(h.slots,5)||!finite(h.cooldown)||h.cooldown<0||h.cooldown>.4)fail();
    }
  }
  if (sim.cityLifeVersion !== undefined && sim.cityLifeVersion !== 1 && !(sim.cityLifeVersion === 2 && generator >= 7) && !(sim.cityLifeVersion === 3 && generator >= 8) && !(sim.cityLifeVersion === 4 && generator >= 9) && !(sim.cityLifeVersion === 5 && generator === 10)) fail();
  if (sim.elapsed !== undefined && (!finite(sim.elapsed) || Number(sim.elapsed) < 0 || Number(sim.elapsed) > 1e12)) fail();
  if (sim.tickNo !== undefined && (!Number.isSafeInteger(sim.tickNo) || Number(sim.tickNo) < 0 || Number(sim.tickNo) > 1e12)) fail();
  if (sim.cropTimer !== undefined && (!finite(sim.cropTimer) || Number(sim.cropTimer) < 0 || Number(sim.cropTimer) > 12)) fail();
  if (sim.entities !== undefined) {
    if (!Array.isArray(sim.entities) || sim.entities.length > (generator >= 8 ? 4096 : generator === 7 ? 1024 : 256)) fail();
    const ids = new Set<string>();
    for (const value of sim.entities as unknown[]) {
      const e = value as import("../game/entities").Entity;
      if (
        !plainRecord(e) ||
        !onlyKeys(e as unknown as Record<string, unknown>,ENTITY_KEYS) ||
        typeof e.id !== "string" ||
        !e.id ||
        e.id.length > 160 ||
        ids.has(e.id) ||
        typeof e.name !== "string" ||
        e.name.length > 100 ||
        typeof e.state !== "string" ||
        e.state.length > 120 ||
        (e.navStatus !== undefined && (typeof e.navStatus !== "string" || e.navStatus.length > 80)) ||
        !["villager", "panda", "spirit"].includes(e.kind) ||
        !plainRecord(e.body) ||
        !onlyKeys(e.body as unknown as Record<string, unknown>,BODY_KEYS) ||
        typeof e.body.grounded !== "boolean" ||
        typeof e.body.flying !== "boolean" ||
        !vector(e.body.position) ||
        !motion(e.body.velocity, 128) ||
        !vector(e.goal) ||
        !vector(e.home) ||
        (e.workplace !== undefined && !vector(e.workplace)) ||
        (e.knockback !== undefined && !motion(e.knockback, 32)) ||
        (e.profession !== undefined && !Object.hasOwn(PROFESSIONS,e.profession)) ||
        ![
          e.health,
          e.timer,
          e.cooldown,
          e.yaw,
          e.trades,
          e.body.fallStart,
        ].every(finite) ||
        e.health < 0 ||
        e.health > 100 ||
        Math.abs(e.timer) > 1e12 ||
        e.cooldown < 0 || e.cooldown > 60 ||
        Math.abs(e.yaw) > 1e6 ||
        Math.abs(e.body.fallStart) > 1e7 ||
        !Number.isInteger(e.trades) ||
        e.trades < 0 ||
        e.trades > 12
      )
        fail();
      ids.add(e.id);
    }
  }
  if (sim.drops !== undefined) {
    if (!Array.isArray(sim.drops) || sim.drops.length > 256) fail();
    const ids = new Set<string>();
    for (const value of sim.drops as unknown[]) {
      const d = value as import("../game/entities").Drop;
      if (
        !plainRecord(d) ||
        !onlyKeys(d as unknown as Record<string, unknown>,DROP_KEYS) ||
        typeof d.id !== "string" ||
        !d.id ||
        d.id.length > 160 ||
        ids.has(d.id) ||
        d.stack === null ||
        !validStack(d.stack) ||
        !vector(d.position) ||
        !motion(d.velocity, 128) ||
        !finite(d.age) ||
        d.age < 0 || d.age > 600
      )
        fail();
      ids.add(d.id);
    }
  }
  if (
    sim.weather !== undefined &&
    !["clear", "rain"].includes(String(sim.weather))
  )
    fail();
  if (
    sim.weatherTimer !== undefined &&
    (!finite(sim.weatherTimer) || Number(sim.weatherTimer) < 0 || Number(sim.weatherTimer) > 1000)
  )
    fail();
  if (sim.hardcoreEnded !== undefined && typeof sim.hardcoreEnded !== "boolean")
    fail();
}

function validStack(value: unknown) {
  if (value === null) return true;
  const s = value as Stack,
    def = plainRecord(s) && onlyKeys(s as unknown as Record<string, unknown>,STACK_KEYS) ? item(s.id) : undefined;
  return (
    !!def &&
    validMetadata(s) &&
    Number.isInteger(s.count) &&
    s.count > 0 &&
    s.count <= def.stack &&
    (def.durability
      ? Number.isFinite(s.durability) &&
        s.durability! > 0 &&
        s.durability! <= def.durability
      : s.durability === undefined)
  );
}
