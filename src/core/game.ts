import { createId } from "./ids";
import { AppViewport } from "../browser/viewport";
import { BrowserExperience } from "../browser/experience";
import { BrowserLifecycle } from "../browser/lifecycle";
import { TabCoordinator } from "../persistence/tab-coordination";
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
import { World } from "../world/world";
import { View } from "../render/renderer";
import {graphicsQuality,graphicsProfile,GRAPHICS_PROFILES,type GraphicsQuality} from "../render/graphics";
import { GraphicsPerformanceAdvisor } from "../render/performance-advisor";
import { FramePacer, frameRateLimit, frameUrgent, hasFrameBackgroundWork, type FrameRateLimit } from "../render/frame-pacer";
import { AdaptiveResolution } from "../render/adaptive-resolution";
import { version as appVersion } from "../../package.json";
import { UI, esc, icon, slot } from "../ui/ui";
import type { Screen } from "../ui/ui";
import { Input } from "../player/input";
import {keyboardCommand, type InputCommand} from "../player/input-state";
import {touchMode, touchSensitivity, type TouchMode} from "../ui/touch-controls";
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
} from "../persistence/saves";
import { MIN_Y, MAX_Y, clamp, Vec3, idOf, packed, stateOf, blockKey } from "./coords";
import { biomeAt } from "../world/generator";
import { seedNumber } from "../world/noise";
export class Game {
  ui: UI;
  view: View;
  input: Input;
  viewport: AppViewport;
  browser?: BrowserExperience;
  lifecycle?: BrowserLifecycle;
  tabs?: TabCoordinator;
  saveConflicted=false;
  private opening=false;
  private reclaimTask?:Promise<void>;
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
  settings = { adaptiveResolution: false, frameRateLimit: "auto" as FrameRateLimit, graphicsQuality: "high" as GraphicsQuality, fov: 75, sensitivity: 4, distance: 5, simulationDistance: 4, volume: 30, touchControls: "auto" as TouchMode, touchSensitivity: 1 };
  private adaptive = new AdaptiveResolution();
  private performanceAdvisor = new GraphicsPerformanceAdvisor();
  private performanceRecommendation: GraphicsQuality | null = null;
  private performanceRecommendationFps = 0;
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
  private lastFrameWorkMs = 0;
  private lastInputTime = 0;
  private frameHandle:number|null=null;
  private disposed=false;
  private disposeTask?:Promise<void>;
  private handleCanvasClick=()=>{if(this.active&&this.ui.screen==="none"&&!this.input.locked&&this.ui.pointerType!=="touch"&&this.ui.pointerType!=="pen")void this.input.lock();};
  private framePacer = new FramePacer();
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
    this.viewport=new AppViewport(root,(w,h)=>this.view.resize(w,h));
    // UI and world now render the same generated pixel textures for every block.
    try {
      this.ui.root.style.setProperty("--item-atlas-url", `url("${this.view.atlas.canvas.toDataURL("image/png")}")`);
    } catch {
      // Privacy-restricted canvas exports can fail; colored icons stay usable.
    }
    this.input = new Input(this.view.canvas);
    this.ui.bindTouchControls(this.input.touch, () => {
      if (this.active && !this.dead && this.ui.screen === "none") void this.input.lock();
    });
    this.world = new World("jade-harbor");
    this.simulation = new Simulation(this.world);
    this.entities = new Entities(this.world);
    this.entityView = new EntityView(this.view.scene, this.view.renderAudit);
    this.effects = new Effects(this.view.scene, this.view.renderAudit);
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
      else {this.viewport.refresh();this.ui.toast("Graphics restored. Return to your world when ready.");}
    };
    this.bind();
    this.loadPreview();
    void this.refreshSaves();
    this.tabs=new TabCoordinator(()=>this.markSaveConflict());
    this.browser=new BrowserExperience({ui:this.ui,viewport:this.viewport,active:()=>this.active,save:()=>this.save(),pauseForUpdate:async()=>{this.input.clear();if(!this.active)return true;if(this.saveConflicted)return false;this.pause();return this.saveTask?await this.saveTask:await this.save();},help:()=>{this.returnScreen=this.ui.screen;this.ui.panel("browser","Jade Harbor on your device.","Install, play offline and choose your display.",this.browser!.helpHtml());}});
    this.lifecycle=new BrowserLifecycle({suspend:()=>this.suspendBrowser(),restore:()=>{this.input.restoreUIFocus();this.lastTime=0;this.lastFrameWorkMs=0;this.accumulator=0;this.viewport.refresh();this.browser?.restore();},release:()=>{void this.tabs?.release();}});
    // Start the frame loop only after every synchronous subsystem has been
    // constructed. A startup failure must not leave a half-built game ticking.
    this.scheduleFrame();
  }
  private scheduleFrame(){if(this.disposed||this.frameHandle!==null)return;this.frameHandle=requestAnimationFrame(t=>{this.frameHandle=null;if(!this.disposed)this.frame(t);});}
  bind() {
    this.view.canvas.addEventListener("click",this.handleCanvasClick);
    this.input.onLook = (dx, dy) => {
      this.yaw -= dx;
      this.pitch = clamp(
        this.pitch - dy,
        -1.54,
        1.54,
      );
    };
    this.input.onUnlock = () => {
      this.useRequest=this.jumpRequest=false;
      if (this.active && this.ui.screen === "none") this.pause();
    };
    this.input.onCommand = command => this.command(command);
    this.input.onClear = () => {this.useRequest=this.jumpRequest=false;this.mineProgress=0;this.ui.touchControls?.suspend();};
    this.ui.onScreenChange = screen => {
      this.input.setContext(this.active && !this.dead && screen==="none"?"gameplay":"ui");
      if (screen !== "none") this.performanceAdvisor.suspend();
      this.useRequest=this.jumpRequest=false;this.mineProgress=0;
    };
    this.input.setContext(this.ui.screen==="none"?"gameplay":"ui");
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
    this.ui.onPerformanceAction = action => {
      if (action === "lower" && this.performanceRecommendation) {
        const next = this.performanceRecommendation;
        this.performanceRecommendation = null;
        this.performanceRecommendationFps = 0;
        this.performanceAdvisor.accept(performance.now());
        this.settings.graphicsQuality = next;
        this.applySettings();
        this.ui.hidePerformanceAdvisor();
        this.ui.toast(`Graphics quality changed to ${GRAPHICS_PROFILES[next].label}.`);
      } else {
        this.performanceAdvisor.dismiss();
        this.performanceRecommendation = null;
        this.performanceRecommendationFps = 0;
        this.ui.hidePerformanceAdvisor();
      }
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
        this.ui.pause(this.meta.name, this.mode, this.hardcoreEnded, (this.performanceRecommendation
          ? { current: this.settings.graphicsQuality, next: this.performanceRecommendation, fps: this.performanceRecommendationFps }
          : undefined));
        void this.save();
        return;
      }
      if(el.id === "graphicsQuality") {
        const next = graphicsQuality(el.value);
        if (next !== this.settings.graphicsQuality) {
          this.performanceAdvisor.reset(performance.now());
          this.performanceRecommendation = null;
          this.performanceRecommendationFps = 0;
          this.ui.hidePerformanceAdvisor();
        }
        this.settings.graphicsQuality=next;
        this.applySettings();return;
      }
      if(el.id === "adaptiveResolution") {
        this.settings.adaptiveResolution=el.value==="on";this.applySettings();return;
      }
      if(el.id === "frameRateLimit") {
        this.settings.frameRateLimit=frameRateLimit(el.value==="auto"?"auto":Number(el.value));this.applySettings();return;
      }
      if (el.id === "touchControls") {
        this.settings.touchControls = touchMode(el.value); this.applySettings(); return;
      }
      if (el.id in this.settings) {
        (this.settings as unknown as Record<string, number>)[el.id] = Number(
          el.value,
        );
        this.applySettings();
        const output = el.parentElement?.querySelector("output");
        if (output)
          output.textContent = (el.id === "touchSensitivity" ? this.settings.touchSensitivity.toFixed(1) : el.value) +
            (el.id === "fov" ? "°" : el.id === "volume" ? "%" :
             el.id === "touchSensitivity" ? "×" :
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
    if(this.input)this.input.mouseSensitivity=this.settings.sensitivity;
    this.settings.volume = clamp(finite(this.settings.volume, 30), 0, 100);
    this.settings.graphicsQuality=graphicsQuality(this.settings.graphicsQuality);
    this.settings.adaptiveResolution=this.settings.adaptiveResolution===true;
    this.settings.frameRateLimit=frameRateLimit(this.settings.frameRateLimit);
    this.adaptive.configure(this.settings.adaptiveResolution,this.settings.frameRateLimit);
    this.view.setGpuTimingEnabled?.(this.settings.adaptiveResolution||this.debug);
    this.view.setResolutionScale(this.adaptive.scale);
    this.settings.touchControls = touchMode(this.settings.touchControls);
    this.settings.touchSensitivity = touchSensitivity(this.settings.touchSensitivity);
    this.ui?.touchControls?.configure(this.settings.touchControls, this.settings.touchSensitivity);
    const profile=graphicsProfile(this.settings.graphicsQuality);
    this.view.setGraphicsProfile(profile);
    this.effects.setRainCount(profile.rainParticleCount);
    this.view.camera.fov = this.settings.fov;
    this.view.camera.updateProjectionMatrix();
    this.view.distance = this.settings.distance;
    this.audio.volume = this.settings.volume / 100;
    this.browser?.refresh();
    try {
      localStorage.setItem(
        "jade-harbor-settings",
        JSON.stringify(this.settings),
      );
    } catch {}
  }
  performanceReport() {
    const v=this.view;
    return {schema:1,version:appVersion,graphics:{quality:this.settings.graphicsQuality,adaptive:this.settings.adaptiveResolution,scale:v.resolutionScale,frameRateLimit:this.settings.frameRateLimit,frameTargetFps:this.framePacer.targetFps,gpuTimingEnabled:this.settings.adaptiveResolution||this.debug,adaptiveState:this.adaptive.state,adaptiveBottleneck:this.adaptive.bottleneck,adaptiveSampleCount:this.adaptive.sampleCount,decision:this.adaptive.decision,drawingBuffer:{width:v.canvas.width,height:v.canvas.height,ratio:v.renderer.getPixelRatio()}},capabilities:v.capabilities,metrics:v.metrics.snapshot(),subsystems:{cityLife:this.entities.life?{scheduleMs:this.entities.life.metrics.scheduleMs,eventMs:this.entities.life.metrics.eventMs,active:this.entities.life.metrics.active,mid:this.entities.life.metrics.mid,far:this.entities.life.metrics.far,relocations:this.entities.life.metrics.relocations,fallbacks:this.entities.life.metrics.fallbacks}:null,navigation:{solveMs:this.entities.navigation.solveMs,expandedNodes:this.entities.navigation.expandedLastTick,searchesStarted:this.entities.navigation.searchesStarted},entities:{tickMs:this.entities.tickMs}},resources:{geometries:v.renderer.info.memory.geometries,textures:v.renderer.info.memory.textures,programs:v.renderer.info.programs?.length??null,columns:this.world.chunks.size,meshQueue:this.world.dirty.size,worldStreaming:this.world.streamingDiagnostics,meshQueueDiagnostics:{...v.meshQueueStats},loadedDataSections:[...this.world.chunks.values()].reduce((n,c)=>n+c.blocks.sections.size,0),untrackedRenderables:v.renderAuditUntrackedSnapshot(),generating:this.world.pending.size,residents:this.entities.residentPopulation.length,activeResidents:this.entities.life?.active.size??null,viewmodelRender:v.viewmodelRenderStats,distant:v.distant?{planMs:v.distant.stats.planMs,buildMs:v.distant.stats.buildMs,maxBuildSliceMs:v.distant.stats.maxBuildSliceMs,ready:v.distant.stats.ready,terrainReady:v.distant.stats.terrainReady,anchorsReady:v.distant.stats.anchorsReady,terrainTriangles:v.distant.stats.terrainTriangles,waterTriangles:v.distant.stats.waterTriangles,anchorTriangles:v.distant.stats.anchorTriangles,anchorBoxes:v.distant.stats.anchorBoxes}:null,render:{...v.worldRenderStats}},notes:"Local rolling samples (up to 240 each). CPU subsystem samples are separate categories and may be nested/overlap; do not sum them. worldStream measures request/eviction bookkeeping; meshQueue includes dirty-queue scan plus mesh creation; mesh is per-section creation. simulation and entities are subcomponents of tick. actorRender includes resident/encounter/drop scene updates. renderSubmit is CPU-side submission, not GPU execution. GPU render time is asynchronous EXT_disjoint_timer_query_webgl2 data when supported; disjoint results are discarded. Browser frame intervals include scheduling. F3 A/B windows compare frameWork and renderSubmit samples with diagnostics enabled versus disabled; compare only in the same settled scene and do not treat them as a controlled GPU benchmark. Mesh-queue queueAgeMs is the duration of the current non-empty backlog episode, not the age of the oldest individual key. Mesh-queue admissionBacklog is the unconsumed dirty-add journal; queuedCandidates and activeSections are the persistent mesh scheduling lanes, while activeJobs and pendingCommits are subsets of activeSections. sectionCoordinateCache and candidatePoolCapacity are retained object counts, not RAM byte measurements. admissionHeadroomMs is estimated from the target frame interval minus the previous measured frameWork CPU time; it is not GPU headroom. Untracked renderables are visible scene objects missing a render-audit category and are not proof of submitted draws. Hardware hints do not measure device speed or temperature. No world names, IDs, seeds or player data included."};
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
  async start(data?:SaveData,name="My Jade Harbor",seed="jade-harbor",mode:Mode="creative") {
    if(this.opening)throw new Error("A world is already opening. Please wait.");this.opening=true;
    try {const prepared=data?validateSave(data):freshWorld(name,seed,mode);
      if(this.active&&!this.saveConflicted){this.pause();if(!(await(this.saveTask??this.save())))throw new Error("Save the current world before opening another.");}
      if(this.tabs&&!(await this.tabs.acquire(prepared.id,prepared.revision??0)))throw new Error("This world is open in another tab. Close it there, then try again.");
      this.saveConflicted=false;await this.startOwnedWorld(prepared,name,seed,mode);
      if(this.tabs&&!this.tabs.writable(this.meta.id))this.markSaveConflict();
    }finally{this.opening=false;}
  }
  private async startOwnedWorld(
    data?: SaveData,
    name = "My Jade Harbor",
    seed = "jade-harbor",
    mode: Mode = "creative",
  ) {
    this.input.clear();
    if(this.travelState)this.cancelTravel(false);
    this.travelSerial++; this.travelState = undefined;
    clearTimeout(this.saveTimer);
    data = data ?? freshWorld(name, seed, mode);
    this.saveRevision = data.revision ?? 0;
    this.discoveries?.dispose();
    this.simulation.dispose();
    this.entities.dispose();
    this.lighting.dispose();
    this.world.dispose();
    this.view.clear();
    this.effects.clear();
    this.mode = data?.mode ?? mode;
    this.meta = {
      id: data?.id ?? createId(),
      name: data?.name ?? name,
      seed: data?.seed ?? seed,
      created: data?.created ?? Date.now(),
    };
    this.world = new World(this.meta.seed, data.edits, true);
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
    this.performanceAdvisor.reset(performance.now());
    this.performanceRecommendation = null;
    this.performanceRecommendationFps = 0;
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
    if(this.saveConflicted)return;
    // Increment even when the write is already in flight. A save may have
    // snapshotted older state, so its status must not claim newer changes.
    this.saveActivityVersion++;
    clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => void this.save(), 650);
  }
  async save(): Promise<boolean> {
    if (!this.active || this.saveConflicted || this.tabs && !this.tabs.writable(this.meta.id)) return false;
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
        if(this.saveConflicted)return false;
        this.tabs?.committed(revision);
        this.ui.saveStatus(
          world.dirtyEdits.size || this.saveActivityVersion !== activityVersion
            ? "Saved · newer changes pending"
            : "✓ All changes saved",
        );
        return true;
      } catch (error) {
        if(error instanceof Error&&error.name==="SaveConflictError"){this.markSaveConflict();return false;}
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
      if (this.saveAgain && this.active && !this.saveConflicted) void this.save();
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
    this.input.clear();
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
      // footprint; district meshes, lighting and NPC settling complete independently.
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
      this.entities.life?.prepare(this.entities.residentPopulation,arrival,this.time,this.simulation.weather==="rain",this.entities.elapsed,this.entities.navigation);
      this.entities.refreshOccupants();
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
  private async suspendBrowser(){this.input.clear();if(this.travelState)this.cancelTravel(false);if(!this.active||this.saveConflicted)return false;if(this.dead){this.input.unlock();return this.save();}this.pause();return this.saveTask?this.saveTask:false;}
  private markSaveConflict(){if(!this.active||this.saveConflicted)return;this.saveConflicted=true;this.saveAgain=false;clearTimeout(this.saveTimer);if(this.travelState)this.cancelTravel(false);this.tabs?.markConflict();this.showSaveConflict();this.input.unlock();this.ui.saveStatus("Save conflict · Export a backup");}
  private showSaveConflict(){this.ui.panel("conflict","This world changed in another tab.","Your current session is paused to protect your changes.",'<p>Export the current session before leaving if you want to keep its changes. The newer saved world will not be overwritten or merged.</p><div class="pause-grid"><button class="primary" data-action="conflict-export">Export current session backup</button><button data-action="conflict-reopen">Reopen latest saved version</button><button data-action="conflict-menu">Return to world list</button></div>');}
  private reclaimSession(){if(this.reclaimTask)return;this.reclaimTask=(async()=>{if(!this.tabs||!(await this.tabs.acquire(this.meta.id,this.saveRevision))){this.ui.toast("This world is open in another tab. Close it there before resuming.");return;}const latest=await loadSave(this.meta.id);if((latest.revision??0)!==this.saveRevision){this.markSaveConflict();return;}this.resume(false);})().catch(e=>this.ui.toast(e instanceof Error?e.message:"Could not reopen this world.")).finally(()=>{this.reclaimTask=undefined;});}
  disposeBrowser(){this.lifecycle?.dispose();this.browser?.dispose();this.viewport.dispose();void this.tabs?.dispose();this.input.dispose();}
  /** Stop the game permanently and release every owned browser/GPU resource.
   * Call this only for a real application teardown, never for bfcache suspension. */
  dispose():Promise<void>{
    if(this.disposeTask)return this.disposeTask;
    this.disposed=true;
    this.disposeTask=this.disposeResources();
    return this.disposeTask;
  }
  private async disposeResources(){
    if(this.frameHandle!==null){cancelAnimationFrame(this.frameHandle);this.frameHandle=null;}
    clearTimeout(this.saveTimer);
    this.input.clear();
    if(this.active&&!this.saveConflicted){try{await(this.saveTask??this.save());}catch{/* Preserve teardown even if storage is unavailable. */}}
    this.lifecycle?.dispose();this.lifecycle=undefined;
    this.browser?.dispose();this.browser=undefined;
    this.viewport.dispose();
    this.view.canvas.removeEventListener("click",this.handleCanvasClick);
    this.input.dispose();
    this.ui.dispose();
    this.discoveries?.dispose();this.discoveries=undefined;
    this.simulation.dispose();this.entities.dispose();this.lighting.dispose();this.world.dispose();
    this.entityView.dispose();this.effects.dispose();this.view.dispose();
    for(const key of Object.keys(this.containers))delete this.containers[key];
    await this.audio.dispose();
    await this.tabs?.dispose();this.tabs=undefined;
  }
  resume(relock = true) {
    if(this.saveConflicted){this.showSaveConflict();return;}
    if(this.active&&this.tabs&&!this.tabs.writable(this.meta.id)){this.reclaimSession();return;}
    if (this.travelState) return;
    if (!this.active) {
      this.ui.menu(this.saves);
      return;
    }
    if(document.hidden){this.ui.pause(this.meta.name,this.mode,this.hardcoreEnded,(this.performanceRecommendation
          ? { current: this.settings.graphicsQuality, next: this.performanceRecommendation, fps: this.performanceRecommendationFps }
          : undefined));this.input.setContext("ui");return;}
    if (this.dead) {
      this.showDeath();
      return;
    }
    if (!this.inventory.settleCursor()) {
      this.ui.toast("Make room for the stack you are holding.");
      return;
    }
    this.ui.show("none");
    this.performanceAdvisor.resume(performance.now());
    if (this.performanceRecommendation) {
      this.ui.showPerformanceAdvisor(this.settings.graphicsQuality, this.performanceRecommendation, this.performanceRecommendationFps);
    }
    this.frameCount = 0;
    this.fps = 0;
    this.fpsTime = performance.now();
    this.input.prepareResume();
    this.ui.touchControls?.setGameplay(this.input.state.context === "gameplay", this.mode);
    // Browser Escape deliberately releases Pointer Lock. Asking for a new
    // lock inside the same Escape can trigger another native release and
    // reopen Pause. A canvas click will reacquire the mouse safely.
    const mouse = this.ui.pointerType !== "touch" && this.ui.pointerType !== "pen";
    if (relock && mouse) void this.input.lock();
    else if (mouse && !this.ui.touchControls?.enabled) this.ui.toast("Click the game to capture your mouse.");
  }
  // Settings and Controls return to where they were opened, not always to gameplay.
  backToPreviousScreen() {
    if (!this.active || this.returnScreen === "menu") this.ui.menu(this.saves);
    else if (this.returnScreen === "create") this.ui.create();
    else this.ui.pause(this.meta.name, this.mode, this.hardcoreEnded, (this.performanceRecommendation
          ? { current: this.settings.graphicsQuality, next: this.performanceRecommendation, fps: this.performanceRecommendationFps }
          : undefined));
  }
  pause() {
    if (!this.active || this.dead) return;
    // Update the UI before releasing pointer lock to avoid an unlock-event race.
    this.ui.pause(this.meta.name, this.mode, this.hardcoreEnded, (this.performanceRecommendation
          ? { current: this.settings.graphicsQuality, next: this.performanceRecommendation, fps: this.performanceRecommendationFps }
          : undefined));
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
  // Retained only for older developer fixtures; physical adapters use commands.
  key(code: string) {const command=keyboardCommand(code);if(command)this.command(command);}
  command(command: Readonly<InputCommand>) {
    if(this.saveConflicted){this.showSaveConflict();return;}
    const {action, value}=command;
    if (this.travelState) {
      if (action === "pause") this.cancelTravel();
      return;
    }
    if (action === "hotbarSelect" && this.active &&
        (this.ui.screen === "none" || this.ui.screen === "inventory")) {
      this.inventory.selected = value;
      if (this.active && this.ui.screen === "inventory")
        this.ui.inventory(this.inventory, this.mode === "creative", this.category, this.query);
      if (this.active) this.scheduleSave();
      return;
    }
    if(action==="hotbarDelta") {
      if(this.active&&this.ui.screen==="none") {this.inventory.selected=(this.inventory.selected+Math.sign(value)+9)%9;this.scheduleSave();}return;
    }
    if (action === "debug") {
      this.debug = !this.debug;
      this.view.setGpuTimingEnabled?.(this.debug||this.settings.adaptiveResolution);
      this.view.setRenderAuditEnabled(this.debug);
      return;
    }
    if (action === "pause") {
      if (!this.active) {
        if (this.ui.screen !== "menu") this.ui.menu(this.saves);
      } else if (this.dead) {
        this.showDeath();
      } else if (this.ui.screen === "none") {
        this.pause();
      } else if (this.ui.screen === "settings" || this.ui.screen === "controls" || this.ui.screen === "journal" || this.ui.screen === "browser") {
        this.backToPreviousScreen();
      } else {
        // Escape closes the modal; a fresh click reacquires browser pointer lock.
        this.resume(false);
      }
      return;
    }
    if (!this.active) return;
    if (action === "inventory") {
      if (this.ui.screen === "inventory" || this.ui.screen === "craft")
        this.resume();
      else if (this.ui.screen === "none") this.open("inventory");
      return;
    }
    if (this.ui.screen !== "none") return;
    if (action === "jump") {
      this.jumpRequest = true;

    }
    if (action === "toggleFlight" && this.mode === "creative") {
      this.body.flying = !this.body.flying;
      this.ui.touchControls?.setFlightState(this.body.flying);
      this.scheduleSave();
    }
    if (action === "use") this.useRequest = true;
    if (action === "drop" && this.inventory.held && this.mode !== "spectator") {
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
    if(action==="conflict-export"){exportSave(this.snapshot());return;}
    if(action==="conflict-menu"){if(!confirm("Return to saved worlds? Export a backup first to keep changes from this session."))return;clearTimeout(this.saveTimer);this.active=false;this.saveConflicted=false;await this.tabs?.release();this.input.unlock();this.view.clearDistant();await this.refreshSaves();return;}
    if(action==="conflict-reopen"){if(confirm("Reopen the latest saved version? Export your current session first to keep its changes.")){this.browser?.beginGameplayDisplay();await this.start(await loadSave(this.meta.id));}return;}
    if(this.saveConflicted)return;
    const id = button.dataset.id;
    if(this.travelState){if(action==="back"||action==="travel-cancel")this.cancelTravel();return;}
    if (action === "new") {
      this.ui.create();
      return;
    }
    if (action === "create") {
      this.browser?.beginGameplayDisplay();
      const name =
          (
            document.querySelector("#world-name") as HTMLInputElement
          ).value.trim() || "Untitled world",
        seed =
          (
            document.querySelector("#world-seed") as HTMLInputElement
          ).value.trim() || createId().slice(0, 8),
        mode = (document.querySelector("#world-mode") as HTMLSelectElement)
          .value as Mode;
      await this.start(undefined, name, seed, mode);
      return;
    }
    if (action === "load") {
      this.browser?.beginGameplayDisplay();
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
        await this.tabs?.release();
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
          await (this.tabs?this.tabs.protect(save.id,()=>renameSave(save.id,name)):renameSave(save.id,name));
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
          await (this.tabs?this.tabs.protect(s.id,()=>deleteSave(s.id)):deleteSave(s.id));
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
        await (this.tabs?this.tabs.protect(s.id,()=>resetSave(s.id)):resetSave(s.id));
        await this.refreshSaves();
        this.ui.toast("World reset. The city and Panda Plaza are ready again.");
      }
      return;
    }
    if (action === "duplicate") {
      const s = this.saves.find((s) => s.id === id);
      if (s) {
        this.ui.worldProcessing(s.id, "Duplicating world…");
        try {
          const d = await loadSave(s.id);
          d.id = createId();
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
          data.id = createId();
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
      await this.browser?.display.toggleFullscreen();
      return;
    }
    if (action === "export-performance") {
      const url=URL.createObjectURL(new Blob([JSON.stringify(this.performanceReport(),null,2)],{type:"application/json"}));
      const a=document.createElement("a");a.href=url;a.download="jade-harbor-performance.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;
    }
    if (action === "reset-settings") {
      this.browser?.resetPreferences();
      this.performanceAdvisor.reset(performance.now());
      this.performanceRecommendation = null;
      this.performanceRecommendationFps = 0;
      this.ui.hidePerformanceAdvisor();
      this.settings = {
        graphicsQuality: "high",
        adaptiveResolution: false,
        frameRateLimit: "auto",
        fov: 75,
        sensitivity: 4,
        distance: 5,
        simulationDistance: 4,
        volume: 30,
        touchControls: "auto",
        touchSensitivity: 1,
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
      const offer = TRADES[Number(id)], trader = this.tradeEntity;
      if (
        trader &&
        this.entities.canInteractWith(trader,this.body.position,5) &&
        trader.trades < 12 &&
        offersFor(trader).some(o=>o.id===Number(id)) &&
        offer &&
        this.inventory.transaction(offer.cost, offer.output)
      ) {
        trader.trades++;
        this.audio.play("craft");
        this.unlockAchievement(
          "A fair exchange",
          "Completed your first trade.",
        );
        this.scheduleSave();
      } else
        this.ui.toast(
          "The resident may no longer be available, or the trade requirements are not met.",
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
      skip = this.input.held("crouch");
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
      !this.input.held("primary")
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
    if(!this.world.set(hit.x, hit.y, hit.z, 0)) return;
    this.view.commitMinedBlock(this.world, hit.x, hit.y, hit.z);
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
    const available = this.entities.canInteractWith(e,this.body.position,5);
    this.ui.panel(
      "trade",
      esc(e.name),
      `${esc(e.profession ? PROFESSIONS[e.profession].label : "Resident")} · ${available ? esc(this.entities.life?.description(e.id) || e.state) : "Resident is no longer available."}${available && offersFor(e).length ? " · Offers restock at dawn." : ""}`,
      `<div class="trade-list">${offersFor(e)
        .map(
          ({ offer, id }) =>
            `<button data-action="trade" data-id="${id}" ${!available || e.trades >= 12 ? "disabled" : ""}>${icon(offer.output[0])}<span>${offer.label}</span><span>${offer.cost.map(([itemId, count]) => `${count} ${item(itemId)?.name}`).join(" + ")} → ${offer.output[1]}</span></button>`,
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
    const intent = this.input.readTick(this.cooldown <= 0),
      p = this.body.position,
      v = this.body.velocity,
      water = inWater(this.world, p),
      spectator = this.mode === "spectator",
      fly = this.body.flying || spectator;
    const f = intent.moveY, r = intent.moveX;
    const requestedCrouch = this.input.held("crouch");
    const control = flightControls(
      requestedCrouch, this.input.held("jump"), fly, this.crouching,
      !fly && this.crouching && collides(this.world, p, 1.75),
    );
    this.crouching = control.crouching;
    const crouch = this.crouching,
      sprint = this.input.held("sprint") && (fly || this.hunger > 4);
    let speed = fly ? 9 : crouch ? 2 : water ? 2.6 : sprint ? 7 : 4.4;
    if (fly && sprint) speed = 18;
    if(this.status.has("speed") && !fly) speed*=1.25;
    const dx = (-Math.sin(this.yaw) * f + Math.cos(this.yaw) * r) * speed,
      dz = (-Math.cos(this.yaw) * f - Math.sin(this.yaw) * r) * speed;
    v.x += (dx - v.x) * Math.min(1, dt * 12);
    v.z += (dz - v.z) * Math.min(1, dt * 12);
    const ladder = idOf(this.world.get(p.x, p.y, p.z)) === B.Ladder;
    if (fly) v.y = control.verticalIntent * speed;
    else if (ladder) v.y = this.input.held("jump") || f > 0 ? 3 : crouch ? 0 : -1;
    else {
      v.y = Math.max(water ? -4 : -38, v.y - (water ? 5 : 24) * dt);
      if (this.jumpRequest && this.body.grounded) v.y = 8.2;
      if (water && this.input.held("jump")) v.y = 4;
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
    if ((this.input.held("secondary") || this.useRequest) && this.cooldown<=0) {this.useRequest=false;this.use();}
    if (
      (this.input.held("primary") || this.input.pressed("primary")) &&
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
    this.input.consumeTick();
    this.simulation.radius=this.settings.simulationDistance*16;
    this.entities.radius=this.settings.simulationDistance*16;
    this.simulation.automation.containers=this.containers;
    this.simulation.automation.drops=this.entities.drops;
    this.simulation.occupants=this.entities.occupantPositions;
    const simulationStarted=performance.now();
    this.simulation.tick(dt, p, this.mode !== "spectator");
    this.view.metrics.add("simulation",performance.now()-simulationStarted);
    const tradeActor=this.tradeEntity;
    this.entities.interactingId=this.ui.screen==="trade" && tradeActor &&
      this.entities.canInteractWith(tradeActor,this.body.position,5) ? tradeActor.id : "";
    this.entities.weather = this.simulation.weather;
    const entitiesStarted=performance.now();
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
    this.view.metrics.add("entities",performance.now()-entitiesStarted);
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
    if(this.disposed)return;
    const inputElapsed=this.lastInputTime?Math.min(.2,Math.max(0,(t-this.lastInputTime)/1000)):0;
    this.lastInputTime=t;
    if(document.hidden||this.view.contextLost){
      this.framePacer.ready(t,"hidden");if(this.framePacer.transitioned){this.input.clear();this.adaptive.suspend();}
      this.lastTime=0;this.lastFrameWorkMs=0;this.accumulator=0;this.scheduleFrame();return;
    }
    this.input.poll(inputElapsed);
    this.ui.touchControls?.setGameplay(this.active && !this.dead && !this.travelState && this.ui.screen === "none" && this.input.state.context === "gameplay", this.mode);
    const simulating=this.active&&!this.dead&&["none","inventory","craft","chest","furnace","trade","enchant","brew","anvil","hopper"].includes(this.ui.screen);
    const distant=this.view.distant;
    const backgroundWorkPending=hasFrameBackgroundWork(this.world.dirty.size>0,this.world.pending.size>0,
      this.lighting.pending,!!distant?.group.visible,!!distant?.stats.ready);
    const urgentRedraw=frameUrgent(this.active,this.view.needsDrawingUpdate,backgroundWorkPending);
    if(!this.framePacer.ready(t,simulating?"playing":"paused",this.settings.frameRateLimit,urgentRedraw)){
      this.scheduleFrame();return;
    }
    if(this.framePacer.transitioned){this.lastTime=0;this.lastFrameWorkMs=0;this.accumulator=0;this.adaptive.suspend();}
    const frameWorkStarted=performance.now();
    const elapsed=this.lastTime ? t-this.lastTime : 0;
    if(elapsed) this.view.metrics.add("frame",elapsed);
    const dt = Math.min(0.2, elapsed/1000);
    this.lastTime = t;
    this.frameCount++;
    if(this.travelState) {
      // Travel is not an active-play measurement window. Discard the old
      // district's samples so arrival starts with a clean adaptive warmup.
      this.adaptive.suspend();
      // Keep the last frame behind the preparation panel. Spending this time
      // on the old district's meshes/GPU/lighting delays collision readiness.
      this.accumulator=0;this.lastFrameWorkMs=0;this.scheduleFrame();return;
    }
    if (t - this.fpsTime > 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (t - this.fpsTime));
      this.frameCount = 0;
      this.fpsTime = t;
      const gameplay = this.active && this.ui.screen === "none" && !this.dead && !this.travelState;
      if (gameplay) {
        const advice = this.performanceAdvisor.sample(this.fps, this.settings.graphicsQuality, true, t);
        if (advice === "recovered") {
          this.performanceRecommendation = null;
          this.performanceRecommendationFps = 0;
          this.ui.hidePerformanceAdvisor();
        } else if (advice) {
          this.performanceRecommendation = advice;
          this.performanceRecommendationFps = this.fps;
          this.ui.showPerformanceAdvisor(this.settings.graphicsQuality, advice, this.fps);
        }
      }
    }
    const p = this.body.position;
    const streamStarted=performance.now();
    const evicted=this.world.stream(
      this.active ? p.x : 0,
      this.active ? p.z : 0,
      this.settings.distance,
      this.yaw,
    );
    this.view.metrics.add("worldStream",performance.now()-streamStarted);
    const evictionStarted=performance.now();
    if(evicted.length)this.lighting.pruneUnloaded(evicted);
    for(const key of evicted)this.view.remove(key);
    this.view.metrics.add("worldEviction",performance.now()-evictionStarted);
    const targetFrameMs=1000/Math.max(1,this.framePacer.targetFps||60);
    const frameHeadroomMs=Math.max(0,targetFrameMs-this.lastFrameWorkMs);
    this.view.setMeshAdmissionHeadroom(frameHeadroomMs);
    const meshQueueStarted=performance.now();
    this.view.rebuild(this.world, 6);
    this.view.metrics.add("meshQueue",performance.now()-meshQueueStarted);
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
      const heldSwing = this.input.held("primary") ? Math.sin(t * 0.022) * 0.18 : 0;
      this.view.hand.rotation.x = -0.12 - heldSwing + heldSway * 0.012;
      this.view.hand.rotation.z = -0.26 + Math.sin(t * 0.0021) * 0.01;
      this.view.hand.position.y = -0.64 + heldSway * 0.005;
      this.view.environment(this.time, this.simulation.weather === "rain",this.status.has("night_vision"),dt);
      const actorRenderStarted=performance.now();
      this.entityView.update(this.entities, t / 1000,this.view.camera,this.view.graphicsProfile);
      this.view.metrics.add("actorRender",performance.now()-actorRenderStarted);
      const effectsStarted=performance.now();
      this.effects.update(dt, p, this.view.atmosphere.rain*this.view.rainExposure, t / 1000);
      this.view.metrics.add("effects",performance.now()-effectsStarted);
      if (
        this.lighting.pending || this.lighting.needsUpdate ||
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
        const debugInspectStarted = this.debug ? performance.now() : 0;
        const geography = this.debug ? this.world.inspectTerrain(p.x, p.z) : undefined;
        const architecture = this.debug ? this.world.inspectDistrict(p.x,p.z) : undefined;
        const landmarkDebug = this.debug ? this.world.inspectLandmark(p.x,p.z) : undefined;
        const urbanDebug = architecture ? `\n${architecture.district?.name ?? "Outside districts"} · ${architecture.road?.kind ?? "off street"} · ${architecture.lot?.archetype ?? "open space"} / ${architecture.lot?.roofFamily ?? "—"} / ${architecture.lot?.facade ?? "—"}` : "";
        if (this.debug) this.view.metrics.add("debugInspect", performance.now() - debugInspectStarted);
        const hudStarted=performance.now();
        const debugHudStarted = this.debug ? performance.now() : 0;
        const metricSnapshot = this.debug ? this.view.metrics.snapshot() : undefined;
        const metricFormat = (name: string) => {
          const value = metricSnapshot?.[name];
          return value ? `${value.p50.toFixed(2)}/${value.p95.toFixed(2)}/${value.max.toFixed(2)}` : "0.00/0.00/0.00";
        };
        const queue = this.view.meshQueueStats;
        let loadedDataSections = 0;
        if (this.debug) for (const chunk of this.world.chunks.values()) loadedDataSections += chunk.blocks.sections.size;
        const f3OnFrame = metricSnapshot?.["frameWork.f3On"];
        const f3OffFrame = metricSnapshot?.["frameWork.f3Off"];
        const f3OnSubmit = metricSnapshot?.["renderSubmit.f3On"];
        const f3OffSubmit = metricSnapshot?.["renderSubmit.f3Off"];
        const signedDelta = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
        const f3Comparison = f3OnFrame && f3OffFrame && f3OnSubmit && f3OffSubmit &&
          f3OnFrame.count >= 24 && f3OffFrame.count >= 24 &&
          f3OnSubmit.count >= 24 && f3OffSubmit.count >= 24
          ? `F3 A/B p50 Δ frame ${signedDelta(f3OnFrame.p50 - f3OffFrame.p50)} ms · submit ${signedDelta(f3OnSubmit.p50 - f3OffSubmit.p50)} ms · p95 frame ${signedDelta(f3OnFrame.p95 - f3OffFrame.p95)} ms · n ${f3OnFrame.count}/${f3OffFrame.count}`
          : `F3 A/B collecting · frame n ${f3OnFrame?.count ?? 0}/${f3OffFrame?.count ?? 0} · submit n ${f3OnSubmit?.count ?? 0}/${f3OffSubmit?.count ?? 0} (need 24 each)`;
        const subsystemTiming =
          `CPU p50/p95/max ms: stream ${metricFormat("worldStream")} · evict ${metricFormat("worldEviction")} · meshQ ${metricFormat("meshQueue")} · mesh ${metricFormat("mesh")} · commit ${metricFormat("meshCommit")} · generation ${metricFormat("generation")}\n` +
          `CPU p50/p95/max ms: sim ${metricFormat("simulation")} · tick ${metricFormat("tick")} · entities ${metricFormat("entities")} · actors ${metricFormat("actorRender")}\n` +
          `CPU p50/p95/max ms: lighting ${metricFormat("lighting")} · effects ${metricFormat("effects")} · atmosphere ${metricFormat("atmosphere")} · distant ${metricFormat("distant")} · submit ${metricFormat("renderSubmit")}\n` +
          `CPU p50/p95/max ms: frameWork ${metricFormat("frameWork")} · F3 inspect ${metricFormat("debugInspect")} · F3 HUD ${metricFormat("debugHud")} · GPU ${metricFormat("gpuRender")}`;
        const worldReadiness = queue.scanComplete
          ? `visible ${queue.visibleReady}/${queue.visibleQueued} ready (${(queue.visibleWorldProgress*100).toFixed(0)}%) · background ${queue.backgroundReady}/${queue.backgroundQueued}`
          : `visible readiness scanning · ${queue.scanRemaining} dirty keys undiscovered`;
        const streaming=this.world.streamingDiagnostics;
        const queueDebug =
          `Sections data ${loadedDataSections} · meshed ${queue.meshed} · non-empty groups ${queue.renderedSections} · deferred ${queue.deferred}\n` +
          `Visible mesh readiness ${queue.visibleWorldReady ? "READY" : worldReadiness} · pending visible ${queue.visiblePending} / background ${queue.backgroundPending}\n` +
          `Mesh queue ${queue.queuedBefore}→${queue.queuedAfter} dirty · ${queue.eligible}/${queue.scanned} eligible/scanned · ${queue.scanComplete ? "scan complete" : `scan pending ${queue.scanRemaining}`} · remesh ${queue.dirtyRemesh} · first ${queue.dirtyFirstBuild} · built ${queue.processed} (${queue.rendered} non-empty/${queue.empty} empty) · max section ${queue.maxSectionMs.toFixed(2)} ms · backlog ${queue.queueAgeMs.toFixed(0)} ms\n` +
          `Admission ${queue.admissionBacklog} pending (peak ${queue.admissionBacklogHighWater}) · ${queue.admittedThisFrame}/${queue.admissionLimit} keys · ${queue.admissionTimeMs.toFixed(2)} / ${queue.admissionBudgetMs.toFixed(2)} ms · headroom ${queue.admissionHeadroomMs.toFixed(1)} ms · cost ${queue.admissionCostMsPerKey.toFixed(4)} ms/key\n` +
          `Mesh pressure ${queue.queuedCandidates} queued candidates · ${queue.activeSections} active sections · ${queue.activeJobs} jobs / ${queue.pendingCommits} commits · active work ${queue.activeMeshingMs.toFixed(2)}/${queue.meshBudgetMs.toFixed(2)} ms · admission pressure ${(queue.admissionPressure*100).toFixed(0)}%\n` +
          `Mesh memory: ${queue.sectionCoordinateCache} coordinate records · ${queue.candidatePoolCapacity} reusable candidate slots`;
        const debugText = this.debug
          ? `${this.view.graphicsDebug()}\nResidents rendered ${this.entityView.stats.full}/${this.entityView.stats.mid}/${this.entityView.stats.far} full/mid/far · ${this.entityView.stats.culled} culled\n${geography?.region ?? "terrain unavailable"} · ${geography?.reservation ?? "no landmark reserve"}\n${geography ? `Slope ${geography.slope.toFixed(2)} · buildable ${geography.buildable} · plan ${geography.planMs.toFixed(1)} ms / ${this.world.planCount} active` : "Terrain data unavailable"}\n${urbanDebug}${landmarkDebug ? `\n${landmarkDebug.name} · ${landmarkDebug.reservation.id}` : ""}\n${this.fps} FPS · target 20 TPS\nFrame p50/p95/p99 ${metricSnapshot?.frame?.p50.toFixed(1) ?? "0.0"}/${metricSnapshot?.frame?.p95.toFixed(1) ?? "0.0"}/${metricSnapshot?.frame?.p99.toFixed(1) ?? "0.0"} ms · adaptive ${this.adaptive.state} ${(this.adaptive.scale*100).toFixed(0)}% · ${this.adaptive.bottleneck} · ${this.adaptive.decision} · target ${this.framePacer.targetFps||"display"} FPS · tick p95 ${metricSnapshot?.tick?.p95.toFixed(1) ?? "0.0"} ms\n${this.world.chunks.size} chunks · ${this.world.pending.size} generating · dirty ${this.world.dirty.size} mesh queue\nStreaming ${streaming.streamFrames} frames · ${streaming.streamRequests} requests · ${streaming.streamEvictions} evictions · preempt ${streaming.workerPreemptions}\nWorker queue ${streaming.workerQueued} / peak ${streaming.workerQueueHighWater} · pending peak ${streaming.pendingHighWater} · pruned ${streaming.workerQueuePruned} · wait avg/max ${streaming.workerQueueWaitAverageMs.toFixed(1)}/${streaming.workerQueueWaitMaxMs.toFixed(1)} ms · oldest ${streaming.oldestQueuedAgeMs.toFixed(1)} ms · active ${streaming.workerBusyAgeMs.toFixed(1)} ms\n${queueDebug}\n${this.view.worldRenderStats.triangles} triangles · ${this.view.worldRenderStats.calls} draws · ${this.view.renderer.info.memory.geometries} geometries\n${this.view.renderAuditDebug()}\n${this.view.renderAuditUntrackedDebug(t)}\n${subsystemTiming}\n${f3Comparison}\n${this.entities.list.length} entities · ${this.entities.life?.metrics.active ?? "inactive"} active residents · ${this.entities.navigation.agents.size} routes / ${this.entities.navigation.expandedLastTick} nodes\nLife ${this.entities.life?.metrics.scheduleMs.toFixed(2) ?? "0"} ms · nav ${this.entities.navigation.solveMs.toFixed(2)} ms · ${this.entities.life?.event?.title ?? "no gathering"}\n${this.view.atmosphere.phase} · fog ${this.view.atmosphere.fogNear.toFixed(0)}/${this.view.atmosphere.fogFar.toFixed(0)} · LOD ${this.view.distant?.stats.terrainTriangles??0}+${this.view.distant?.stats.waterTriangles??0}+${this.view.distant?.stats.anchorTriangles??0} triangles · proxy terrain ${this.view.distant?.stats.terrainReady?"ready":"building"} / anchors ${this.view.distant?.stats.anchorsReady?"ready":"building"}\n${this.world.evictionBlocked} pinned unsaved chunks\nCPU block arrays ~${([...this.world.chunks.values()].reduce((n,c)=>n+c.blocks.byteLength,0)/1048576).toFixed(1)} MiB (excludes GPU/heap)\n${this.world.edits.size} edits · save rev ${this.saveRevision} · ${this.meta.seed}`
          : "";
        this.ui.updateHUD(this.inventory, {
          name: this.meta.name,
          mode: this.mode,
          biome: biomeAt(p.x, p.z, seedNumber(this.meta.seed)),
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
          debug: debugText,
        });
        this.view.metrics.add("hud",performance.now()-hudStarted);
        if (this.debug) this.view.metrics.add("debugHud", performance.now() - debugHudStarted);
      }
      if (t - this.lastAuto > 8000 && !this.saveConflicted) {
        this.lastAuto = t;
        void this.save();
      }
    } else {
      this.view.target(null);
      this.view.environment(0.23);
      const actorRenderStarted=performance.now();
      this.entityView.update(this.entities, t / 1000,this.view.camera,this.view.graphicsProfile);
      this.view.metrics.add("actorRender",performance.now()-actorRenderStarted);
      if (
        this.lighting.pending || this.lighting.needsUpdate ||
        (t - this.lastLighting > 2000 && this.world.pending.size === 0)
      ) {
        if (!this.lighting.pending) this.lastLighting = t;
        const started=performance.now();
        this.lighting.update(4);
        this.view.metrics.add("lighting",performance.now()-started);
      }
    }
    if(this.active)this.view.updateDistant(this.world);
    this.view.setRenderAuditEnabled(this.debug);
    const drawStarted=performance.now();
    this.view.render();
    const renderCpu=performance.now()-drawStarted;
    this.view.metrics.add("renderSubmit",renderCpu);
    const debugBenchmarkActive = this.active && !this.dead && this.ui.screen === "none" &&
      !this.travelState && !this.view.contextLost;
    if (debugBenchmarkActive)
      this.view.metrics.add(this.debug ? "renderSubmit.f3On" : "renderSubmit.f3Off", renderCpu);
    const gpuSample=this.view.consumeGpuTiming();
    if(gpuSample)this.view.metrics.add("gpuRender",gpuSample.timeMs);
    const cpu=performance.now()-frameWorkStarted;
    this.lastFrameWorkMs=cpu;
    this.view.metrics.add("frameWork",cpu);
    if (debugBenchmarkActive)
      this.view.metrics.add(this.debug ? "frameWork.f3On" : "frameWork.f3Off",cpu);
    // Observe the complete active-play workload, including chunk generation,
    // dirty-mesh rebuilds and distant-world preparation. Those periods are
    // precisely when frame pacing must remain visible to the controller.
    // Menus, death, travel and context loss remain excluded and reset warmup.
    const adaptiveGameplay=this.active&&!this.dead&&this.ui.screen==="none"&&!this.travelState&&!this.view.contextLost;
    if(adaptiveGameplay)this.view.setResolutionScale(this.adaptive.observe(t,elapsed,cpu,renderCpu,gpuSample?.timeMs??null,this.framePacer.targetFps));
    else this.adaptive.suspend();
    this.scheduleFrame();
  }
}
