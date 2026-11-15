import * as THREE from "three";
import { version as appVersion } from "../../package.json";
import { adaptivePixelRatio, resolutionScale } from "./adaptive-resolution";
import { performanceCapabilities, type PerformanceCapabilities } from "./capabilities";
import { GpuTimer, type GpuTimingSample } from "./gpu-timer";
import { terrainMaterial, waterMaterial } from "./material";
import { sortTransparentRenderItems } from "./transparency-sort";
import { Lighting } from "../world/lighting";
import { World } from "../world/world";
import { meshChunkSteps, type MeshData } from "./mesher";
import { makeAtlas } from "./atlas";
import { Metrics } from "../core/metrics";
import { Vec3,MIN_SECTION,MAX_SECTION } from "../core/coords";
import {graphicsProfile,graphicsQualityLevel,effectivePixelRatio,rendererDiagnostics,type GraphicsProfile,type RendererDiagnostics}from "./graphics";
import { Atmosphere, makeSky } from "./atmosphere";
import { DistantWorld } from "./distant-world";
import type { MeshCoverageChange } from "./mesh-coverage";
import { sampleTerrain } from "../world/geography/terrain";
import { item } from "../game/items";
import { createWebGL2Context, GraphicsStartupError } from "./webgl-context";
import {
  RenderWorkloadAudit,
  type RenderAuditSnapshot,
  type UntrackedRenderableSnapshot,
} from "./render-audit";

if (import.meta.env.DEV && typeof window !== "undefined") {
  // Diagnostics show the shipped package version, not an internal engineering identifier.
  (window as unknown as { __jadeHarborBuildId?: string }).__jadeHarborBuildId = appVersion;
}
// Every section mesh is expressed in section-local coordinates [0, 16]^3.
// This conservative sphere encloses the entire section, so commit does not
// synchronously scan every vertex just to compute a tighter bound. It is shared
// read-only: Three.js copies it into its frustum-culling scratch sphere.
const SECTION_BOUNDING_SPHERE = new THREE.Sphere(
  new THREE.Vector3(8, 8, 8),
  Math.sqrt(3 * 8 * 8) + 0.001,
);

function createSectionGeometry(data: MeshData) {
  const geometry = new THREE.BufferGeometry();
  try {
    // MeshData already owns correctly typed arrays. Attach them directly rather
    // than converting or copying them during the geometry-commit phase.
    geometry.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
    geometry.setAttribute("normal", new THREE.BufferAttribute(data.normals, 3));
    geometry.setAttribute("uv", new THREE.BufferAttribute(data.uvs, 2));
    geometry.setAttribute("tile", new THREE.BufferAttribute(data.tiles, 2));
    geometry.setAttribute("color", new THREE.BufferAttribute(data.colors, 3));
    geometry.setAttribute("emissive", new THREE.BufferAttribute(data.emissive, 1));
    geometry.setAttribute("sky", new THREE.BufferAttribute(data.sky, 1));
    geometry.setAttribute("blockLight", new THREE.BufferAttribute(data.lights, 1));
    geometry.setIndex(new THREE.BufferAttribute(data.indices, 1));
    geometry.boundingSphere = SECTION_BOUNDING_SPHERE;
    return geometry;
  } catch (error) {
    geometry.dispose();
    throw error;
  }
}

type NearestSection = {
  key:string; cx:number; sy:number; cz:number; distance:number;
  foreground:boolean; firstBuild:boolean; ready:boolean; queued:boolean;
};
type PendingMeshJob = {
  iterator: Generator<void, MeshData[], void>;
  editRevision: number;
  dirtyRevision: number;
  cx: number; sy: number; cz: number;
  cpuMs: number;
};
type PendingMeshCommit = {
  key: string; cx: number; sy: number; cz: number; columnKey: string;
  data: MeshData[]; group: THREE.Group; nextMaterial: number; cpuMs: number; meshCpuMs: number; dirtyRevision: number;
  lastAdvancedFrame: number;
};
export type MeshQueueDiagnostics = {
  queuedBefore: number;
  queuedAfter: number;
  scanned: number;
  eligible: number;
  dirtyRemesh: number;
  dirtyFirstBuild: number;
  processed: number;
  rendered: number;
  empty: number;
  deferred: number;
  meshed: number;
  renderedSections: number;
  queueAgeMs: number;
  maxSectionMs: number;
  scanComplete: boolean;
  scanRemaining: number;
  activeJobs: number;
  slicesThisFrame: number;
  admissionBacklog: number;
  admissionBacklogHighWater: number;
  admittedThisFrame: number;
  admissionLimit: number;
  admissionTimeMs: number;
  admissionBudgetMs: number;
  meshBudgetMs: number;
  admissionHeadroomMs: number;
  admissionCostMsPerKey: number;
  admissionPressure: number;
  queuedCandidates: number;
  activeSections: number;
  pendingCommits: number;
  sectionCoordinateCache: number;
  candidatePoolCapacity: number;
  activeMeshingMs: number;
  visibleQueued: number;
  visibleReady: number;
  visiblePending: number;
  backgroundQueued: number;
  backgroundReady: number;
  backgroundPending: number;
  visibleWorldReady: boolean;
  visibleWorldProgress: number;
};

