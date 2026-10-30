import { MIN_Y, SEA, packed } from "../core/coords";
import { B } from "./blocks";
import { hash, noise, noise3, seedNumber } from "./noise";
import { BlockColumn } from "./sections";
import { inCity, contains } from "./city/plan";
import { VoxelWriter } from "./city/writer";
import { drawStructure, tree } from "./city/structures";
import { createMacroPlan } from "./geography/plan";
import { agriculturalTerrace, cityElevation, sampleTerrain, terrainSuitability, terrainName } from "./geography/terrain";
import { caveRoofAt, landmarkRequests, protections, reservationAt, resolveReservations } from "./geography/landmarks";
import { createUrbanPlan, roadElevation, urbanAt, nearestRoadPoint } from "./metropolis/plan";
import { drawUrbanStreets } from "./metropolis/architecture";
import { createRichFabric, planRichBuilding, drawRichLot } from "./metropolis/richness";
import { createRegionalPlan, regionAt, regionalRouteAt } from "./regions/plan";
import {drawLandscapeProgram} from "./regions/landscapes";
import { drawRegions } from "./regions/builders-v10";
import { createV6Generator } from "./generator-v6";
import { createDensityPlan } from "./metropolis/density";
import { createFabricPlan } from "./metropolis/fabric";
import { drawLandmarks, landmarkAt } from "./landmarks/builders";
import { regionalForestTreeAllowed as forestTreeAllowed, regionalLandUseAt } from "./regions/land-use";
import { footprintDistance, footprintsOverlap } from "./geography/geometry";

function vegetationBiome(x: number, z: number, seed: number) {
  const n = noise(x / 190, z / 190, seed + 82);
  return n < .22 ? "Cherry Blossom Valley" : n < .44 ? "Bamboo Forest" : n < .66 ? "Cedar Highlands" : n < .83 ? "Jade Mountains" : "Snow Peaks";
}
/** V10 architectural grammar. The complete v3–v9 generation inputs stay frozen.
 * Terrain/caves/ores/mine and landmarks use the retained geographic contracts;
 * urban surfaces and architecture consume one indexed immutable fabric plan. */
