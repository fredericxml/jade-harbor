import { BlockColumn } from "../src/world/sections";
import { describe, it, expect } from "vitest";
import { World } from "../src/world/world";
import { B } from "../src/world/blocks";
import { packed, index, stateOf, idOf, blockKey } from "../src/core/coords";
import { Simulation, Furnace, tickFurnace } from "../src/game/simulation";
import { Entities, spawnEntity } from "../src/game/entities";
import { Inventory } from "../src/game/inventory";
import { Lighting } from "../src/world/lighting";
function emptyWorld() {
  const w = new World("test", {}, false);
  for (let cz = -1; cz <= 1; cz++)
    for (let cx = -1; cx <= 1; cx++) {
      const blocks = new BlockColumn();
      for (let z = 0; z < 16; z++)
        for (let x = 0; x < 16; x++) blocks.set(x, 0, z, B.Stone);
      w.chunks.set(`${cx},${cz}`, { cx, cz, blocks, revision: 0 });
    }
  return w;
}
describe("processing and safe storage", () => {
  it("consumes ore and fuel and produces iron only after the processing duration", () => {
    const f: Furnace = {
      slots: [{ id: B.Iron, count: 2 }, { id: 101, count: 1 }, null],
      burn: 0,
      progress: 0,
      recipe: 0,
    };
    tickFurnace(f, 2);
    expect(f.slots[2]).toBeNull();
    expect(f.slots[1]).toBeNull();
    tickFurnace(f, 2);
    expect(f.slots[2]).toEqual({ id: 102, count: 1 });
    expect(f.slots[0]?.count).toBe(1);
    const restored = JSON.parse(JSON.stringify(f));
    tickFurnace(restored, 4);
    expect(restored.slots[2].count).toBe(2);
  });
  it("does not burn new fuel or consume input when output is blocked", () => {
    const f: Furnace = {
      slots: [
        { id: B.Iron, count: 2 },
        { id: 101, count: 1 },
        { id: 102, count: 64 },
      ],
      burn: 0,
      progress: 0,
      recipe: 0,
    };
    tickFurnace(f, 10);
    expect(f.slots[1]?.count).toBe(1);
    expect(f.slots[0]?.count).toBe(2);
  });
  it("does not transfer items into nonexistent chest slots", () => {
    const chest = new Inventory(
      Array.from({ length: 27 }, () => ({ id: B.Stone, count: 64 })),
      27,
    );
    expect(chest.add(B.Log, 1)).toBe(1);
    expect(chest.slots.length).toBe(27);
  });
});
describe("world systems", () => {
  it("grows irrigated rice and leaves a dry crop unchanged", () => {
    const w = emptyWorld();
    w.set(2, 1, 2, B.Farmland);
    w.set(2, 2, 2, B.Rice);
    w.set(1, 1, 2, B.Water);
    w.set(12, 1, 12, B.Farmland);
    w.set(12, 2, 12, B.Rice);
    const sim = new Simulation(w);
    for (let i = 0; i < 2400; i++) sim.tick(0.05, { x: 0, y: 2, z: 0 });
    expect(stateOf(w.get(2, 2, 2))).toBe(3);
    expect(stateOf(w.get(12, 2, 12))).toBe(0);
  });
  it("propagates switch power across a chunk boundary and closes door when off", () => {
    const w = emptyWorld();
    w.set(14, 1, 0, packed(B.Switch, 1));
    w.set(15, 1, 0, B.Wire);
    w.set(16, 1, 0, B.Wire);
    w.set(17, 1, 0, B.Door);
    w.set(17, 2, 0, packed(B.Door, 8));
    w.set(16, 1, 1, B.Lamp);
    const sim = new Simulation(w);
    sim.indexChunks();
    sim.circuits();
    expect(stateOf(w.get(17, 1, 0)) & 4).toBe(4);
    expect(stateOf(w.get(17, 2, 0)) & 4).toBe(4);
    expect(stateOf(w.get(16, 1, 1))).toBe(1);
    w.set(14, 1, 0, B.Switch);
    sim.indexChunks();
    sim.circuits();
    expect(stateOf(w.get(17, 1, 0)) & 4).toBe(0);
    expect(stateOf(w.get(17, 2, 0)) & 4).toBe(0);
    expect(stateOf(w.get(16, 1, 1))).toBe(0);
  });
  it("moves placed water downward with bounded work", () => {
    const w = emptyWorld();
    w.set(4, 4, 4, B.Water);
    const sim = new Simulation(w);
    sim.changed(4, 4, 4);
    for (let n = 0; n < 20; n++) sim.updates(64);
    expect(idOf(w.get(4, 1, 4))).toBe(B.Water);
    expect(w.edits.size).toBeLessThan(1000);
  });
  it("turns lava contacting water into stone", () => {
    const w = emptyWorld();
    w.set(4, 1, 4, B.Water);
    w.set(5, 1, 4, B.Lava);
    const sim = new Simulation(w);
    sim.changed(4, 1, 4);
    sim.updates(64);
    expect([B.Stone, B.Obsidian]).toContain(w.get(5, 1, 4));
  });
  it("settles gravel under gravity", () => {
    const w = emptyWorld();
    w.set(4, 4, 4, B.Gravel);
    const sim = new Simulation(w);
    sim.changed(4, 4, 4);
    for (let n = 0; n < 4; n++) sim.updates(64);
    expect(w.get(4, 1, 4)).toBe(B.Gravel);
    expect(w.get(4, 4, 4)).toBe(0);
  });
});
describe("light and entities", () => {
  it("propagates and removes lantern lighting across chunk edges", () => {
    const w = emptyWorld();
    w.set(15, 3, 3, B.Lantern);
    const l = new Lighting(w);
    l.rebuild();
    expect(l.blockLight.get("16,3,3")).toBe(13);
    expect(l.blockLight.get("17,3,3")).toBe(12);
    w.set(15, 3, 3, 0);
    l.rebuild();
    expect(l.blockLight.size).toBe(0);
  });
  it("blocks light with opaque walls", () => {
    const w = emptyWorld();
    w.set(4, 3, 4, B.Lantern);
    w.set(5, 3, 4, B.Stone);
    const l = new Lighting(w);
    l.rebuild();
    expect(l.blockLight.get("5,3,4")).toBeUndefined();
  });
  it("collects drops atomically and retains them when the inventory is full", () => {
    const w = emptyWorld(),
      e = new Entities(w, { entities: [] }),
      i = new Inventory();
    e.drop({ id: 6, count: 3 }, { x: 0, y: 1.7, z: 0 });
    for (let n = 0; n < 20; n++)
      e.tick(
        0.05,
        { x: 0, y: 1, z: 0 },
        i,
        0.2,
        false,
        () => {},
        () => {},
      );
    expect(i.count(6)).toBe(3);
    expect(e.drops.length).toBe(0);
    const full = new Inventory(
      Array.from({ length: 36 }, () => ({ id: 3, count: 64 })),
    );
    e.drop({ id: 6, count: 2 }, { x: 0, y: 1.7, z: 0 });
    for (let n = 0; n < 20; n++)
      e.tick(
        0.05,
        { x: 0, y: 1, z: 0 },
        full,
        0.2,
        false,
        () => {},
        () => {},
      );
    expect(e.drops[0].stack.count).toBe(2);
  });
  it("kills a hostile and creates a real collectible reward", () => {
    const w = emptyWorld(),
      e = new Entities(w, { entities: [] }),
      spirit = spawnEntity("spirit", { x: 0, y: 1, z: 0 });
    e.list.push(spirit);
    expect(e.attack(spirit, 20, { x: 1, y: 0, z: 0 })).toBe(true);
    expect(e.drops[0].stack.id).toBe(103);
  });
});
import { matchGrid, craftGrid } from "../src/game/crafting";
describe("shaped crafting", () => {
  it("matches a shifted 2x2 recipe and consumes exact ingredients", () => {
    const grid = [null, { id: 6, count: 2 }, null, null],
      inv = new Inventory();
    expect(matchGrid(grid, 2)?.output).toEqual([8, 4]);
    expect(craftGrid(grid, 2, inv)).toBe(true);
    expect(grid[1]?.count).toBe(1);
    expect(inv.count(8)).toBe(4);
  });
  it("matches mirrored axe patterns but rejects extra ingredients", () => {
    const g = [
      null,
      { id: 8, count: 1 },
      { id: 8, count: 1 },
      null,
      { id: 104, count: 1 },
      { id: 8, count: 1 },
      null,
      { id: 104, count: 1 },
      null,
    ];
    expect(matchGrid(g, 3)?.output[0]).toBe(121);
    g[0] = { id: 3, count: 1 };
    expect(matchGrid(g, 3)).toBeNull();
  });
});
import { Equipment } from "../src/game/equipment";
describe("equipment and combat protection", () => {
  it("accepts only the matching armor slot and preserves rejected items", () => {
    const inv = new Inventory();
    inv.cursor = { id: 151, count: 1, durability: 180 };
    expect(inv.equipment.click(0, inv)).toBe(false);
    expect(inv.cursor.id).toBe(151);
    expect(inv.equipment.click(1, inv)).toBe(true);
    expect(inv.cursor).toBeNull();
    expect(inv.equipment.protection).toBe(6);
  });
  it("equips a held armor item without losing the previous equipment", () => {
    const inv = new Inventory();
    inv.add(150);
    inv.equipment.slots[0] = { id: 154, count: 1, durability: 100 };
    expect(inv.equipment.equipHeld(inv)).toBe(true);
    expect(inv.held?.id).toBe(154);
    expect(inv.equipment.slots[0]?.id).toBe(150);
  });
  it("reduces melee damage, consumes durability, and breaks worn armor", () => {
    const armor = new Equipment([
      { id: 154, count: 1, durability: 1 },
      { id: 155, count: 1, durability: 420 },
      { id: 156, count: 1, durability: 440 },
      { id: 157, count: 1, durability: 460 },
    ]);
    expect(armor.absorb(10)).toBeCloseTo(2);
    expect(armor.slots[0]).toBeNull();
    expect(armor.slots[1]?.durability).toBe(418);
    expect(armor.protection).toBe(17);
  });
  it("matches the shaped helmet recipe and creates durable equipment", () => {
    const grid = [
      { id: 102, count: 1 },
      { id: 102, count: 1 },
      { id: 102, count: 1 },
      { id: 102, count: 1 },
      null,
      { id: 102, count: 1 },
      null,
      null,
      null,
    ];
    const inv = new Inventory();
    expect(craftGrid(grid, 3, inv)).toBe(true);
    expect(inv.slots[0]).toEqual({ id: 150, count: 1, durability: 160 });
    expect(grid.filter(Boolean)).toHaveLength(0);
  });
});
import { validateSave, SaveData } from "../src/persistence/saves";
describe("complete save validation", () => {
  const valid = (): SaveData => ({
    version: 1,
    generator: 3,
    format: "jade-harbor-engine",
    id: "validation",
    name: "test",
    seed: "s",
    mode: "survival",
    created: 1,
    updated: 1,
    time: 0.2,
    weather: "clear",
    edits: {},
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
      armor: [null, { id: 151, count: 1, durability: 180 }, null, null],
    },
    achievements: [],
  });
  it("preserves equipment, cursor, kiln and containers in a complete snapshot", () => {
    const d = valid();
    d.player.cursor = { id: 8, count: 3 };
    d.simulation = {
      containers: { "0,22,0": Array(27).fill(null) },
      furnaces: {
        "1,22,0": {
          slots: [{ id: 19, count: 1 }, null, { id: 102, count: 1 }],
          burn: 5,
          progress: 2,
          recipe: 19,
        },
      },
    };
    expect(validateSave(JSON.parse(JSON.stringify(d)))).toEqual(d);
  });
  it("rejects mismatched equipment, unwearable tool imports and malformed container sizes", () => {
    const d = valid();
    d.player.armor![0] = { id: 151, count: 1, durability: 180 };
    expect(() => validateSave(d)).toThrow();
    const t = valid();
    t.player.slots[0] = { id: 120, count: 1 };
    expect(() => validateSave(t)).toThrow();
    const c = valid();
    c.simulation = { containers: { "0,22,0": [] } };
    expect(() => validateSave(c)).toThrow();
  });
});
