import type { Vec3 } from "../../core/coords";
import { distance } from "../../core/coords";
import type { World } from "../../world/world";
import type { Entity } from "../entities";
import { standAt, type Navigation } from "../navigation/pathfinder";
import { CITY_LIFE_BUDGET, createPopulation, type PopulationPlan } from "./population";
import { clockHour, identityHash, scheduleAt, type Activity, type SchedulePhase } from "./schedules";
import { activityRoute } from "./routes";
import { circuitStart } from "./presence";
import type { ResidentPlan } from "./population";
import { nearestRoadPoint } from "../../world/metropolis/plan";
import type { TaskAction, TaskNode } from "./purpose";

export type ResidentState = { phase: SchedulePhase; activity: Activity; target: Vec3; tier: "near" | "mid" | "far";
  failures: number; fallbackUntil: number; lastFailure: number; routeIndex: number; route: readonly Vec3[]; intentKey: string;
  circuitIndex?: number; circuitStep?: number; pauseUntil?: number; arrived?: boolean;
  taskIndex?:number;taskActing?:boolean;taskAction?:TaskAction;taskFocus?:Vec3;actionPlace?:TaskNode["place"];completedActions?:number };
export type MicroEvent = { id: string; title: string; participants: string[]; slots: Map<string, Vec3> };
export type LifeMetrics = { updates: number; scheduleMs: number; eventMs: number; active: number; mid: number; far: number; relocations: number; fallbacks: number };
const EVENT_RULES = [
  { id: "market-break", title: "Market midday break", district: "market", start: 12, end: 13.5 },
  { id: "plaza-evening", title: "Panda Plaza evening gathering", district: "heritage", start: 17, end: 19.5 },
  { id: "tea-evening", title: "Evening tea gathering", district: "nightlife", start: 19, end: 22.5 },
  { id: "dock-start", title: "Harbor morning work group", district: "harbor", start: 7, end: 9 },
] as const;
/** Validate authored positions against loaded collision geometry. No generation,
 * world scan or broad top-down search; edited/unsupported anchors fail closed. */