export function createV10Generator(seedText: string) {
  const started = performance.now(), seed = seedNumber(seedText), original = createV6Generator(seedText);
  const { plan, landmarks, realization } = original;
  const previous = createDensityPlan(plan, landmarks, realization, original.metropolis), density = createRichFabric(createFabricPlan(plan, landmarks, realization, previous),seed);
  const metropolis = density.urban, city = metropolis.residentCity;
  const regions = createRegionalPlan(plan, metropolis, realization);
  const assemblies = new Map(metropolis.lots.map(lot => [lot.id, planRichBuilding(lot, density.designs.get(lot.id)!)]));
  const landUseAt = (_: typeof plan, x: number, z: number, t = sampleTerrain(plan,x,z)) => regionalLandUseAt(plan,regions,x,z,t);
  const protectedSites = protections(plan);
  const planMs = performance.now() - started;
  const sample = (x: number, z: number) => sampleTerrain(plan, x, z);
  const terrainHeight = (x: number, z: number) => sample(x, z).height;
  const biomeAt = (x: number, z: number) => terrainName(plan, x, z);
  const inspect = (x: number, z: number) => ({ ...terrainSuitability(plan, x, z), generator: 10, ...(() => { const a=urbanAt(metropolis,x,z), design=a.lot?density.designs.get(a.lot.id):undefined; return { landUse:landUseAt(plan,x,z), family:design?.family, massing:design?.massing, roofProfile:design?.roofGrammar, facadeGrammar:design?.facadeGrammar, composition:design?.composition, landmark:landmarkAt(realization,x,z)?.name, district:a.district?.name, road:a.road?.kind, lot:a.lot?.id, archetype:a.lot?.archetype, roof:a.lot?.roofFamily, facade:a.lot?.facade }; })(),
    reservation: reservationAt(landmarks, x, z)?.id, plans: 1, planMs, reservations: landmarks.reservations.length });
  function generate(cx: number, cz: number) {
    const data = new BlockColumn(), ox = cx * 16, oz = cz * 16, w = new VoxelWriter(data, ox, oz);
    for (let z = 0; z < 16; z++) for (let x = 0; x < 16; x++) {
      const wx = ox + x, wz = oz + z, t = sample(wx, wz), a=urbanAt(metropolis,wx,wz), urban=t.urban;
      const pad=a.lot, road=a.road&&!a.road.id.startsWith("v8:settlement:")&&!a.road.id.startsWith("settlement:")?a.road:undefined, elevation=road?(road.owner?.startsWith("v7:")||road.owner?.startsWith("v8:")?Math.round(nearestRoadPoint(road,wx,wz).y*2)/2:roadElevation(plan,road,wx,wz)):pad?pad.baseY:t.elevation;
      const h=Math.floor(elevation),paddy=agriculturalTerrace(wx,wz);
      const biome = vegetationBiome(wx, wz, seed), caveRoof = caveRoofAt(regionAt(regions,wx,wz) ? {reservations:regions.sites.map(s=>s.reservation),diagnostics:[]} : landmarks, wx, wz, t.caveRoof);
      const use = landUseAt(plan,wx,wz,t), protectedLand = (realization.byChunk.get(`${cx},${cz}`)??[]).some(c=>wx>=c.bounds.x1-2&&wx<=c.bounds.x2+2&&wz>=c.bounds.z1-2&&wz<=c.bounds.z2+2)||reservationAt(landmarks,wx,wz)||regionAt(regions,wx,wz)||regionalRouteAt(regions,wx,wz);
      const managed = !urban&&!pad&&!road&&!paddy&&!t.water&&!protectedLand&&h>SEA&&!plan.connections.some(c=>footprintDistance({kind:"corridor",points:c.points,halfWidth:c.halfWidth},wx,wz)<3);
      for (let y = MIN_Y; y <= Math.max(SEA, h); y++) {
        let id: number = y > h ? B.Water : y === h ? road ? road.surface : pad ? B.Paving : urban ? a.district && !["scholar","highland"].includes(a.district.id) ? a.district.id === "hutong" || a.district.id === "artisan" ? B.Gravel : B.Paving : B.Grass
          : h < SEA + 1 ? B.Sand : t.region === "cliff" ? B.Stone : biome === "Snow Peaks" && h > 100 ? B.Snow : B.Grass : y > h - 4 ? B.Dirt : B.Stone;
        // Preserve v3 cave/geology distributions; only the surface protection roof varies.
        if (y > MIN_Y + 3 && y < h - caveRoof && ((Math.abs(noise3(wx / 27, y / 19, wz / 27, seed + 381) - .5) < .065 && noise3(wx / 43, y / 31, wz / 43, seed + 13) > .51) ||
          (y < -8 && noise3(wx / 36, y / 15, wz / 36, seed + 811) > .72)))
          id = y < -54 ? B.Lava : y < -28 && noise3(wx / 64, y / 32, wz / 64, seed + 719) > .68 ? B.Water : B.Air;
        if (id === B.Stone) {
          const r = hash(wx, wz, seed, y);
          if (r > .977) id = B.Coal; else if (r > .962 && y < 24) id = B.Iron; else if (r > .954 && y < -18) id = B.Jade; else if (r > .948 && y < -8) id = B.Gold;
        }
        if(a.canal && y>=17)id=y===17?B.SculptureStone:y<20?B.Water:road?road.surface:B.Air;
        // Dry routes across natural water are decks with the water below left
        // intact. Inland pads are local foundations, not regional flattening.
        if(road&&t.water&&y>t.height&&y<h)id=B.Water;
        if(pad&&y>=Math.min(t.height,h)-2&&y<=h)id=y===h?B.Paving:B.SculptureStone;
        if(pad&&t.water&&y>t.height&&y<=h)id=y===h?B.Planks:(wx-pad.x1)%6===0&&(wz-pad.z1)%6===0?B.DarkTimber:B.Water;
        if (paddy && y === h) id = wx === 350 || wx === 374 || (wz - 120) % 16 === 0 ? B.Moss : (wx - 351) % 7 === 0 ? B.Water : B.Farmland;
        if (id === B.Stone && y < -8) id = y < -36 ? B.Basalt : noise3(wx / 22, y / 7, wz / 22, seed + 300) > .63 ? B.Marble : B.Stone;
        data.set(x, y, z, y === MIN_Y ? B.Obsidian : id);
      }
      // Half-block terrace approaches preserve walking/NPC stepping without new architecture.
      if (elevation % 1 && !a.canal) data.set(x, h + 1, z, B.Slab);
      if(a.canal&&!road){data.set(x,18,z,B.Water);data.set(x,19,z,B.Water);}
      // Canal bridge parapets sit beside the five-block clear crossing.
      if(a.canal)for(const r of metropolis.roadsByChunk.get(`${cx},${cz}`)??[]){
        if(!r.id.startsWith("water-bridge-"))continue;
        const edge=Math.abs(wz-r.points[0].z);if(edge===r.half+1){data.set(x,20,z,B.Planks);data.set(x,21,z,B.Fence);}
      }
      if (paddy && data.get(x, h, z) === B.Farmland) data.set(x, h + 1, z, packed(B.Rice, 3));
      if(managed&&use==="tea-terrace") {
        // Small contour-shaped tea banks belong to the northern village;
        // broad v8 field matrices are not copied into the new world.
        const row=((h+Math.floor(wx/7))%5+5)%5;
        if(row<2&&noise(wx/18,wz/18,seed+963)>.42){data.set(x,h,z,B.Moss);if(row===0)data.set(x,h+1,z,packed(B.Tea,2));}
      } else if(managed&&use==="managed-orchard"&&((wx%12)+12)%12===0)data.set(x,h,z,B.Moss);
      else if(managed&&(use==="meadow"||use==="riverside")) {
        const patch=noise(wx/22,wz/22,seed+964);
        if(patch>.69&&h%9===0)data.set(x,h,z,B.Moss);
        else if(hash(wx,wz,seed,963)>.986)data.set(x,h+1,z,B.Flower);
      } else if(managed&&use==="scenic-rock") {
        const patch=noise(wx/14,wz/14,seed+864),contour=((h%7)+7)%7;
        data.set(x,h,z,patch>.61?B.Moss:patch>.43&&contour<4?B.Stone:B.Grass);
        if(patch<.43&&hash(wx,wz,seed,865)>.977)data.set(x,h+1,z,B.Flower);
      }
    }
    for (let z = oz - 4; z < oz + 20; z++) for (let x = ox - 4; x < ox + 20; x++) {
      if (inCity(x,z)||metropolis.districts.some(d=>contains(d.bounds,x,z))||agriculturalTerrace(x,z))continue;
      const t=sample(x,z),use=landUseAt(plan,x,z,t),orchard=use==="managed-orchard"&&x%12===0&&z%16===0;
      const wild=use==="wild-forest"&&forestTreeAllowed(seed,x,z)&&hash(x,z,seed+24)>.978;
      const boulder=use==="scenic-rock"&&x%16===0&&z%16===0&&hash(x,z,seed,866)>.35;
      if(!orchard&&!wild&&!boulder||t.height<=SEA||t.region==="cliff"||t.region==="ridge")continue;
      if([[-3,-3],[-3,3],[3,-3],[3,3],[0,0]].some(([dx,dz])=>{const a=urbanAt(metropolis,x+dx,z+dz);return a.lot||a.road;}))continue;
      if(regionAt(regions,x,z)||regionalRouteAt(regions,x,z)||landmarks.reservations.some(r=>footprintDistance(r.footprint,x,z)<=r.margin+4)||plan.connections.some(c=>footprintDistance({kind:"corridor",points:c.points,halfWidth:c.halfWidth},x,z)<=5))continue;
      if((realization.byChunk.get(`${Math.floor(x/16)},${Math.floor(z/16)}`)??[]).some(c=>x>=c.bounds.x1-4&&x<=c.bounds.x2+4&&z>=c.bounds.z1-4&&z<=c.bounds.z2+4))continue;
      const sx=Math.round((x-80)/160)*160+80,sz=Math.round((z-80)/160)*160+80;if(Math.abs(x-sx)<8&&Math.abs(z-sz)<8)continue;
      if(boulder) {
        if([[-1,-1],[-1,1],[1,-1],[1,1]].some(([dx,dz])=>Math.abs(sample(x+dx,z+dz).height-t.height)>2))continue;
        for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const ground=sample(x+dx,z+dz).height;w.fill(x+dx,ground+1,z+dz,x+dx,t.height+(dx===0&&dz===0?2:1),z+dz,dx===dz?B.Moss:B.Stone);}
      }else if(orchard)tree(w,x,t.height+1,z,Math.floor(x/12+z/16)%3===0,B.Log);
      else if(vegetationBiome(x,z,seed)==="Bamboo Forest")w.fill(x,t.height+1,z,x,t.height+7,z,B.Bamboo);
      else tree(w,x,t.height+1,z,vegetationBiome(x,z,seed)==="Cherry Blossom Valley",B.Log);
    }
    for(const lot of metropolis.lotsByChunk.get(`${cx},${cz}`)??[])drawRichLot(w,lot,density.designs.get(lot.id)!,assemblies.get(lot.id)!);
    if(ox<=metropolis.panda.x2+3&&ox+15>=metropolis.panda.x1-3&&oz<=metropolis.panda.z2+3&&oz+15>=metropolis.panda.z1-3)drawStructure(w,metropolis.panda);
    if(ox<=metropolis.gate.x2+3&&ox+15>=metropolis.gate.x1-3&&oz<=metropolis.gate.z2+3&&oz+15>=metropolis.gate.z1-3)drawStructure(w,metropolis.gate);
    drawUrbanStreets(w,plan,metropolis,cx,cz);
    // Keep discovery content, but reject its entire footprint against protected sites.
    for (let sz = Math.floor((oz - 5 - 80) / 160) * 160 + 80; sz < oz + 21; sz += 160)
      for (let sx = Math.floor((ox - 5 - 80) / 160) * 160 + 80; sx < ox + 21; sx += 160) {
        const footprint = { kind: "area" as const, bounds: { x1: sx - 4, x2: sx + 4, z1: sz - 4, z2: sz + 4 } };
        if (metropolis.districts.some(d=>contains(d.bounds,sx,sz)) || urbanAt(metropolis,sx,sz).road || agriculturalTerrace(sx, sz) || protectedSites.some(p => footprintsOverlap(footprint, p.footprint)) ||
          landmarks.reservations.some(r => footprintsOverlap(footprint, r.footprint, r.margin))) continue;
        const t = terrainSuitability(plan, sx, sz); if (!t.buildable) continue;
        const y = t.height + 1;
        for (let z = sz - 3; z <= sz + 3; z++) for (let x = sx - 3; x <= sx + 3; x++) {
          w.fill(x, Math.min(y - 1, terrainHeight(x, z)), z, x, y - 1, z, B.Moss);
          w.fill(x, y, z, x, y + 6, z, B.Air);
        }
        for (const x of [sx - 2, sx + 2]) for (const z of [sz - 2, sz + 2]) w.fill(x, y, z, x, y + 3, z, B.Red);
        w.fill(sx - 3, y + 4, sz - 3, sx + 3, y + 4, sz + 3, B.JadeRoof);
        w.fill(sx - 2, y + 5, sz - 2, sx + 2, y + 5, sz + 2, B.JadeRoof);
        w.put(sx, y, sz, B.Chest); w.put(sx, y + 3, sz, B.Lantern);
      }
    const mine = plan.mine;
    if (ox <= mine.entrance.x + mine.halfWidth && ox + 15 >= mine.entrance.x - mine.halfWidth && oz <= mine.end.z && oz + 15 >= mine.entrance.z) {
      const mineTop = terrainHeight(mine.entrance.x, mine.entrance.z);
      for (let z = Math.max(mine.entrance.z, oz); z <= Math.min(mine.end.z, oz + 15); z++) {
        const run = z - mine.entrance.z, y = mineTop - Math.floor(run / mine.stepRun);
        for (let x = mine.entrance.x - mine.halfWidth; x <= mine.entrance.x + mine.halfWidth; x++) {
          w.fill(x, y - 2, z, x, y + 3, z, B.Air); w.put(x, y - 1, z, B.Stone); w.put(x, y, z, run % 2 ? B.Slab : B.Planks);
          if (run > 5 && run % 8 === 0) { if (Math.abs(x - mine.entrance.x) === mine.halfWidth) w.fill(x, y + 1, z, x, y + 3, z, B.DarkTimber); w.put(x, y + 4, z, B.DarkTimber); }
        }
        if (run > 5 && run % 8 === 0) w.put(mine.entrance.x, y + 3, z, B.Lantern);
      }
    }
    drawLandmarks(w,plan,realization,cx,cz);
    drawRegions(w,plan,regions,cx,cz);
    drawLandscapeProgram(w,plan,regions.landscapes,(x,z)=>{
      const t=sample(x,z),a=urbanAt(metropolis,x,z),sx=Math.round((x-80)/160)*160+80,sz=Math.round((z-80)/160)*160+80;
      return !(Math.abs(x-sx)<8&&Math.abs(z-sz)<8)&&!protectedSites.some(p=>(p.kind==="mine"||p.kind==="route")&&footprintDistance(p.footprint,x,z)<3)&&!t.urban&&!t.water&&t.height>SEA&&t.region!=="cliff"&&t.region!=="ridge"&&!a.lot&&!a.road&&!a.canal&&!agriculturalTerrace(x,z)&&!regionAt(regions,x,z)&&!regionalRouteAt(regions,x,z)&&!reservationAt(landmarks,x,z)&&
        !(realization.byChunk.get(`${Math.floor(x/16)},${Math.floor(z/16)}`)??[]).some(c=>x>=c.bounds.x1-2&&x<=c.bounds.x2+2&&z>=c.bounds.z1-2&&z<=c.bounds.z2+2);
    });
    data.compact(); return data;
  }
  return { version: 10 as const, plan, landmarks, realization, city, metropolis, density, regions, assemblies, planMs, generate, terrainHeight, biomeAt, inspect };
}
