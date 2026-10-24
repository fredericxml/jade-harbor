import { describe, it, expect, vi } from "vitest";
import "fake-indexeddb/auto";
import {
  freshWorld,
  writeSave,
  loadSave,
  listSaves,
  resetSave,
  deleteSave,
  encodeEdits,
  validateSave,
  DATABASE_NAME,
} from "../src/persistence/saves";
import { World } from "../src/world/world";
import { B } from "../src/world/blocks";
import { packed } from "../src/core/coords";
describe("schema 1 atomic chunk delta saves", () => {
  it("round trips removals, negative boundaries, house and panda edits with player state", async () => {
    const d = freshWorld("delta", "jade-harbor", "creative");
    d.edits = {
      "-1,20,-16": 0,
      "-16,25,-17": B.Red,
      "0,36,-45": 0,
      "12,25,24": B.Porcelain,
      "16,21,16": packed(B.Door, 4),
    };
    d.player.position = { x: -15.5, y: 29, z: -19.5 };
    d.player.selected = 7;
    d.player.yaw = 0.7;
    d.player.pitch = -0.4;
    const rev = await writeSave(d);
    expect(rev).toBe(1);
    expect(await loadSave(d.id)).toMatchObject({ ...d, revision: 1 });
    expect(
      encodeEdits(d.edits).every((c) => c.entries instanceof Uint16Array),
    ).toBe(true);
  });
  it("commits only dirty chunks without dropping unchanged edits", async () => {
    const d = freshWorld("incremental", "a", "creative");
    d.edits = { "1,25,1": B.Red, "-16,25,-1": B.Porcelain };
    let revision = await writeSave(d);
    const world = new World(d.seed, d.edits, false);
    world.set(1, 25, 1, 0);
    const captured = world.captureChanges();
    expect(captured.chunks).toHaveLength(1);
    revision = await writeSave(
      { ...d, edits: {}, time: 0.6 },
      captured.chunks,
      revision,
    );
    world.acknowledgeChanges(captured.revisions);
    expect(world.captureChanges().chunks).toHaveLength(0);
    const saved = await loadSave(d.id);
    expect(saved.edits).toEqual({ "1,25,1": 0, "-16,25,-1": B.Porcelain });
    expect(saved.time).toBe(0.6);
  });
  it("does not acknowledge a newer mutation when an older transaction finishes", () => {
    const w = new World("a", {}, false);
    w.set(-1, 25, -1, B.Red);
    const old = w.captureChanges();
    w.set(-2, 25, -1, B.Glass);
    w.acknowledgeChanges(old.revisions);
    expect(w.captureChanges().chunks).toHaveLength(1);
    expect(w.captureChanges().chunks[0].entries).toHaveLength(4);
  });
  it("isolates two worlds and resets only the selected slot to its deterministic seed", async () => {
    const a = freshWorld("A", "city-a", "creative"),
      b = freshWorld("B", "city-b", "survival");
    a.edits = { "0,35,-45": 0 };
    b.edits = { "0,35,-45": B.Gold };
    await writeSave(a);
    await writeSave(b);
    const fresh = await resetSave(a.id);
    expect(fresh.id).toBe(a.id);
    expect(fresh.seed).toBe("city-a");
    expect((await loadSave(a.id)).edits).toEqual({});
    expect((await loadSave(b.id)).edits).toEqual(b.edits);
    await deleteSave(a.id);
    await expect(loadSave(a.id)).rejects.toThrow("no longer available");
    expect((await listSaves()).some((s) => s.id === b.id)).toBe(true);
  });
  it("rejects stale parallel-tab writes atomically, preserving previous blocks and player state", async () => {
    const d = freshWorld("conflict", "a", "creative");
    const r = await writeSave(d);
    await writeSave({ ...d, time: 0.4 }, encodeEdits({ "1,25,1": B.Gold }), r);
    await expect(
      writeSave({ ...d, time: 0.8 }, encodeEdits({ "1,25,1": 0 }), r),
    ).rejects.toThrow("Another tab");
    const saved = await loadSave(d.id);
    expect(saved.time).toBe(0.4);
    expect(saved.edits["1,25,1"]).toBe(B.Gold);
  });
  it("preserves explicit removals while evicting, generating and reloading a panda chunk", async () => {
    const d = freshWorld("sculpture", "jade-harbor", "creative"),
      w = new World(d.seed, {}, false);
    w.ensure(0, -3, true);
    expect(w.get(0, 35, -45)).not.toBe(0);
    w.set(0, 35, -45, 0);
    w.set(1, 35, -45, B.Jade);
    await writeSave({ ...d, edits: Object.fromEntries(w.edits) });
    w.chunks.clear();
    w.ensure(0, -3, true);
    expect(w.get(0, 35, -45)).toBe(0);
    const restored = await loadSave(d.id),
      newWorld = new World(restored.seed, restored.edits, false);
    newWorld.ensure(0, -3, true);
    expect(newWorld.get(0, 35, -45)).toBe(0);
    expect(newWorld.get(1, 35, -45)).toBe(B.Jade);
  });
  it("surfaces database failures and retains a retryable dirty edit buffer", async () => {
    const d = freshWorld("failure", "a", "creative"),
      w = new World("a", {}, false);
    w.set(1, 25, 1, B.Jade);
    const spy = vi.spyOn(indexedDB, "open").mockImplementation(() => {
      throw new DOMException("Storage unavailable", "QuotaExceededError");
    });
    await expect(writeSave(d, w.captureChanges().chunks)).rejects.toThrow(
      "Storage unavailable",
    );
    expect(w.captureChanges().chunks).toHaveLength(1);
    spy.mockRestore();
    await writeSave(d, w.captureChanges().chunks);
    expect((await loadSave(d.id)).edits["1,25,1"]).toBe(B.Jade);
  });
  it("rejects all legacy formats and generator versions without migration", () => {
    const d = freshWorld("format", "a", "creative");
    expect(() => validateSave({ ...d, generator: 1 })).toThrow();
    expect(() => validateSave({ ...d, format: undefined })).toThrow();
    expect(DATABASE_NAME).toBe("jade-harbor-engine-v1");
  });
});
