import type { Vec3 } from "../../core/coords";
import type { World } from "../../world/world";
import type { DistrictId } from "../../world/metropolis/districts";
import { nearestRoadPoint, type UrbanLot } from "../../world/metropolis/plan";
import type { LandmarkId } from "../../world/landmarks/types";
import { buildingPoint, residents, PROFESSIONS, type Profession } from "../professions";
import { addRegionalLife } from "./regional-life";
import { addPurposefulLife, type TaskChain } from "./purpose";
import { addNeighborhoodPopulation, type Circuit } from "./presence";

export type ResidentPlan = { id: string; name: string; profession: Profession; district: DistrictId; home: Vec3; workplace: Vec3;
  workLoop: Vec3[]; public: Vec3; landmark?: LandmarkId; legacy: boolean; neighborhood?: string; circuit?: Circuit; task?:TaskChain };
export type PublicSpace = { id: string; district: DistrictId; position: Vec3; slots: Vec3[] };
export type PopulationPlan = { residents: ResidentPlan[]; byId: Map<string, ResidentPlan>; spaces: PublicSpace[];
  presence?: { neighborhoods: { id: string; district: DistrictId; position: Vec3; residents: number; kind?: "street" | "landing" | "junction" }[]; active: number } };
export const CITY_LIFE_BUDGET = { residents: 36, active: 16, visitors: 0, events: 1, participants: 3, scheduleSeconds: 1, activationRadius: 80 } as const;
const dist = (a: Vec3, b: Vec3) => Math.abs(a.x - b.x) + Math.abs(a.z - b.z);
const center = (l: UrbanLot): Vec3 => ({ x: (l.x1 + l.x2) / 2, y: l.baseY + 1.002, z: (l.z1 + l.z2) / 2 });
const EXTRAS: readonly [DistrictId, string, Profession][] = [
  ["heritage", "An", "guard"], ["heritage", "Min", "merchant"], ["heritage", "Rui", "scholar"], ["heritage", "Xin", "resident"],
  ["market", "Yun", "merchant"], ["market", "Lei", "chef"], ["market", "Ning", "merchant"],
  ["hutong", "Hui", "resident"], ["hutong", "Jia", "resident"], ["water-town", "Lin", "fisherman"],
  ["imperial", "Song", "guard"], ["harbor", "Fei", "dock_worker"], ["harbor", "Wei", "fisherman"],
  ["artisan", "Zhen", "potter"], ["artisan", "Chun", "carpenter"], ["scholar", "Hai", "scholar"],
  ["nightlife", "Lan", "chef"], ["nightlife", "Xia", "merchant"],
];
const REMOTE: Record<LandmarkId, [string, Profession, DistrictId]> = {
  "imperial-complex": ["Ling", "attendant", "imperial"], "ridge-fortification": ["Qiu", "guard", "highland"],
  archaeology: ["Ming", "researcher", "artisan"], "harbor-front": ["Chen", "dock_worker", "harbor"],
  "mountain-temple": ["Hao", "caretaker", "highland"], "cliff-grotto": ["Shu", "researcher", "highland"],
  "scenic-landscape": ["Ping", "caretaker", "scholar"], "western-viewpoint": ["Zhu", "scholar", "highland"],
};
/** Spatial assignments are resolved once. This never generates a column. */
export function createPopulation(world: World): PopulationPlan | undefined {
  const urban = world.densityPlan?.baseUrban ?? world.metropolisPlan, landmarks = world.landmarkPlan;
  if (world.generatorVersion < 6 || !urban || !landmarks) return;
  const lots = [...urban.lots].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const nearest = (p: Vec3, choices = lots) => {
    let best: UrbanLot | undefined, score = Infinity;
    for (const l of choices) {
      const d = Math.abs((l.x1 + l.x2) / 2 - p.x) + Math.abs((l.z1 + l.z2) / 2 - p.z);
      if (d < score || d === score && (!best || l.id < best.id)) { best = l; score = d; }
    }
    return best;
  };
  const spaces: PublicSpace[] = [];
  const panda = urban.panda;
  const plaza = { x: (panda.x1 + panda.x2) / 2 + .5, y: (panda.baseY ?? 20) + 1.002, z: panda.z2 + 9.5 };
  // The protected plaza's floor is city grade, not the monument's raised base.
  plaza.y = 21.002;
  spaces.push({ id: "panda-plaza", district: "heritage", position: plaza,
    slots: [[-8,-1],[-3,3],[4,0],[8,5]].map(([dx,dz]) => ({ ...plaza, x: plaza.x + dx, z: plaza.z + dz })) });
  for (const d of urban.districts.filter(d => d.id !== "heritage")) {
    const localLots = lots.filter(l => l.districtId === d.id);
    const focus = { x: localLots.reduce((n, l) => n + center(l).x, 0) / (localLots.length || 1), y: 21, z: localLots.reduce((n, l) => n + center(l).z, 0) / (localLots.length || 1) };
    const roads = urban.roads.filter(r => r.district === d.id && r.kind !== "approach" && !r.owner);
    const road = d.id === "harbor" ? roads.find(r => r.id === "harbor-north-quay") : [...roads].sort((a, b) => nearestRoadPoint(a, focus.x, focus.z).distance - nearestRoadPoint(b, focus.x, focus.z).distance || (a.id < b.id ? -1 : 1))[0];
    const l = localLots[0];
    if (!road && !l) continue;
    const middle = road ? Math.floor((road.points.length - 1) / 2) : 0;
    const a = road?.points[middle], b = road?.points[middle + 1];
    const p = a && b ? { x: Math.floor((a.x + b.x) / 2) + .5, y: Math.round(a.y + b.y) / 2 + 1.002, z: Math.floor((a.z + b.z) / 2) + .5 } : buildingPoint(l!, 1);
    const alongX = a && b ? Math.abs(b.x - a.x) >= Math.abs(b.z - a.z) : true;
    spaces.push({ id: `${d.id}-public`, district: d.id, position: p,
      slots: [-3, 0, 3].map(n => ({ ...p, x: p.x + (alongX ? n : 0), z: p.z + (alongX ? 0 : n) })) });
  }
  const result: ResidentPlan[] = residents(world.seed, urban.residentCity).map(r => {
    const l = nearest(r.home), district = l?.districtId ?? "heritage";
    const s = spaces.find(s => s.district === district);
    return { ...r, district, workLoop: [r.workplace], public: s && dist(r.home, s.position) < 80 ? s.slots[resultSlot(r.id, s.slots.length)] : r.workplace, legacy: true };
  });
  const claimedHomes = new Set(result.map(r => nearest(r.home)?.id));
  for (const [district, name, profession] of EXTRAS) {
    const local = lots.filter(l => l.districtId === district && !["pavilion", "garden", "civic"].includes(l.archetype));
    const available = local.length ? local : lots.filter(l => l.districtId === district);
    if (!available.length) continue;
    const id = `citizen:${world.seed}:${district}:${name.toLowerCase()}`;
    const space = spaces.find(s => s.district === district)!;
    const slot = EXTRAS.filter(e => e[0] === district).map(e => e[1]).sort().indexOf(name);
    const ranked = [...available].sort((a,b) => dist(center(a),space.position)-dist(center(b),space.position) || (a.id<b.id?-1:1));
    const work = ranked[slot % ranked.length];
    const workplace = district === "heritage" ? space.slots[slot % space.slots.length] : buildingPoint(work, 2);
    const housing = lots.filter(l => l.id !== work.id && l.districtId === district && !["pavilion","garden"].includes(l.archetype) && !claimedHomes.has(l.id) && dist(center(l),workplace)<64);
    const home = nearest(workplace, housing) ?? nearest(workplace, lots.filter(l => l.id !== work.id && l.districtId === district && !["pavilion","garden"].includes(l.archetype) && dist(center(l),workplace)<80)) ?? work;
    claimedHomes.add(home.id);
    result.push({ id, name: `${name} · ${PROFESSIONS[profession].label}`, profession, district, home: buildingPoint(home, 1), workplace,
      workLoop: district === "heritage" ? [workplace, { ...workplace, z: workplace.z + 4 }] : [workplace, buildingPoint(work, 4)],
      public: space && dist(workplace, space.position) < 80 ? space.slots[slot % space.slots.length] : workplace, legacy: false });
  }
  for (const s of landmarks.sites) {
    const [name, profession, district] = REMOTE[s.id];
    const feet = (p: { x: number; y: number; z: number }) => ({ x: p.x + .5, y: p.y + 1.002, z: p.z + .5 });
    const workplace = feet(s.id === "western-viewpoint" ? s.entry : s.id === "cliff-grotto" ? s.viewpoints[0] : s.publicSpaces[0] ?? s.entry);
    const l = nearest(workplace, lots.filter(l => !["pavilion","garden"].includes(l.archetype) && !claimedHomes.has(l.id)));
    if (!l) continue;
    claimedHomes.add(l.id);
    let workLoop = [workplace, feet(s.entry)];
    if (s.id === "cliff-grotto") workLoop = [workplace, feet(s.entry), { ...feet(s.entry), x: s.entry.x + 1.5 }];
    if (s.id === "ridge-fortification") workLoop = [0, 8, 16].map(i => feet(landmarks.wallWalk[i]));
    if (s.id === "western-viewpoint") workLoop = [workplace, feet(s.viewpoints[0])];
    if (s.id === "harbor-front") workLoop = [workplace, feet(s.viewpoints[0])];
    result.push({ id: `citizen:${world.seed}:landmark:${s.id}`, name: `${name} · ${PROFESSIONS[profession].label}`, profession, district,
      home: buildingPoint(l, 1), workplace, workLoop, public: workplace, landmark: s.id, legacy: false });
  }
  if (result.length > CITY_LIFE_BUDGET.residents) throw Error("Population budget exceeded");
  const population=addNeighborhoodPopulation(world, { residents: result, byId: new Map(result.map(r => [r.id, r])), spaces });
  const regional=world.generatorVersion>=9?addRegionalLife(world,population):population;
  return world.generatorVersion>=10?addPurposefulLife(world,regional):regional;
}
function resultSlot(id: string, count: number) { let n = 0; for (const c of id) n = (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0; return count ? n % count : 0; }
