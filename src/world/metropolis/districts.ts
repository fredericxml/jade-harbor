import { B } from "../blocks";
import type { District, Family, Rect } from "../city/plan";
import type { Region } from "../geography/plan";

export type DistrictId = "heritage" | "market" | "hutong" | "water-town" | "imperial" | "harbor" | "artisan" | "scholar" | "nightlife" | "highland";
export type Archetype = "shophouse" | "courtyard" | "water-house" | "compound" | "warehouse" | "merchant" | "workyard" | "garden" | "mixed-use" | "hillside" | "civic" | "pavilion";
export type RoofFamily = "gable" | "hip" | "double-eave" | "warehouse" | "terrace";
export type FacadeFamily = "timber" | "lattice" | "arcade" | "loading-bay" | "formal";
export type Weights<T> = readonly (readonly [T, number])[];
export type DistrictSpec = Readonly<{
  id: DistrictId; name: string; legacy: District; role: string; terrainContract: string;
  bounds: Rect; regions: readonly Region[]; block: readonly [number, number]; lane: number;
  frontage: readonly [number, number]; depth: number; setback: number; openSpace: number;
  archetypes: Weights<Archetype>; floors: Weights<number>; roofs: Weights<RoofFamily>; facades: Weights<FacadeFamily>;
  wall: number; timber: number; tile: number; accent: number; pavement: number;
  balcony: number; arcade: number; signs: number; lanterns: number; greenery: number; props: number;
}>;
const rect = (x1: number, z1: number, x2: number, z2: number): Rect => ({ x1, z1, x2, z2 });
const common = { wall: B.CreamWall, timber: B.DarkTimber, tile: B.Roof, accent: B.Red, pavement: B.Paving,
  balcony: .2, arcade: 0, signs: 1, lanterns: 2, greenery: 0, props: 2, setback: 3, openSpace: .06 };
