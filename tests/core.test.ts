import { BlockColumn } from "../src/world/sections";
import { beforeAll, describe, it, expect } from "vitest";
import { chunkCoord, localCoord, index, packed } from "../src/core/coords";
import { generateChunk, generatorFor } from "../src/world/generator";
import { World } from "../src/world/world";
import { B } from "../src/world/blocks";
import { raycast } from "../src/player/raycast";
import { moveBody, Body, collides } from "../src/player/physics";
import { Inventory, RECIPES } from "../src/game/inventory";
import { meshChunk } from "../src/render/mesher";
import "fake-indexeddb/auto";
import {
  writeSave,
  listSaves,
  loadSave,
  validateSave,
  SaveData,
} from "../src/persistence/saves";
describe("coordinates and generation", () => {
  beforeAll(()=>{generatorFor("seed");generatorFor("other");},20000);
  it("maps negative coordinates without seams", () => {
    expect(chunkCoord(-1)).toBe(-1);
    expect(localCoord(-1)).toBe(15);
    expect(chunkCoord(-16)).toBe(-1);
    expect(localCoord(-16)).toBe(0);
    expect(index(15, 79, 15)).toBe(20479);
  });
  it("produces deterministic seeded chunks and different terrain for different seeds", () => {
    expect(generateChunk(7, -4, "seed")).toEqual(generateChunk(7, -4, "seed"));
    expect(generateChunk(7, -4, "seed")).not.toEqual(
      generateChunk(7, -4, "other"),
    );
  });
  it("applies edits arriving before generation, and persists across eviction", () => {
    const w = new World("a", {}, false);
    w.set(-1, 25, -1, B.Red);
    w.ensure(-1, -1, true);
    expect(w.get(-1, 25, -1)).toBe(B.Red);
    w.chunks.clear();
    w.ensure(-1, -1, true);
    expect(w.get(-1, 25, -1)).toBe(B.Red);
  });
  it("marks both sides of a chunk boundary dirty", () => {
    const w = new World("a", {}, false);
    w.ensure(0, 0, true);
    w.ensure(1, 0, true);
    w.dirty.clear();
    w.set(15, 21, 2, B.Red);
    expect(w.dirty.has("0,1,0")).toBe(true);
    expect(w.dirty.has("1,1,0")).toBe(true);
  });
  it("protects bedrock and height limits", () => {
    const w = new World("a", {}, false);
    expect(w.set(0, -64, 0, 0)).toBe(false);
    expect(w.set(0, 320, 0, 1)).toBe(false);
  });
});
describe("logical raycast and physics", () => {
  it("targets a block and gives the adjacent placement normal", () => {
    const hit = raycast(
      (x, y, z) => (x === -2 && y === 1 && z === 0 ? B.Stone : 0),
      { x: 0.5, y: 1.5, z: 0.5 },
      { x: -1, y: 0, z: 0 },
    );
    expect(hit?.x).toBe(-2);
    expect(hit?.normal.x).toBe(1);
    expect(hit?.distance).toBe(1.5);
  });
  it("does not hit out of reach", () =>
    expect(
      raycast(
        (x) => (x === 8 ? 3 : 0),
        { x: 0.5, y: 0.5, z: 0.5 },
        { x: 1, y: 0, z: 0 },
        5,
      ),
    ).toBeNull());
  it("lands on the ground and cannot tunnel through a wall at speed", () => {
    const world = {
      get: (x: number, y: number, z: number) =>
        y < 1 || (x === 3 && y < 5) ? B.Stone : 0,
    };
    const body: Body = {
      position: { x: 0, y: 6, z: 0 },
      velocity: { x: 0, y: -38, z: 0 },
      grounded: false,
      flying: false,
      fallStart: 6,
    };
    for (let i = 0; i < 10; i++) {
      body.velocity.y = -38;
      moveBody(world, body, 0.05);
    }
    expect(body.position.y).toBeGreaterThanOrEqual(1);
    expect(body.position.y).toBeLessThan(1.2);
    expect(body.grounded).toBe(true);
    body.velocity = { x: 100, y: 0, z: 0 };
    moveBody(world, body, 0.1);
    expect(body.position.x).toBeLessThan(2.72);
    expect(collides(world, body.position)).toBe(false);
  });
  it("respects half-block collision", () => {
    const world = {
      get: (x: number, y: number, z: number) =>
        x === 0 && y === 1 && z === 0 ? B.Slab : 0,
    };
    expect(collides(world, { x: 0.5, y: 1.51, z: 0.5 })).toBe(false);
    expect(collides(world, { x: 0.5, y: 1.4, z: 0.5 })).toBe(true);
  });
});
describe("chunk meshes", () => {
  it("culls touching opaque faces and reveals a removed block", () => {
    const w = new World("a", {}, false);
    const c = { cx: 0, cz: 0, blocks: new BlockColumn(), revision: 0 };
    w.chunks.set("0,0", c);
    c.blocks.set(2, 2, 2, B.Stone);
    c.blocks.set(3, 2, 2, B.Stone);
    expect(meshChunk(w, c)[0].indices.length).toBe(60);
    w.set(2, 2, 2, 0);
    expect(meshChunk(w, c)[0].indices.length).toBe(36);
  });
  it("retains solid faces behind transparent water", () => {
    const w = new World("a", {}, false);
    const c = { cx: 0, cz: 0, blocks: new BlockColumn(), revision: 0 };
    w.chunks.set("0,0", c);
    c.blocks.set(2, 2, 2, B.Stone);
    c.blocks.set(3, 2, 2, B.Water);
    expect(meshChunk(w, c)[0].indices.length).toBe(36);
    expect(meshChunk(w, c)[1].indices.length).toBe(30);
  });
});
describe("inventory and progression", () => {
  it("stacks, splits and merges without duplication", () => {
    const i = new Inventory();
    expect(i.add(8, 130)).toBe(0);
    expect(i.slots.slice(0, 3).map((s) => s?.count)).toEqual([64, 64, 2]);
    i.click(0, true);
    expect(i.cursor?.count).toBe(32);
    i.click(2);
    expect(i.slots[2]?.count).toBe(34);
    expect(i.count(8)).toBe(130);
  });
  it("crafts logs to planks to bench and tools with exact ingredient consumption", () => {
    const i = new Inventory();
    i.add(6, 4);
    const craft = (name: string) => {
      const r = RECIPES.find((r) => r.id === name)!;
      return i.transaction(r.cost, r.output);
    };
    for (let n = 0; n < 4; n++) expect(craft("planks")).toBe(true);
    expect(craft("bench")).toBe(true);
    expect(craft("sticks")).toBe(true);
    expect(craft("tool-120")).toBe(true);
    expect(i.count(120)).toBe(1);
    expect(i.count(8)).toBe(7);
    expect(i.count(104)).toBe(2);
  });
  it("rolls back an atomic craft when the output will not fit", () => {
    const i = new Inventory(
      Array.from({ length: 36 }, () => ({ id: 8, count: 64 })),
    );
    const before = JSON.stringify(i.slots);
    expect(i.transaction([[8, 1]], [25, 1])).toBe(false);
    expect(JSON.stringify(i.slots)).toBe(before);
  });
  it("deletes a broken tool and preserves durability while moving", () => {
    const i = new Inventory();
    i.add(120, 1, 1);
    i.wear();
    expect(i.held).toBeNull();
    i.add(125, 1, 50);
    i.click(0);
    i.click(3);
    expect(i.slots[3]?.durability).toBe(50);
  });
});
describe("persistent save round trip", () => {
  const data: SaveData = {
    version: 1,
    generator: 3,
    format: "jade-harbor-engine",
    id: "test",
    name: "test",
    seed: "s",
    mode: "creative",
    created: 1,
    updated: 2,
    time: 0.2,
    weather: "clear",
    edits: { "-1,23,15": packed(B.Door, 4) },
    player: {
      position: { x: 0, y: 21, z: 0 },
      spawn: { x: 0, y: 21, z: 0 },
      yaw: 0,
      pitch: 0,
      health: 20,
      hunger: 20,
      xp: 0,
      slots: new Inventory().slots,
      selected: 0,
    },
    achievements: [],
  };
  it("commits and restores world edits via IndexedDB", async () => {
    await writeSave(data);
    const restored = await loadSave("test");
    expect(validateSave(restored)).toMatchObject(data);
    const world = new World(restored.seed, restored.edits, false);
    world.ensure(-1, 0, true);
    expect(world.get(-1, 23, 15)).toBe(packed(B.Door, 4));
  });
  it("rejects corrupt or incompatible imports", () => {
    expect(() => validateSave({ ...data, version: 999 })).toThrow();
    expect(() => validateSave({ ...data, edits: { "0,999,0": 3 } })).toThrow();
  });
});
describe("advanced collision shapes", () => {
  it("walks up a half slab without walking through a full block", () => {
    const w = {
      get: (x: number, y: number, z: number) =>
        y === 0
          ? B.Stone
          : x === 1 && y === 1
            ? B.Slab
            : x === 3 && y < 4
              ? B.Stone
              : 0,
    };
    const b: Body = {
      position: { x: 0.5, y: 1.01, z: 0.5 },
      velocity: { x: 3, y: -1, z: 0 },
      grounded: true,
      flying: false,
      fallStart: 1.01,
    };
    for (let n = 0; n < 8; n++) {
      b.velocity.x = 3;
      b.velocity.y = -1;
      moveBody(w, b, 0.05);
    }
    expect(b.position.x).toBeGreaterThan(1);
    expect(b.position.y).toBeGreaterThanOrEqual(1.5);
  });
});
describe("streaming collision and persistence safeguards", () => {
  it("does not cross into an unloaded horizontal chunk", () => {
    const w = { get: () => 0, loaded: (x: number) => x < 16 },
      b: Body = {
        position: { x: 15.8, y: 4, z: 0 },
        velocity: { x: 18, y: 0, z: 0 },
        grounded: false,
        flying: true,
        fallStart: 4,
      };
    moveBody(w, b, 0.2);
    expect(b.position.x).toBeLessThan(16);
    expect(b.velocity.x).toBe(0);
  });
  it("can synchronously resolve a pending spawn chunk without a late worker overwriting edits", () => {
    const w = new World("test", {}, false);
    w.pending.add("0,0");
    w.set(2, 22, 2, B.Lantern);
    w.ensure(0, 0, true);
    expect(w.loaded(2, 2)).toBe(true);
    expect(w.pending.has("0,0")).toBe(false);
    w.accept(0, 0, new BlockColumn());
    expect(w.get(2, 22, 2)).toBe(B.Lantern);
  });
  it("restores indexed edits only to their own chunks after eviction", () => {
    const w = new World(
      "test",
      { "1,40,1": B.Red, "-1,40,-1": B.Lantern },
      false,
    );
    w.ensure(0, 0, true);
    w.ensure(-1, -1, true);
    expect(w.get(1, 40, 1)).toBe(B.Red);
    expect(w.get(-1, 40, -1)).toBe(B.Lantern);
    w.set(-1, 40, -1, B.Paper);
    w.chunks.clear();
    w.ensure(-1, -1, true);
    expect(w.get(-1, 40, -1)).toBe(B.Paper);
  });
});
