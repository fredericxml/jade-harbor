import * as THREE from "three";
import { terrainMaterial } from "./material";
import { Lighting } from "../world/lighting";
import { World } from "../world/world";
import { meshChunk } from "./mesher";
import { makeAtlas } from "./atlas";
import { Metrics } from "../core/metrics";
import { Vec3 } from "../core/coords";
import { Atmosphere, makeSky } from "./atmosphere";
import { DistantWorld } from "./distant-world";
import { sampleTerrain } from "../world/geography/terrain";
import { item } from "../game/items";
export class View {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.06, 960);
  groups = new Map<string, THREE.Group>();
  sections = new Map<string, THREE.Group>();
  deferred = new Set<string>();
  verticalRadius = 64;
  private lastSectionY = Infinity;
  private lastSurfaceY = Infinity;
  readonly atmosphere = new Atmosphere();
  readonly sky = makeSky(this.atmosphere);
  distant?: DistantWorld;
  readonly meshed = new Set<string>();
  meshRevision = 0;
  distance = 5;
  rainExposure=1;
  private renderWorld?: World;
  private environmentTime=.23; private weather=false;
  lighting?: Lighting;
  metrics = new Metrics();
  // The equipment pass resets renderer.info; F3 needs the main world counters.
  worldRenderStats = { triangles: 0, calls: 0 };
  contextLost = false;
  onContext?: (lost:boolean) => void;
  atlas = makeAtlas();
  materials: THREE.Material[];
  sun: THREE.DirectionalLight;
  ambient: THREE.HemisphereLight;
  outline: THREE.LineSegments;
  clouds = new THREE.Group();
  hand = new THREE.Group();
  // Draw first-person equipment in its own pass. World depth and fog must
  // never cut through a hand, weapon, or held block.
  private viewmodelScene = new THREE.Scene();
  private viewmodelCamera = new THREE.PerspectiveCamera(56, innerWidth / innerHeight, 0.02, 8);
  private heldModel = new THREE.Group();
  private lastHeldItem: number | null | undefined = undefined;
  constructor(public canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene.background = new THREE.Color("#bad5ce");
    this.scene.fog = new THREE.Fog("#bad5ce", 55, 155);
    this.materials = [
      terrainMaterial(this.atlas.texture),
      terrainMaterial(this.atlas.texture, true),
      terrainMaterial(this.atlas.texture, false, true),
    ];
    this.ambient = new THREE.HemisphereLight("#eaf5e3", "#697560", 2.2);
    this.scene.add(this.ambient);
    this.sun = new THREE.DirectionalLight("#fff1c4", 2.4);
    this.sun.position.set(-45, 100, 30);
    this.scene.add(this.sun);
    this.outline = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.008, 1.008, 1.008)),
      new THREE.LineBasicMaterial({
        color: "#fff4c9",
        transparent: true,
        opacity: 0.85,
      }),
    );
    this.outline.visible = false;
    this.scene.add(this.outline);
    const cloudMat = new THREE.MeshBasicMaterial({
      color: "#f4eee0",
      transparent: true,
      opacity: 0.65,
    });
    const geo = new THREE.BoxGeometry(1, 1, 1);
    // A shared instanced draw retains all 28 clouds and their original shapes.
    const cloudBatch=new THREE.InstancedMesh(geo,cloudMat,28),cloudPose=new THREE.Object3D();
    for(let i=0;i<28;i++) {cloudPose.position.set((i%7)*48-144+((i*17)%23)-12,174+(i%5)*6,Math.floor(i/7)*62-124+((i*11)%31)-15);cloudPose.scale.set(18+(i%4)*5,2,8+(i%3)*4);cloudPose.updateMatrix();cloudBatch.setMatrixAt(i,cloudPose.matrix);}
    this.clouds.clear();this.clouds.add(cloudBatch);this.scene.add(this.clouds);this.scene.add(this.sky);
    // A compact foreground arm with a separate cuff, palm and gripping thumb.
    // The pieces overlap intentionally; no detached floating hand geometry.
    const armPiece = (size: [number, number, number], color: string,
                      x: number, y: number, z: number) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size),
        new THREE.MeshBasicMaterial({ color }));
      mesh.position.set(x, y, z);
      this.hand.add(mesh);
    };
    armPiece([0.24, 0.43, 0.24], "#335951", 0.085, -0.24, 0.045); // sleeve
    armPiece([0.255, 0.075, 0.255], "#263d39", 0.085, -0.018, 0.045); // cuff
    armPiece([0.215, 0.205, 0.21], "#cfa880", 0.06, 0.08, 0.012); // palm
    armPiece([0.065, 0.135, 0.105], "#bb936f", -0.064, 0.118, 0.125); // thumb
    this.heldModel.position.set(0.025, 0.13, -0.075);
    this.hand.add(this.heldModel);
    this.hand.position.set(0.51, -0.64, -1.15);
    this.hand.rotation.set(-0.12, -0.20, -0.26);
    this.viewmodelScene.add(this.hand);
    this.renderer.autoClear = false;
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault(); this.contextLost=true; this.onContext?.(true);
    });
    canvas.addEventListener("webglcontextrestored", () => {
      this.contextLost=false; this.clear();
      for(const c of this.lighting?.world.chunks.values() ?? []) this.lighting!.world.markDirty(c.cx,c.cz);
      this.onContext?.(false);
    });
    addEventListener("resize", () => this.resize());
  }
  /** Construct an original, low-poly first-person model with connected parts. */
  setHeldItem(id: number | null) {
    if (id === this.lastHeldItem) return;
    this.lastHeldItem = id;
    for (const child of [...this.heldModel.children]) {
      this.heldModel.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
          material.dispose();
        }
      }
    }
    // The held item pivots around the grip, independently of the hand/arm.
    // Always reset the previous category's pose before selecting a new item.
    this.heldModel.rotation.set(0, 0, 0);
    if (id === null) return;
    const definition = item(id);
    if (!definition) return;
    if (definition.tool) {
      // Each tool points into the scene (-Z), rather than displaying a flat
      // side profile. Yaw makes wide heads readable in perspective; roll
      // aims the working end inward without obscuring the crosshair.
      const poses: Record<string, [number, number, number]> = {
        sword:   [-0.73, 0.24, 0.34],
        pickaxe: [-0.67, 0.48, 0.27],
        axe:     [-0.66, 0.43, 0.32],
        hoe:     [-0.72, 0.52, 0.27],
        shovel:  [-0.75, 0.32, 0.29],
      };
      const [pitch, yaw, roll] = poses[definition.tool] ?? [-0.69, 0.38, 0.28];
      this.heldModel.rotation.set(pitch, yaw, roll, "XYZ");
    } else if (definition.block !== undefined) {
      // Building blocks keep the familiar slightly angled palm presentation.
      this.heldModel.rotation.set(-0.12, -0.18, -0.10, "XYZ");
    } else {
      this.heldModel.rotation.set(-0.19, 0.11, 0.08, "XYZ");
    }
    const addPart = (size: [number, number, number], color: string,
                     x: number, y: number, z: number, angle = 0) => {
      const geometry = new THREE.BoxGeometry(...size);
      const faceColors: number[] = [];
      // Six face values add readable depth without extra real-time lights.
      for (const shade of [0.87, 0.96, 1, 0.67, 0.91, 0.78]) {
        for (let vertex = 0; vertex < 4; vertex++) {
          faceColors.push(shade, shade, shade);
        }
      }
      geometry.setAttribute("color", new THREE.Float32BufferAttribute(faceColors, 3));
      const mesh = new THREE.Mesh(geometry,
        new THREE.MeshBasicMaterial({ color, vertexColors: true }));
      mesh.position.set(x, y, z);
      mesh.rotation.z = angle;
      this.heldModel.add(mesh);
    };
    const metal = definition.color;
    if (definition.tool) {
      if (definition.tool === "sword") {
        // Pommel, leather-bound grip, crossguard and blade form one silhouette.
        addPart([0.145, 0.09, 0.13], "#9d8051", 0, -0.005, 0);
        addPart([0.105, 0.315, 0.105], "#815e3f", 0, 0.175, 0);
        addPart([0.37, 0.09, 0.14], "#d8b76c", 0, 0.34, 0);
        addPart([0.17, 0.48, 0.11], metal, 0, 0.575, 0);
        addPart([0.10, 0.14, 0.095], metal, 0, 0.865, 0);
        addPart([0.045, 0.40, 0.116], "#e2e4d7", 0.038, 0.57, 0.003);
      } else {
        // All working heads overlap this handle; no floating tool pieces.
        addPart([0.105, 0.675, 0.105], "#906943", 0, 0.29, 0, -0.11);
        addPart([0.112, 0.125, 0.113], "#b88a56", -0.034, 0.56, 0, -0.11);
        switch (definition.tool) {
          case "pickaxe":
            addPart([0.50, 0.13, 0.14], metal, -0.035, 0.625, 0, -0.08);
            addPart([0.12, 0.17, 0.145], metal, -0.055, 0.55, 0);
            addPart([0.11, 0.12, 0.13], metal, -0.315, 0.57, 0);
            addPart([0.11, 0.12, 0.13], metal, 0.24, 0.57, 0);
            break;
          case "axe":
            addPart([0.15, 0.15, 0.14], metal, -0.04, 0.625, 0);
            addPart([0.255, 0.355, 0.135], metal, -0.17, 0.625, 0);
            addPart([0.085, 0.28, 0.125], "#e4dcc5", -0.328, 0.625, 0);
            break;
          case "shovel":
            addPart([0.125, 0.11, 0.12], metal, -0.055, 0.64, 0);
            addPart([0.245, 0.285, 0.14], metal, -0.055, 0.79, 0);
            addPart([0.14, 0.095, 0.135], metal, -0.055, 0.972, 0);
            break;
          case "hoe":
            addPart([0.345, 0.12, 0.14], metal, -0.135, 0.635, 0, -0.07);
            addPart([0.18, 0.205, 0.125], metal, -0.25, 0.565, 0);
            addPart([0.10, 0.12, 0.13], "#d7dccd", -0.29, 0.465, 0);
            break;
          default:
            addPart([0.19, 0.22, 0.14], metal, -0.04, 0.69, 0);
        }
      }
    } else if (definition.block !== undefined) {
      // Show the *actual* block's pixel texture, not a generic beige cube.
      const geometry = new THREE.BoxGeometry(0.32, 0.32, 0.32);
      const uv = geometry.getAttribute("uv");
      for (let face = 0; face < 6; face++) {
        const tile = definition.block * 3 + (face === 2 ? 0 : face === 3 ? 2 : 1);
        const tileX = tile % 16, tileY = Math.floor(tile / 16);
        const u0 = (tileX * 16 + 0.1) / 256, u1 = ((tileX + 1) * 16 - 0.1) / 256;
        const v0 = 1 - ((tileY + 1) * 16 - 0.1) / 256;
        const v1 = 1 - (tileY * 16 + 0.1) / 256;
        const cornerUV = [[u1,v1], [u0,v1], [u1,v0], [u0,v0]];
        for (let corner = 0; corner < 4; corner++) {
          uv.setXY(face * 4 + corner, cornerUV[corner][0], cornerUV[corner][1]);
        }
      }
      uv.needsUpdate = true;
      const blockMesh = new THREE.Mesh(geometry,
        new THREE.MeshBasicMaterial({ map: this.atlas.texture }));
      blockMesh.position.set(-0.025, 0.195, -0.015);
      blockMesh.rotation.z = -0.12;
      this.heldModel.add(blockMesh);
    } else if (definition.category === "Materials") {
      addPart([0.17, 0.23, 0.14], metal, -0.02, 0.15, 0.005, -0.32);
      addPart([0.095, 0.095, 0.105], "#d3dfcd", 0.06, 0.23, 0.035, -0.32);
    } else if (definition.category === "Food" || definition.category === "Brewing") {
      addPart([0.22, 0.18, 0.22], metal, -0.015, 0.14, 0.0);
      addPart([0.155, 0.065, 0.155], "#e7dcc5", -0.015, 0.265, 0.0);
    } else {
      addPart([0.205, 0.215, 0.185], metal, -0.015, 0.15, 0, -0.17);
    }
  }
  resize() {
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    this.viewmodelCamera.aspect = innerWidth / innerHeight;
    this.viewmodelCamera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth, innerHeight);
  }
  rebuild(world: World, budget = 2) {
    const macro=world.macroPlan,eye=this.camera.position;
    const surface=macro?sampleTerrain(macro,eye.x,eye.z).elevation:eye.y;
    const center=Math.floor(eye.y/16),surfaceCenter=eye.y>surface+64?Math.floor(surface/16):center;
    // Retain the nine sections around the player (including sky builds),
    // plus at most five surface sections for elevated outdoor views.
    const inRange=(y:number)=>Math.abs(y-center)<=Math.ceil(this.verticalRadius/16)||(surfaceCenter!==center&&Math.abs(y-surfaceCenter)<=2);
    if(center!==this.lastSectionY||surfaceCenter!==this.lastSurfaceY) {
      this.lastSectionY=center;this.lastSurfaceY=surfaceCenter;
      for(const key of this.deferred) {const [,y]=key.split(",").map(Number);if(inRange(y)){world.dirty.add(key);this.deferred.delete(key);}}
      for(const key of this.meshed) {const [,y]=key.split(",").map(Number);if(!inRange(y)){this.removeSection(key);this.deferred.add(key);}}
    }
    let n = 0;
    const started = performance.now();
    // The dirty queue can contain hundreds of vertical sections. Sorting
    // every key every rendered frame causes O(N log N) churn even though only
    // a handful of sections can be meshed before the frame-time budget.
    // Select the nearest `budget` candidates in O(N * budget), without
    // allocating and sorting the entire queue. Invalid/out-of-height entries
    // are removed or deferred in the same pass.
    const nearest: { key: string; cx: number; sy: number; cz: number; distance: number }[] = [];
    const limit = Math.max(1, Math.floor(budget));
    for (const key of world.dirty) {
      const [cx, sy, cz] = key.split(",").map(Number);
      const ck = `${cx},${cz}`;
      if (!world.chunks.has(ck)) {world.dirty.delete(key);continue;}
      if (!inRange(sy)) {
        world.dirty.delete(key);
        this.deferred.add(key);
        continue;
      }
      const dx = cx * 16 + 8 - this.camera.position.x;
      const dy = sy * 16 + 8 - this.camera.position.y;
      const dz = cz * 16 + 8 - this.camera.position.z;
      const distance = dx * dx + dy * dy + dz * dz;
      let i = nearest.length;
      while (i > 0 && nearest[i-1].distance > distance) i--;
      if (i >= limit) continue;
      nearest.splice(i, 0, {key, cx, sy, cz, distance});
      if (nearest.length > limit) nearest.pop();
    }
    for (const {key, cx, sy, cz} of nearest) {
      world.dirty.delete(key);
      const ck = `${cx},${cz}`;
      const c = world.chunks.get(ck);
      if (!c) continue;
      const meshStarted = performance.now();
      this.removeSection(key);
      const meshData = meshChunk(world, c, this.lighting, sy);
      if(!this.meshed.has(key)){this.meshed.add(key);this.meshRevision++;}
      if (!meshData.some((data) => data.indices.length > 0)) {
        this.metrics.add("mesh", performance.now()-meshStarted);
        if (++n >= budget || performance.now() - started > 7) break;
        continue;
      }
      let column=this.groups.get(ck);
      if(!column) {column=new THREE.Group();column.position.set(cx*16,0,cz*16);this.groups.set(ck,column);this.scene.add(column);}
      const group = new THREE.Group();
      group.position.set(0,sy*16,0);
      for (const [i, d] of meshData.entries()) {

        if (!d.indices.length) continue;
        const geo = new THREE.BufferGeometry();
        geo.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(d.positions, 3),
        );
        geo.setAttribute(
          "normal",
          new THREE.Float32BufferAttribute(d.normals, 3),
        );
        geo.setAttribute("uv", new THREE.Float32BufferAttribute(d.uvs, 2));
        geo.setAttribute(
          "color",
          new THREE.Float32BufferAttribute(d.colors, 3),
        );
        geo.setAttribute("sky", new THREE.Float32BufferAttribute(d.sky, 1));
        geo.setAttribute(
          "blockLight",
          new THREE.Float32BufferAttribute(d.lights, 1),
        );
        geo.setIndex(d.indices);
        geo.computeBoundingSphere();
        group.add(new THREE.Mesh(geo, this.materials[i]));
      }
      this.sections.set(key, group);
      column.add(group);
      // Report per-section cost, not an accumulating value from frame start.
      this.metrics.add("mesh",performance.now()-meshStarted);
      if (++n >= budget || performance.now() - started > 7) break;
    }
  }
  removeSection(key:string) {
    if(this.meshed.delete(key))this.meshRevision++;
    const g=this.sections.get(key);
    if(g) {g.traverse(o=>{if(o instanceof THREE.Mesh) o.geometry.dispose();});g.removeFromParent();this.sections.delete(key);}
  }
  remove(key: string) {
    const [cx,cz]=key.split(",").map(Number);
    for(const sk of this.sections.keys()) {const [x,,z]=sk.split(",").map(Number);if(x===cx && z===cz) this.removeSection(sk);}
    for(const sk of this.deferred) {const [x,,z]=sk.split(",").map(Number);if(x===cx && z===cz)this.deferred.delete(sk);}
    for(const sk of this.meshed){const [x,,z]=sk.split(",").map(Number);if(x===cx&&z===cz){this.meshed.delete(sk);this.meshRevision++;}}
    this.groups.get(key)?.removeFromParent();this.groups.delete(key);
  }
  clear() {
    for (const k of this.groups.keys()) this.remove(k);
    this.meshed.clear();this.deferred.clear();this.lastSectionY=Infinity;this.lastSurfaceY=Infinity;this.meshRevision++;
    this.clearDistant();
  }
  clearDistant() {this.distant?.dispose();this.distant=undefined;this.renderWorld=undefined;}
  attachWorld(world:World,time:number,rain=false) {
    if(this.renderWorld===world)return;
    this.distant?.dispose();this.distant=world.macroPlan?new DistantWorld(world,this.atmosphere):undefined;if(this.distant)this.scene.add(this.distant.group);this.renderWorld=world;
    this.atmosphere.reset(time,rain,this.distance);
  }
  environment(time: number, rain = false, nightVision = false,dt=1/60) {
    const began=performance.now(),a=this.atmosphere;
    this.environmentTime=time;this.weather=rain;
    a.update(time,rain,nightVision,this.distance,dt);
    const fog=this.scene.fog as THREE.Fog;fog.color.copy(a.fog);fog.near=a.fogNear;fog.far=a.fogFar;
    (this.scene.background as THREE.Color).copy(a.horizon);
    this.sky.position.copy(this.camera.position);this.sky.material.uniforms.sunVisibility.value=(1-a.rain)*Math.max(0,a.sunDirection.y)*.8;
    this.ambient.color.copy(a.light);this.ambient.intensity=a.ambient;
    this.sun.color.copy(a.light);this.sun.intensity=a.sun;this.sun.position.copy(a.sunDirection).multiplyScalar(100);
    this.clouds.position.set(this.camera.position.x+a.sunDirection.y*15,0,this.camera.position.z+a.sunDirection.x*8);
    const cloud=this.clouds.children[0] as THREE.InstancedMesh;const cloudMaterial=cloud.material as THREE.MeshBasicMaterial;cloudMaterial.color.copy(a.cloud);cloudMaterial.opacity=.62+a.rain*.14;
    const world=this.lighting?.world,eye=this.camera.position,macro=world?.macroPlan;
    this.rainExposure=this.lighting?.sample(Math.floor(eye.x),Math.floor(eye.y),Math.floor(eye.z))[0]??1;
    const underground=!!(world?.loaded(eye.x,eye.z)&&macro&&eye.y<sampleTerrain(macro,eye.x,eye.z).height-3&&this.lighting?.sample(Math.floor(eye.x),Math.floor(eye.y),Math.floor(eye.z))[0]===0);
    this.sky.visible=this.clouds.visible=!underground;
    for(const m of this.materials)if(m instanceof THREE.ShaderMaterial){const u=m.uniforms;u.daylight.value=a.daylight;u.lightTint.value.copy(a.light);u.waterTint.value.copy(a.water);u.night.value=a.night;u.fogColor.value.copy(a.fog);u.fogNear.value=a.fogNear;u.fogFar.value=a.fogFar;u.fogDetail.value=a.fogDetail;}
    this.metrics.add("atmosphere",performance.now()-began);
  }
  updateDistant(world:World) {
    this.attachWorld(world,this.environmentTime,this.weather);
    const began=performance.now();
    if(this.distant){this.distant.group.visible=this.sky.visible;this.distant.update(this.camera.position,this.meshed,this.atmosphere,this.meshRevision);}
    this.metrics.add("distant",performance.now()-began);
  }
  target(hit: Vec3 | null) {
    this.outline.visible = !!hit;
    if (hit) this.outline.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
  }
  render() {
    if (this.contextLost) return;
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    this.worldRenderStats.triangles = this.renderer.info.render.triangles;
    this.worldRenderStats.calls = this.renderer.info.render.calls;
    if (this.hand.visible) {
      this.renderer.clearDepth();
      this.renderer.render(this.viewmodelScene, this.viewmodelCamera);
    }
  }
}
