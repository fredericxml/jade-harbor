import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { createGenerator } from "../src/world/generator";
import { World } from "../src/world/world";
import { createPopulation } from "../src/game/city-life/population";
import { Discoveries, discoveryRegistry } from "../src/game/city-life/discoveries";
import { travelDestinations } from "../src/game/city-life/travel";
import { measureRegionalLandUse } from "../src/world/regions/land-use";

const seed="jade-harbor";
let world:World;
beforeAll(()=>{world=new World(seed,{},false);},30000);
afterAll(()=>world.dispose());
describe("current world content",()=>{
  it("has all ten districts, eight landmarks and five regional destinations",()=>{
    expect(world.metropolisPlan?.districts).toHaveLength(10);
    expect(world.landmarkPlan?.sites).toHaveLength(8);
    expect(world.regionalPlan?.sites).toHaveLength(5);
  });
  it("plans a continuous dense city without generic forests dominating",()=>{
    const g=createGenerator(seed);
    expect(g.metropolis.lots.length).toBeGreaterThan(100);
    expect(g.metropolis.roads.length).toBeGreaterThan(20);
    expect(measureRegionalLandUse(g.plan,g.regions).genericForest).toBeLessThan(.05);
  },30000);
  it("exposes stable travel destinations and discovery registry",()=>{
    expect(travelDestinations(world)).toHaveLength(18);
    expect(discoveryRegistry(world)).toHaveLength(33);
    const ids=travelDestinations(world).map(v=>v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("maintains distinct citizen identities and location assignments",()=>{
    const population=createPopulation(world)!;
    expect(population.residents.length).toBeGreaterThan(1000);
    expect(new Set(population.residents.map(v=>v.id)).size).toBe(population.residents.length);
  },30000);
  it("keeps discoverable landmarks tied to authoritative world metadata",()=>{
    const landmarks=world.landmarkPlan!.sites;
    for(const site of landmarks) {
      expect(site.entry).toBeDefined();
      expect(Number.isFinite(site.entry.x+site.entry.y+site.entry.z)).toBe(true);
    }
    expect(new Discoveries(world,new Set()).entries).toHaveLength(33);
  });
});