function createMeshQueueDiagnostics(): MeshQueueDiagnostics {
  return {
    queuedBefore: 0, queuedAfter: 0, scanned: 0, eligible: 0,
    dirtyRemesh: 0, dirtyFirstBuild: 0, processed: 0, rendered: 0,
    empty: 0, deferred: 0, meshed: 0, renderedSections: 0,
    queueAgeMs: 0, maxSectionMs: 0, scanComplete: true, scanRemaining: 0, activeJobs: 0, slicesThisFrame: 0,
    admissionBacklog: 0, admissionBacklogHighWater: 0, admittedThisFrame: 0, admissionLimit: 16,
    admissionTimeMs: 0, admissionBudgetMs: 0, meshBudgetMs: 1, admissionHeadroomMs: 0, admissionCostMsPerKey: 0.01,
    admissionPressure: 0, queuedCandidates: 0, activeSections: 0, pendingCommits: 0,
    sectionCoordinateCache: 0, candidatePoolCapacity: 0, activeMeshingMs: 0,
    visibleQueued: 0, visibleReady: 0, visiblePending: 0,
    backgroundQueued: 0, backgroundReady: 0, backgroundPending: 0,
    visibleWorldReady: true, visibleWorldProgress: 1,
  };
}
export class View {
  renderer: THREE.WebGLRenderer;
  private readonly transparentSortProjection=new THREE.Matrix4();
  private transparentSortFrame=0;
  graphicsProfile:GraphicsProfile=graphicsProfile("medium");
  gpu!:RendererDiagnostics;
  capabilities!: Readonly<PerformanceCapabilities>;
  private gpuTimer: GpuTimer;
  private gpuTimingSample: GpuTimingSample | null = null;
  private gpuTimingEnabled=false;
  private disposed=false;
  private handleContextLost=(event:Event)=>{event.preventDefault();this.contextLost=true;this.gpuTimer.reset();this.gpuTimingSample=null;this.onContext?.(true);};
  private handleContextRestored=()=>{if(this.disposed)return;this.contextLost=false;this.gpuTimer.dispose();this.clear();this.gpu=rendererDiagnostics(this.renderer.getContext());this.capabilities=performanceCapabilities(this.renderer.getContext(),navigator);this.gpuTimer=new GpuTimer(this.renderer.getContext() as WebGL2RenderingContext);this.gpuTimingSample=null;this.drawingRatio=-1;this.resize();for(const c of this.lighting?.world.chunks.values() ?? [])this.lighting!.world.markDirty(c.cx,c.cz);this.onContext?.(false);};
  resolutionScale = 1;
  private drawingSizePending=false;
  get needsDrawingUpdate(){return this.drawingSizePending;}
  private layoutWidth=1;private layoutHeight=1;
  private drawingWidth=-1;private drawingHeight=-1;private drawingRatio=-1;
  private sectionCoordinates=new Map<string,{cx:number;sy:number;cz:number;column:string}>();
  // A bounded sweep reclaims orphaned coordinates after many stream/evict cycles.
  private staleCoordinateSweep:Iterator<[string,{cx:number;sy:number;cz:number;column:string}]>|null=null;
  private evictionQueueRefresh=false;
  // Active section jobs are kept separate from the persistent nearest-first heap.
  // The heap is populated once per world/camera revision, then consumed across
  // many frames without rescanning the remaining dirty Set after each scheduling pass.
  private readonly nearestSections:NearestSection[]=[];
  private readonly nearestSectionPool:NearestSection[]=[];
  // The foreground heap contains sections in the camera's forward cone plus
  // the immediate player neighborhood. The background heap retains every
  // other eligible section and receives a guaranteed share of mesh slots.
  private readonly meshQueueHeap:NearestSection[]=[];
  private readonly meshQueueBackgroundHeap:NearestSection[]=[];
  private meshFrameSequence = 0;
  private meshQueueEntryByKey = new Map<string,NearestSection>();
  private dirtyScanAddCursor = 0;
  private meshAdmissionHeadroomMs = 4;
  private dirtyAdmissionCostMsPerKey = 0.01;
  private dirtyAdmissionBacklogHighWater = 0;
  private dirtyAdmissionEpisodeActive = false;
  private meshQueueForegroundStreak=0;
  private meshQueueForward = new THREE.Vector3(0,0,-1);
  private dirtyScanForwardX=0;private dirtyScanForwardY=0;private dirtyScanForwardZ=-1;
  private dirtyScanEyeX=0;private dirtyScanEyeY=0;private dirtyScanEyeZ=0;
  private dirtyScanVisibleFirstBuild=0;private dirtyScanVisibleReady=0;
  private dirtyScanBackgroundFirstBuild=0;private dirtyScanBackgroundReady=0;
  private readonly meshJobs = new Map<string, PendingMeshJob>();
  private readonly meshCommits = new Map<string, PendingMeshCommit>();
  private dirtyScanEditRevision = -1;
  private dirtyScanReady = false;
  // Dirty-section discovery is resumable. Keep a live Set iterator so large
  // backlogs are scanned over multiple frames without allocating a full copy.
  private dirtyScanIterator: Iterator<string> | null = null;
  private dirtyScanWorld?: World;
  private dirtyScanCameraCell = "";
  private dirtyScanPoolCount = 0;
  private dirtyScanInitialSize = 0;
  private dirtyScanScanned = 0;
  private dirtyScanEligible = 0;
  private dirtyScanRemesh = 0;
  private dirtyScanFirstBuild = 0;
  private surfaceX=NaN;private surfaceZ=NaN;private surfaceHeight=0;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, 1, 0.06, 960);
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
  readonly meshChanges:MeshCoverageChange[]=[];
  meshChangeBase=0;
  distance = 5;
  rainExposure=1;
  private renderWorld?: World;
  private environmentTime=.23; private weather=false;
  lighting?: Lighting;
  metrics = new Metrics();
  readonly renderAudit = new RenderWorkloadAudit();
  // Diagnostics state must exist before the first frame. The mesh queue is
  // processed during the preview/menu loop as well as active gameplay.
  meshQueueStats: MeshQueueDiagnostics = createMeshQueueDiagnostics();
  private meshQueueStartedAt = 0;
  private untrackedAuditScannedAt = -Infinity;
  private untrackedAuditStats: UntrackedRenderableSnapshot = { count: 0, examples: [] };
  // The equipment pass resets renderer.info; retain separate world and viewmodel counters.
  worldRenderStats: { triangles: number; calls: number; breakdown: RenderAuditSnapshot | null } = { triangles: 0, calls: 0, breakdown: null };
  viewmodelRenderStats: { triangles: number; calls: number; breakdown: RenderAuditSnapshot | null } = { triangles: 0, calls: 0, breakdown: null };
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
  private viewmodelCamera = new THREE.PerspectiveCamera(56, 1, 0.02, 8);
  private heldModel = new THREE.Group();
  private lastHeldItem: number | null | undefined = undefined;
  constructor(public canvas: HTMLCanvasElement) {
    // Create the context explicitly so touch-first browsers can use a lighter
    // attribute set before Three.js initializes its renderer. Passing the
    // already-created context also prevents Three.js from retrying only with
    // its default antialias/high-performance request.
    const selected = createWebGL2Context(canvas);
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        context: selected.context,
        alpha: false,
        antialias: selected.antialias,
        depth: true,
        stencil: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
        powerPreference: selected.powerPreference,
        failIfMajorPerformanceCaveat: false,
      });
    } catch (error) {
      throw new GraphicsStartupError(
        "renderer-initialization-failed",
        "WebGL 2 was available, but Jade Harbor could not initialize its Three.js renderer.",
        error,
        [`touchFirst=${selected.touchFirst}`, `antialias=${selected.antialias}`, `powerPreference=${selected.powerPreference}`],
      );
    }
    // Preserve default transparent ordering for all objects, but depth-sort
    // voxel water/glass by their actual visible geometry center rather than
    // column origin. Avoid an unconditional water-after-glass renderOrder.
    this.renderer.setTransparentSort((a,b)=>sortTransparentRenderItems(
      a,b,this.transparentSortProjection.elements,this.transparentSortFrame));
    this.gpu=rendererDiagnostics(this.renderer.getContext());
    this.capabilities=performanceCapabilities(this.renderer.getContext(),navigator);
    this.gpuTimer=new GpuTimer(this.renderer.getContext() as WebGL2RenderingContext);
    this.updateDrawingSize();
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene.background = new THREE.Color("#bad5ce");
    this.scene.fog = new THREE.Fog("#bad5ce", 55, 155);
    this.materials = [
      // Opaque and emissive voxel faces share one draw; a compact vertex flag
      // selects the emissive lighting path without changing their surface data.
      terrainMaterial(this.atlas.texture, false, this.graphicsProfile.quality),
      terrainMaterial(this.atlas.texture, true, this.graphicsProfile.quality),
      // Third material is used only in sections containing water. It does not
      // affect opaque blocks, NPCs, glass, ice, or the world/save format.
      waterMaterial(this.atlas.texture, this.graphicsProfile.quality),
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
    this.renderAudit?.tag(this.outline, "interaction");
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
    this.renderAudit?.tag(cloudBatch, "clouds");
    this.renderAudit?.tag(this.sky, "sky");
    this.clouds.clear();this.clouds.add(cloudBatch);this.scene.add(this.clouds);this.scene.add(this.sky);
    // A compact foreground arm with a separate cuff, palm and gripping thumb.
    // The pieces overlap intentionally; no detached floating hand geometry.
    const armPiece = (size: [number, number, number], color: string,
                      x: number, y: number, z: number) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size),
        new THREE.MeshBasicMaterial({ color }));
      mesh.position.set(x, y, z);
      this.renderAudit?.tag(mesh, "player");
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
    canvas.addEventListener("webglcontextlost",this.handleContextLost);
    canvas.addEventListener("webglcontextrestored",this.handleContextRestored);
  }
  /** Construct an original, low-poly first-person model with connected parts. */
  setHeldItem(id: number | null) {
    if (id === this.lastHeldItem) return;
    this.lastHeldItem = id;
    for (const child of [...this.heldModel.children]) {
      this.heldModel.remove(child);
      if (child instanceof THREE.Mesh) {
        this.renderAudit?.untag(child);
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
      this.renderAudit?.tag(mesh, "player");
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
      this.renderAudit?.tag(blockMesh, "player");
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
  setGraphicsProfile(profile:GraphicsProfile){
    if(profile!==this.graphicsProfile){this.graphicsProfile=profile;this.distant?.setProfile(profile);}
    const qualityLevel=graphicsQualityLevel(profile);
    for(const material of this.materials)if(material instanceof THREE.ShaderMaterial&&material.uniforms.qualityLevel)material.uniforms.qualityLevel.value=qualityLevel;
    const skyMaterial=this.sky.material as THREE.ShaderMaterial;
    if(skyMaterial.uniforms.qualityLevel)skyMaterial.uniforms.qualityLevel.value=qualityLevel;
    const cloud=this.clouds.children[0] as THREE.InstancedMesh|undefined;if(cloud)cloud.count=profile.cloudCount;
    // Apply backbuffer changes once at the start of a rendered frame. A
    // settings event must not resize a busy GL surface after submitting draws.
    this.drawingSizePending=true;
  }
  setResolutionScale(scale:number) {
    const next=resolutionScale(scale);
    if(next!==this.resolutionScale){this.resolutionScale=next;this.drawingSizePending=true;}
  }
  private updateDrawingSize(){
    const w=this.layoutWidth,h=this.layoutHeight,base=effectivePixelRatio(this.graphicsProfile,devicePixelRatio),ratio=adaptivePixelRatio(base,this.resolutionScale??1,w,h,this.capabilities?.maxRenderbufferSize);
    if(w===this.drawingWidth&&h===this.drawingHeight&&ratio===this.drawingRatio)return;
    this.drawingWidth=w;this.drawingHeight=h;this.drawingRatio=ratio;
    this.renderer.setDrawingBufferSize(w,h,ratio);
  }
  graphicsDebug(){
    const gpu=this.gpu,identity=gpu.restricted?gpu.renderer:gpu.unmaskedRenderer,vendor=gpu.restricted?gpu.vendor:gpu.unmaskedVendor;
    const short=(text:string,n:number)=>text.replace(/[\r\n]/g," ").slice(0,n);
    return `Graphics ${this.graphicsProfile.label} · scale ${(this.graphicsProfile.renderScale*(this.resolutionScale??1)).toFixed(2)} · DPR ${this.renderer.getPixelRatio().toFixed(2)} · ${this.drawingWidth}×${this.drawingHeight} → ${this.canvas.width}×${this.canvas.height}\nGPU ${short(vendor,35)} / ${short(identity,100)} · ${gpu.version.split(" (")[0]}${gpu.restricted?" · identity restricted":""} · GPU timer ${this.capabilities.timerQuery?"available":"unavailable"}${gpu.software?"\nSoftware rendering detected — hardware GPU performance may be much higher.":""}`;
  }
  private recordMeshChange(key:string,present:boolean,reset=false){
    const revision=++this.meshRevision;this.meshChanges.push({revision,key,present,reset});
    if(this.meshChanges.length>8192){const removed=this.meshChanges.splice(0,1024);this.meshChangeBase=removed[removed.length-1].revision;}
  }
  private sectionCoordinate(key:string){let q=this.sectionCoordinates.get(key);if(!q){const[cx,sy,cz]=key.split(",").map(Number);if(![cx,sy,cz].every(Number.isFinite)||sy<MIN_SECTION||sy>MAX_SECTION)return; q={cx,sy,cz,column:`${cx},${cz}`};this.sectionCoordinates.set(key,q);}return q;}
  private pruneStaleSectionCoordinates(world:World){
    const capacity=world.chunks.size*(MAX_SECTION-MIN_SECTION+1)+256;
    if(this.sectionCoordinates.size<=capacity){this.staleCoordinateSweep=null;return;}
    const sweep=this.staleCoordinateSweep??(this.staleCoordinateSweep=this.sectionCoordinates.entries());
    // Spread the cleanup over frames; loaded sections and current dirty work
    // are never removed. The next request can recreate a pruned coordinate.
    for(let i=0;i<128;i++){
      const next=sweep.next();
      if(next.done){this.staleCoordinateSweep=null;break;}
      const [key,coordinate]=next.value;
      if(!world.chunks.has(coordinate.column)&&!world.dirty.has(key)&&
        !this.meshJobs.has(key)&&!this.meshCommits.has(key))this.sectionCoordinates.delete(key);
    }
  }
  private meshQueueLess(a:NearestSection,b:NearestSection){
    return a.distance!==b.distance?a.distance<b.distance:a.key<b.key;
  }
  private updateMeshQueueForward(){
    const forward=this.meshQueueForward??(this.meshQueueForward={x:0,y:0,z:-1} as THREE.Vector3);
    const camera=this.camera as THREE.PerspectiveCamera & {getWorldDirection?:(target:THREE.Vector3)=>THREE.Vector3};
    if(typeof camera.getWorldDirection==="function")camera.getWorldDirection(forward);
    else{forward.x=0;forward.y=0;forward.z=-1;}
    const length=Math.hypot(forward.x,forward.y,forward.z);
    if(length>1e-8){forward.x/=length;forward.y/=length;forward.z/=length;}
    else{forward.x=0;forward.y=0;forward.z=-1;}
    return forward;
  }
  private updateMeshQueueEntry(entry:NearestSection,eye:THREE.Vector3){
    const dx=entry.cx*16+8-eye.x,dy=entry.sy*16+8-eye.y,dz=entry.cz*16+8-eye.z;
    const distance=dx*dx+dy*dy+dz*dz;entry.distance=distance;
    const dot=dx*this.dirtyScanForwardX+dy*this.dirtyScanForwardY+dz*this.dirtyScanForwardZ;
    // A 60-degree forward cone approximates the useful camera-facing area;
    // the immediate 1.4-section neighborhood stays foreground even behind us.
    entry.foreground=distance<=512||(dot>0&&dot*dot>=distance*0.25);
  }
  private heapifyMeshQueue(heap:NearestSection[]){
    for(let start=(heap.length>>1)-1;start>=0;start--){
      const entry=heap[start];let index=start;
      while(true){
        const left=index*2+1;if(left>=heap.length)break;
        const right=left+1,child=right<heap.length&&this.meshQueueLess(heap[right],heap[left])?right:left;
        if(!this.meshQueueLess(heap[child],entry))break;
        heap[index]=heap[child];index=child;
      }
      heap[index]=entry;
    }
  }
  private refreshMeshQueueFacing(world:World,eye:THREE.Vector3,force=false){
    const forward=this.updateMeshQueueForward();
    const facingDot=forward.x*this.dirtyScanForwardX+forward.y*this.dirtyScanForwardY+forward.z*this.dirtyScanForwardZ;
    const dx=eye.x-this.dirtyScanEyeX,dy=eye.y-this.dirtyScanEyeY,dz=eye.z-this.dirtyScanEyeZ;
    // Reprioritize only after a meaningful turn or within-cell movement. Active
    // jobs/commits are retained; only unstarted candidates are moved between heaps.
    // Camera-cell crossings and pool compaction request a refresh even when
    // the player moved less than four blocks since the previous priority pass.
    if(!force&&facingDot>=0.9238795325&&dx*dx+dy*dy+dz*dz<16&&
      !(this.dirtyScanPoolCount>512&&this.dirtyScanPoolCount>world.dirty.size+this.meshed.size+256))return;
    this.dirtyScanForwardX=forward.x;this.dirtyScanForwardY=forward.y;this.dirtyScanForwardZ=forward.z;
    this.dirtyScanEyeX=eye.x;this.dirtyScanEyeY=eye.y;this.dirtyScanEyeZ=eye.z;
    this.meshQueueHeap.length=0;this.meshQueueBackgroundHeap.length=0;
    // Active slots selected at the end of the previous frame but not yet
    // started are safe to reprioritize. Preserve real generators and commits.
    let activeWrite=0;
    for(const entry of this.nearestSections){
      if(this.meshJobs.has(entry.key)||this.meshCommits.has(entry.key))this.nearestSections[activeWrite++]=entry;
      else entry.queued=true;
    }
    this.nearestSections.length=activeWrite;
    this.dirtyScanVisibleFirstBuild=0;this.dirtyScanVisibleReady=0;
    this.dirtyScanBackgroundFirstBuild=0;this.dirtyScanBackgroundReady=0;
    // Reclaim completed entries after eviction and stale unqueued records.
    // Reorder object references, not objects: active generators and heap entries
    // keep their exact identities. Swapping preserves reusable spare objects.
    const pool=this.nearestSectionPool;
    let retained=0;
    for(let i=0;i<this.dirtyScanPoolCount;i++){
      const entry=pool[i];
      if(!entry.key)continue;
      const stillDirty=world.dirty.has(entry.key);
      const active=this.nearestSections.includes(entry);
      const loaded=world.chunks.has(`${entry.cx},${entry.cz}`);
      if(!stillDirty&&(!entry.ready||!loaded||!this.meshed.has(entry.key))){
        entry.queued=false;
        if(this.meshQueueEntryByKey.get(entry.key)===entry)this.meshQueueEntryByKey.delete(entry.key);
        if(!active){entry.key="";continue;}
        // The active loop cancels stale work later this frame; do not mutate
        // its key while the same entry object is still referenced there.
      }
      this.updateMeshQueueEntry(entry,eye);
      if(entry.ready){
        if(entry.foreground)this.dirtyScanVisibleReady++;else this.dirtyScanBackgroundReady++;
      }else if(entry.firstBuild&&stillDirty){
        if(entry.foreground)this.dirtyScanVisibleFirstBuild++;else this.dirtyScanBackgroundFirstBuild++;
      }
      if(entry.queued&&stillDirty)(entry.foreground?this.meshQueueHeap:this.meshQueueBackgroundHeap).push(entry);
      if(retained!==i){const spare=pool[retained];pool[retained]=entry;pool[i]=spare;}
      retained++;
    }
    this.dirtyScanPoolCount=retained;
    // Spare candidate objects are reusable, but a long stream-and-evict run
    // should not retain the highest historical pool allocation indefinitely.
    const reusableCapacity=Math.max(256,retained+128);
    if(pool.length>reusableCapacity*2)pool.length=reusableCapacity;
    this.heapifyMeshQueue(this.meshQueueHeap);this.heapifyMeshQueue(this.meshQueueBackgroundHeap);
  }
  private pushMeshQueue(entry:NearestSection){
    const heap=entry.foreground?this.meshQueueHeap:this.meshQueueBackgroundHeap;
    let index=heap.length;heap.push(entry);entry.queued=true;
    while(index>0){const parent=(index-1)>>1,parentEntry=heap[parent];if(!this.meshQueueLess(entry,parentEntry))break;heap[index]=parentEntry;index=parent;}
    heap[index]=entry;
  }
  private popMeshQueue(heap:NearestSection[]=this.meshQueueHeap):NearestSection|undefined{
    if(!heap.length)return;
    const first=heap[0],last=heap.pop()!;first.queued=false;
    if(heap.length){
      let index=0;
      while(true){
        const left=index*2+1;if(left>=heap.length)break;
        const right=left+1,child=right<heap.length&&this.meshQueueLess(heap[right],heap[left])?right:left;
        if(!this.meshQueueLess(heap[child],last))break;
        heap[index]=heap[child];index=child;
      }
      heap[index]=last;
    }
    return first;
  }
  private popNextMeshQueue(){
    const foreground=this.meshQueueHeap.length>0,background=this.meshQueueBackgroundHeap.length>0;
    if(!foreground){this.meshQueueForegroundStreak=0;return this.popMeshQueue(this.meshQueueBackgroundHeap);}
    if(!background||this.meshQueueForegroundStreak<3){this.meshQueueForegroundStreak++;return this.popMeshQueue(this.meshQueueHeap);}
    this.meshQueueForegroundStreak=0;return this.popMeshQueue(this.meshQueueBackgroundHeap);
  }
  private recordMeshQueueReady(entry:NearestSection){
    if(!entry.firstBuild)return;
    entry.firstBuild=false;entry.ready=true;
    if(entry.foreground)this.dirtyScanVisibleReady++;
    else this.dirtyScanBackgroundReady++;
  }
  private resetMeshQueue(world?:World,cameraCell=""){
    for(const job of this.meshJobs.values())job.iterator.return?.(undefined as unknown as MeshData[]);this.meshJobs.clear();
    for(const commit of this.meshCommits.values())this.disposePendingCommit(commit);this.meshCommits.clear();
    this.meshQueueHeap.length=0;this.meshQueueBackgroundHeap.length=0;this.nearestSections.length=0;
    this.meshQueueEntryByKey.clear();this.dirtyScanAddCursor=0;
    this.evictionQueueRefresh=false;this.staleCoordinateSweep=null;
    if(world?.dirtyAddQueue){world.dirtyAddQueue.length=0;world.dirtyAddQueueSet?.clear();}
    for(const entry of this.nearestSectionPool){entry.key="";entry.queued=false;entry.firstBuild=false;entry.ready=false;}
    const forward=this.updateMeshQueueForward();
    this.dirtyScanForwardX=forward.x;this.dirtyScanForwardY=forward.y;this.dirtyScanForwardZ=forward.z;
    this.dirtyScanEyeX=this.camera.position.x;this.dirtyScanEyeY=this.camera.position.y;this.dirtyScanEyeZ=this.camera.position.z;
    this.dirtyScanVisibleFirstBuild=0;this.dirtyScanVisibleReady=0;this.dirtyScanBackgroundFirstBuild=0;this.dirtyScanBackgroundReady=0;
    this.dirtyScanPoolCount=0;this.dirtyScanInitialSize=world?.dirty.size??0;
    this.dirtyScanScanned=0;this.dirtyScanEligible=0;this.dirtyScanRemesh=0;this.dirtyScanFirstBuild=0;
    this.dirtyScanIterator=world?world.dirty.values():null;this.dirtyScanWorld=world;this.dirtyScanCameraCell=cameraCell;
    this.dirtyAdmissionBacklogHighWater=0;this.dirtyAdmissionEpisodeActive=!!world?.dirty.size;
    this.dirtyScanReady=false;this.dirtyScanEditRevision=world?(world.lightingEditRevision??world.navRevision):-1;
  }
  resize(width?:number,height?:number) {
    if(width===undefined||height===undefined){const rect=this.canvas.getBoundingClientRect();width=rect.width;height=rect.height;}
    this.layoutWidth=Math.max(1,Math.round(width));this.layoutHeight=Math.max(1,Math.round(height));const aspect=this.layoutWidth/this.layoutHeight;
    if(this.camera.aspect!==aspect){this.camera.aspect=aspect;this.camera.updateProjectionMatrix();}
    if(this.viewmodelCamera.aspect!==aspect){this.viewmodelCamera.aspect=aspect;this.viewmodelCamera.updateProjectionMatrix();}this.drawingSizePending=true;
  }
  private disposePendingCommit(commit: PendingMeshCommit) {
    commit.group.traverse(o => {
      if (o instanceof THREE.Mesh) {
        this.renderAudit?.untag(o);
        o.geometry.dispose();
      }
    });
    commit.group.clear?.();
  }
  private advanceMeshCommit(world: World, commit: PendingMeshCommit) {
    const commitStarted = performance.now();
    let i = commit.nextMaterial;
    let d = commit.data[i];
    // Empty material groups need no geometry allocation; skip them in the same
    // slice so empty sections still settle immediately.
    while (d && d.indices.length === 0 && i < commit.data.length) {
      i++;
      commit.nextMaterial = i;
      d = commit.data[i];
    }
    if (i < commit.data.length) commit.nextMaterial = i + 1;
    if (d?.indices.length) {
      const geo = createSectionGeometry(d);
      const mesh = new THREE.Mesh(geo, this.materials[i]);
      const category = i === 0 ? "voxel-opaque" : i === 1 ? "voxel-transparent" : "water";
      const breakdown = i === 0 && d.emissiveTriangles > 0
        ? { "voxel-emissive": d.emissiveTriangles } : undefined;
      // The visible-group midpoint gives Three.js a meaningful sort anchor.
      // All transparent groups retain the same renderOrder; both water and
      // glass/ice must sort back-to-front rather than water always drawing last.
      if ((i===1||i===2)&&d.sortCenter) mesh.userData.transparentSortAnchor=[
        commit.cx*16+d.sortCenter[0],commit.sy*16+d.sortCenter[1],commit.cz*16+d.sortCenter[2],
      ];
      this.renderAudit?.tag(mesh, category, breakdown);
      commit.group.add(mesh);
    }
    commit.cpuMs += performance.now() - commitStarted;
    if (commit.nextMaterial < commit.data.length) return false;

    // Atomic replacement: the old section stays visible until all new material
    // groups and their bounds are ready.
    this.removeSection(commit.key, false);
    if (commit.group.children.length) {
      let column = this.groups.get(commit.columnKey);
      if (!column) {
        column = new THREE.Group();
        column.position.set(commit.cx * 16, 0, commit.cz * 16);
        this.groups.set(commit.columnKey, column);
        this.scene.add(column);
      }
      this.sections.set(commit.key, commit.group);
      column.add(commit.group);
    } else {
      this.disposePendingCommit(commit);
    }
    if (!this.meshed.has(commit.key)) {
      this.meshed.add(commit.key);
      this.recordMeshChange(commit.key, true);
    }
    world.dirty.delete(commit.key);
    this.meshCommits.delete(commit.key);
    this.metrics.add("meshCommit", commit.cpuMs);
    return true;
  }
  private cancelMeshWork(key:string){
    const job=this.meshJobs.get(key);
    if(job){job.iterator.return?.(undefined as unknown as MeshData[]);this.meshJobs.delete(key);}
    const commit=this.meshCommits.get(key);
    if(commit){this.disposePendingCommit(commit);this.meshCommits.delete(key);}
  }
  setMeshAdmissionHeadroom(headroomMs:number){
    this.meshAdmissionHeadroomMs=Number.isFinite(headroomMs)?Math.max(0,Math.min(50,headroomMs)):0;
  }
  rebuild(world: World, budget = 2) {
    this.meshFrameSequence=(this.meshFrameSequence??0)+1;
    const meshFrameId=this.meshFrameSequence;
    const macro=world.macroPlan,eye=this.camera.position;
    if(macro&&(eye.x!==this.surfaceX||eye.z!==this.surfaceZ)){this.surfaceX=eye.x;this.surfaceZ=eye.z;this.surfaceHeight=sampleTerrain(macro,eye.x,eye.z).elevation;}
    const surface=macro?this.surfaceHeight:eye.y;
    const center=Math.floor(eye.y/16),surfaceCenter=eye.y>surface+64?Math.floor(surface/16):center;
    // Retain the nine sections around the player (including sky builds),
    // plus at most five surface sections for elevated outdoor views.
    const inRange=(y:number)=>Math.abs(y-center)<=Math.ceil(this.verticalRadius/16)||(surfaceCenter!==center&&Math.abs(y-surfaceCenter)<=2);
    if(center!==this.lastSectionY||surfaceCenter!==this.lastSurfaceY) {
      this.lastSectionY=center;this.lastSurfaceY=surfaceCenter;
      for(const key of this.deferred) {const q=this.sectionCoordinate(key);if(q&&inRange(q.sy)){world.markSection(q.cx,q.sy,q.cz);this.deferred.delete(key);}}
      for(const key of this.meshed) {const q=this.sectionCoordinate(key);if(q&&!inRange(q.sy)){this.removeSection(key);this.deferred.add(key);}}
    }
    this.dirtyScanScanned ??= 0;this.dirtyScanEligible ??= 0;this.dirtyScanRemesh ??= 0;this.dirtyScanFirstBuild ??= 0;
    this.dirtyScanPoolCount ??= 0;this.dirtyScanInitialSize ??= 0;this.dirtyScanIterator ??= null;
    this.meshQueueEntryByKey??=new Map();this.dirtyScanAddCursor??=0;
    this.meshAdmissionHeadroomMs??=4;this.dirtyAdmissionCostMsPerKey??=0.01;
    this.dirtyAdmissionBacklogHighWater??=0;this.dirtyAdmissionEpisodeActive??=false;
    const queueNow=performance.now(),cameraCell=`${Math.floor(eye.x/16)},${center},${Math.floor(eye.z/16)}:${surfaceCenter}`;
    const queuedBefore=world.dirty.size;
    const currentEditRevision=world.lightingEditRevision??world.navRevision;
    const addQueue=world.dirtyAddQueue??(world.dirtyAddQueue=[]);
    let scanned=0,processed=0,rendered=0,empty=0,maxSectionMs=0,slicesThisFrame=0;
    let admittedThisFrame=0,admissionLimit=16,admissionTimeMs=0,admissionBudgetMs=0,activeMeshingMs=0;
    // Use measured previous-frame CPU headroom; keep 1 ms for progress and cap at 7 ms.
    const meshBudgetMs=Math.max(1,Math.min(7,this.meshAdmissionHeadroomMs*0.5));
    if(!this.dirtyAdmissionEpisodeActive&&queuedBefore>0){
      this.dirtyAdmissionBacklogHighWater=0;this.dirtyAdmissionEpisodeActive=true;
    }
    const finishQueueDiagnostics=(scanComplete:boolean)=>{
      const stats = this.meshQueueStats ?? (this.meshQueueStats = createMeshQueueDiagnostics());
      stats.queuedBefore=queuedBefore;stats.queuedAfter=world.dirty.size;
      stats.scanned=this.dirtyScanScanned??0;stats.eligible=this.dirtyScanEligible??0;
      stats.dirtyRemesh=this.dirtyScanRemesh??0;stats.dirtyFirstBuild=this.dirtyScanFirstBuild??0;
      stats.processed=processed;stats.rendered=rendered;stats.empty=empty;stats.deferred=this.deferred.size;
      stats.meshed=this.meshed.size;stats.renderedSections=this.sections.size;
      stats.queueAgeMs=world.dirty.size&&this.meshQueueStartedAt>0?Math.max(0,performance.now()-this.meshQueueStartedAt):0;
      stats.maxSectionMs=maxSectionMs;stats.scanComplete=scanComplete;
      stats.scanRemaining=scanComplete?0:Math.max(0,(this.dirtyScanInitialSize??queuedBefore)-(this.dirtyScanScanned??0));
      stats.activeJobs=this.meshJobs.size;stats.slicesThisFrame=slicesThisFrame;
      stats.admissionBacklog=Math.max(0,addQueue.length-this.dirtyScanAddCursor);
      stats.admissionBacklogHighWater=this.dirtyAdmissionBacklogHighWater;
      stats.admittedThisFrame=admittedThisFrame;stats.admissionLimit=admissionLimit;
      stats.admissionTimeMs=admissionTimeMs;stats.admissionBudgetMs=admissionBudgetMs;stats.meshBudgetMs=meshBudgetMs;
      stats.admissionHeadroomMs=this.meshAdmissionHeadroomMs;stats.admissionCostMsPerKey=this.dirtyAdmissionCostMsPerKey;
      stats.queuedCandidates=this.meshQueueHeap.length+this.meshQueueBackgroundHeap.length;
      stats.activeSections=this.nearestSections.length;stats.pendingCommits=this.meshCommits.size;
      stats.sectionCoordinateCache=this.sectionCoordinates.size;stats.candidatePoolCapacity=this.nearestSectionPool.length;
      stats.activeMeshingMs=activeMeshingMs;
      stats.admissionPressure=stats.admissionBacklog/Math.max(1,stats.admissionBacklog+stats.queuedCandidates+stats.activeSections);
      stats.visibleQueued=this.dirtyScanVisibleFirstBuild;stats.visibleReady=this.dirtyScanVisibleReady;
      stats.visiblePending=Math.max(0,stats.visibleQueued-stats.visibleReady);
      stats.backgroundQueued=this.dirtyScanBackgroundFirstBuild;stats.backgroundReady=this.dirtyScanBackgroundReady;
      stats.backgroundPending=Math.max(0,stats.backgroundQueued-stats.backgroundReady);
      stats.visibleWorldReady=scanComplete&&stats.visiblePending===0;
      stats.visibleWorldProgress=scanComplete?(stats.visibleQueued?stats.visibleReady/stats.visibleQueued:1):0;
    };
    // Stream/evict cleanup is amortized rather than scanning all cached keys
    // for every removed column.
    this.pruneStaleSectionCoordinates?.(world);
    const nearest=this.nearestSections;
    this.dirtyAdmissionBacklogHighWater=Math.max(this.dirtyAdmissionBacklogHighWater,Math.max(0,addQueue.length-this.dirtyScanAddCursor));
    if(!queuedBefore){
      const needsIdleReset=this.dirtyScanWorld!==world||this.dirtyScanEditRevision!==currentEditRevision||
        !this.dirtyScanReady||
        this.meshQueueHeap.length>0||this.meshQueueBackgroundHeap.length>0||nearest.length>0||
        this.meshJobs.size>0||this.meshCommits.size>0||addQueue.length>this.dirtyScanAddCursor;
      if(needsIdleReset){
        this.resetMeshQueue(world,cameraCell);
        this.dirtyScanReady=true;this.dirtyScanIterator=null;this.dirtyScanInitialSize=0;
      }
      this.meshQueueStartedAt=0;this.dirtyAdmissionBacklogHighWater=0;this.dirtyAdmissionEpisodeActive=false;
      // An idle world does not need to retain a huge historical burst buffer.
      if(this.nearestSectionPool.length>512)this.nearestSectionPool.length=512;
      this.dirtyScanCameraCell=cameraCell;
      finishQueueDiagnostics(true);
      return;
    }
    // Block edits and world replacement invalidate the priority snapshot.
    // Camera-cell movement only reprioritizes unstarted candidates; chunk
    // topology and new dirty keys enter incrementally. Per-section revisions
    // cancel only affected active jobs and pending geometry commits.
    if(this.dirtyScanEditRevision!==currentEditRevision||
      this.dirtyScanWorld!==world||
      (this.dirtyScanReady&&!this.meshQueueHeap.length&&!this.meshQueueBackgroundHeap.length&&
        !nearest.length&&!this.meshJobs.size&&!this.meshCommits.size&&
        this.dirtyScanAddCursor>=addQueue.length&&world.dirty.size>0)||
      (!this.dirtyScanReady&&!this.dirtyScanIterator)){
      this.resetMeshQueue(world,cameraCell);
    }
    const cameraCellChanged=this.dirtyScanCameraCell!==cameraCell;
    this.refreshMeshQueueFacing(world,eye,cameraCellChanged||this.evictionQueueRefresh);
    this.evictionQueueRefresh=false;
    this.dirtyScanCameraCell=cameraCell;
    if(this.meshQueueStartedAt<=0)this.meshQueueStartedAt=queueNow;
    const scanLimit=256,admissionHardCap=256,minAdmission=16,limit=Math.max(1,Math.floor(budget));
    // Mesh work shares only measured previous-frame CPU headroom. Keep a small
    // minimum for forward progress, but never exceed the established 7 ms cap.

    const activePressure=nearest.length>=limit?0.65:nearest.length>0?0.85:1;
    admissionBudgetMs=Math.max(0.16,Math.min(1.25,this.meshAdmissionHeadroomMs*0.15)*activePressure);
    admissionLimit=Math.min(admissionHardCap,Math.max(minAdmission,
      Math.floor(admissionBudgetMs/Math.max(0.001,this.dirtyAdmissionCostMsPerKey))));
    let scanComplete=this.dirtyScanReady;
    if(!this.dirtyScanReady){
      while(scanned<scanLimit&&this.dirtyScanScanned<this.dirtyScanInitialSize){
        const next=this.dirtyScanIterator!.next();
        if(next.done){scanComplete=true;this.dirtyScanIterator=null;break;}
        const key=next.value;scanned++;this.dirtyScanScanned++;
        const q=this.sectionCoordinate(key);
        if(!q){world.dirty.delete(key);continue;}
        const{cx,sy,cz,column:ck}=q;
        if(!world.chunks.has(ck)){
          world.dirty.delete(key);world.sectionDirtyRevision?.delete(key);
          this.sectionCoordinates.delete(key);continue;
        }
        if(!inRange(sy)){world.dirty.delete(key);this.deferred.add(key);continue;}
        this.dirtyScanEligible++;
        const firstBuild=!this.meshed.has(key);
        if(firstBuild)this.dirtyScanFirstBuild++;else this.dirtyScanRemesh++;
        let entry=this.nearestSectionPool[this.dirtyScanPoolCount];
        if(!entry){entry={key:"",cx:0,sy:0,cz:0,distance:0,foreground:false,firstBuild:false,ready:false,queued:false};this.nearestSectionPool[this.dirtyScanPoolCount]=entry;}
        this.dirtyScanPoolCount++;
        entry.key=key;entry.cx=cx;entry.sy=sy;entry.cz=cz;entry.firstBuild=firstBuild;entry.ready=false;entry.queued=true;
        this.meshQueueEntryByKey.set(key,entry);
        this.updateMeshQueueEntry(entry,eye);
        if(firstBuild){if(entry.foreground)this.dirtyScanVisibleFirstBuild++;else this.dirtyScanBackgroundFirstBuild++;}
        this.pushMeshQueue(entry);
      }
      if(this.dirtyScanScanned>=this.dirtyScanInitialSize)scanComplete=true;
      if(scanComplete){this.dirtyScanIterator=null;this.dirtyScanReady=true;}
    }
    // The initial snapshot must be classified before foreground scheduling
    // starts. After that, newly dirty keys are admitted incrementally without
    // restarting the snapshot, clearing heaps or cancelling unrelated jobs.
    if(!this.dirtyScanReady){
      this.dirtyAdmissionBacklogHighWater=Math.max(this.dirtyAdmissionBacklogHighWater,Math.max(0,addQueue.length-this.dirtyScanAddCursor));
      finishQueueDiagnostics(false);return;
    }
    const admissionStarted=performance.now();
    while(this.dirtyScanAddCursor<addQueue.length&&admittedThisFrame<admissionLimit){
      if(admittedThisFrame>=minAdmission&&(admittedThisFrame&7)===0&&performance.now()-admissionStarted>=admissionBudgetMs)break;
      const key=addQueue[this.dirtyScanAddCursor++];admittedThisFrame++;
      world.dirtyAddQueueSet?.delete(key);
      if(!world.dirty.has(key)||this.meshQueueEntryByKey.has(key))continue;
      const q=this.sectionCoordinate(key);
      if(!q){world.dirty.delete(key);continue;}
      const{cx,sy,cz,column:ck}=q;
      if(!world.chunks.has(ck)){
          world.dirty.delete(key);world.sectionDirtyRevision?.delete(key);
          this.sectionCoordinates.delete(key);continue;
        }
      if(!inRange(sy)){world.dirty.delete(key);this.deferred.add(key);continue;}
      this.dirtyScanEligible++;
      const firstBuild=!this.meshed.has(key);
      if(firstBuild)this.dirtyScanFirstBuild++;else this.dirtyScanRemesh++;
      let entry=this.nearestSectionPool[this.dirtyScanPoolCount];
      if(!entry){entry={key:"",cx:0,sy:0,cz:0,distance:0,foreground:false,firstBuild:false,ready:false,queued:false};this.nearestSectionPool[this.dirtyScanPoolCount]=entry;}
      this.dirtyScanPoolCount++;
      entry.key=key;entry.cx=cx;entry.sy=sy;entry.cz=cz;entry.firstBuild=firstBuild;entry.ready=false;entry.queued=true;
      this.meshQueueEntryByKey.set(key,entry);
      this.updateMeshQueueEntry(entry,eye);
      if(firstBuild){if(entry.foreground)this.dirtyScanVisibleFirstBuild++;else this.dirtyScanBackgroundFirstBuild++;}
      this.pushMeshQueue(entry);
    }
    admissionTimeMs=Math.max(0,performance.now()-admissionStarted);
    if(admittedThisFrame>0){
      const observedCost=admissionTimeMs/admittedThisFrame;
      this.dirtyAdmissionCostMsPerKey=Math.max(0.001,Math.min(0.1,this.dirtyAdmissionCostMsPerKey*0.8+observedCost*0.2));
    }
    this.dirtyAdmissionBacklogHighWater=Math.max(this.dirtyAdmissionBacklogHighWater,Math.max(0,addQueue.length-this.dirtyScanAddCursor));
    if(this.dirtyScanAddCursor>=addQueue.length){
      addQueue.length=0;this.dirtyScanAddCursor=0;world.dirtyAddQueueSet?.clear();
    }
    scanComplete=this.dirtyScanReady&&this.dirtyScanAddCursor>=addQueue.length;
    const fillActive=()=>{
      let foregroundSlots=Math.max(0,limit-nearest.length);
      let reserveBackground=foregroundSlots>1&&this.meshQueueBackgroundHeap.length>0;
      if(reserveBackground)foregroundSlots--;
      while(nearest.length<limit&&(this.meshQueueHeap.length||this.meshQueueBackgroundHeap.length)){
        let entry:NearestSection|undefined;
        if(reserveBackground&&foregroundSlots<=0&&this.meshQueueBackgroundHeap.length){
          entry=this.popMeshQueue(this.meshQueueBackgroundHeap);this.meshQueueForegroundStreak=0;reserveBackground=false;
        }else{
          entry=this.popNextMeshQueue();
          if(entry?.foreground)foregroundSlots--;else if(entry){foregroundSlots=0;reserveBackground=false;}
        }
        if(!entry)break;
        if(!world.dirty.has(entry.key)){this.meshQueueEntryByKey.delete(entry.key);continue;}
        const columnKey=`${entry.cx},${entry.cz}`;
        if(!world.chunks.has(columnKey)){
          world.dirty.delete(entry.key);world.sectionDirtyRevision?.delete(entry.key);
          this.sectionCoordinates.delete(entry.key);this.meshQueueEntryByKey.delete(entry.key);continue;
        }
        if(!inRange(entry.sy)){world.dirty.delete(entry.key);this.deferred.add(entry.key);this.meshQueueEntryByKey.delete(entry.key);continue;}
        nearest.push(entry);
      }
    };
    const removeActiveAt=(index:number)=>{
      for(let i=index;i<nearest.length-1;i++)nearest[i]=nearest[i+1];
      nearest.pop();
    };
    fillActive();
    const started=performance.now(),activeMeshingStarted=started;
    let completedThisFrame=0,index=0,unchangedCommitVisits=0;
    while(index<nearest.length){
      const entry=nearest[index],{key,cx,sy,cz}=entry;
      if(!world.dirty.has(key)){this.cancelMeshWork(key);this.meshQueueEntryByKey.delete(key);removeActiveAt(index);continue;}
      const ck=`${cx},${cz}`,c=world.chunks.get(ck);
      if(!c){world.dirty.delete(key);world.sectionDirtyRevision?.delete(key);this.sectionCoordinates.delete(key);this.cancelMeshWork(key);this.meshQueueEntryByKey.delete(key);removeActiveAt(index);continue;}
      if(!inRange(sy)){world.dirty.delete(key);this.deferred.add(key);this.cancelMeshWork(key);this.meshQueueEntryByKey.delete(key);removeActiveAt(index);continue;}
      let pendingCommit=this.meshCommits.get(key);
      const sectionDirtyRevision=world.sectionDirtyRevision?.get(key)??0;
      if(pendingCommit&&pendingCommit.dirtyRevision!==sectionDirtyRevision){
        this.disposePendingCommit(pendingCommit);this.meshCommits.delete(key);pendingCommit=undefined;
      }
      if(pendingCommit){
        // A section gets at most one material-group geometry commit per frame,
        // but an unfinished commit must not block every other active section.
        if(pendingCommit.lastAdvancedFrame===meshFrameId){
          index++;if(index>=nearest.length)index=0;
          if(++unchangedCommitVisits>=nearest.length)break;
          continue;
        }
        pendingCommit.lastAdvancedFrame=meshFrameId;
        const completed=this.advanceMeshCommit(world,pendingCommit);
        unchangedCommitVisits=0;
        if(completed){
          this.recordMeshQueueReady(entry);this.meshQueueEntryByKey.delete(key);
          processed++;if(pendingCommit.group.children.length)rendered++;else empty++;
          this.metrics.add("mesh",pendingCommit.meshCpuMs);removeActiveAt(index);
          if(++completedThisFrame>=limit||performance.now()-started>meshBudgetMs)break;
          continue;
        }
        index++;if(index>=nearest.length)index=0;
        if(performance.now()-started>meshBudgetMs)break;
        continue;
      }
      let job=this.meshJobs.get(key);
      if(!job){
        job={iterator:meshChunkSteps(world,c,this.lighting,sy),editRevision:currentEditRevision,
          dirtyRevision:sectionDirtyRevision,cx,sy,cz,cpuMs:0};
        this.meshJobs.set(key,job);
      }
      if(job.editRevision!==currentEditRevision||job.dirtyRevision!==(world.sectionDirtyRevision?.get(key)??0)||
        world.chunks.get(ck)!==c){
        job.iterator.return?.(undefined as unknown as MeshData[]);this.meshJobs.delete(key);index++;
        if(index>=nearest.length)index=0;
        continue;
      }
      const sliceStarted=performance.now(),result=job.iterator.next(),sliceMs=performance.now()-sliceStarted;
      slicesThisFrame++;job.cpuMs+=sliceMs;unchangedCommitVisits=0;
      if(result.done){
        maxSectionMs=Math.max(maxSectionMs,job.cpuMs);this.meshJobs.delete(key);
        const commit:PendingMeshCommit={key,cx,sy,cz,columnKey:ck,data:result.value,group:new THREE.Group(),
          nextMaterial:0,cpuMs:0,meshCpuMs:job.cpuMs,dirtyRevision:job.dirtyRevision,lastAdvancedFrame:meshFrameId};
        commit.group.position.set(0,sy*16,0);this.meshCommits.set(key,commit);
        // Geometry creation and bounds are spread across frames; the old section
        // remains visible until its complete replacement is ready.
        const completed=this.advanceMeshCommit(world,commit);
        if(completed){
          this.recordMeshQueueReady(entry);this.meshQueueEntryByKey.delete(key);
          processed++;if(commit.group.children.length)rendered++;else empty++;
          this.metrics.add("mesh",job.cpuMs);removeActiveAt(index);
          if(++completedThisFrame>=limit||performance.now()-started>meshBudgetMs)break;
          continue;
        }
        index++;if(index>=nearest.length)index=0;
        if(performance.now()-started>meshBudgetMs)break;
        continue;
      }
      // Advance active jobs in nearest-first round-robin order. Fine-grained
      // mesher slices are small, so a frame may consume several rounds while
      // sharing the same soft CPU budget instead of forcing one slice/job/frame.
      index++;
      if(index>=nearest.length)index=0;
      if(performance.now()-started>meshBudgetMs)break;
    }
    activeMeshingMs=Math.max(0,performance.now()-activeMeshingStarted);
    // Completed active slots are replenished from the persistent heap. This is
    // the key invariant: subsequent scheduling passes reuse the same dirty-Set scan.
    let write=0;
    for(let i=0;i<nearest.length;i++){
      const entry=nearest[i];
      if(world.dirty.has(entry.key)||this.meshJobs.has(entry.key)||this.meshCommits.has(entry.key))nearest[write++]=entry;
    }
    nearest.length=write;
    fillActive();
    finishQueueDiagnostics(scanComplete);
    const queuePending=nearest.length>0||this.meshQueueHeap.length>0||this.meshQueueBackgroundHeap.length>0||
      this.meshJobs.size>0||this.meshCommits.size>0||this.dirtyScanAddCursor<addQueue.length;
    if(scanComplete&&!queuePending){
      this.resetMeshQueue(world,cameraCell);
      if(world.dirty.size===0){this.meshQueueStartedAt=0;this.dirtyScanReady=true;this.dirtyScanIterator=null;this.dirtyScanInitialSize=0;}
    }
  }
  /** Commit a player's mined block in the same frame as the authoritative
   * world edit. Ordinary chunk streaming, simulation edits and lighting still
   * use the bounded asynchronous scheduler; only an already-visible section
   * may need this interaction-latency exception.
   */
  commitMinedBlock(world: World, x: number, y: number, z: number) {
    const cx=Math.floor(x/16),sy=Math.floor(y/16),cz=Math.floor(z/16);
    const key=`${cx},${sy},${cz}`,columnKey=`${cx},${cz}`;
    // Nothing stale is visible if the section has not been drawn yet.
    if(!this.sections.has(key)||!world.dirty.has(key))return;
    const chunk=world.chunks.get(columnKey);
    if(!chunk)return;
    const revision=world.sectionDirtyRevision.get(key)??0;
    const started=performance.now();
    const iterator=meshChunkSteps(world,chunk,this.lighting,sy);
    let step=iterator.next();
    while(!step.done)step=iterator.next();
    // Keep revision/column safety even for this synchronous interaction path.
    if(world.chunks.get(columnKey)!==chunk || (world.sectionDirtyRevision.get(key)??0)!==revision)return;
    this.cancelMeshWork(key);
    const commit:PendingMeshCommit={
      key,cx,sy,cz,columnKey,data:step.value,group:new THREE.Group(),
      nextMaterial:0,cpuMs:0,meshCpuMs:performance.now()-started,
      dirtyRevision:revision,lastAdvancedFrame:this.meshFrameSequence??0,
    };
    commit.group.position.set(0,sy*16,0);
    this.meshCommits.set(key,commit);
    // Use the same atomic replacement and disposal code as normal meshing.
    // At most three material groups are committed, only for this one section.
    while(this.meshCommits.has(key))this.advanceMeshCommit(world,commit);
    this.metrics.add("mesh",commit.meshCpuMs);
    const queued=this.meshQueueEntryByKey.get(key);
    if(queued){this.recordMeshQueueReady(queued);this.meshQueueEntryByKey.delete(key);}
  }
  removeSection(key:string,forget=true) {
    if(forget&&this.meshed.delete(key))this.recordMeshChange(key,false);
    const g=this.sections.get(key);
    if(g) {g.traverse(o=>{if(o instanceof THREE.Mesh){this.renderAudit?.untag(o);o.geometry.dispose();}});g.removeFromParent();this.sections.delete(key);}
  }
  remove(key: string) {
    const [cx,cz]=key.split(",").map(Number);
    // The released signed-height range has exactly24 section addresses.
    // Eviction need not rescan and parse every other loaded section.
    for(let sy=MIN_SECTION;sy<=MAX_SECTION;sy++){
      const sk=`${cx},${sy},${cz}`;
      this.cancelMeshWork(sk);
      this.meshQueueEntryByKey.delete(sk);
      this.removeSection(sk);this.deferred.delete(sk);this.sectionCoordinates.delete(sk);
    }
    // Invalidate queued priorities just once in the next rebuild instead of
    // rescanning an entire streaming backlog separately for each evicted chunk.
    this.evictionQueueRefresh=true;this.staleCoordinateSweep=null;
    this.groups.get(key)?.removeFromParent();this.groups.delete(key);
  }
  clear() {
    for (const job of this.meshJobs.values()) job.iterator.return?.(undefined as unknown as MeshData[]);this.meshJobs.clear();
    for (const commit of this.meshCommits.values()) this.disposePendingCommit(commit);this.meshCommits.clear();
    this.dirtyScanIterator=null;this.dirtyScanWorld=undefined;this.dirtyScanCameraCell="";this.dirtyScanReady=false;
    this.dirtyScanEditRevision=-1;this.dirtyScanInitialSize=0;this.dirtyScanScanned=0;
    this.dirtyScanEligible=0;this.dirtyScanRemesh=0;this.dirtyScanFirstBuild=0;this.meshQueueStartedAt=0;
    this.meshQueueHeap.length=0;this.meshQueueBackgroundHeap.length=0;this.meshQueueForegroundStreak=0;this.nearestSections.length=0;this.dirtyScanPoolCount=0;
    this.meshQueueEntryByKey.clear();this.dirtyScanAddCursor=0;
    this.dirtyAdmissionBacklogHighWater=0;this.dirtyAdmissionEpisodeActive=false;this.meshAdmissionHeadroomMs=4;this.dirtyAdmissionCostMsPerKey=0.01;
    this.dirtyScanVisibleFirstBuild=0;this.dirtyScanVisibleReady=0;this.dirtyScanBackgroundFirstBuild=0;this.dirtyScanBackgroundReady=0;
    for(const entry of this.nearestSectionPool){entry.key="";entry.queued=false;entry.firstBuild=false;entry.ready=false;}
    for (const k of this.groups.keys()) this.remove(k);
    this.evictionQueueRefresh=false;this.staleCoordinateSweep=null;
    // World switches should not retain another world's peak candidate pool.
    if(this.nearestSectionPool.length>256)this.nearestSectionPool.length=256;
    this.meshed.clear();this.deferred.clear();this.sectionCoordinates.clear();this.surfaceX=this.surfaceZ=NaN;this.lastSectionY=Infinity;this.lastSurfaceY=Infinity;this.recordMeshChange("",false,true);
    this.clearDistant();
  }
  clearDistant() {this.distant?.dispose();this.distant=undefined;this.renderWorld=undefined;}
  attachWorld(world:World,time:number,rain=false) {
    if(this.renderWorld===world)return;
    this.distant?.dispose();this.distant=world.macroPlan?new DistantWorld(world,this.atmosphere,this.graphicsProfile,this.renderAudit):undefined;if(this.distant)this.scene.add(this.distant.group);this.renderWorld=world;
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
    const eyeSky=this.lighting?.sample(Math.floor(eye.x),Math.floor(eye.y),Math.floor(eye.z))[0];
    this.rainExposure=eyeSky??1;
    const underground=!!(world?.loaded(eye.x,eye.z)&&macro&&eye.y<sampleTerrain(macro,eye.x,eye.z).height-3&&eyeSky===0);
    this.sky.visible=this.clouds.visible=!underground;
    for(const m of this.materials)if(m instanceof THREE.ShaderMaterial){const u=m.uniforms;u.daylight.value=a.daylight;u.lightTint.value.copy(a.light);u.waterTint.value.copy(a.water);u.night.value=a.night;u.fogColor.value.copy(a.fog);u.fogNear.value=a.fogNear;u.fogFar.value=a.fogFar;u.fogDetail.value=a.fogDetail;}
    this.metrics.add("atmosphere",performance.now()-began);
  }
  updateDistant(world:World) {
    this.attachWorld(world,this.environmentTime,this.weather);
    const began=performance.now();
    if(this.distant){this.distant.group.visible=this.sky.visible;this.distant.update(this.camera.position,this.meshed,this.atmosphere,this.meshRevision,this.meshChanges,this.meshChangeBase);}
    this.metrics.add("distant",performance.now()-began);
  }
  target(hit: Vec3 | null) {
    this.outline.visible = !!hit;
    if (hit) this.outline.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
  }
  setRenderAuditEnabled(enabled:boolean) { this.renderAudit.setEnabled(enabled); }
  renderAuditDebug() { return this.renderAudit?.format(this.worldRenderStats.breakdown) ?? "Render category audit: unavailable"; }
  renderAuditUntrackedDebug(now = performance.now()) {
    // Scene traversal is intentionally limited to 1 Hz and only requested by
    // F3. It is diagnostic work, not part of the normal render loop.
    if (now - this.untrackedAuditScannedAt >= 1000) {
      this.untrackedAuditScannedAt = now;
      this.untrackedAuditStats = this.renderAudit.inspectUntracked([this.scene, this.viewmodelScene]);
    }
    const { count, examples } = this.untrackedAuditStats;
    return `Untracked visible renderables: ${count}${examples.length ? ` · ${examples.join(", ")}` : ""}`;
  }
  renderAuditUntrackedSnapshot() {
    if (this.untrackedAuditScannedAt === -Infinity) return null;
    return {
      count: this.untrackedAuditStats.count,
      examples: [...this.untrackedAuditStats.examples],
    };
  }
  setGpuTimingEnabled(enabled:boolean) {
    if(this.gpuTimingEnabled===enabled)return;
    this.gpuTimingEnabled=enabled;this.gpuTimer.reset();this.gpuTimingSample=null;
  }
  consumeGpuTiming(): GpuTimingSample | null {
    const sample=this.gpuTimingSample;this.gpuTimingSample=null;return sample;
  }
  render() {
    if (this.disposed || this.contextLost) return;
    if(this.drawingSizePending){this.drawingSizePending=false;this.updateDrawingSize();}
    const completed=this.gpuTimingEnabled?this.gpuTimer.poll(performance.now()):null;
    if(completed)this.gpuTimingSample=completed;
    else if(!this.gpuTimingEnabled)this.gpuTimingSample=null;
    const timed=this.gpuTimingEnabled&&this.gpuTimer.begin();
    try {
      const audit = this.renderAudit;
      this.viewmodelRenderStats ??= { triangles: 0, calls: 0, breakdown: null };
      audit?.beginPass();
      this.camera.updateMatrixWorld();
      this.transparentSortProjection.multiplyMatrices(this.camera.projectionMatrix,this.camera.matrixWorldInverse);
      this.transparentSortFrame++;
      this.renderer.clear();
      this.renderer.render(this.scene, this.camera);
      this.worldRenderStats.triangles = this.renderer.info.render.triangles;
      this.worldRenderStats.calls = this.renderer.info.render.calls;
      this.worldRenderStats.breakdown = audit?.snapshot(
        this.worldRenderStats.triangles, this.worldRenderStats.calls, this.worldRenderStats.breakdown,
      ) ?? null;
      if (this.hand.visible) {
        audit?.beginPass();
        this.renderer.clearDepth();
        this.renderer.render(this.viewmodelScene, this.viewmodelCamera);
        this.viewmodelRenderStats.triangles = this.renderer.info.render.triangles;
        this.viewmodelRenderStats.calls = this.renderer.info.render.calls;
        this.viewmodelRenderStats.breakdown = audit?.snapshot(
          this.viewmodelRenderStats.triangles, this.viewmodelRenderStats.calls, this.viewmodelRenderStats.breakdown,
        ) ?? null;
      } else {
        this.viewmodelRenderStats.triangles = 0;
        this.viewmodelRenderStats.calls = 0;
        this.viewmodelRenderStats.breakdown = null;
      }
    } finally {
      if(timed)this.gpuTimer.end();
    }
  }
  /** Final owner teardown. World transitions should use clear(), not dispose(). */
  dispose(){
    if(this.disposed)return;
    this.disposed=true;
    this.canvas.removeEventListener("webglcontextlost",this.handleContextLost);
    this.canvas.removeEventListener("webglcontextrestored",this.handleContextRestored);
    this.onContext=undefined;
    this.gpuTimer.dispose();this.gpuTimingSample=null;
    this.renderAudit?.dispose();
    this.clear();
    // The remaining scene graph is owned by this View (EntityView and Effects
    // must be disposed by Game first). Dispose each GPU resource once.
    const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();
    const collect=(root:THREE.Object3D)=>root.traverse(object=>{
      const renderable=object as THREE.Mesh;
      if(renderable.geometry)geometries.add(renderable.geometry);
      const material=renderable.material as THREE.Material|THREE.Material[]|undefined;
      if(Array.isArray(material))for(const m of material)materials.add(m);else if(material)materials.add(material);
    });
    collect(this.scene);collect(this.viewmodelScene);
    for(const material of this.materials)materials.add(material);
    for(const geometry of geometries)geometry.dispose();
    for(const material of materials)material.dispose();
    this.atlas.texture.dispose();
    this.renderer.dispose();
    this.scene.clear();this.viewmodelScene.clear();this.clouds.clear();this.hand.clear();this.heldModel.clear();
    this.materials.length=0;this.atlas.canvas.width=1;this.atlas.canvas.height=1;
    this.groups.clear();this.sections.clear();this.meshed.clear();this.deferred.clear();this.sectionCoordinates.clear();this.meshChanges.length=0;this.meshChangeBase=this.meshRevision;this.nearestSections.length=0;this.nearestSectionPool.length=0;this.meshQueueHeap.length=0;for(const job of this.meshJobs.values())job.iterator.return?.(undefined as unknown as MeshData[]);this.meshJobs.clear();
    this.renderWorld=undefined;this.lighting=undefined;
  }

}
