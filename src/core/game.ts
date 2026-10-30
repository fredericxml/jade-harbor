import { PROFESSIONS } from "../game/professions";
import { Discoveries } from "../game/city-life/discoveries";
import { journalPlaces, travelDestinations, travelUnlocked, safeTravelArrival, travelColumns, type TravelDestination } from "../game/city-life/travel";
import { chestInventory } from "../game/storage";
import { HOPPER_DIRECTIONS } from "../game/automation";
import { useBucket } from "../game/buckets";
import { StatusEffects, POTIONS, EFFECTS, enchantLevel, enchantHeld, repairHeld } from "../game/progression";
import { cloneStack, Enchantment } from "../game/stack";
import { INFUSIONS, brewingWater } from "../game/brewing";
import { toolStation, brewerPanel } from "../ui/stations";
import * as THREE from "three";
import { World } from "../world/world";
import { View } from "../render/renderer";
import { UI, esc, icon, slot } from "../ui/ui";
import type { Screen } from "../ui/ui";
import { Input } from "../player/input";
import {
  Body,
  moveBody,
  collides,
  overlapsBlock,
  inWater,
  findSafeStand,
} from "../player/physics";
import { flightControls, shouldVoidRespawn } from "../player/flight";
import { raycast, Hit } from "../player/raycast";
import { B, block } from "../world/blocks";
import { Inventory, RECIPES, Stack } from "../game/inventory";
import { item } from "../game/items";
import { Equipment } from "../game/equipment";
import { matchGrid, craftGrid } from "../game/crafting";
import { Simulation, SMELTING, FUEL } from "../game/simulation";
import { Entities, Entity, TRADES, offersFor } from "../game/entities";
import { meleeSightBetween } from "../game/combat";
import { EntityView } from "../render/entity-view";
import { Effects } from "../render/effects";
import { Lighting } from "../world/lighting";
import { AudioEngine } from "../game/audio";
import {
  SaveData,
  SaveSummary,
  loadSave,
  resetSave,
  renameSave,
  freshWorld,
  Mode,
  listSaves,
  writeSave,
  deleteSave,
  exportSave,
  validateSave,
  denseCityCopy,
} from "../persistence/saves";
import { MIN_Y, MAX_Y, clamp, Vec3, idOf, packed, stateOf, blockKey } from "./coords";
import { biomeAt } from "../world/generator";
import { seedNumber } from "../world/noise";
export class Game {
  ui: UI;
  view: View;
  input: Input;
  audio = new AudioEngine();
  world: World;
  inventory = Inventory.creative();
  mode: Mode = "creative";
  body: Body = {
    position: { x: 0.5, y: 21.1, z: 22.5 },
    velocity: { x: 0, y: 0, z: 0 },
    grounded: false,
    flying: false,
    fallStart: 21.1,
  };
  previous: Vec3 = { ...this.body.position };
  yaw = 0;
  pitch = 0;
  time = 0.24;
  health = 20;
  hunger = 20;
  xp = 0;
  status = new StatusEffects();
  saturation = 5;
  exhaustion = 0;
  spawn = { x: 0.5, y: 21.1, z: 22.5 };
  active = false;
  travelState?: { destination: TravelDestination; world: World; serial: number; origin: Vec3; camera: Vec3 };
  private travelSerial = 0;
  readonly travelMetrics:{id:string;mode:Mode;ms:number;success:boolean;columns:number;pending:number;meshQueue:number}[]=[];
  dead = false;
  meta = { id: "", name: "", seed: "jade-harbor", created: 0 };
  saves: SaveSummary[] = [];
  saveRevision = 0;
  // Coalesces repeated autosaves into a bounded number of transactions.
  saveTask: Promise<boolean> | null = null;
  saveAgain = false;
  saveActivityVersion = 0;
  achievements = new Set<string>();
  settings = { fov: 75, sensitivity: 4, distance: 5, simulationDistance: 4, volume: 30 };
  hit: Hit | null = null;
  mineProgress = 0;
  mineKey = "";
  cooldown = 0;
  debug = false;
  fps = 0;
  frameCount = 0;
  fpsTime = 0;
  tickCount = 0;
  craftingGrid: (Stack | null)[] = Array(9).fill(null);
  category = "All";
  query = "";
  lastJump = 0;
  crouching = false;
  jumpRequest = false;
  useRequest = false;
  saveTimer = 0;
  evictionSave = false;
  lastAuto = 0;
  lastHud = 0;
  lastStep = 0;
  damageCooldown = 0;
  hungerClock = 0;
  lastTime = 0;
  accumulator = 0;
  simulation: Simulation;
  entities: Entities;
  entityView: EntityView;
  effects: Effects;
  lighting: Lighting;
  lastLighting = 0;
  entityHit: Entity | null = null;
  hitFlash = 0;
  hitMessage = "";
  attackCooldown = 0;
  tradeEntity: Entity | null = null;
  discoveries?: Discoveries;
  discoveryClock = 0;
  private discoveryArrival?: Vec3;
  breath = 10;
  hardcoreEnded = false;
  containerKey = "";
  containers: Record<string, (Stack | null)[]> = {};
  returnScreen: Screen = "menu";
  constructor(root: HTMLElement) {
    this.ui = new UI(root);
    this.view = new View(root.querySelector("canvas")!);
    // UI and world now render the same generated pixel textures for every block.
    try {
      this.ui.root.style.setProperty("--item-atlas-url", `url("${this.view.atlas.canvas.toDataURL("image/png")}")`);
    } catch {
      // Privacy-restricted canvas exports can fail; colored icons stay usable.
    }
    this.input = new Input(this.view.canvas);
    this.world = new World("jade-harbor");
    this.simulation = new Simulation(this.world);
    this.entities = new Entities(this.world);
    this.entityView = new EntityView(this.view.scene);
    this.effects = new Effects(this.view.scene);
    this.lighting = new Lighting(this.world);
    this.view.lighting = this.lighting;
    try {
      this.settings = {
        ...this.settings,
        ...JSON.parse(localStorage.getItem("jade-harbor-settings") ?? "{}"),
      };
    } catch {}
    this.applySettings();
    this.view.onContext=(lost)=>{
      if(lost) { if(this.active) this.pause(); this.ui.toast("Graphics paused. Your world is kept in memory while we save it."); }
      else this.ui.toast("Graphics restored. Return to your world when ready.");
    };
    this.bind();
    this.loadPreview();
    void this.refreshSaves();
    requestAnimationFrame((t) => this.frame(t));
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.active) {
        void this.save();
        if (this.ui.screen === "none") this.pause();
      }
    });
    addEventListener("pagehide", () => {
      if (this.active) void this.save();
    });
  }
  bind() {
    this.view.canvas.addEventListener("click", () => {
      if (this.active && this.ui.screen === "none" && !this.input.locked)
        void this.input.lock();
    });
    this.input.onLook = (dx, dy) => {
      this.yaw -= dx * 0.0005 * this.settings.sensitivity;
      this.pitch = clamp(
        this.pitch - dy * 0.0005 * this.settings.sensitivity,
        -1.54,
        1.54,
      );
    };
    this.input.onUse = () => {
      if (this.active && this.ui.screen === "none") this.useRequest=true;
    };
    this.input.onUnlock = () => {
      this.useRequest=false;
      if (this.active && this.ui.screen === "none") this.pause();
    };
    this.input.onWheel = (n) => {
      if (!this.active || this.ui.screen !== "none") return;
      this.inventory.selected = (this.inventory.selected + n + 9) % 9;
      this.scheduleSave();
    };
    this.input.onKey = (key) => this.key(key);
    this.ui.onMove = (fromAction, fromIndex, toAction, toIndex) => {
      if (!this.active || (this.ui.screen !== "inventory" && this.ui.screen !== "chest")) return;
      const valid = (action: string) => action === "slot" ||
        action === "hotbar-select" || (action === "container-slot" && this.ui.screen === "chest");
      if (!valid(fromAction) || !valid(toAction)) return;
      const external = this.containers[this.containerKey];
      const source = fromAction === "container-slot" ? external : this.inventory.slots;
      const target = toAction === "container-slot" ? external : this.inventory.slots;
      if (!source || !target || !this.inventory.move(fromIndex, toIndex, source, target)) return;
      if (this.ui.screen === "chest") this.ui.container(this.inventory, external);
      else this.ui.inventory(this.inventory, this.mode === "creative", this.category, this.query);
      this.scheduleSave();
    };
    this.ui.onAction = (a, b, e) => {
      void this.action(a, b, e).catch((err) =>
        this.ui.toast(err instanceof Error ? err.message : "Action failed."),
      );
    };
    this.ui.onSearch = () => {
      this.query = (
        document.querySelector("#search") as HTMLInputElement
      ).value;
      document.querySelector("#catalog")!.innerHTML = this.ui.catalog(
        this.category,
        this.query,
      );
    };
    this.ui.onChange = (el) => {
      if (el.id === "change-mode") {
        if (this.hardcoreEnded) return;
        const previousMode = this.mode;
        this.mode = el.value as Mode;
        this.body.flying = this.mode === "spectator";
        this.crouching = false;
        this.jumpRequest = false;
        this.body.velocity = { x: 0, y: 0, z: 0 };
        this.body.grounded = false;
        if (previousMode === "spectator" && this.mode !== "spectator") {
          const safe = findSafeStand(this.world, this.body.position);
          if (safe) {
            this.body.position = safe;
            this.previous = { ...safe };
          } else this.safeSpawn();
        }
        this.body.fallStart = this.body.position.y;
        this.view.hand.visible = this.mode !== "spectator";
        this.ui.pause(this.meta.name, this.mode, this.hardcoreEnded);
        void this.save();
        return;
      }
      if (el.id in this.settings) {
        (this.settings as unknown as Record<string, number>)[el.id] = Number(
          el.value,
        );
        this.applySettings();
        const output = el.parentElement?.querySelector("output");
        if (output)
          output.textContent = el.value +
            (el.id === "fov" ? "°" : el.id === "volume" ? "%" :
             el.id === "distance" || el.id === "simulationDistance" ? " chunks" : "");
      }
    };
  }
  applySettings() {
    // localStorage is user-controlled and can contain stale/corrupt JSON. Keep
    // renderer/input values finite instead of allowing NaN to reach the camera.
    const finite = (value: unknown, fallback: number) =>
      typeof value === "number" && Number.isFinite(value) ? value : fallback;
    this.settings.fov = clamp(finite(this.settings.fov, 75), 55, 105);
    this.settings.distance = Math.round(clamp(finite(this.settings.distance, 5), 3, 8));
    this.settings.simulationDistance = Math.round(clamp(finite(this.settings.simulationDistance, 4), 2, 6));
    this.settings.sensitivity = clamp(finite(this.settings.sensitivity, 4), 1, 12);
    this.settings.volume = clamp(finite(this.settings.volume, 30), 0, 100);
    this.view.camera.fov = this.settings.fov;
    this.view.camera.updateProjectionMatrix();
    this.view.distance = this.settings.distance;
    this.audio.volume = this.settings.volume / 100;
    try {
      localStorage.setItem(
        "jade-harbor-settings",
        JSON.stringify(this.settings),
      );
    } catch {}
  }
  loadPreview() {
    for (let z = -2; z <= 2; z++)
      for (let x = -2; x <= 2; x++) this.world.ensure(x, z, true);
    this.view.camera.position.set(46, 62, 54);
    this.view.camera.lookAt(0, 28, -43);
    this.view.hand.visible = false;
  }
  async refreshSaves() {
    try {
      this.saves = await listSaves();
      if (!this.active) this.ui.menu(this.saves);
    } catch {
      this.ui.menu([]);
      this.ui.toast(
        "Device storage is unavailable. Enable browser storage to save worlds.",
      );
    }
  }
  async start(
    data?: SaveData,
    name = "My Jade Harbor",
    seed = "jade-harbor",
    mode: Mode = "creative",
  ) {
    if(this.travelState)this.cancelTravel(false);
    this.travelSerial++; this.travelState = undefined;
    if (this.active && !(await this.save()))
      throw new Error("Save the current world before opening another.");
    clearTimeout(this.saveTimer);
    data = data ? validateSave(data) : freshWorld(name, seed, mode);
    this.saveRevision = data.revision ?? 0;
    this.discoveries?.dispose();
    this.entities.dispose();
    this.world.dispose();
    this.view.clear();
    this.mode = data?.mode ?? mode;
    this.meta = {
      id: data?.id ?? crypto.randomUUID(),
      name: data?.name ?? name,
      seed: data?.seed ?? seed,
      created: data?.created ?? Date.now(),
    };
    this.world = new World(this.meta.seed, data.edits, true, data.generator);
    this.simulation = new Simulation(this.world, data?.simulation);
    this.entities = new Entities(this.world, data?.simulation, data.time);
    this.entityView.clear();
    this.lighting = new Lighting(this.world);
    this.view.lighting = this.lighting;
    this.lastLighting = 0;
    this.hardcoreEnded = Boolean(data?.simulation?.hardcoreEnded);
    if (this.hardcoreEnded) this.mode = "spectator";
    this.inventory = data
      ? new Inventory(data.player.slots)
      : this.mode === "creative"
        ? Inventory.creative()
        : new Inventory();
    if (!data && this.mode !== "creative") {
      this.inventory.add(105, 4);
      this.inventory.add(107, 5);
    }
    this.inventory.equipment = new Equipment(data?.player.armor);
    this.inventory.selected = data?.player.selected ?? 0;
    this.inventory.cursor = data?.player.cursor ?? null;
    this.craftingGrid = data?.player.grid ?? Array(9).fill(null);
    this.body.position = {
      ...(data?.player.position ?? { x: 0.5, y: 21.1, z: 22.5 }),
    };
    this.body.velocity = { x: 0, y: 0, z: 0 };
    this.previous = { ...this.body.position };
    // Keep Creative flight after reload, but never enable it for survival modes.
    this.body.flying = this.mode === "spectator" ||
      (this.mode === "creative" && data.player.flying === true);
    this.body.fallStart = this.body.position.y;
    this.spawn = { ...(data?.player.spawn ?? { x: 0.5, y: 21.1, z: 22.5 }) };
    this.yaw = data?.player.yaw ?? 0;
    this.pitch = data?.player.pitch ?? 0;
    this.health = data?.player.health ?? 20;
    this.hunger = data?.player.hunger ?? 20;
    this.xp = data?.player.xp ?? 0;
    this.status = new StatusEffects(data.player.effects);
    this.saturation = data.player.saturation ?? 5;
    this.exhaustion = data.player.exhaustion ?? 0;
    this.time = data?.time ?? 0.24;
    this.view.attachWorld(this.world,this.time,this.simulation.weather==="rain");
    this.dead = data?.player.dead ?? false;
    this.achievements = new Set(data?.achievements ?? []);
    this.discoveries = new Discoveries(this.world, this.achievements);
    this.discoveryClock = 0;
    this.discoveryArrival={...this.body.position};
    this.containers =
      (data?.simulation?.containers as Record<string, (Stack | null)[]>) ?? {};
    const cx = Math.floor(this.body.position.x / 16),
      cz = Math.floor(this.body.position.z / 16);
    for (let z = cz - 1; z <= cz + 1; z++)
      for (let x = cx - 1; x <= cx + 1; x++) this.world.ensure(x, z, true);
    if (collides(this.world, this.body.position) && this.mode !== "spectator")
      this.safeSpawn();
    this.world.onChange = (x, y, z) => {
      this.scheduleSave();
      this.simulation.changed(x, y, z);
    };
    this.world.onGeneration=(ms)=>this.view.metrics.add("generation",ms);
    this.world.onEvictionPending=()=>{
      if(this.evictionSave) return;
      this.evictionSave=true;
      void this.save().finally(()=>{window.setTimeout(()=>this.evictionSave=false,2000);});
    };
    this.active = true;
    this.tickCount = 0;
    this.cooldown =
      this.damageCooldown =
      this.attackCooldown =
      this.hungerClock =
        0;
    this.breath = data.player.breath ?? 10;
    this.crouching = false;
    this.jumpRequest = false;
    this.mineProgress = 0;
    this.accumulator = 0;
    this.lastAuto = performance.now();
    this.view.hand.visible = this.mode !== "spectator";
    this.ui.show("pause");
    this.resume();
    this.unlockAchievement(
      "First lantern",
      "Welcome to Jade Harbor. Every block has a story.",
    );
    await this.save();
  }
  safeSpawn() {
    const sx = Math.floor(this.spawn.x / 16),
      sz = Math.floor(this.spawn.z / 16);
    for (let z = sz - 1; z <= sz + 1; z++)
      for (let x = sx - 1; x <= sx + 1; x++) this.world.ensure(x, z, true);
    for (let radius = 0; radius <= 3; radius++)
      for (let dx = -radius; dx <= radius; dx++)
        for (let dz = -radius; dz <= radius; dz++)
          for (let d = 0; d < 18; d++)
            for (const sign of [1, -1]) {
              const p = {
                x: this.spawn.x + dx,
                y: this.spawn.y + d * sign,
                z: this.spawn.z + dz,
              };
              if (
                p.y <= MIN_Y ||
                p.y > MAX_Y ||
                collides(this.world, p) ||
                !collides(this.world, { ...p, y: p.y - 0.15 }) ||
                [B.Water, B.Lava].includes(idOf(this.world.get(p.x, p.y, p.z)) as never) ||
                [B.Water, B.Lava].includes(idOf(this.world.get(p.x, p.y + 1, p.z)) as never)
              )
                continue;
              this.body.position = p;
              this.body.velocity = { x: 0, y: 0, z: 0 };
              this.previous = { ...p };
              return;
            }
    const x = Math.floor(this.spawn.x),
      z = Math.floor(this.spawn.z);
    for (let y = MAX_Y-1; y > MIN_Y; y--)
      if (
        !collides(this.world, { x: x + 0.5, y: y + 0.01, z: z + 0.5 }) &&
        block(this.world.get(x, y - 1, z)).solid &&
        ![B.Water, B.Lava].includes(idOf(this.world.get(x, y, z)) as never) &&
        ![B.Water, B.Lava].includes(idOf(this.world.get(x, y + 1, z)) as never)
      ) {
        this.body.position = { x: x + 0.5, y: y + 0.01, z: z + 0.5 };
        this.body.velocity = { x: 0, y: 0, z: 0 };
        this.previous = { ...this.body.position };
        return;
      }
  }

  snapshot(includeEdits = true): SaveData {
    return {
      version: 1,
      generator: this.world.generatorVersion,
      format: "jade-harbor-engine",
      revision: this.saveRevision,
      ...this.meta,
      updated: Date.now(),
      mode: this.mode,
      time: this.time,
      weather: this.simulation.weather,
      edits: includeEdits ? Object.fromEntries(this.world.edits) : {},
      player: {
        position: { ...this.body.position },
        yaw: this.yaw,
        pitch: this.pitch,
        health: this.health,
        hunger: this.hunger,
        xp: this.xp,
        effects: this.status.list.map(e=>({...e})),
        saturation: this.saturation,
        exhaustion: this.exhaustion,
        breath: this.breath,
        slots: this.inventory.slots.map(cloneStack),
        selected: this.inventory.selected,
        armor: this.inventory.equipment.slots.map(cloneStack),
        cursor: cloneStack(this.inventory.cursor),
        grid: this.craftingGrid.map(cloneStack),
        spawn: { ...this.spawn },
        dead: this.dead,
        flying: this.mode === "spectator" ||
          (this.mode === "creative" && this.body.flying),
      },
      simulation: {
        ...this.simulation.serialize(),
        ...this.entities.serialize(),
        containers: structuredClone(this.containers),
        hardcoreEnded: this.hardcoreEnded,
      },
      achievements: [...this.achievements],
    };
  }
  scheduleSave() {
    // Increment even when the write is already in flight. A save may have
    // snapshotted older state, so its status must not claim newer changes.
    this.saveActivityVersion++;
    clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => void this.save(), 650);
  }
  async save(): Promise<boolean> {
    if (!this.active) return false;
    // Manual saves, autosaves and eviction requests share a single writer.
    // A burst of 100 requests produces at most one extra pending write,
    // rather than 100 stale snapshots queued for IndexedDB.
    if (this.saveTask) {
      this.saveAgain = true;
      return this.saveTask;
    }
    const world = this.world,
      id = this.meta.id;
    const commit = async (): Promise<boolean> => {
      if (this.world !== world || this.meta.id !== id) return false;
      try {
        this.ui.saveStatus("Saving…");
        const started = performance.now();
        const captured = world.captureChanges();
        const activityVersion = this.saveActivityVersion;
        // A new/imported world has no checkpoint to extend. Its first commit
        // must include the complete overlay, including edits loaded at start.
        const firstCommit = this.saveRevision === 0;
        const state = this.snapshot(firstCommit);
        const revision = await writeSave(state, firstCommit ? undefined : captured.chunks, this.saveRevision);
        world.acknowledgeChanges(captured.revisions);
        this.view.metrics.add("save", performance.now() - started);
        this.saveRevision = revision;
        this.ui.saveStatus(
          world.dirtyEdits.size || this.saveActivityVersion !== activityVersion
            ? "Saved · newer changes pending"
            : "✓ All changes saved",
        );
        return true;
      } catch (error) {
        this.ui.saveStatus("Save failed · changes still in memory");
        this.ui.toast(
          error instanceof Error
            ? error.message
            : "Could not save. Export a backup from Pause.",
        );
        return false;
      }
    };
    const run = async () => {
      do {
        this.saveAgain = false;
        if (!(await commit())) return false;
      } while (this.saveAgain);
      return true;
    };
    const task = run();
    this.saveTask = task;
    try {
      return await task;
    } finally {
      this.saveTask = null;
      // A request arriving just as the task resolves must never get lost.
      if (this.saveAgain && this.active) void this.save();
    }
  }
  showJournal() {
    const book=this.discoveries,places=journalPlaces(this.world),hubs=travelDestinations(this.world);
    const cards=hubs.map(h=>{
      const members=places.filter(p=>p.parentHubId===h.id),visited=members.filter(p=>book?.has(p.discoveryId)).length,unlocked=travelUnlocked(h,this.mode,this.achievements);
      return `<article class="journal-hub"><div class="journal-heading"><div><strong>${esc(h.title)}</strong><p>${esc(h.description)}</p></div><button data-action="travel" data-id="${esc(h.id)}" ${unlocked?"":"disabled"}>${unlocked?"Travel":"Locked · visit area"}</button></div><details><summary>${visited} / ${members.length} places discovered</summary><ul>${members.map(p=>`<li class="${book?.has(p.discoveryId)?"discovered":"undiscovered"}"><span aria-label="${book?.has(p.discoveryId)?"Discovered":"Undiscovered"}">${book?.has(p.discoveryId)?"✓":"?"}</span> ${esc(p.title)}</li>`).join("")}</ul></details></article>`;
    }).join("");
    this.ui.panel("journal","Travel journal",`${book?.count??0} / ${places.length} places discovered · ${hubs.length} travel hubs`,
      `<div class="journal-list">${cards||'<p>No area travel is available in this world.</p>'}</div><p class="form-note">${this.mode==="creative"||this.mode==="spectator"?"All area hubs are available in this mode.":"Discover any place in an area on foot to unlock its hub."}</p>`);
  }
  cancelTravel(show=true) {
    const pending=this.travelState;if(!pending)return;
    this.travelSerial++;this.travelState=undefined;
    if(this.world===pending.world){this.body.position={...pending.origin};this.previous={...pending.origin};this.view.camera.position.set(pending.camera.x,pending.camera.y,pending.camera.z);}
    if(show)this.showJournal();
  }
  async travelTo(id:string) {
    if(!this.active||this.dead||this.travelState)return false;
    const destination=travelDestinations(this.world).find(d=>d.id===id);
    if(!destination||!travelUnlocked(destination,this.mode,this.achievements))return false;
    if(!this.inventory.settleCursor()){this.ui.toast("Make room for the stack you are holding.");return false;}
    const began=performance.now(),travelMode=this.mode;
    const world=this.world,serial=++this.travelSerial,origin={...this.body.position},camera=this.view.camera.position.clone();
    this.input.keys.clear();this.input.left=this.input.right=false;
    document.exitPointerLock?.();
    this.travelState={destination,world,serial,origin,camera};
    this.ui.panel("journal","Traveling…",destination.title,'<p role="status">Preparing a safe arrival…</p><button data-action="travel-cancel">Cancel travel</button>');
    let committed=false;
    const deadline=performance.now()+3000;
    const check=()=>{
      if(this.world!==world||this.travelSerial!==serial)throw Error("Travel cancelled");
      if(performance.now()>=deadline)throw Error("Arrival preparation timed out. Try again.");
    };
    const bounded=async<T>(work:Promise<T>):Promise<T>=>{
      let timer:ReturnType<typeof setTimeout>|undefined;
      try{return await Promise.race([work,new Promise<T>((_,reject)=>{timer=setTimeout(()=>reject(Error("Arrival preparation timed out. Try again.")),Math.max(0,deadline-performance.now()));})]);}
      finally{clearTimeout(timer);}
    };
    try {
      // Save once before eviction. Collision preparation owns only a tiny
      // footprint; district meshes, lighting and NPC settling are Stage B.
      if(!(await bounded(this.save())))throw Error("Save your world before traveling.");
      check();let arrival:Vec3|undefined;
      for(const anchor of [destination.arrival,...(destination.fallback?[destination.fallback]:[])]) {
        const candidate={...destination,arrival:anchor};
        for(const c of travelColumns(candidate)) {
          check();world.ensure(c.cx,c.cz,true);check();
          // Yield to Cancel and timeout without waiting for a rendered frame.
          await bounded(new Promise<void>(resolve=>setTimeout(resolve,0)));check();
        }
        arrival=safeTravelArrival(world,candidate);if(arrival)break;
      }
      if(!arrival)throw Error("Unable to find a safe arrival. Try again.");
      check();
      this.view.camera.position.set(arrival.x,arrival.y+1.61,arrival.z);
      this.view.rebuild(world,2); // Best effort immediate ground, no queue drain.
      check();
      this.discoveryArrival={...arrival};
      this.body.position={...arrival};this.previous={...arrival};this.body.velocity={x:0,y:0,z:0};
      this.body.grounded=true;this.body.flying=this.mode==="spectator";this.body.fallStart=arrival.y;
      this.yaw=Math.atan2(-(destination.focus.x-arrival.x),-(destination.focus.z-arrival.z));
      this.pitch=Math.max(-.22,Math.min(.2,Math.atan2(destination.focus.y-arrival.y-1.61,Math.max(8,Math.hypot(destination.focus.x-arrival.x,destination.focus.z-arrival.z)))));
      this.view.camera.rotation.set(this.pitch,this.yaw,0,"YXZ");this.accumulator=0;
      this.hit=null;this.entityHit=null;this.mineProgress=0;this.mineKey="";this.crouching=false;
      this.entities.life?.reactivate();this.entities.navigation.agents.clear();
      this.entities.life?.prepare(this.entities.list,arrival,this.time,this.simulation.weather==="rain",this.entities.elapsed,this.entities.navigation);
      committed=true;this.travelState=undefined;this.resume(false);this.scheduleSave();
      this.ui.toast(`Arrived: ${destination.title}`);return true;
    }catch(error){
      if(this.world===world&&this.travelSerial===serial){this.travelState=undefined;this.showJournal();this.ui.toast(error instanceof Error?error.message:"Travel failed. Please try again.");}
      return false;
    }finally{
      if(this.travelMetrics.length>=120)this.travelMetrics.shift();
      this.travelMetrics.push({id,mode:travelMode,ms:performance.now()-began,success:committed,columns:world.chunks.size,pending:world.pending.size,meshQueue:world.dirty.size});
      if(!committed&&this.world===world&&this.travelSerial===serial){this.body.position={...origin};this.previous={...origin};this.view.camera.position.copy(camera);}
      if(this.travelState?.serial===serial)this.travelState=undefined;
    }
  }
  resume(relock = true) {
    if (this.travelState) return;
    if (!this.active) {
      this.ui.menu(this.saves);
      return;
    }
    if (this.dead) {
      this.showDeath();
      return;
    }
    if (!this.inventory.settleCursor()) {
      this.ui.toast("Make room for the stack you are holding.");
      return;
    }
    this.ui.show("none");
    this.input.prepareResume();
    // Browser Escape deliberately releases Pointer Lock. Asking for a new
    // lock inside the same Escape can trigger another native release and
    // reopen Pause. A canvas click will reacquire the mouse safely.
    if (relock) void this.input.lock();
    else this.ui.toast("Click the game to capture your mouse.");
  }
  // Settings and Controls return to where they were opened, not always to gameplay.
  backToPreviousScreen() {
    if (!this.active || this.returnScreen === "menu") this.ui.menu(this.saves);
    else if (this.returnScreen === "create") this.ui.create();
    else this.ui.pause(this.meta.name, this.mode, this.hardcoreEnded);
  }
  pause() {
    if (!this.active || this.dead) return;
    // Update the UI before releasing pointer lock to avoid an unlock-event race.
    this.ui.pause(this.meta.name, this.mode, this.hardcoreEnded);
    this.input.unlock();
    void this.save();
  }
  open(screen: Screen) {
    this.input.unlock();
    if (screen === "inventory")
      this.ui.inventory(
        this.inventory,
        this.mode === "creative",
        this.category,
        this.query,
      );
    if (screen === "craft") this.showCraft();
  }
  key(code: string) {
    if (this.travelState) {
      if (code === "Escape") this.cancelTravel();
      return;
    }
    if (/^Digit[1-9]$/.test(code) && this.active &&
        (this.ui.screen === "none" || this.ui.screen === "inventory")) {
      this.inventory.selected = Number(code.slice(-1)) - 1;
      if (this.active && this.ui.screen === "inventory")
        this.ui.inventory(this.inventory, this.mode === "creative", this.category, this.query);
      if (this.active) this.scheduleSave();
      return;
    }
    if (code === "F3") {
      this.debug = !this.debug;
      return;
    }
    if (code === "Escape") {
      if (!this.active) {
        if (this.ui.screen !== "menu") this.ui.menu(this.saves);
      } else if (this.dead) {
        this.showDeath();
      } else if (this.ui.screen === "none") {
        this.pause();
      } else if (this.ui.screen === "settings" || this.ui.screen === "controls" || this.ui.screen === "journal") {
        this.backToPreviousScreen();
      } else {
        // Escape closes the modal; a fresh click reacquires browser pointer lock.
        this.resume(false);
      }
      return;
    }
    if (!this.active) return;
    if (code === "KeyE") {
      if (this.ui.screen === "inventory" || this.ui.screen === "craft")
        this.resume();
      else if (this.ui.screen === "none") this.open("inventory");
      return;
    }
    if (this.ui.screen !== "none") return;
    if (code === "Space") {
      this.jumpRequest = true;
      const now = performance.now();
      if (now - this.lastJump < 280 && this.mode === "creative") {
        this.body.flying = !this.body.flying;
        this.scheduleSave();
      }
      this.lastJump = now;
    }
    if (code === "KeyG" && this.mode === "creative") {
      this.body.flying = !this.body.flying;
      this.scheduleSave();
    }
    if (code === "KeyF") this.useRequest = true;
    if (code === "KeyQ" && this.inventory.held && this.mode !== "spectator") {
      const d = this.direction(),
        p = this.body.position;
      if (
        this.entities.drop(
          { ...this.inventory.held, count: 1 },
          { x: p.x + d.x, y: p.y + 1, z: p.z + d.z },
        )
      ) {
        // Creative mode has unlimited items. Dropping a copy must not
        // silently consume the selected hotbar item.
        if (this.mode !== "creative") this.inventory.consumeHeld();
        this.scheduleSave();
      }
    }
  }
  async action(action: string, button: HTMLElement, event: MouseEvent) {
    this.audio.play("click");
    const id = button.dataset.id;
    if(this.travelState){if(action==="back"||action==="travel-cancel")this.cancelTravel();return;}
    if (action === "new") {
      this.ui.create();
      return;
    }
    if (action === "create") {
      const name =
          (
            document.querySelector("#world-name") as HTMLInputElement
          ).value.trim() || "Untitled world",
        seed =
          (
            document.querySelector("#world-seed") as HTMLInputElement
          ).value.trim() || crypto.randomUUID().slice(0, 8),
        mode = (document.querySelector("#world-mode") as HTMLSelectElement)
          .value as Mode;
      await this.start(undefined, name, seed, mode);
      return;
    }
    if (action === "load") {
      const save = this.saves.find((s) => s.id === id);
      if (save) await this.start(await loadSave(save.id));
      return;
    }
    if (action === "menu") {
      if (this.active) {
        if (!this.inventory.settleCursor()) {
          this.ui.toast("Make room for the held stack first.");
          return;
        }
        if (!(await this.save())) return;
        this.active = false;
        this.view.clearDistant();this.view.atmosphere.reset(.23,false,this.view.distance);
        this.input.unlock();
      }
      await this.refreshSaves();
      this.view.hand.visible = false;
      this.view.camera.position.set(46, 62, 54);
      this.view.camera.lookAt(0, 28, -43);
      return;
    }
    if (action === "rename") {
      const save = this.saves.find((entry) => entry.id === id);
      if (save) {
        const name = prompt("World name", save.name);
        if (name?.trim()) {
          await renameSave(save.id, name);
          await this.refreshSaves();
        }
      }
      return;
    }
    if (action === "delete") {
      const s = this.saves.find((s) => s.id === id);
      if (
        s &&
        confirm(
          `Delete “${s.name}”? This cannot be undone. Export it first if you want a backup.`,
        )
      ) {
        this.ui.worldProcessing(s.id, "Deleting world…");
        try {
          await deleteSave(s.id);
          await this.refreshSaves();
        } catch (error) {
          this.ui.worldProcessing(s.id, null);
          throw error;
        }
      }
      return;
    }
    if (action === "reset") {
      const s = this.saves.find((s) => s.id === id);
      if (
        s &&
        confirm(
          `Reset “${s.name}” to its original seed? This erases its buildings, inventory and progress.`,
        )
      ) {
        await resetSave(s.id);
        await this.refreshSaves();
        this.ui.toast("World reset. The city and Panda Plaza are ready again.");
      }
      return;
    }
    if (action === "dense-city-copy") {
      const s = this.saves.find(s => s.id === id);
      if (s) {
        this.ui.worldProcessing(s.id, "Creating updated city copy…");
        try {
          await writeSave(denseCityCopy(await loadSave(s.id),10));
          await this.refreshSaves();
          this.ui.toast("Updated city copy created. Start at Panda Plaza with your saved progress.");
        } catch (error) { this.ui.worldProcessing(s.id, null); throw error; }
      }
      return;
    }
    if (action === "duplicate") {
      const s = this.saves.find((s) => s.id === id);
      if (s) {
        this.ui.worldProcessing(s.id, "Duplicating world…");
        try {
          const d = await loadSave(s.id);
          d.id = crypto.randomUUID();
          d.name = `${d.name} (copy)`;
          d.updated = Date.now();
          await writeSave(d);
          await this.refreshSaves();
        } catch (error) {
          this.ui.worldProcessing(s.id, null);
          throw error;
        }
      }
      return;
    }
    if (action === "export-world") {
      const s = this.saves.find((s) => s.id === id);
      if (s) exportSave(await loadSave(s.id));
      return;
    }
    if (action === "import") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = async () => {
        try {
          const file = input.files?.[0];
          if (!file) return;
          if (file.size > 32 * 1024 * 1024)
            throw new Error("Save exceeds 32 MB.");
          const data = validateSave(JSON.parse(await file.text()));
          data.id = crypto.randomUUID();
          data.updated = Date.now();
          await writeSave(data);
          await this.refreshSaves();
          this.ui.toast("World imported.");
        } catch (e) {
          this.ui.toast(e instanceof Error ? e.message : "Import failed.");
        }
      };
      input.click();
      return;
    }
    if (action === "back") {
      this.backToPreviousScreen();
      return;
    }
    if (action === "resume") {
      this.resume();
      return;
    }
    if (action === "save") {
      if (await this.save()) this.ui.toast("Your world is saved.");
      return;
    }
    if (action === "export") {
      exportSave(this.snapshot());
      return;
    }
    if (action === "journal") {
      this.returnScreen = this.ui.screen;
      this.showJournal();
      return;
    }
    if (action === "travel") {
      await this.travelTo(id ?? "");
      return;
    }
    if (action === "travel-cancel") {
      this.cancelTravel();
      return;
    }
    if (action === "settings") {
      this.returnScreen = this.ui.screen;
      this.ui.settings(this.settings);
      return;
    }
    if (action === "controls") {
      this.returnScreen = this.ui.screen;
      this.ui.controls();
      return;
    }
    if (action === "fullscreen") {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
      return;
    }
    if (action === "reset-settings") {
      this.settings = {
        fov: 75,
        sensitivity: 4,
        distance: 5,
        simulationDistance: 4,
        volume: 30,
      };
      this.applySettings();
      this.ui.settings(this.settings);
      this.ui.toast("Settings reset to defaults.");
      return;
    }
    if (action === "inventory" || action === "craft") {
      this.open(action);
      return;
    }
    if (action === "category") {
      this.category = button.dataset.category!;
      this.ui.inventory(
        this.inventory,
        this.mode === "creative",
        this.category,
        this.query,
      );
      return;
    }
    if (action === "hotbar-select" && this.ui.screen === "inventory" && this.mode === "creative") {
      const index = Number(button.dataset.index);
      if (!Number.isInteger(index) || index < 0 || index > 8) return;
      this.inventory.selected = index;
      this.ui.inventory(this.inventory, true, this.category, this.query);
      this.scheduleSave();
      return;
    }
    if (action === "choose" && this.mode === "creative") {
      this.inventory.insertHeld(Number(id));
      this.ui.inventory(this.inventory, true, this.category, this.query);
      this.scheduleSave();
      return;
    }
    if (action === "armor-slot") {
      if (
        !this.inventory.equipment.click(
          Number(button.dataset.index),
          this.inventory,
        )
      )
        this.ui.toast("That item does not fit this equipment slot.");
      this.ui.inventory(
        this.inventory,
        this.mode === "creative",
        this.category,
        this.query,
      );
      this.scheduleSave();
      return;
    }
    if (action === "grid-slot") {
      this.inventory.click(
        Number(button.dataset.index),
        event.button === 2,
        this.craftingGrid,
      );
      this.showCraft();
      this.scheduleSave();
      return;
    }
    if (action === "grid-output") {
      const near = this.near(B.Workbench),
        size = near || this.craftingGrid.slice(4).some(Boolean) ? 3 : 2;
      if (size === 3 && !near) {
        this.ui.toast("Stand near a crafting bench.");
        return;
      }
      if (craftGrid(this.craftingGrid, size, this.inventory)) {
        this.audio.play("craft");
        this.unlockAchievement("Handcrafted", "Crafted your first item.");
      }
      this.showCraft();
      this.scheduleSave();
      return;
    }
    if (action === "furnace-slot") {
      this.furnaceClick(Number(button.dataset.index), event.button === 2);
      return;
    }
    if (action === "hopper-slot" && this.stationInReach(B.Hopper)) {
      this.inventory.click(
        Number(button.dataset.index),
        event.button === 2,
        this.simulation.automation.hopper(this.containerKey).slots,
      );
      this.showHopper();
      this.scheduleSave();
      return;
    }
    if (action === "hopper-direction" && this.stationInReach(B.Hopper)) {
      const [x, y, z] = this.containerKey.split(",").map(Number);
      const value = this.world.get(x, y, z);
      this.world.set(x, y, z, packed(B.Hopper, (stateOf(value) + 1) % 5));
      this.showHopper();
      return;
    }
    if (action === "brew-slot") {
      this.brewerClick(Number(button.dataset.index), event.button === 2);
      return;
    }
    if (
      action === "station-select" &&
      ["enchant", "anvil"].includes(this.ui.screen)
    ) {
      const index = Number(button.dataset.index);
      if (!Number.isInteger(index) || index < 0 || index > 8) return;
      this.inventory.selected = index;
      this.showToolStation(this.ui.screen as "enchant" | "anvil");
      return;
    }
    if (action === "enchant" || action === "repair") {
      const station = action === "enchant" ? B.Enchanter : B.Anvil;
      if (!this.stationInReach(station)) {
        this.ui.toast("Stand within reach of the workstation.");
        return;
      }
      const result =
        action === "enchant"
          ? enchantHeld(this.inventory, this.xp, id as Enchantment)
          : repairHeld(this.inventory, this.xp);
      if (result.ok) {
        this.xp = result.xp;
        this.audio.play("craft");
        this.scheduleSave();
      } else {
        this.ui.toast(
          "Check the selected item, materials, XP and inscription compatibility.",
        );
      }
      this.showToolStation(action === "enchant" ? "enchant" : "anvil");
      return;
    }
    if (action === "trade") {
      const offer = TRADES[Number(id)];
      if (
        this.tradeEntity &&
        this.tradeEntity.trades < 12 &&
        Math.hypot(this.body.position.x-this.tradeEntity.body.position.x,this.body.position.y-this.tradeEntity.body.position.y,this.body.position.z-this.tradeEntity.body.position.z)<5 &&
        offersFor(this.tradeEntity).some(o=>o.id===Number(id)) &&
        offer &&
        this.inventory.transaction(offer.cost, offer.output)
      ) {
        this.tradeEntity.trades++;
        this.audio.play("craft");
        this.unlockAchievement(
          "A fair exchange",
          "Completed your first trade.",
        );
        this.scheduleSave();
      } else
        this.ui.toast(
          "Check your items, inventory space, and daily trade limit.",
        );
      this.showTrade();
      return;
    }
    if (action === "slot" || action === "container-slot") {
      const external =
          action === "container-slot"
            ? this.containers[this.containerKey]
            : undefined,
        i = Number(button.dataset.index);
      if (event.shiftKey && this.ui.screen === "chest") {
        const source = external ?? this.inventory.slots,
          target = external
            ? this.inventory.slots
            : this.containers[this.containerKey],
          s = source[i];
        if (s) {
          const copy = new Inventory(target, target.length),
            rest = copy.addStack(s);
          if (external) this.inventory.slots = copy.slots;
          else this.containers[this.containerKey] = copy.slots;
          s.count = rest;
          if (!rest) source[i] = null;
        }
      } else this.inventory.click(i, event.button === 2, external);
      if (this.ui.screen === "craft") this.showCraft();
      else if (this.ui.screen === "furnace") this.showFurnace();
      else if (this.ui.screen === "brew") this.showBrewer();
      else if (this.ui.screen === "hopper") this.showHopper();
      else if (this.ui.screen === "chest")
        this.ui.container(this.inventory, this.containers[this.containerKey]);
      else
        this.ui.inventory(
          this.inventory,
          this.mode === "creative",
          this.category,
          this.query,
        );
      this.scheduleSave();
      return;
    }
    if (action === "make") {
      const r = RECIPES.find((r) => r.id === id);
      if (r && (!r.station || this.near(B.Workbench))) {
        const ok =
          this.mode === "creative"
            ? this.inventory.add(...r.output) === 0
            : this.inventory.transaction(r.cost, r.output);
        if (ok) {
          this.audio.play("craft");
          this.unlockAchievement("Handcrafted", "Crafted your first item.");
          this.scheduleSave();
        } else this.ui.toast("Not enough ingredients or inventory space.");
        this.showCraft();
      }
      return;
    }
    if (action === "respawn") {
      this.dead = false;
      this.health = this.hunger = 20;
      this.saturation=5;this.exhaustion=0;this.breath=10;this.status=new StatusEffects();
      this.safeSpawn();
      this.resume();
      void this.save();
    }
  }
  near(id: number) {
    const p = this.body.position;
    for (let y = Math.floor(p.y) - 2; y < Math.floor(p.y) + 3; y++)
      for (let z = Math.floor(p.z) - 4; z <= Math.floor(p.z) + 4; z++)
        for (let x = Math.floor(p.x) - 4; x <= Math.floor(p.x) + 4; x++)
          if (
            idOf(this.world.get(x, y, z)) === id &&
            Math.hypot(x - p.x, z - p.z) < 5
          )
            return true;
    return false;
  }
  direction() {
    return {
      x: -Math.sin(this.yaw) * Math.cos(this.pitch),
      y: Math.sin(this.pitch),
      z: -Math.cos(this.yaw) * Math.cos(this.pitch),
    };
  }
  target() {
    const p = this.body.position;
    this.hit = raycast(
      this.world.get.bind(this.world),
      { x: p.x, y: p.y + 1.61, z: p.z },
      this.direction(),
      this.mode === "creative" ? 7 : 5,
      this.inventory.held?.id === B.Water || this.inventory.held?.id === 168,
    );
    return this.hit;
  }
  use() {
    if (this.cooldown > 0 || this.mode === "spectator") return;
    this.cooldown = 0.22;
    const hit = this.target(),
      held = this.inventory.held,
      def = held ? item(held.id) : undefined,
      skip = this.input.keys.has("ControlLeft") || this.input.keys.has("KeyC");
    const entity = this.entities.target(
      {
        x: this.body.position.x,
        y: this.body.position.y + 1.61,
        z: this.body.position.z,
      },
      this.direction(),
      Math.min(4, hit?.distance ?? 4),
    );
    if (entity?.kind === "villager" && !skip) {
      this.tradeEntity = entity;
      this.input.unlock();
      this.showTrade();
      return;
    }
    if(hit && [168,169,170].includes(held?.id??0) && this.mode!=="adventure") {
      if(useBucket(this.world,this.inventory,hit,this.body.position,this.mode==="creative")){this.audio.play("place");this.scheduleSave();return;}
    }
    if (hit && !skip) {
      const id = idOf(hit.value),
        key = blockKey(hit.x, hit.y, hit.z);
      if([B.Enchanter,B.Anvil,B.Apothecary].includes(id as never)) {
        this.containerKey=key;this.input.unlock();
        if(id===B.Apothecary)this.showBrewer();else this.showToolStation(id===B.Enchanter?"enchant":"anvil");
        return;
      }
      if(id===B.Hopper) {this.containerKey=key;this.input.unlock();this.showHopper();return;}
      if(id===B.Timer) {this.world.set(hit.x,hit.y,hit.z,packed(id,stateOf(hit.value)^2));return;}
      if (id === B.Furnace) {
        this.containerKey = key;
        this.input.unlock();
        this.showFurnace();
        return;
      }
      if (id === B.Workbench) {
        this.open("craft");
        return;
      }
      if (id === B.Chest) {
        this.containerKey = key;
        chestInventory(this.world,key,this.containers);
        this.input.unlock();
        this.ui.container(this.inventory, this.containers[key]);
        return;
      }
      if (id === B.Door) {
        const state = stateOf(hit.value),
          otherY = hit.y + (state & 8 ? -1 : 1),
          other = this.world.get(hit.x, otherY, hit.z);
        this.world.set(hit.x, hit.y, hit.z, packed(id, state ^ 4));
        if (idOf(other) === B.Door)
          this.world.set(hit.x, otherY, hit.z, packed(id, stateOf(other) ^ 4));
        this.audio.play("place");
        return;
      }
      if (id === B.Bed) {
        this.spawn = { x: hit.x + 1.5, y: hit.y + 0.1, z: hit.z + 0.5 };
        if (this.time > 0.5) {
          this.time = 0.18;
          this.health = Math.min(20, this.health + 4);
          this.ui.toast("A new morning in Jade Harbor.");
        } else this.ui.toast("Respawn point set. Return at night to sleep.");
        this.scheduleSave();
        return;
      }
      if (id === B.Switch) {
        this.world.set(hit.x, hit.y, hit.z, packed(id, stateOf(hit.value) ^ 1));
        return;
      }
    }
    if (def?.armorSlot) {
      this.inventory.equipment.equipHeld(this.inventory);
      this.audio.play("place");
      this.scheduleSave();
      return;
    }
    if(held && POTIONS[held.id]) {
      // A consumed infusion always returns its empty flask. Reserve a valid
      // destination before applying the effect so full inventory + full drop
      // pool cannot silently destroy the container.
      let flaskToDrop = false;
      if(this.mode!=="creative") {
        const trial = new Inventory(this.inventory.slots);
        trial.selected = this.inventory.selected;
        trial.consumeHeld();
        flaskToDrop = trial.add(160) !== 0;
        if(flaskToDrop && !this.entities.drop(
          {id:160,count:1},
          {...this.body.position,y:this.body.position.y+.8},
        )) {
          this.ui.toast("Make room for the empty flask first.");
          return;
        }
      }
      const effect=POTIONS[held.id];
      if(effect==="healing")this.health=Math.min(20,this.health+6);else this.status.apply(effect);
      if(this.mode!=="creative") {
        this.inventory.consumeHeld();
        if(!flaskToDrop && this.inventory.add(160))
          throw new Error("Reserved flask slot became unavailable.");
      }
      this.audio.play("eat");this.scheduleSave();return;
    }
    if (def?.food && this.hunger < 20) {
      this.hunger = Math.min(20, this.hunger + def.food);
      this.saturation = Math.min(20,this.saturation+def.food*.6);
      if (this.mode !== "creative") this.inventory.consumeHeld();
      this.audio.play("eat");
      this.scheduleSave();
      return;
    }
    if (!hit || this.mode === "adventure") return;
    if (
      def?.tool === "hoe" &&
      [B.Grass, B.Dirt].includes(idOf(hit.value) as never)
    ) {
      if (!this.world.set(hit.x, hit.y, hit.z, B.Farmland)) return;
      if (this.mode !== "creative") this.inventory.wear();
      this.audio.play("place");
      return;
    }
    if (
      held?.id === 107 &&
      idOf(hit.value) === B.Farmland &&
      this.world.get(hit.x, hit.y + 1, hit.z) === 0
    ) {
      if (!this.world.set(hit.x, hit.y + 1, hit.z, B.Rice)) return;
      if (this.mode !== "creative") this.inventory.consumeHeld();
      return;
    }
    if (!def?.block) return;
    if (
      def.block === B.Slab &&
      idOf(hit.value) === B.Slab &&
      !(stateOf(hit.value) & 1)
    ) {
      if (overlapsBlock(this.body.position, hit.x, hit.y, hit.z, packed(B.Slab, 1))) return;
      if (!this.world.set(hit.x, hit.y, hit.z, packed(B.Slab, 1))) return;
      if (this.mode !== "creative") this.inventory.consumeHeld();
      return;
    }
    const x = hit.x + hit.normal.x,
      y = hit.y + hit.normal.y,
      z = hit.z + hit.normal.z;
    const facing = Math.round(this.yaw / (Math.PI / 2)) & 3;
    const placementState = def.block === B.Stairs || def.block === B.Door ? facing : def.block === B.Timer ? 6 : 0;
    if (
      y <= MIN_Y ||
      y > MAX_Y ||
      overlapsBlock(this.body.position, x, y, z, packed(def.block, placementState)) ||
      (this.world.get(x, y, z) !== 0 &&
        idOf(this.world.get(x, y, z)) !== B.Water)
    )
      return;
    if (def.block === B.Door) {
      if (
        y >= MAX_Y ||
        this.world.get(x, y + 1, z) !== 0 ||
        overlapsBlock(this.body.position, x, y + 1, z, packed(B.Door, facing | 8))
      )
        return;
      if (!this.world.set(x, y + 1, z, packed(B.Door, facing | 8))) return;
    }
    if (!this.world.set(
      x,
      y,
      z,
      packed(
        def.block,
        placementState,
      ),
    )) {
      if (def.block === B.Door) this.world.set(x, y + 1, z, B.Air);
      return;
    }
    if (this.mode !== "creative") this.inventory.consumeHeld();
    this.audio.play("place");
    this.unlockAchievement(
      "A place of your own",
      "Placed your first building block.",
    );
  }
  mine(dt: number) {
    if (
      this.mode === "adventure" ||
      this.mode === "spectator" ||
      !this.hit ||
      !this.input.left
    ) {
      this.mineProgress = 0;
      return;
    }
    const hit = this.hit;
    if (hit.y === MIN_Y) return;
    const key = blockKey(hit.x, hit.y, hit.z);
    if (key !== this.mineKey) {
      this.mineKey = key;
      this.mineProgress = 0;
    }
    const b = block(hit.value);
    if ([B.Water, B.Lava].includes(b.id as never)) {
      this.mineProgress = 0;
      return;
    }
    const tool = item(this.inventory.held?.id ?? 0),
      correct = tool?.tool === b.tool;
    const duration =
      this.mode === "creative"
        ? 0.12
        : Math.max(0.18, b.hardness * (correct ? 1 / ((tool?.tier ?? 1)*(1+.4*enchantLevel(this.inventory.held,"efficiency"))) : 1.5));
    this.mineProgress += dt / duration;
    if (this.mineProgress < 1) return;
    this.mineProgress = 0;
    const loot:Stack[]=[];
    const canHarvest=this.mode!=="creative" && (!b.tier || (correct && (tool?.tier??0)>=b.tier));
    if(canHarvest) {
      const silk=enchantLevel(this.inventory.held,"silk"),rare=[B.Coal,B.Jade].includes(b.id as never);
      const drop=b.id===B.Rice ? stateOf(hit.value)>=3 ? 108 : 107 : silk ? b.id : (b.drop??b.id);
      loot.push({id:drop,count:rare&&!silk?1+enchantLevel(this.inventory.held,"fortune"):1});
      if(b.id===B.Rice && stateOf(hit.value)>=3)loot.push({id:107,count:2});
    }
    if(!this.breakContents(hit.x,hit.y,hit.z,loot)) {
      this.ui.toast("Nearby item storage is full. Collect some dropped items first.");return;
    }
    this.world.set(hit.x, hit.y, hit.z, 0);
    this.effects.burst(hit, b.color);
    if(canHarvest && !enchantLevel(this.inventory.held,"silk") && [B.Coal,B.Jade].includes(b.id as never))this.xp++;
    if (this.mode !== "creative" && tool?.tool) this.inventory.wear();
    this.audio.play("break");
    this.unlockAchievement("Groundbreaker", "Mined your first block.");
  }
  showCraft() {
    const near = this.near(B.Workbench),
      size = near || this.craftingGrid.slice(4).some(Boolean) ? 3 : 2;
    this.ui.craft(
      this.inventory,
      near,
      this.mode === "creative",
      this.craftingGrid,
      size,
      matchGrid(this.craftingGrid, size)?.output ?? null,
    );
  }
  stationInReach(id: number) {
    const [x, y, z] = this.containerKey.split(",").map(Number);
    const position = this.body.position;
    return (
      [x, y, z].every(Number.isFinite) &&
      this.world.loaded(x, z) &&
      idOf(this.world.get(x, y, z)) === id &&
      Math.hypot(x + 0.5 - position.x, y + 0.5 - position.y, z + 0.5 - position.z) < 5
    );
  }
  showToolStation(screen: "enchant" | "anvil") {
    toolStation(this.ui, this.inventory, this.xp, screen);
  }
  showHopper() {
    const [x, y, z] = this.containerKey.split(",").map(Number);
    const hopper = this.simulation.automation.hopper(this.containerKey);
    const direction = HOPPER_DIRECTIONS[stateOf(this.world.get(x, y, z)) % 5];
    const status = this.simulation.powered(x, y, z)
      ? "Paused by signal."
      : "Ready to transfer.";
    const cursor = this.inventory.cursor
      ? `Holding ${esc(item(this.inventory.cursor.id)?.name)} ×${this.inventory.cursor.count}`
      : "";

    this.ui.panel(
      "hopper",
      "A steady flow of supplies.",
      "Pulls from above; pushes one item every 0.4s. A powered neighbor pauses it.",
      `<button data-action="hopper-direction">Output: ${direction} ↻</button><div class="station-slots">${hopper.slots.map((stack, index) => slot(stack, index, "hopper-slot")).join("")}</div><p class="form-note">Feed kiln ore from above and fuel from a side. A hopper below collects finished goods. ${status}</p><div class="section-label">YOUR INVENTORY <span>${cursor}</span></div><div class="slots">${this.inventory.slots.map((stack, index) => slot(stack, index)).join("")}</div>`,
    );
  }
  showBrewer() {
    const [x, y, z] = this.containerKey.split(",").map(Number);
    brewerPanel(
      this.ui,
      this.inventory,
      this.simulation.brewer(this.containerKey),
      brewingWater(this.world, x, y, z),
    );
  }
  brewerClick(index: number, right: boolean) {
    if (
      !this.stationInReach(B.Apothecary) ||
      !Number.isInteger(index) ||
      index < 0 ||
      index > 3
    ) {
      return;
    }
    const cursor = this.inventory.cursor;
    const invalidItem =
      cursor &&
      ((index === 0 && cursor.id !== 160) ||
        (index === 1 && !INFUSIONS[cursor.id]) ||
        (index === 2 && cursor.id !== B.Bamboo) ||
        index === 3);
    if (invalidItem) {
      this.ui.toast("That item does not belong in this slot.");
      return;
    }
    this.inventory.click(
      index,
      right,
      this.simulation.brewer(this.containerKey).slots,
    );
    this.showBrewer();
    this.scheduleSave();
  }
  showFurnace() {
    const f = this.simulation.furnace(this.containerKey);
    this.ui.panel(
      "furnace",
      "A little heat. A new possibility.",
      "Input on the left · fuel below · collect output on the right",
      `<div class="station-slots">${f.slots.map((s, i) => `<div>${slot(s, i, "furnace-slot")}<div class="station-slot-label">${["Input", "Fuel", "Output"][i]}</div></div>`).join("")}</div><div class="station-progress"><div style="width:${(f.progress / 4) * 100}%"></div></div><p class="form-note">${f.burn > 0 ? `Burning · ${Math.ceil(f.burn)}s of fuel left` : "Add coal, logs, planks or bamboo for fuel."} · Iron, gold, rice, sand and earth can be processed.</p><div class="section-label">YOUR INVENTORY <span>${this.inventory.cursor ? `Holding ${esc(item(this.inventory.cursor.id)?.name)} ×${this.inventory.cursor.count}` : ""}</span></div><div class="slots">${this.inventory.slots.map((s, i) => slot(s, i)).join("")}</div>`,
    );
  }
  furnaceClick(i: number, right: boolean) {
    if(!this.stationInReach(B.Furnace)) return;
    const f = this.simulation.furnace(this.containerKey),
      c = this.inventory.cursor;
    if (
      c &&
      ((i === 0 && !SMELTING[c.id]) || (i === 1 && !FUEL[c.id]) || i === 2)
    ) {
      this.ui.toast("That item cannot go in this slot.");
      return;
    }
    const before = f.slots[2]?.count ?? 0;
    this.inventory.click(i, right, f.slots);
    if (i === 2) this.xp += Math.max(0, before - (f.slots[2]?.count ?? 0));
    this.showFurnace();
    this.scheduleSave();
  }
  showTrade() {
    const e = this.tradeEntity;
    if (!e) return;
    this.ui.panel(
      "trade",
      esc(e.name),
      `${esc(e.profession ? PROFESSIONS[e.profession].label : "Resident")} · ${esc(this.entities.life?.description(e.id) || e.state)}${offersFor(e).length ? " · Offers restock at dawn." : ""}`,
      `<div class="trade-list">${offersFor(e)
        .map(
          ({ offer, id }) =>
            `<button data-action="trade" data-id="${id}" ${e.trades >= 12 ? "disabled" : ""}>${icon(offer.output[0])}<span>${offer.label}</span><span>${offer.cost.map(([itemId, count]) => `${count} ${item(itemId)?.name}`).join(" + ")} → ${offer.output[1]}</span></button>`,
        )
        .join("")}</div><p class="form-note">${offersFor(e).length ? `${12 - e.trades} trades remaining today · You have ${this.inventory.count(111)} jade tokens.` : "No goods for trade at this post."}</p>`,
    );
  }
  breakContents(x: number, y: number, z: number,loot:Stack[]=[]) {
    const value=this.world.get(x,y,z),key=blockKey(x,y,z);
    // Generated discovery chests lazily materialize their loot on first access.
    // Mining an unopened chest must take the same path as opening it, otherwise
    // its discovery contents would disappear before ever entering a container.
    const container = idOf(value) === B.Chest
      ? chestInventory(this.world,key,this.containers)
      : (this.containers[key] ?? []);
    const contents=[...container,...(this.simulation.furnaces[key]?.slots??[]),
      ...(this.simulation.brewers[key]?.slots??[]),...(this.simulation.automation.hoppers[key]?.slots??[]),...loot];
    if(!this.entities.dropMany(contents,{x:x+.5,y:y+.8,z:z+.5}))return false;
    if(idOf(value)===B.Door) {
      const otherY=y+(stateOf(value)&8?-1:1);
      if(idOf(this.world.get(x,otherY,z))===B.Door)this.world.set(x,otherY,z,0);
    }
    delete this.containers[key];delete this.simulation.furnaces[key];delete this.simulation.brewers[key];delete this.simulation.automation.hoppers[key];
    return true;
  }
  unlockAchievement(id: string, message: string) {
    if (!this.achievements.has(id)) {
      this.achievements.add(id);
      this.ui.toast(message);
    }
  }
  damage(amount: number, armored = false, fire = false) {
    if(fire && this.status.has("fire_resistance")) return;
    if (
      ["creative", "spectator"].includes(this.mode) ||
      this.damageCooldown > 0 ||
      this.dead
    )
      return;
    if (armored) amount = this.inventory.equipment.absorb(amount,fire);
    this.health = Math.max(0, this.health - amount);
    this.damageCooldown = 0.8;
    this.audio.play("hurt");
    if (this.health <= 0) {
      this.dead = true;
      this.status=new StatusEffects();
      if (this.mode === "hardcore") {
        this.hardcoreEnded = true;
        this.mode = "spectator";
        this.dead = false;
        this.body.flying = true;
        this.health = 20;
        this.ui.toast(
          "Your one life has ended. This world is now spectator-only.",
        );
      } else {
        const all=[...this.inventory.slots,...this.inventory.equipment.slots,...this.craftingGrid,this.inventory.cursor];
        if(this.entities.dropMany(all,{...this.body.position,y:this.body.position.y+.7})) {
          this.inventory.slots = Array(36).fill(null);
          this.inventory.cursor = null;
          this.inventory.equipment = new Equipment();
          this.craftingGrid = Array(9).fill(null);
        } else this.ui.toast("Dropped-item limit reached; your possessions were kept for respawn.");
        this.xp = Math.floor(this.xp / 2);
        this.showDeath();
      }
    }
    this.scheduleSave();
  }
  showDeath() {
    this.input.unlock();
    this.ui.panel(
      "death",
      "Your journey continues.",
      "Return to your resting place. Recover your dropped items where you fell; drops remain for 10 active minutes.",
      `<button class="primary full" data-action="respawn">Return to Jade Harbor <span>↗</span></button>`,
    );
  }
  tick(dt: number) {
    this.tickCount++;
    this.previous = { ...this.body.position };
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.damageCooldown = Math.max(0, this.damageCooldown - dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.time = (this.time + dt / 1200) % 1;
    const k = this.input.keys,
      p = this.body.position,
      v = this.body.velocity,
      water = inWater(this.world, p),
      spectator = this.mode === "spectator",
      fly = this.body.flying || spectator;
    let f = Number(k.has("KeyW")) - Number(k.has("KeyS")),
      r = Number(k.has("KeyD")) - Number(k.has("KeyA"));
    const length = Math.hypot(f, r) || 1;
    f /= length;
    r /= length;
    const requestedCrouch = k.has("ControlLeft") || k.has("KeyC");
    const control = flightControls(
      requestedCrouch, k.has("Space"), fly, this.crouching,
      !fly && this.crouching && collides(this.world, p, 1.75),
    );
    this.crouching = control.crouching;
    const crouch = this.crouching,
      sprint = k.has("ShiftLeft") && (fly || this.hunger > 4);
    let speed = fly ? 9 : crouch ? 2 : water ? 2.6 : sprint ? 7 : 4.4;
    if (fly && sprint) speed = 18;
    if(this.status.has("speed") && !fly) speed*=1.25;
    const dx = (-Math.sin(this.yaw) * f + Math.cos(this.yaw) * r) * speed,
      dz = (-Math.cos(this.yaw) * f - Math.sin(this.yaw) * r) * speed;
    v.x += (dx - v.x) * Math.min(1, dt * 12);
    v.z += (dz - v.z) * Math.min(1, dt * 12);
    const ladder = idOf(this.world.get(p.x, p.y, p.z)) === B.Ladder;
    if (fly) v.y = control.verticalIntent * speed;
    else if (ladder) v.y = k.has("Space") || f > 0 ? 3 : crouch ? 0 : -1;
    else {
      v.y = Math.max(water ? -4 : -38, v.y - (water ? 5 : 24) * dt);
      if (this.jumpRequest && this.body.grounded) v.y = 8.2;
      if (water && k.has("Space")) v.y = 4;
    }
    this.jumpRequest = false;
    if (crouch && this.body.grounded && !fly)
      for (const axis of ["x", "z"] as const) {
        const candidate = { ...p, y: p.y - 0.55 };
        candidate[axis] += v[axis] * dt;
        if (!collides(this.world, candidate, 1.45)) v[axis] = 0;
      }
    const fall = moveBody(
      this.world,
      this.body,
      dt,
      spectator,
      crouch ? 1.45 : 1.75,
    );
    if (p.y > MAX_Y + 2) { p.y = MAX_Y + 2; v.y = 0; }
    // Spectators retain noclip but cannot drift into an endless, empty void.
    if (spectator && p.y < MIN_Y + 1) { p.y = MIN_Y + 1; v.y = 0; }
    if (fall > 3 && !water && !fly) this.damage(Math.floor(fall - 3));
    if (shouldVoidRespawn(this.mode, p.y, MIN_Y)) {
      this.damage(20);
      this.safeSpawn();
    }
    if (idOf(this.world.get(p.x, p.y, p.z)) === B.Lava) this.damage(4,true,true);
    this.target();
    this.entityHit = this.entities.target(
      { x: p.x, y: p.y + 1.61, z: p.z },
      this.direction(),
      Math.min(4, this.hit?.distance ?? 4),
    );
    if ((this.input.right || this.useRequest) && this.cooldown<=0) {this.useRequest=false;this.use();}
    if (
      (this.input.left || this.input.leftPressed) &&
      this.entityHit &&
      this.mode !== "spectator"
    ) {
      if (this.attackCooldown <= 0) {
        const tool = item(this.inventory.held?.id ?? 0);
        const target = this.entityHit;
        const damageAmount = (tool?.damage ?? 1) + enchantLevel(this.inventory.held,"sharpness") +
          (this.status.has("strength") ? 3 : 0);
        const playerPosition = this.body.position;
        const visible = meleeSightBetween(this.world, playerPosition, target.body.position, 1.61,
          target.kind === "panda" ? 0.75 : 1.15);
        if (visible) {
          const result = this.entities.applyHit(target, damageAmount, this.direction());
          if (result.status === "killed") {
            this.xp += 3;
            this.hitMessage = `${target.name} defeated · +3 XP`;
          } else if (result.status === "hit") {
            this.hitMessage = `${target.name} · −${result.damage} HP`;
          } else if (result.status === "blocked") {
            this.ui.toast("Dropped-item limit reached. Collect nearby loot first.");
          }
          if (result.status === "hit" || result.status === "killed") {
            this.hitFlash = 0.42;
            if (this.mode !== "creative" && this.inventory.wear()) {
              this.ui.toast(`${tool?.name ?? "Item"} broke.`);
              this.audio.play("break");
            }
            this.audio.play("hurt");
            this.scheduleSave();
          }
        }
        this.attackCooldown = 0.5;
      }
    } else this.mine(dt);
    this.input.leftPressed = false;
    this.simulation.radius=this.settings.simulationDistance*16;
    this.entities.radius=this.settings.simulationDistance*16;
    this.simulation.automation.containers=this.containers;
    this.simulation.automation.drops=this.entities.drops;
    this.simulation.occupants=[...this.entities.list.filter(e=>e.health>0).map(e=>e.body.position),...this.entities.drops.map(d=>d.position)];
    this.simulation.tick(dt, p, this.mode !== "spectator");
    this.entities.interactingId=this.ui.screen==="trade" ? this.tradeEntity?.id ?? "" : "";
    this.entities.weather = this.simulation.weather;
    this.entities.tick(
      dt,
      p,
      this.inventory,
      this.time,
      !["creative", "spectator"].includes(this.mode),
      (n) => this.damage(n, true),
      () => {
        this.audio.play("pickup");
        this.scheduleSave();
      },
      this.mode !== "spectator",
    );
    const walking=this.body.grounded&&!this.body.flying&&this.mode!=="spectator";
    // Recognize the walk while input is held, independently of the slower
    // collection cadence. Stopping between polls must not lose a real visit.
    if(this.discoveryArrival&&walking&&(f||r)&&Math.hypot(p.x-this.discoveryArrival.x,p.z-this.discoveryArrival.z)>=2)this.discoveryArrival=undefined;
    this.discoveryClock -= dt;
    if (this.discoveryClock <= 0) {
      this.discoveryClock = .5;
      const found = this.discoveries?.visit(p, walking&&!this.discoveryArrival);
      if (found) { this.ui.toast(`Discovered: ${found.title}`); this.scheduleSave(); }
    }
    if(this.ui.screen==="brew" && this.tickCount%10===0)this.showBrewer();
    if(this.ui.screen==="hopper" && this.tickCount%10===0)this.showHopper();
    this.health=this.status.tick(dt,this.health,["creative","spectator"].includes(this.mode));
    if (this.ui.screen === "furnace" && this.tickCount % 10 === 0)
      this.showFurnace();
    if (idOf(this.world.get(p.x, p.y + 1.6, p.z)) === B.Water) {
      this.breath = Math.max(0,this.breath-dt);
      if (this.breath <= 0) this.damage(2);
    } else this.breath = 10;
    if ((f || r) && this.body.grounded) {
      this.lastStep += dt;
      if (this.lastStep > 0.4) {
        this.audio.play("step");
        this.lastStep = 0;
      }
    }
    if (!["creative", "spectator"].includes(this.mode)) {
      this.exhaustion += dt * (f || r ? (sprint ? .4 : .2) : .05);
      while(this.exhaustion>=4) {
        this.exhaustion-=4;
        if(this.saturation>0)this.saturation=Math.max(0,this.saturation-1);else this.hunger=Math.max(0,this.hunger-1);
      }
      if (this.tickCount % 80 === 0) {
        if (this.hunger >= 16 && this.health < 20) {
          this.health = Math.min(20, this.health + 1);
          this.exhaustion = Math.min(3.99,this.exhaustion+1);
        }
        if (this.hunger <= 0) this.damage(1);
      }
    }
  }
  frame(t: number) {
    const elapsed=this.lastTime ? t-this.lastTime : 0;
    if(elapsed) this.view.metrics.add("frame",elapsed);
    const dt = Math.min(0.2, elapsed/1000);
    this.lastTime = t;
    this.frameCount++;
    if(this.travelState) {
      // Keep the last frame behind the preparation panel. Spending this time
      // on the old district's meshes/GPU/lighting delays collision readiness.
      this.accumulator=0;requestAnimationFrame(t=>this.frame(t));return;
    }
    if (t - this.fpsTime > 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (t - this.fpsTime));
      this.frameCount = 0;
      this.fpsTime = t;
    }
    const p = this.body.position;
    for (const key of this.world.stream(
      this.active ? p.x : 0,
      this.active ? p.z : 0,
      this.settings.distance,
      this.yaw,
    ))
      this.view.remove(key);
    this.view.rebuild(this.world, 6);
    if (
      this.active &&
      ["none", "inventory", "craft", "chest", "furnace", "trade", "enchant", "brew", "anvil", "hopper"].includes(
        this.ui.screen,
      ) &&
      !this.dead
    ) {
      this.accumulator += dt;
      while (this.accumulator >= 0.05) {
        const started=performance.now();
        this.tick(0.05);
        this.view.metrics.add("tick",performance.now()-started);
        this.accumulator -= 0.05;
      }
      const a = this.accumulator / 0.05;
      this.view.camera.position.set(
        this.previous.x + (p.x - this.previous.x) * a,
        this.previous.y +
          (p.y - this.previous.y) * a +
          (this.crouching ? 1.27 : 1.61),
        this.previous.z + (p.z - this.previous.z) * a,
      );
      this.view.camera.rotation.set(this.pitch, this.yaw, 0, "YXZ");
    } else this.accumulator = 0;
    if (this.active) {
      this.view.target(this.ui.screen === "none" ? this.hit : null);
      // The 3D held item must follow the actual hotbar slot, not a fixed cube.
      this.view.setHeldItem(this.inventory.held?.id ?? null);
      this.view.hand.visible =
        this.ui.screen === "none" && this.mode !== "spectator";
      // Subtle idle breathing and a short interaction swing; no perpetual sway.
      const heldSway = Math.sin(t * 0.0027);
      const heldSwing = this.input.left ? Math.sin(t * 0.022) * 0.18 : 0;
      this.view.hand.rotation.x = -0.12 - heldSwing + heldSway * 0.012;
      this.view.hand.rotation.z = -0.26 + Math.sin(t * 0.0021) * 0.01;
      this.view.hand.position.y = -0.64 + heldSway * 0.005;
      this.view.environment(this.time, this.simulation.weather === "rain",this.status.has("night_vision"),dt);
      this.entityView.update(this.entities, t / 1000);
      this.effects.update(dt, p, this.view.atmosphere.rain*this.view.rainExposure, t / 1000);
      if (
        this.lighting.pending ||
        (t - this.lastLighting > 1200 && this.world.pending.size === 0)
      ) {
        if (!this.lighting.pending) this.lastLighting = t;
        const started=performance.now();
        this.lighting.update(4);
        this.view.metrics.add("lighting",performance.now()-started);
      }
      if (t - this.lastHud > 120) {
        this.lastHud = t;
        const hour = Math.floor((this.time * 24 + 6) % 24),
          minute = Math.floor((this.time * 1440) % 60);
        const geography = this.debug ? this.world.inspectTerrain(p.x, p.z) : undefined;
        const architecture = this.debug ? this.world.inspectDistrict(p.x,p.z) : undefined;
        const landmarkDebug = this.debug ? this.world.inspectLandmark(p.x,p.z) : undefined;
        const urbanDebug = architecture ? `\n${architecture.district?.name ?? "Outside districts"} · ${architecture.road?.kind ?? "off street"} · ${architecture.lot?.archetype ?? "open space"} / ${architecture.lot?.roofFamily ?? "—"} / ${architecture.lot?.facade ?? "—"}` : "";
        this.ui.updateHUD(this.inventory, {
          name: this.meta.name,
          mode: this.mode,
          biome: biomeAt(p.x, p.z, seedNumber(this.meta.seed), this.world.generatorVersion),
          x: Math.floor(p.x),
          y: Math.floor(p.y),
          z: Math.floor(p.z),
          time: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
          target: this.entityHit
            ? `${this.entityHit.name} · ${Math.max(0, Math.ceil(this.entityHit.health))} / ${this.entityHit.kind === "spirit" ? 16 : 20} HP`
            : this.hit
              ? block(this.hit.value).name
              : "",
          health: this.health,
          hunger: this.hunger,
          xp: this.xp,
          breath: this.breath,
          effects: this.status.list.map(e=>`${EFFECTS[e.id].name} ${Math.ceil(e.remaining)}s`).join(" · "),
          flying: this.body.flying,
          progress: this.mineProgress,
          hitFlash: this.hitFlash > 0,
          hitMessage: this.hitFlash > 0 ? this.hitMessage : "",
          debug: this.debug
            ? `Generator ${this.world.generatorVersion} · ${geography?.region ?? "legacy geography"} · ${geography?.reservation ?? "no landmark reserve"}\n${geography ? `Slope ${geography.slope.toFixed(2)} · buildable ${geography.buildable} · plan ${geography.planMs.toFixed(1)} ms / ${this.world.planCount} active` : "Legacy v3 terrain retained"}\n${urbanDebug}${landmarkDebug ? `\n${landmarkDebug.name} · ${landmarkDebug.reservation.id}` : ""}\n${this.fps} FPS · target 20 TPS\nFrame p50/p95 ${this.view.metrics.summary("frame").p50.toFixed(1)}/${this.view.metrics.summary("frame").p95.toFixed(1)} ms · tick p95 ${this.view.metrics.summary("tick").p95.toFixed(1)} ms\n${this.world.chunks.size} chunks · ${this.world.pending.size} generating · ${this.world.dirty.size} mesh queue\n${this.view.worldRenderStats.triangles} triangles · ${this.view.worldRenderStats.calls} draws · ${this.view.renderer.info.memory.geometries} geometries\n${this.entities.list.length} entities · ${this.entities.life?.metrics.active ?? "legacy"} active residents · ${this.entities.navigation.agents.size} routes / ${this.entities.navigation.expandedLastTick} nodes\nLife ${this.entities.life?.metrics.scheduleMs.toFixed(2) ?? "0"} ms · nav ${this.entities.navigation.solveMs.toFixed(2)} ms · ${this.entities.life?.event?.title ?? "no gathering"}\n${this.view.atmosphere.phase} · fog ${this.view.atmosphere.fogNear.toFixed(0)}/${this.view.atmosphere.fogFar.toFixed(0)} · LOD ${this.view.distant?.stats.terrainTriangles??0}+${this.view.distant?.stats.anchorTriangles??0} triangles\n${this.world.evictionBlocked} pinned unsaved chunks\nCPU block arrays ~${([...this.world.chunks.values()].reduce((n,c)=>n+c.blocks.byteLength,0)/1048576).toFixed(1)} MiB (excludes GPU/heap)\n${this.world.edits.size} edits · save rev ${this.saveRevision} · ${this.meta.seed}`
            : "",
        });
      }
      if (t - this.lastAuto > 8000) {
        this.lastAuto = t;
        void this.save();
      }
    } else {
      this.view.target(null);
      this.view.environment(0.23);
      this.entityView.update(this.entities, t / 1000);
      if (
        this.lighting.pending ||
        (t - this.lastLighting > 2000 && this.world.pending.size === 0)
      ) {
        if (!this.lighting.pending) this.lastLighting = t;
        const started=performance.now();
        this.lighting.update(4);
        this.view.metrics.add("lighting",performance.now()-started);
      }
    }
    if(this.active)this.view.updateDistant(this.world);
    this.view.render();
    requestAnimationFrame((t) => this.frame(t));
  }
}
