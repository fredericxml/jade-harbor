import { hash } from "../noise";
import { freezePlan, type Point, type Footprint } from "./geometry";

export type Region = "metropolitan-core" | "urban-terrace" | "urban-lowland" | "harbor-waterfront" |
  "river-corridor" | "canal-lowland" | "imperial-plateau" | "ridge" | "highland" | "mountain" |
  "valley" | "cliff" | "scenic-protected" | "archaeology-outskirts" | "rural-transition";
export type Connection = Readonly<{ id: string; kind: "avenue" | "ceremonial-axis" | "harbor-road" | "bridge" |
  "canal" | "promenade" | "mountain-pass" | "ridge-trail" | "landmark-approach" | "archaeology-route" | "mine-entrance";
  points: readonly Point[]; halfWidth: number; state: "existing" | "reserved" }>;
export type DistrictContract = Readonly<{ id: string; name: string; anchor: Point; footprint: Footprint;
  priority: number; seed: number; regions: readonly Region[]; elevation: readonly [number, number]; maxSlope: number;
  density: "dense" | "mixed" | "open"; water: "none" | "preferred" | "required";
  ridge: boolean; allowCliff: boolean; protectScenery: boolean; connections: readonly string[] }>;
export type MacroPlan = Readonly<{
  version: 4; seed: number; primary: Point; envelope: Footprint; harbor: { center: Point; radius: number };
  river: readonly Point[]; riverHalfWidth: number; ridge: readonly Point[]; wallRidge: readonly Point[];
  pass: readonly Point[]; cliff: Point; scenic: Point; imperial: Point; archaeology: Point;
  cityRampX: number; districts: readonly DistrictContract[]; connections: readonly Connection[];
  mine: { id: string; entrance: Point; end: Point; halfWidth: number; stepRun: number };
}>;
const point = (x: number, z: number): Point => ({ x, z });
const area = (x1: number, z1: number, x2: number, z2: number): Footprint => ({ kind: "area", bounds: { x1, z1, x2, z2 } });

