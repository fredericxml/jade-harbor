import type { Vec3 } from "../../core/coords";
import type { World } from "../../world/world";
import { nearestRoadPoint, type UrbanLot, type UrbanRoad } from "../../world/metropolis/plan";
import type { DistrictId } from "../../world/metropolis/districts";
import { contains, inCity } from "../../world/city/plan";
import { cityElevation } from "../../world/geography/terrain";
import type { MacroPlan } from "../../world/geography/plan";
import { buildingPoint, PROFESSIONS, type Profession } from "../professions";
import { identityHash } from "./schedules";
import type { PopulationPlan, ResidentPlan } from "./population";
import { addStreetLife } from "./street-life";
import type { FabricPlan } from "../../world/metropolis/fabric";

export const PRESENCE_BUDGET = { residents: 960, active: 48, saveEntities: 1024, activationRadius: 80, scheduleSeconds: 1 } as const;
export type Routine = "circulation" | "work" | "patrol" | "social";
export type Circuit = { points: Vec3[]; routine: Routine; dwell: number; focus: Vec3; dwellPoints?: number[]; pace?: number };
export const DISTRICT_PRESENCE: Record<DistrictId, { cell: number; people: number; worker: readonly Profession[]; dwell: number; reach: number }> = {
  heritage: { cell: 48, people: 6, worker: ["merchant", "attendant"], dwell: 3, reach: 8 },
  market: { cell: 48, people: 7, worker: ["merchant", "chef"], dwell: 4, reach: 4 },
  hutong: { cell: 56, people: 5, worker: ["resident", "carpenter"], dwell: 3, reach: 4 },
  "water-town": { cell: 48, people: 5, worker: ["fisherman", "chef"], dwell: 4, reach: 6 },
  imperial: { cell: 56, people: 5, worker: ["attendant", "guard"], dwell: 4, reach: 8 },
  harbor: { cell: 48, people: 6, worker: ["dock_worker", "fisherman"], dwell: 2, reach: 6 },
  artisan: { cell: 56, people: 6, worker: ["potter", "carpenter", "blacksmith"], dwell: 3, reach: 6 },
  scholar: { cell: 56, people: 5, worker: ["scholar", "caretaker"], dwell: 4, reach: 6 },
  nightlife: { cell: 48, people: 7, worker: ["chef", "merchant"], dwell: 3, reach: 6 },
  highland: { cell: 48, people: 4, worker: ["guard", "resident"], dwell: 3, reach: 6 },
};
const GIVEN = ["An", "Bai", "Cheng", "Dai", "En", "Fang", "Guo", "Han", "Jing", "Kai", "Luo", "Meng", "Ning", "Qian", "Ren", "Shan", "Tian", "Wen", "Xiang", "Yan", "Zhi", "Yu"];
const FAMILY = ["Chen", "Lin", "Wang", "Zhao", "Wu", "Huang", "He", "Sun", "Liu", "Zhou", "Xu", "Liang", "Shen", "Tang", "Su", "Feng"];
// Parallel streets in one cell need separate occupancy on these principal
// corridors; otherwise an avenue can lose every local resident to a side lane.
export const PRESENCE_CORRIDORS = new Set(["lantern-south", "lantern-north", "plaza-west", "plaza-east", "plaza-south", "cross--216", "cross--112", "cross-120", "cross-312", "ring--320", "ring--84", "ring-100", "ring-320", "harbor-link", "harbor-north-quay", "imperial-forecourt", "water-bank-132", "water-bank-156", "scholar-link", "scholar-spine", "hutong-link", "artisan-link", "highland-switchbacks"]);
const feet = (p: { x: number; y: number; z: number }): Vec3 => ({ x: Math.floor(p.x) + .5, y: Math.round(p.y * 2) / 2 + 1.002, z: Math.floor(p.z) + .5 });
const grade = (p: Vec3, road: UrbanRoad, m?: MacroPlan): Vec3 => m && !road.owner?.startsWith("v7:") && inCity(p.x, p.z) ? { ...p, y: cityElevation(m, Math.floor(p.x)) + 1.002 } : p;
export const circuitStart = (id: string, time: number, count: number) => (identityHash(id) + Math.floor(time * 1200 / 16)) % count;
function sampleRoad(road: UrbanRoad, macro?: MacroPlan): Vec3[] {
  const out: Vec3[] = []; let walked = 0, next = 0;
  for (let i = 1; i < road.points.length; i++) {
    const a = road.points[i - 1], b = road.points[i], n = Math.hypot(b.x - a.x, b.z - a.z);
    if (!n) continue;
    for (; next <= walked + n; next += 4) { const t = (next - walked) / n; out.push(grade(feet({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t }), road, macro)); }
    walked += n;
  }
  if (road.points.length) out.push(grade(feet(road.points.at(-1)!), road, macro));
  return out;
}
const near = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.z - b.z);
function closest(points: Vec3[], p: Vec3) { let index = 0, distance = Infinity; points.forEach((v, i) => { const d = near(v, p); if (d < distance) { index = i; distance = d; } }); return index; }
function streetCircuit(points: Vec3[], p: Vec3, reach: number, road: UrbanRoad, macro?: MacroPlan, separation = Math.max(1, Math.min(3, road.half - 1))): Vec3[] {
  const at = closest(points, p), a = Math.max(0, at - reach), b = Math.min(points.length - 1, at + reach), result: Vec3[] = [];
  const lane = (i: number, side: number) => { side *= separation; const before = points[Math.max(0, i - 1)], after = points[Math.min(points.length - 1, i + 1)], n = Math.hypot(after.x - before.x, after.z - before.z) || 1; return grade({ ...points[i], x: points[i].x - (after.z - before.z) / n * side, z: points[i].z + (after.x - before.x) / n * side }, road, macro); };
  for (let i = a; i <= b; i += 2) result.push(lane(i, 1));
  if (b > a) result.push(lane(b, 1));
  for (let i = b; i >= a; i -= 2) result.push(lane(i, -1));
  if (b > a) result.push(lane(a, -1));
  return result;
}

