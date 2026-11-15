#!/usr/bin/env node
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".ts"] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText.replace(/import\.meta\.url/g, '"file:///generation.worker.ts"'), file);
const { World } = require("../src/world/world.ts");
const { BlockColumn } = require("../src/world/sections.ts");
const { Lighting } = require("../src/world/lighting.ts");
const { B } = require("../src/world/blocks.ts");

function digest(lighting) {
  return JSON.stringify({
    sky: [...lighting.sky].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,Array.from(v)]),
    block: [...lighting.blockLightSections].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,Buffer.from(v).toString("hex")]),
    count: lighting.blockLightCount,
  });
}
function finish(lighting, max = 10000) {
  let steps=0;
  while (lighting.pending && steps++ < max) lighting.update(100);
  assert.ok(steps < max, "lighting job must settle");
}

test("game loops wake lighting for urgent edits and settled topology without polling stale snapshots", () => {
  const game=fs.readFileSync(require("node:path").join(__dirname,"../src/core/game.ts"),"utf8");
  assert.equal((game.match(/this\.lighting\.pending \|\| this\.lighting\.needsUpdate/g)||[]).length,2,
    "active gameplay and menu frame loops both observe the coalesced lighting wake-up");
});

test("World separates block-edit and chunk-topology revisions while retaining nav revision", () => {
  const world = new World("lighting-revisions", {}, false, 4);
  try {
    world.accept(0, 0, new BlockColumn());
    assert.equal(world.navRevision, 1);
    assert.equal(world.chunkTopologyRevision, 1);
    assert.equal(world.lightingEditRevision, 0);
    world.set(2, 30, 2, B.Lantern);
    assert.equal(world.navRevision, 2);
    assert.equal(world.chunkTopologyRevision, 1);
    assert.equal(world.lightingEditRevision, 1);
    world.acknowledgeChanges(world.captureChanges().revisions);
    const topologyBeforeEviction=world.chunkTopologyRevision;
    const removed=world.stream(160,0,0,0);
    assert.ok(removed.includes("0,0"),"distant old column is evicted by the normal stream path");
    assert.ok(world.chunkTopologyRevision>=topologyBeforeEviction+2,
      "accepting the new column and evicting the old column both advance topology revision");
  } finally { world.dispose(); }
});

test("lighting coalesces streaming topology churn into one final rebuild with exact output parity", () => {
  const world = new World("lighting-coalesce", {}, false, 4);
  const lighting = new Lighting(world);
  try {
    const initial = new BlockColumn();
    initial.set(8, 30, 8, B.Lantern);
    world.accept(0, 0, initial);

    let computeStarts=0;
    const originalCompute=lighting.compute.bind(lighting);
    lighting.compute=function*(){computeStarts++;return yield* originalCompute();};

    // Begin a staged job on the current stable topology.
    lighting.update(0);
    assert.equal(lighting.pending, true);
    assert.equal(computeStarts, 1);

    // Eight queued chunk requests model the world's existing worker cap.
    for(let i=1;i<=8;i++)world.pending.add(`${i},0`);
    for(let i=1;i<=8;i++){
      const blocks=new BlockColumn();
      if(i===4)blocks.set(8,30,8,B.Lantern);
      world.accept(i,0,blocks);
      if(i<8){
        lighting.update(4);
        assert.equal(lighting.pending,false,"stale topology work is cancelled once and held while more chunks remain");
        assert.equal(lighting.needsUpdate,false,"topology-only work does not restart while the stream is unsettled");
      }
    }

    assert.equal(world.pending.size,0);
    assert.equal(lighting.needsUpdate,true,"settled topology immediately exposes one rebuild request");
    lighting.update(100);
    finish(lighting);
    assert.equal(computeStarts,2,"one stale job plus one stable rebuild; no restart per accepted chunk");

    const reference=new Lighting(world);
    reference.rebuild();
    assert.equal(digest(lighting),digest(reference),"coalesced output must exactly match a full stable rebuild");
    reference.dispose();
  } finally { lighting.dispose(); world.dispose(); }
});

test("lighting preserves an urgent block-edit attempt while chunks are pending", () => {
  const world = new World("lighting-urgent-edit", {}, false, 4);
  const lighting = new Lighting(world);
  try {
    const blocks=new BlockColumn();
    blocks.set(8,30,8,B.Lantern);
    world.accept(0,0,blocks);
    lighting.rebuild();

    world.pending.add("1,0");
    world.set(8,30,8,B.Air);
    assert.equal(lighting.needsUpdate,true,"new block edits request one urgent lighting pass even while streaming");
    lighting.update(0);
    assert.equal(lighting.pending,true,"urgent edit starts without waiting for the chunk queue to drain");
    assert.equal(lighting.needsUpdate,false,"the same edit revision is not repeatedly rescheduled");
    finish(lighting);

    const reference=new Lighting(world);
    reference.rebuild();
    assert.equal(digest(lighting),digest(reference),"urgent block-edit output matches the stable reference");
    reference.dispose();
  } finally { lighting.dispose(); world.dispose(); }
});

test("lighting defers a topology-invalidated urgent edit once, then commits the exact latest state", () => {
  const world = new World("lighting-edit-topology", {}, false, 4);
  const lighting = new Lighting(world);
  try {
    const blocks=new BlockColumn();
    blocks.set(8,30,8,B.Lantern);
    world.accept(0,0,blocks);
    lighting.rebuild();

    world.pending.add("1,0");
    world.set(8,30,8,B.Air);
    lighting.update(0);
    assert.equal(lighting.pending,true);

    const added=new BlockColumn();
    added.set(8,30,8,B.Lantern);
    world.accept(1,0,added);
    world.pending.add("2,0");
    lighting.update(0);
    assert.equal(lighting.pending,false,"topology change invalidates the urgent snapshot");
    assert.equal(lighting.needsUpdate,false,"the attempted edit is not restarted on every topology revision");

    world.pending.delete("2,0");
    assert.equal(lighting.needsUpdate,true,"stable topology re-enables the final pass");
    lighting.update(100);
    finish(lighting);

    const reference=new Lighting(world);
    reference.rebuild();
    assert.equal(digest(lighting),digest(reference),"latest block and chunk state is reflected exactly");
    reference.dispose();
  } finally { lighting.dispose(); world.dispose(); }
});

console.log("PASS lighting revision coalescing: topology churn, urgent edits, stale cancellation and final output parity.");