/** Small immutable semantic plan. Topology is curated; seeds vary contours and silhouettes. */
export function createMacroPlan(seed: number): MacroPlan {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error("Invalid macro seed.");
  const shift = (i: number, range: number) => Math.round((hash(i, 19, seed) - .5) * range);
  const east = 450 + shift(1, 24);
  const harbor = { center: point(200, 530), radius: 180 };
  const river = [point(east + 80, -1e7), point(east + 80, -1300), point(east + 25, -800), point(east, -280),
    point(east, 180), point(410, 390), point(330, 480), harbor.center, point(300, 760), point(600, 1100), point(700, 1e7)];
  const ridge = [point(-1100, -470), point(-700, -540 + shift(2, 32)), point(-420, -570),
    point(-160, -580 + shift(3, 32)), point(160, -630 + shift(4, 32)), point(550, -610 + shift(5, 32)), point(1050, -470)];
  const pass = [point(-380, -340), point(-420, -570), point(-490, -850)];
  // End west of the river gorge; the range continues across it, the wall route does not.
  const wallRidge = [ridge[3], ridge[4], point(350, -620)];
  const mine = { id: "eastern-timber-mine", entrance: point(360, 0), end: point(360, 144), halfWidth: 2, stepRun: 2 };
  const connections: Connection[] = [
    { id: "lantern-avenue", kind: "avenue", points: [point(0, -208), point(0, 288)], halfWidth: 5, state: "existing" },
    { id: "imperial-axis", kind: "ceremonial-axis", points: [point(0, -305), point(0, -430)], halfWidth: 6, state: "reserved" },
    { id: "harbor-approach", kind: "harbor-road", points: [point(64, 288), point(64, 340), point(200, 345)], halfWidth: 5, state: "reserved" },
    { id: "east-crossing", kind: "bridge", points: [point(310, 208), point(east + 65, 208)], halfWidth: 5, state: "reserved" },
    { id: "canal-link", kind: "canal", points: [point(144, 143), point(280, 250), point(410, 300)], halfWidth: 4, state: "reserved" },
    { id: "harbor-promenade", kind: "promenade", points: [point(30, 350), point(200, 345), point(330, 390)], halfWidth: 4, state: "reserved" },
    { id: "western-pass", kind: "mountain-pass", points: pass, halfWidth: 12, state: "reserved" },
    { id: "northern-ridge", kind: "ridge-trail", points: wallRidge, halfWidth: 5, state: "reserved" },
    { id: "cliff-approach", kind: "landmark-approach", points: [point(530, -280), point(620, -400)], halfWidth: 3, state: "reserved" },
    { id: "archaeology-road", kind: "archaeology-route", points: [point(-310, 128), point(-435, 160)], halfWidth: 4, state: "reserved" },
    { id: "timber-mine", kind: "mine-entrance", points: [point(310, 0), mine.entrance], halfWidth: 3, state: "reserved" },
  ];
  const district = (id: string, name: string, anchor: Point, footprint: Footprint, regions: Region[], elevation: [number, number],
    density: DistrictContract["density"], connections: string[], water: DistrictContract["water"] = "none", ridge = false): DistrictContract =>
    ({ id, name, anchor, footprint, regions, elevation, density, connections, water, ridge, allowCliff: false,
      protectScenery: density === "open", maxSlope: ridge ? 1 : .5, priority: 50, seed: Math.floor(hash(anchor.x, anchor.z, seed) * 0xffffffff) });
  const districts = [
    district("lantern", "Grand Lantern Avenue", point(0, 0), area(-80, -218, 100, 180), ["metropolitan-core"], [20, 20], "dense", ["lantern-avenue"]),
    district("old-town", "Residential Old Town", point(-260, 0), area(-328, -64, -81, 116), ["urban-terrace", "metropolitan-core"], [20, 24], "dense", ["lantern-avenue"]),
    district("market", "Grand Market", point(-184, -184), area(-328, -328, -81, -65), ["urban-terrace", "metropolitan-core"], [20, 24], "dense", ["western-pass"]),
    district("temple", "Temple Quarter", point(-32, -265), area(-80, -328, 80, -219), ["metropolitan-core"], [20, 20], "mixed", ["imperial-axis"]),
    district("canal", "Canal Quarter", point(144, -80), area(101, -218, 328, 116), ["canal-lowland"], [20, 20], "mixed", ["canal-link", "east-crossing"], "preferred"),
    district("imperial", "Imperial Quarter", point(184, -265), area(81, -328, 328, -219), ["metropolitan-core"], [20, 20], "mixed", ["imperial-axis"]),
    district("artisan", "Artisan Quarter", point(-184, 168), area(-328, 117, -81, 328), ["urban-terrace", "metropolitan-core"], [20, 24], "dense", ["archaeology-road"]),
    district("gardens", "Classical Gardens", point(184, 168), area(101, 117, 328, 328), ["urban-lowland"], [20, 20], "open", ["canal-link"], "preferred"),
    district("harbor-expansion", "Harbor waterfront envelope", point(200, 345), area(0, 332, 330, 400), ["harbor-waterfront"], [18, 23], "mixed", ["harbor-approach", "harbor-promenade"], "required"),
    district("imperial-expansion", "Imperial plateau envelope", point(0, -430), area(-95, -480, 95, -380), ["imperial-plateau"], [34, 36], "mixed", ["imperial-axis"]),
    district("archaeology", "Archaeological outskirts", point(-530, 160), area(-605, 85, -455, 235), ["archaeology-outskirts"], [26, 28], "open", ["archaeology-road"]),
    district("ridge", "Northern fortified highlands", wallRidge[1], { kind: "corridor", points: wallRidge, halfWidth: 26 }, ["ridge"], [70, 170], "open", ["northern-ridge"], "none", true),
  ];
  return freezePlan({ version: 4, seed, primary: point(0, 0), envelope: area(-720, -850, 760, 760), harbor, river, riverHalfWidth: 26,
    ridge, wallRidge, pass, cliff: point(620, -430), scenic: point(-660, -250), imperial: point(0, -430), archaeology: point(-530, 160),
    cityRampX: -224 + Math.floor(hash(1, 7, seed) * 9) - 4, districts, connections, mine });
}