/** Stable neighborhood addresses cover developed street cells, rather than
 * concentrating an entire district at one public midpoint. No voxel generation. */
export function addNeighborhoodPopulation(world: World, base: PopulationPlan): PopulationPlan {
  const urban = world.metropolisPlan, density = world.densityPlan;
  if (!urban || !density) return base;
  if(world.generatorVersion>=8&&"previousUrban" in density) {
    const currentRoads=new Map(urban.roads.map(r=>[r.id,r])),prior=(density as FabricPlan).previousUrban;
    const oldWorld={seed:world.seed,generatorVersion:7,metropolisPlan:prior,densityPlan:{...density,urban:prior},macroPlan:world.macroPlan,landmarkPlan:world.landmarkPlan} as unknown as World;
    const released=addNeighborhoodPopulation(oldWorld,base);
    // Resolve the frozen addresses first: moving/merging a lane must not rename
    // a cell and lose its released identities. Then fit their disposable routes
    // to v8's narrower/current street geometry, leaving real old home aisles.
    const fit=(p:Vec3):Vec3=>{
      const key=`${Math.floor(p.x/16)},${Math.floor(p.z/16)}`;
      if((prior.lotsByChunk.get(key)??[]).some(l=>contains(l,p.x,p.z)))return p;
      const oldRoad=(prior.roadsByChunk.get(key)??[]).map(r=>({r,q:nearestRoadPoint(r,p.x,p.z)})).filter(a=>a.q.distance<=a.r.half+1).sort((a,b)=>a.q.distance-b.q.distance||(a.r.id<b.r.id?-1:1))[0];
      if(!oldRoad)return p;const r=currentRoads.get(oldRoad.r.id);if(!r||r===oldRoad.r)return p;
      const q=nearestRoadPoint(r,p.x,p.z),at=r.points.reduce((best,v,i)=>Math.hypot(v.x-q.x,v.z-q.z)<Math.hypot(r.points[best].x-q.x,r.points[best].z-q.z)?i:best,0),a=r.points[Math.max(0,at-1)],b=r.points[Math.min(r.points.length-1,at+1)],n=Math.hypot(b.x-a.x,b.z-a.z)||1,nx=-(b.z-a.z)/n,nz=(b.x-a.x)/n;
      const offset=Math.max(-Math.max(.5,r.half-.5),Math.min(Math.max(.5,r.half-.5),(p.x-oldRoad.q.x)*nx+(p.z-oldRoad.q.z)*nz));
      const point={x:Math.floor(q.x+nx*offset)+.5,z:Math.floor(q.z+nz*offset)+.5,y:Math.round(q.y*2)/2+1.002};
      if(!r.owner&&inCity(point.x,point.z))point.y=cityElevation(world.macroPlan!,Math.floor(point.x))+1.002;return point;
    };
    const residents=released.residents.map(r=>r.circuit?{...r,workplace:fit(r.workplace),public:fit(r.public),circuit:{...r.circuit,points:r.circuit.points.map(fit),focus:fit(r.circuit.focus)}}:r);
    const adapted={...released,residents,byId:new Map(residents.map(r=>[r.id,r])),presence:released.presence?{...released.presence,neighborhoods:released.presence.neighborhoods.map(n=>({...n,position:fit(n.position)}))}:undefined};
    return addStreetLife(world,adapted);
  }
  type Neighborhood = { id: string; district: DistrictId; lot: UrbanLot; road: UrbanRoad; point: Vec3; score: number; hub?: "landing" | "junction" };
  const cells = new Map<string, Neighborhood>(), samples = new Map<UrbanRoad, Vec3[]>();
  const roads = urban.roads.filter(r => !r.owner), entries = new Map(urban.roads.filter(r => r.owner).map(r => [r.owner!, r]));
  for (const lot of urban.lots) {
    const policy = DISTRICT_PRESENCE[lot.districtId], access = entries.get(lot.id), end = access?.points.at(-1) ?? { ...lot.entrance, y: lot.baseY };
    const local = (urban.roadsByChunk.get(`${Math.floor(end.x / 16)},${Math.floor(end.z / 16)}`) ?? []).filter(r => !r.owner);
    let road: UrbanRoad | undefined, best = Infinity;
    for (const r of local.length ? local : roads) { const d = nearestRoadPoint(r, end.x, end.z).distance; if (d < best || d === best && road && r.id < road.id) { best = d; road = r; } }
    if (!road || best > 12) continue;
    const q = nearestRoadPoint(road, end.x, end.z), point = feet(q), gx = Math.floor(q.x / policy.cell), gz = Math.floor(q.z / policy.cell);
    const id = `${lot.districtId}:${gx}:${gz}${PRESENCE_CORRIDORS.has(road.id) ? `:${road.id}` : ""}`, score = Math.hypot(q.x - (gx + .5) * policy.cell, q.z - (gz + .5) * policy.cell) + near(point, feet({ ...lot.entrance, y: lot.baseY })) * .25;
    if (!cells.has(id) || score < cells.get(id)!.score) cells.set(id, { id, district: lot.districtId, lot, road, point, score });
    if (!samples.has(road)) samples.set(road, sampleRoad(road, world.macroPlan));
  }
  // Public courts also need addresses. Building-only anchors can leave the
  // protected Panda apron empty while every resident walks behind the camera.
  // These are permanent authored places, independent of player position.
  for (const space of base.spaces) {
    const policy = DISTRICT_PRESENCE[space.district];
    const road = roads.filter(r => r.district === space.district).sort((a, b) => nearestRoadPoint(a, space.position.x, space.position.z).distance - nearestRoadPoint(b, space.position.x, space.position.z).distance || (a.id < b.id ? -1 : 1))[0];
    const lot = urban.lots.filter(l => l.districtId === space.district).sort((a, b) => near(buildingPoint(a, 1), space.position) - near(buildingPoint(b, 1), space.position) || (a.id < b.id ? -1 : 1))[0];
    if (!road || !lot) continue;
    const q = nearestRoadPoint(road, space.position.x, space.position.z), point = grade(feet(q), road, world.macroPlan);
    if (q.distance > 24 || near(buildingPoint(lot, 1), point) > 64) continue;
    const id = `${space.district}:${Math.floor(q.x / policy.cell)}:${Math.floor(q.z / policy.cell)}${PRESENCE_CORRIDORS.has(road.id) ? `:${road.id}` : ""}`;
    if (!cells.has(id)) cells.set(id, { id, district: space.district, lot, road, point, score: 0 });
    if (!samples.has(road)) samples.set(road, sampleRoad(road, world.macroPlan));
  }
  // Grade landings and principal junctions are real shared places, even when
  // the nearest facade belongs to a different cell. Give them short routines
  // from the same finite population instead of leaving stairs/garden corners dead.
  const hubs: Neighborhood[] = [];
  function addHub(road: UrbanRoad, point: Vec3, kind: "landing" | "junction") {
    if(hubs.length>=32 || hubs.some(h=>near(h.point,point)<12))return;
    const district=urban!.districts.find(d=>contains(d.bounds,point.x,point.z))?.id;
    if(!district)return;
    const lot=urban!.lots.filter(l=>l.districtId===district && near(buildingPoint(l,1),point)<40).sort((a,b)=>near(buildingPoint(a,1),point)-near(buildingPoint(b,1),point)||(a.id<b.id?-1:1))[0];
    if(!lot)return;
    const id=`${district}:${kind}:${Math.floor(point.x)}:${Math.floor(point.z)}`;
    const n:Neighborhood={id,district,lot,road,point,score:0,hub:kind};hubs.push(n);cells.set(id,n);
  }
  const principals=roads.filter(r=>PRESENCE_CORRIDORS.has(r.id));
  for(const road of principals) {
    const points=samples.get(road)??sampleRoad(road,world.macroPlan);samples.set(road,points);
    let start=-1;
    const finish=(end:number)=>{if(start>=0 && Math.abs(points[end].y-points[start].y)>=1.5 && near(points[start],points[end])<=40)addHub(road,points[Math.floor((start+end)/2)],"landing");start=-1;};
    for(let i=1;i<points.length;i++)if(Math.abs(points[i].y-points[i-1].y)>.2){if(start<0)start=i-1;}else if(start>=0)finish(i-1);
    if(start>=0)finish(points.length-1);
  }
  const crossings=new Map<string,{road:UrbanRoad;point:Vec3;tx:number;tz:number}[]>();
  for(const road of principals) {
    const points=samples.get(road)!;
    for(let i=0;i<points.length;i++) {
      const point=points[i],a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],length=near(a,b)||1,tx=(b.x-a.x)/length,tz=(b.z-a.z)/length,key=`${Math.floor(point.x/4)},${Math.floor(point.z/4)}`,local=crossings.get(key)??[];
      for(const other of local)if(other.road!==road && near(other.point,point)<3 && Math.abs(other.point.y-point.y)<.6 && Math.abs(tx*other.tz-tz*other.tx)>.7)addHub(road,point,"junction");
      local.push({road,point,tx,tz});crossings.set(key,local);
    }
  }
  const neighborhoods = [...cells.values()].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const residents = [...base.residents], remaining = PRESENCE_BUDGET.residents - base.residents.length - 24;
  // Fair allocation preserves every neighborhood before adding extra roles.
  const allocation = new Map(neighborhoods.map(n => [n.id, 0])); let used = 0;
  const allocationOrder = [...neighborhoods].sort((a, b) => Number(!!b.hub)-Number(!!a.hub) || Number(PRESENCE_CORRIDORS.has(b.road.id)) - Number(PRESENCE_CORRIDORS.has(a.road.id)) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const hubBudget=Math.max(0,Math.floor((remaining-neighborhoods.length*3)/3));
  for(const n of allocationOrder.filter(n=>n.hub).slice(0,hubBudget)){allocation.set(n.id,6);used+=6;}
  for (let round = 0; round < 7; round++) for (const n of allocationOrder) if (allocation.get(n.id)!<=round && round < (n.hub?6:DISTRICT_PRESENCE[n.district].people) && used < remaining) { allocation.set(n.id, allocation.get(n.id)! + 1); used++; }
  for (const n of neighborhoods) {
    const policy = DISTRICT_PRESENCE[n.district], points = samples.get(n.road)!;
    if (points.length < 2) continue;
    const housing = urban.lots.filter(l => l.districtId === n.district && near(buildingPoint(l, 1), n.point) < 64).sort((a, b) => near(buildingPoint(a, 1), n.point) - near(buildingPoint(b, 1), n.point) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    const access = entries.get(n.lot.id), path = access ? sampleRoad(access, world.macroPlan) : [feet({ ...n.lot.entrance, y: n.lot.baseY }), n.point];
    const roadLoop = streetCircuit(points, n.point, n.hub?3:policy.reach, n.road, world.macroPlan), localLoop = streetCircuit(points, n.point, 3, n.road, world.macroPlan),socialLoop=n.hub?streetCircuit(points,n.point,2,n.road,world.macroPlan,1):localLoop;
    for (let slot = 0; slot < allocation.get(n.id)!; slot++) {
      const id = `neighbor:${world.seed}:${n.id}:${slot}`, h = identityHash(id), routine: Routine = slot === 0 ? "work" : slot === 3 || n.hub && slot===2 ? "social" : slot === 4 && (n.hub || ["heritage", "imperial", "harbor", "highland"].includes(n.district)) ? "patrol" : "circulation";
      const profession: Profession = routine === "work" ? policy.worker[h % policy.worker.length] : routine === "patrol" ? "guard" : n.district === "scholar" ? "scholar" : n.district === "nightlife" ? slot % 2 ? "chef" : "merchant" : "resident";
      const focus = n.hub && routine==="social"?n.point:buildingPoint(n.lot, 3), home = buildingPoint(housing[(slot + 1) % (housing.length || 1)] ?? n.lot, 1);
      const workerLoop = [buildingPoint(n.lot, 2), ...path, ...localLoop.slice(0, 3), ...[...path].reverse(), buildingPoint(n.lot, 1)];
      const circuit = routine === "work" ? workerLoop : routine === "social" ? [...socialLoop, ...path.slice(0, 1)] : roadLoop;
      const workplace = circuit[h % circuit.length];
      residents.push({ id, name: `${GIVEN[h % GIVEN.length]} ${FAMILY[Math.floor(h / GIVEN.length) % FAMILY.length]} · ${PROFESSIONS[profession].label}`, profession, district: n.district, home, workplace,
        public: n.point, workLoop: [workplace], legacy: false, neighborhood: n.id, circuit: { points: circuit, routine, dwell: routine === "circulation" ? .7 : routine === "patrol" ? 1.5 : policy.dwell, focus } });
    }
  }
  for (const source of base.residents.filter(r => r.landmark)) {
    const site = world.landmarkPlan!.sites.find(s => s.id === source.landmark)!;
    // A site can own river, approach and interior stair segments. Use the one
    // ending at its actual arrival, not simply the first route with that site.
    const approach = world.landmarkPlan!.approaches.filter(a => a.site === source.landmark).sort((a, b) => near(a.nodes.at(-1)!, site.entry) - near(b.nodes.at(-1)!, site.entry) || (a.id < b.id ? -1 : 1))[0];
    const nodes = approach?.nodes.slice(-33).filter((_, i) => i % 8 === 0).map(feet).reverse();
    const route = nodes && nodes.length > 1 ? [...nodes, ...[...nodes].reverse()] : [...source.workLoop, ...[...source.workLoop].reverse()];
    for (let slot = 0; slot < 3; slot++) {
      const publicPoint = source.landmark === "cliff-grotto" ? source.workplace : source.landmark === "ridge-fortification" ? source.workLoop[1] : feet(site.publicSpaces[0] ?? site.entry);
      const interior = source.workLoop.reduce((a, b) => Math.hypot(a.x - site.entry.x, a.y - site.entry.y, a.z - site.entry.z) > Math.hypot(b.x - site.entry.x, b.y - site.entry.y, b.z - site.entry.z) ? a : b);
      const points = slot === 1 ? route : [publicPoint, ...route, ...(slot === 2 ? [interior] : [])];
      const id = `visitor:${world.seed}:${source.landmark}:${slot}`, profession: Profession = slot === 1 ? "guard" : source.profession === "researcher" ? "researcher" : "scholar", h = identityHash(id);
      residents.push({ id, name: `${GIVEN[h % GIVEN.length]} ${FAMILY[h % FAMILY.length]} · ${PROFESSIONS[profession].label}`, profession, district: source.district, home: { ...source.home }, workplace: points[slot % points.length], workLoop: source.workLoop,
        public: source.public, landmark: source.landmark, legacy: false, neighborhood: `landmark:${source.landmark}`, circuit: { points, routine: slot === 1 ? "patrol" : "circulation", dwell: slot === 1 ? 2 : 1, focus: publicPoint } });
    }
  }
  if (residents.length > PRESENCE_BUDGET.residents) throw Error("Neighborhood population budget exceeded");
  return { ...base, residents, byId: new Map(residents.map(r => [r.id, r])), presence: { neighborhoods: neighborhoods.map(n => ({ id: n.id, district: n.district, position: n.point, residents: allocation.get(n.id)!, kind:n.hub??"street" })), active: PRESENCE_BUDGET.active } };
}