export function safeActivityPoint(world: World, point: Vec3): Vec3 | undefined {
  for (const [dx, dz] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1], [-2, 0], [2, 0], [0, -2], [0, 2]]) {
    const p = standAt(world, Math.floor(point.x) + .5 + dx, Math.floor(point.z) + .5 + dz, point.y);
    if (p) return p;
  }
}
export class CityLife {
  plan?: PopulationPlan;
  states = new Map<string, ResidentState>();
  active = new Set<string>();
  event?: MicroEvent;
  metrics: LifeMetrics = { updates: 0, scheduleMs: 0, eventMs: 0, active: 0, mid: 0, far: 0, relocations: 0, fallbacks: 0 };
  private nextUpdate = 0;
  private lastTime = NaN;
  private taskActors:Entity[]=[];
  private nextTaskUpdate=0;
  purposeMetrics={completedActions:0,updates:0};
  reactivate() { this.nextUpdate=0;this.nextTaskUpdate=0;this.taskActors=[];this.active.clear(); }
  constructor(private world?: World) { if (world) this.plan = createPopulation(world); }
  prepare(list: Entity[], player: Vec3, time: number, rain: boolean, elapsed: number, nav: Navigation) {
    const world = this.world, plan = this.plan;
    if (!world || !plan) return;
    // Coarse schedules; movement still runs at the existing fixed tick. Time
    // jumps invalidate immediately without replaying missed ticks.
    if (elapsed < this.nextUpdate && Math.abs(time - this.lastTime) < .01) {
      if(world.generatorVersion>=10&&elapsed>=this.nextTaskUpdate) {
        this.nextTaskUpdate=elapsed+.2;this.purposeMetrics.updates++;
        for(const e of this.taskActors) {
          const r=plan.byId.get(e.id),s=this.states.get(e.id);
          if(e.health>0&&r?.task&&s?.intentKey.includes(":task:"))this.choreograph(r,s,e,elapsed,nav,world);
        }
      }
      return;
    }
    this.nextUpdate = elapsed + CITY_LIFE_BUDGET.scheduleSeconds; this.lastTime = time;
    this.metrics.updates++;
    const started = performance.now(), candidates: Entity[] = [];
    this.metrics.mid = this.metrics.far = 0;
    for (const e of list) {
      if (e.kind !== "villager" || e.health <= 0) continue;
      const r = plan.byId.get(e.id), schedule = r ? scheduleAt(r.id, r.profession, r.district, time, rain) : undefined;
      if (r && schedule) {
        let s = this.states.get(e.id);
        if (!s) { s = { phase: schedule.phase, activity: schedule.activity, target: r.workplace, tier: "far", failures: 0,
          fallbackUntil: 0, lastFailure: -Infinity, routeIndex: 0, route: [], intentKey: "" }; this.states.set(e.id, s); }
        s.phase = schedule.phase; s.activity = schedule.activity;
        const base = r.circuit && schedule.destination !== "home" ? r.circuit.points[circuitStart(r.id, time, r.circuit.points.length)] : schedule.destination === "home" ? r.home : schedule.destination === "public" ? r.public : r.workplace;
        // Unloaded actors advance logically. Never reposition an actor already
        // loaded/near the player, and never create voxels for a remote schedule.
        if (!world.loaded(e.body.position.x, e.body.position.z) && distance(e.body.position, player) > 96 &&
          distance(base, player) <= CITY_LIFE_BUDGET.activationRadius && distance(base, player) > (plan.presence ? 24 : 10)) {
          const p = safeActivityPoint(world, base);
          if (p) { e.body.position = { ...p }; e.body.velocity = { x: 0, y: 0, z: 0 }; e.body.fallStart = p.y;
            nav.agents.delete(e.id); s.circuitIndex = undefined; s.arrived = false; this.metrics.relocations++; }
        }
        const d = distance(e.body.position, player);
        s.tier = d <= 64 && world.loaded(e.body.position.x, e.body.position.z) ? "near" : d <= 96 ? "mid" : "far";
        if (s.tier === "mid") this.metrics.mid++; else if (s.tier === "far") this.metrics.far++;
      }
      if (world.loaded(e.body.position.x, e.body.position.z) && distance(e.body.position, player) <= 64) candidates.push(e);
    }
    // Keep nearby interaction targets first, then spend v8's finite detailed
    // budget on the public streets/entries/courts. Dense interiors otherwise
    // consume the whole cap while their surrounding pedestrians stand frozen.
    // This uses real address geometry, never the camera or a visibility test.
    const publicCells = new Map<string, boolean>(), urban = world.generatorVersion >= 8 ? world.metropolisPlan : undefined;
    const priority = new Map<string, number>();
    for (const e of candidates) {
      const p=e.body.position,d=distance(p,player);
      let score=d;
      if(urban && d>12) {
        const key=`${Math.floor(p.x)},${Math.round(p.y*2)},${Math.floor(p.z)}`;
        let outside=publicCells.get(key);
        if(outside===undefined) {
          const panda=urban.panda;
          outside=p.x>=panda.x1&&p.x<=panda.x2&&p.z>=panda.z1&&p.z<=panda.z2&&Math.abs(p.y-21)<2 ||
            (urban.roadsByChunk.get(`${Math.floor(p.x/16)},${Math.floor(p.z/16)}`)??[]).some(r=>{const q=nearestRoadPoint(r,p.x,p.z);return q.distance<=r.half+.7&&Math.abs(p.y-q.y-1)<2.5;});
          publicCells.set(key,outside);
        }
        if(outside)score-=80;
      } else if(urban)score-=200;
      priority.set(e.id,score);
    }
    candidates.sort((a, b) => priority.get(a.id)!-priority.get(b.id)! || (a.id < b.id ? -1 : 1));
    this.active = new Set(candidates.slice(0, plan.presence?.active ?? CITY_LIFE_BUDGET.active).map(e => e.id)); this.metrics.active = this.active.size;
    this.taskActors=world.generatorVersion>=10?candidates.filter(e=>this.active.has(e.id)):[];
    const eventStart = performance.now(); this.event = undefined;
    if (!rain) for (const rule of EVENT_RULES) {
      const hour = clockHour(time), space = plan.spaces.find(s => s.district === rule.district);
      if (hour < rule.start || hour >= rule.end || !space || distance(space.position, player) > 64 || !world.loaded(space.position.x, space.position.z)) continue;
      const eligible = candidates.filter(e => this.active.has(e.id) && plan.byId.get(e.id)?.district === rule.district && distance(e.body.position, space.position) < 64).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0).slice(0, CITY_LIFE_BUDGET.participants);
      const slots = new Map<string, Vec3>();
      eligible.forEach((e, i) => { const p = safeActivityPoint(world, space.slots[i]); if (p) slots.set(e.id, p); });
      if (slots.size >= 2) { this.event = { id: rule.id, title: rule.title, participants: [...slots.keys()], slots }; break; }
    }
    this.metrics.eventMs = performance.now() - eventStart;
    for (const e of candidates) {
      const r = plan.byId.get(e.id), s = this.states.get(e.id); if (!r || !s || !this.active.has(e.id)) continue;
      const schedule = scheduleAt(r.id, r.profession, r.district, time, rain);
      const cycle = Math.floor((time * 1200 + identityHash(e.id) % 17) / 24);
      const eventPoint = this.event?.slots.get(e.id);
      const rainShelter=rain && r.circuit?.routine==="social";
      if(r.task&&schedule.destination!=="home"&&!eventPoint&&!rainShelter) {
        this.choreograph(r,s,e,elapsed,nav,world);continue;
      }
      s.taskActing=false;s.taskAction=undefined;
      if (r.circuit && schedule.destination !== "home" && !eventPoint && !rainShelter) {
        this.circulate(r, s, e, elapsed, nav, world, player);
        continue;
      }
      const publicGoal = r.landmark || r.district === "heritage" ? r.workLoop[cycle % r.workLoop.length] : { ...r.public, x: r.public.x + (cycle % 2 ? 2 : 0) };
      let desired = eventPoint ?? (rainShelter || schedule.destination === "home" ? r.home : schedule.destination === "public" ? publicGoal : r.workLoop[cycle % r.workLoop.length]);
      if(rainShelter)s.activity="resting";
      const previousStatus = nav.agents.get(e.id)?.status;
      // Finish a local trip before selecting another clock-offset loop point.
      // Phase changes and event participation may still preempt it immediately.
      if (!eventPoint && s.intentKey.startsWith(`${schedule.phase}:${schedule.destination}:`) && s.route.length &&
        (previousStatus === "ready" || previousStatus === "searching")) desired = s.route[s.route.length - 1];
      if (eventPoint) s.activity = "gathering";
      const status = nav.agents.get(e.id)?.status;
      if (status === "blocked" && elapsed - s.lastFailure >= 3) { s.failures++; s.lastFailure = elapsed; }
      if (s.failures >= 3) { s.fallbackUntil = elapsed + 20; s.failures = 0; this.metrics.fallbacks++; }
      const key = `${schedule.phase}:${schedule.destination}:${Math.floor(desired.x)},${desired.y},${Math.floor(desired.z)}`;
      if (key !== s.intentKey && elapsed >= s.fallbackUntil) {
        s.intentKey = key; s.routeIndex = 0; s.route = activityRoute(world,e.body.position,desired,r.landmark); s.failures = 0;
      }
      while (s.routeIndex < s.route.length - 1 && distance(e.body.position, s.route[s.routeIndex]) < 1.2) s.routeIndex++;
      const point = safeActivityPoint(world, s.route[s.routeIndex] ?? desired);
      if (elapsed < s.fallbackUntil || !point) {
        // Abandon an optional activity locally. Do not teleport through edits.
        s.target = safeActivityPoint(world, e.body.position) ?? { ...e.body.position }; s.activity = "resting";
        s.route = []; s.intentKey = "fallback"; continue;
      }
      s.target = point;
    }
    this.metrics.scheduleMs = performance.now() - started;
  }
  private choreograph(r:ResidentPlan,s:ResidentState,e:Entity,elapsed:number,nav:Navigation,world:World) {
    const task=r.task!,nodes=task.nodes,p=e.body.position;
    if(s.taskIndex===undefined||!s.intentKey.includes(":task:")) {
      s.taskIndex=nodes.reduce((best,n,i)=>distance(n.position,p)<distance(nodes[best].position,p)?i:best,0);
      s.taskActing=false;s.pauseUntil=0;
    }
    const advance=()=>{s.taskIndex=(s.taskIndex!+1)%nodes.length;s.taskActing=false;s.taskAction=undefined;s.pauseUntil=0;};
    let node=nodes[s.taskIndex!];
    if(nav.agents.get(e.id)?.status==="blocked"&&elapsed-s.lastFailure>=2) {
      s.lastFailure=elapsed;s.failures++;
      if(s.failures>=2){advance();node=nodes[s.taskIndex!];s.failures=0;this.metrics.fallbacks++;}
    }
    const point=safeActivityPoint(world,node.position);
    if(!point) {
      s.taskActing=false;s.taskAction=undefined;s.target=safeActivityPoint(world,p)??{...p};s.activity="resting";
      if(elapsed-s.lastFailure>=1){s.lastFailure=elapsed;advance();}
      s.intentKey=`${s.phase}:task:${s.taskIndex}`;return;
    }
    if(distance(p,point)<.85) {
      if(!s.taskActing) {
        s.taskActing=true;s.taskAction=node.action;s.actionPlace=node.place;s.taskFocus=node.focus;
        s.pauseUntil=elapsed+node.seconds;s.completedActions=(s.completedActions??0)+1;this.purposeMetrics.completedActions++;
      }
      if(elapsed>=(s.pauseUntil??0)){advance();node=nodes[s.taskIndex!];}
    } else {s.taskActing=false;s.taskAction=undefined;}
    s.target=safeActivityPoint(world,node.position)??point;s.route=[s.target];s.routeIndex=0;
    s.intentKey=`${s.phase}:task:${s.taskIndex}`;
    s.activity=task.category==="patrol"?"guarding":task.category==="social"?"gathering":task.category==="work"?"working":task.category==="commerce"?"browsing":"sightseeing";
  }
  private circulate(r: ResidentPlan, s: ResidentState, e: Entity, elapsed: number, nav: Navigation, world: World, player: Vec3) {
    const c = r.circuit!, points = c.points, count = points.length, position = e.body.position;
    if (s.circuitIndex === undefined || !s.intentKey.includes(":circuit:")) {
      let best = Infinity; points.forEach((p, i) => { const d = distance(p, position); if (d < best) { best = d; s.circuitIndex = i; } });
      s.circuitStep = 1; s.arrived = false;
    }
    const advance = () => { s.circuitIndex = (s.circuitIndex! + (s.circuitStep ?? 1) + count) % count; s.arrived = false; s.pauseUntil = 0; };
    const status = nav.agents.get(e.id)?.status;
    if (status === "blocked" && elapsed - s.lastFailure >= 3) {
      s.lastFailure = elapsed; s.failures++;
      if (s.failures >= 2) { s.circuitStep = -(s.circuitStep ?? 1); advance(); s.failures = 0; s.fallbackUntil = elapsed + 2; this.metrics.fallbacks++; }
    }
    let goal = points[s.circuitIndex!];
    if(distance(goal,player)<1.2 && distance(position,goal)<4){advance();goal=points[s.circuitIndex!];}
    if (distance(position, goal) < .85 || status === "arrived") {
      if (!s.arrived) { const pause=c.dwellPoints?(c.dwellPoints.includes(s.circuitIndex!)?c.dwell:.15):c.dwell; s.pauseUntil = elapsed + (world.generatorVersion>=9 ? pause+(c.dwellPoints?.includes(s.circuitIndex!)?(identityHash(r.id)%5)/10:0) : pause+(identityHash(r.id) % 11) / 10); s.arrived = true; }
      if (elapsed >= (s.pauseUntil ?? 0)) { advance(); goal = points[s.circuitIndex!]; }
    }
    if (!world.loaded(goal.x, goal.z)) { s.circuitStep = -(s.circuitStep ?? 1); advance(); goal = points[s.circuitIndex!]; }
    const point = safeActivityPoint(world, goal);
    if (!point || elapsed < s.fallbackUntil) {
      s.target = safeActivityPoint(world, position) ?? { ...position }; s.activity = "resting";
      if (!point && elapsed - s.lastFailure >= 2) { s.lastFailure = elapsed; advance(); }
      return;
    }
    s.target = point; s.route = [point]; s.routeIndex = 0; s.intentKey = `${s.phase}:circuit:${s.circuitIndex}`;
    s.activity = c.routine === "work" ? "working" : c.routine === "patrol" ? "guarding" : c.routine === "social" ? "gathering" : r.district === "scholar" || r.landmark ? "sightseeing" : "browsing";
  }
  facing(id: string, position: Vec3, elapsed: number) {
    const r = this.plan?.byId.get(id); if (!r?.circuit) return;
    const s=this.states.get(id);let focus=s?.taskActing&&s.taskFocus?s.taskFocus:r.circuit.focus;
    if(r.task?.group&&s?.taskActing) {
      const other=this.taskActors.find(e=>e.id!==id&&this.plan?.byId.get(e.id)?.task?.group===r.task!.group&&this.states.get(e.id)?.taskActing&&distance(e.body.position,position)<6&&distance(e.body.position,position)>.6);
      if(other)focus=other.body.position;
    }
    return Math.atan2(focus.x - position.x, focus.z - position.z) + Math.sin(elapsed * .7 + identityHash(id) % 31) * .12;
  }
  goal(id: string) { return this.states.get(id)?.target; }
  description(id: string) {
    const r = this.plan?.byId.get(id), s = this.states.get(id);
    if (!r) return "";
    const flavor = r.landmark ? "A quiet stop on the landmark trail." : r.district === "market" ? "The stalls keep their own daily rhythm." : r.district === "harbor" ? "Work begins early along the quay." : r.district === "nightlife" ? "Tea and conversation continue into the evening." : r.district === "scholar" ? "There is time for a short garden walk." : "There is always another lane to explore.";
    return r.task?`${r.task.role} · ${s?.taskActing?s.taskAction:s?.activity??"local circulation"} · ${r.district}. ${flavor}`:`${s?.activity ?? "resting"} · ${r.district}. ${flavor}`;
  }
  dispose() { this.world = undefined; this.plan = undefined; this.states.clear(); this.active.clear(); this.taskActors=[];this.event = undefined; }
}