export const DISTRICT_SPECS: readonly DistrictSpec[] = [
  { ...common, id: "heritage", name: "Panda Heritage Core", legacy: "Grand Lantern Avenue", role: "Civic axis and plaza frame", terrainContract: "lantern",
    bounds: rect(-76,-224,94,112), regions: ["metropolitan-core"], block: [58,56], lane: 4, frontage: [17,20], depth: 20, setback: 4,
    archetypes: [["civic",3],["merchant",2],["pavilion",1]], floors: [[2,5],[1,1]], roofs: [["double-eave",4],["hip",2]], facades: [["formal",4],["lattice",2]],
    tile: B.JadeRoof, signs: 0, greenery: .25, openSpace: .12 },
  { ...common, id: "market", name: "Old Market Maze", legacy: "Grand Market", role: "Narrow merchant fronts and branching alleys", terrainContract: "market",
    bounds: rect(-310,-304,-92,-84), regions: ["metropolitan-core","urban-terrace"], block: [44,42], lane: 2, frontage: [9,15], depth: 13,
    archetypes: [["shophouse",7],["merchant",2],["mixed-use",1]], floors: [[2,5],[3,2],[1,2]], roofs: [["gable",5],["hip",2],["terrace",1]], facades: [["timber",4],["arcade",2],["lattice",1]],
    tile: B.RubyRoof, balcony: .75, arcade: .35, signs: 3, lanterns: 3, props: 4, openSpace: .02 },
  { ...common, id: "hutong", name: "Hutong Courtyards", legacy: "Residential Old Town", role: "Enclosed low-rise homes and neighborhood lanes", terrainContract: "old-town",
    bounds: rect(-310,-68,-92,112), regions: ["metropolitan-core","urban-terrace"], block: [54,48], lane: 2, frontage: [32,38], depth: 30,
    archetypes: [["courtyard",8],["shophouse",1]], floors: [[1,1]], roofs: [["gable",5],["hip",1]], facades: [["lattice",5],["timber",1]],
    wall: B.Marble, signs: 0, balcony: 0, lanterns: 1, greenery: .8, props: 1 },
  { ...common, id: "water-town", name: "Jade Water Town", legacy: "Canal Quarter", role: "Low timber houses facing canals and bridge plazas", terrainContract: "canal",
    bounds: rect(108,-204,314,96), regions: ["canal-lowland","metropolitan-core"], block: [52,48], lane: 2, frontage: [12,19], depth: 17,
    archetypes: [["water-house",7],["merchant",2],["pavilion",1]], floors: [[1,5],[2,2]], roofs: [["gable",6],["hip",1]], facades: [["timber",4],["lattice",3]],
    wall: B.Marble, balcony: .55, signs: 1, greenery: .3, props: 1 },
  { ...common, id: "imperial", name: "Imperial Quarter", legacy: "Imperial Quarter", role: "Formal compounds, deep courts and an open northern axis", terrainContract: "imperial",
    bounds: rect(-76,-320,314,-224), regions: ["metropolitan-core"], block: [94,80], lane: 5, frontage: [58,72], depth: 52,
    archetypes: [["compound",6],["civic",2]], floors: [[1,4],[2,1]], roofs: [["double-eave",5],["hip",2]], facades: [["formal",1]],
    wall: B.Red, tile: B.BrownRoof, accent: B.GoldTrim, setback: 7, balcony: 0, signs: 0, greenery: .3, props: 1 },
  { ...common, id: "harbor", name: "Merchant Docks", legacy: "Classical Gardens", role: "Warehouses, cargo courts and quays", terrainContract: "harbor-expansion",
    bounds: rect(8,314,332,446), regions: ["harbor-waterfront","urban-lowland","rural-transition"], block: [60,40], lane: 4, frontage: [26,38], depth: 22,
    archetypes: [["warehouse",8],["merchant",2]], floors: [[1,5],[2,1]], roofs: [["warehouse",5],["gable",2]], facades: [["loading-bay",5],["arcade",2]],
    wall: B.Planks, tile: B.BrownRoof, balcony: .25, arcade: .5, signs: 2, greenery: 0, props: 8, pavement: B.SculptureStone },
  { ...common, id: "artisan", name: "Artisan Workyards", legacy: "Artisan Quarter", role: "Open work courts, kilns and workshop wings", terrainContract: "artisan",
    bounds: rect(-310,132,-92,304), regions: ["metropolitan-core","urban-terrace"], block: [58,54], lane: 3, frontage: [30,40], depth: 32,
    archetypes: [["workyard",7],["merchant",2],["shophouse",1]], floors: [[1,4],[2,1]], roofs: [["gable",4],["warehouse",2]], facades: [["timber",4],["loading-bay",2]],
    wall: B.Brick, tile: B.BrownRoof, balcony: .1, signs: 1, greenery: .1, props: 6 },
  { ...common, id: "scholar", name: "Scholar Gardens", legacy: "Classical Gardens", role: "Asymmetric garden compounds, ponds and quiet paths", terrainContract: "gardens",
    bounds: rect(110,116,314,304), regions: ["urban-lowland"], block: [84,80], lane: 2, frontage: [52,62], depth: 52,
    archetypes: [["garden",7],["pavilion",2],["courtyard",1]], floors: [[1,1]], roofs: [["hip",4],["gable",2]], facades: [["lattice",1]],
    wall: B.Marble, tile: B.JadeRoof, setback: 6, signs: 0, balcony: 0, greenery: 1, lanterns: 1, openSpace: .2 },
  { ...common, id: "nightlife", name: "Lantern Commercial Core", legacy: "Grand Lantern Avenue", role: "Vertical mixed use, arcades and roof terraces", terrainContract: "lantern",
    bounds: rect(-76,132,94,304), regions: ["metropolitan-core"], block: [50,56], lane: 3, frontage: [13,21], depth: 18,
    archetypes: [["mixed-use",6],["merchant",2],["shophouse",2]], floors: [[3,4],[4,3],[5,1],[2,1]], roofs: [["terrace",4],["hip",2],["gable",1]], facades: [["arcade",4],["timber",2]],
    tile: B.JadeRoof, balcony: .85, arcade: .75, signs: 4, lanterns: 4, props: 3, openSpace: .02 },
  { ...common, id: "highland", name: "Northern Terrace Edge", legacy: "Temple Quarter", role: "Supported hillside homes, switchbacks and outlooks", terrainContract: "ridge",
    bounds: rect(-330,-478,-192,-332), regions: ["urban-lowland","rural-transition","mountain","highland"], block: [44,36], lane: 3, frontage: [20,28], depth: 16,
    archetypes: [["hillside",6],["pavilion",2],["courtyard",1]], floors: [[1,3],[2,2]], roofs: [["hip",4],["gable",2]], facades: [["timber",4],["formal",1]],
    wall: B.SculptureStone, tile: B.Roof, signs: 0, greenery: .4, lanterns: 1, props: 1 },
];
export const FAMILY: Record<Archetype, Family> = { shophouse: "shophouse", courtyard: "courtyard", "water-house": "canal-house", compound: "civic", warehouse: "warehouse", merchant: "merchant", workyard: "workshop", garden: "garden", "mixed-use": "shop", hillside: "home", civic: "civic", pavilion: "pavilion" };
export const districtSpec = (id: DistrictId) => DISTRICT_SPECS.find(d => d.id === id)!;
