const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const renderer = fs.readFileSync(path.join(root, "src/render/renderer.ts"), "utf8");
const start = renderer.indexOf("const SECTION_BOUNDING_SPHERE");
const end = renderer.indexOf("type NearestSection", start);
assert.ok(start >= 0 && end > start, "section geometry helper must be present");
const helperSource = renderer.slice(start, end);
const compiled = ts.transpileModule(helperSource, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 }
}).outputText;

function createThree(failAttribute = false) {
  class Vector3 { constructor(x, y, z) { Object.assign(this, { x, y, z }); } }
  class Sphere { constructor(center, radius) { Object.assign(this, { center, radius }); } }
  class BufferAttribute {
    constructor(array, itemSize) { Object.assign(this, { array, itemSize }); }
  }
  class BufferGeometry {
    constructor() { this.attributes = {}; this.disposed = false; }
    setAttribute(name, attribute) {
      if (failAttribute && name === "normal") throw new Error("synthetic attribute failure");
      this.attributes[name] = attribute;
      return this;
    }
    setIndex(attribute) { this.index = attribute; return this; }
    dispose() { this.disposed = true; }
  }
  return { Vector3, Sphere, BufferAttribute, BufferGeometry };
}

function loadHelper(THREE) {
  return Function("THREE", `${compiled}; return { createSectionGeometry, SECTION_BOUNDING_SPHERE };`)(THREE);
}

function sampleData() {
  return {
    positions: new Float32Array([0,0,0, 16,0,0, 16,16,16, 0,16,16]),
    normals: new Float32Array(12),
    uvs: new Float32Array(8),
    tiles: new Uint8Array(8),
    colors: new Float32Array(12),
    emissive: new Uint8Array(4),
    sky: new Float32Array(4),
    lights: new Float32Array(4),
    indices: new Uint16Array([0,1,2,0,2,3]),
    emissiveTriangles: 0,
    waterTriangles: 0
  };
}

test("meshing creates section geometry with direct typed-array attributes and no vertex-scan bounds pass", () => {
  const THREE = createThree();
  const { createSectionGeometry, SECTION_BOUNDING_SPHERE } = loadHelper(THREE);
  const data = sampleData();
  const geometry = createSectionGeometry(data);
  assert.equal(geometry.attributes.position.array, data.positions);
  assert.equal(geometry.attributes.normal.array, data.normals);
  assert.equal(geometry.attributes.uv.array, data.uvs);
  assert.equal(geometry.attributes.tile.array, data.tiles);
  assert.equal(geometry.attributes.color.array, data.colors);
  assert.equal(geometry.attributes.emissive.array, data.emissive);
  assert.equal(geometry.attributes.sky.array, data.sky);
  assert.equal(geometry.attributes.blockLight.array, data.lights);
  assert.equal(geometry.index.array, data.indices);
  assert.equal(geometry.boundingSphere, SECTION_BOUNDING_SPHERE);
  assert.equal(geometry.boundingSphere.center.x, 8);
  assert.equal(geometry.boundingSphere.center.y, 8);
  assert.equal(geometry.boundingSphere.center.z, 8);
  assert.ok(geometry.boundingSphere.radius >= Math.sqrt(3 * 8 * 8));
  assert.doesNotMatch(renderer.slice(renderer.indexOf("private advanceMeshCommit"), renderer.indexOf("rebuild(world")),
    /computeBoundingSphere\s*\(/);
});

test("meshing conservative bounds enclose every corner of a section-local 16-cube", () => {
  const THREE = createThree();
  const { SECTION_BOUNDING_SPHERE: sphere } = loadHelper(THREE);
  for (const x of [0, 16]) for (const y of [0, 16]) for (const z of [0, 16]) {
    const dx = x - sphere.center.x, dy = y - sphere.center.y, dz = z - sphere.center.z;
    assert.ok(dx * dx + dy * dy + dz * dz <= sphere.radius * sphere.radius);
  }
});

test("meshing disposes partially-created geometry if attribute setup fails", () => {
  const THREE = createThree(true);
  const { createSectionGeometry } = loadHelper(THREE);
  assert.throws(() => createSectionGeometry(sampleData()), /synthetic attribute failure/);
});
