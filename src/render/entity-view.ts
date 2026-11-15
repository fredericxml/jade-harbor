import * as THREE from "three";
import { Entities, Entity } from "../game/entities";
import { PROFESSIONS } from "../game/professions";
import { item } from "../game/items";
import type { TaskChain } from "../game/city-life/purpose";
import type { ResidentState } from "../game/city-life/runtime";
import { identityHash } from "../game/city-life/schedules";
import { GRAPHICS_PROFILES, type GraphicsProfile } from "./graphics";
import type { RenderWorkloadAudit } from "./render-audit";
type Part=(color:string,x:number,y:number,z:number,w:number,h:number,d:number,rx?:number,ry?:number)=>void;
type ResidentPoseCache = { signature: number; appearanceSignature: number; start: number; parts: number };
type ResidentRenderInfo = { detail: number; animationTime: number; task?: TaskChain; state?: ResidentState; signature: number; appearanceSignature: number };

const renderHashBuffer = new ArrayBuffer(4);
const renderHashFloat = new Float32Array(renderHashBuffer);
const renderHashUint = new Uint32Array(renderHashBuffer);
function hashNumber(hash: number, value: number) {
  renderHashFloat[0] = Number.isFinite(value) ? value : 0;
  return Math.imul(hash ^ renderHashUint[0], 16777619) >>> 0;
}
function hashString(hash: number, value: string | undefined) {
  if (value === undefined) return Math.imul(hash ^ 0xff, 16777619) >>> 0;
  for (let i = 0; i < value.length; i++) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619) >>> 0;
  return Math.imul(hash ^ 0xfe, 16777619) >>> 0;
}
function hashBoolean(hash: number, value: boolean) {
  return Math.imul(hash ^ (value ? 1 : 0), 16777619) >>> 0;
}
export class EntityView {
  models = new Map<string, THREE.Group>();
  drops = new Map<string, THREE.Mesh>();
  geometry = new THREE.BoxGeometry(1, 1, 1);
  materials = new Map<string, THREE.MeshLambertMaterial>();
  private civilianMaterial = new THREE.MeshLambertMaterial({ color: "#ffffff" });
  // Legacy components can render 256 civilians; v8 details at most 96 (v7: 48).
  readonly civilians = new THREE.InstancedMesh(this.geometry, this.civilianMaterial, 256 * 24);
  private pose = new THREE.Object3D();
  private bodyMatrix = new THREE.Matrix4();
  private partMatrix = new THREE.Matrix4();
  private colors = new Map<string, THREE.Color>();
  private actorScale=new THREE.Vector3();
  readonly stats={simulated:0,full:0,mid:0,far:0,culled:0,parts:0};
  private disposed=false;
  private readonly visibleResidents:Entity[]=[];
  private readonly visibleOthers:Entity[]=[];
  private readonly alive=new Set<string>();
  private readonly dropIds=new Set<string>();
  private readonly residentPoseCache = new Map<string, ResidentPoseCache>();
  private readonly residentOrder: string[] = [];
  private readonly residentInfo: ResidentRenderInfo[] = [];
  private readonly residentDirtyRanges: Array<{ start: number; count: number; colors: boolean }> = [];
  private readonly frustum=new THREE.Frustum();
  private readonly cameraMatrix=new THREE.Matrix4();
  private readonly actorSphere=new THREE.Sphere(new THREE.Vector3(),2.2);
  private readonly phases=new Map<string,number>();
  constructor(public scene: THREE.Scene, private readonly renderAudit?: RenderWorkloadAudit) {
    this.renderAudit?.tag(this.civilians, "npc");
    this.civilians.count = 0; this.civilians.frustumCulled = false;
    this.civilians.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(this.civilians);
  }
  material(color: string) {
    if (!this.materials.has(color))
      this.materials.set(color, new THREE.MeshLambertMaterial({ color }));
    return this.materials.get(color)!;
  }
  box(
    group: THREE.Group,
    color: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
  ) {
    const m = new THREE.Mesh(this.geometry, this.material(color));
    this.renderAudit?.tag(m, "npc");
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    group.add(m);
    return m;
  }
  create(e: Entity) {
    const g = new THREE.Group();
    if (e.kind === "panda") {
      this.box(g, "#e1e1cf", 0, 0.48, 0, 0.75, 0.65, 1);
      this.box(g, "#dedfcb", 0, 0.78, 0.5, 0.68, 0.55, 0.5);
      for (const x of [-0.25, 0.25]) {
        this.box(g, "#323d38", x, 0.88, 0.76, 0.19, 0.2, 0.04);
        this.box(g, "#253b34", x, 1.08, 0.5, 0.22, 0.23, 0.22);
        for (const z of [-0.32, 0.32])
          this.box(g, "#303b37", x, 0.18, z, 0.22, 0.38, 0.26);
      }
      this.box(g, "#2b3c36", 0, 0.7, 0.78, 0.15, 0.12, 0.06);
    } else {
      const robe =
        e.kind === "spirit"
          ? "#607b8b"
          : e.profession ? PROFESSIONS[e.profession].color
          : e.name.startsWith("Mei")
            ? "#a85843"
            : e.name.startsWith("Wen")
              ? "#526a66"
              : "#9b905b";
      this.box(g, robe, 0, 0.86, 0, 0.55, 0.68, 0.32);
      this.box(
        g,
        e.kind === "spirit" ? "#8da7aa" : "#c8aa7e",
        0,
        1.43,
        0,
        0.46,
        0.46,
        0.44,
      );
      this.box(g, "#3e4539", 0, 1.68, 0, 0.51, 0.12, 0.49);
      for (const x of [-0.12, 0.12])
        this.box(
          g,
          e.kind === "spirit" ? "#e5ba7e" : "#2b3e35",
          x,
          1.46,
          0.225,
          0.045,
          0.05,
          0.025,
        );
      this.box(g, "#ceae6b", 0, 0.64, 0.17, 0.56, 0.06, 0.03);
      for (const x of [-0.36, 0.36]) {
        const arm = this.box(g, robe, x, 0.85, 0, 0.16, 0.6, 0.2);
        arm.userData.limb = x > 0 ? 1 : -1;
      }
      for (const x of [-0.16, 0.16]) {
        const leg = this.box(g, "#475549", x, 0.28, 0, 0.2, 0.56, 0.23);
        leg.userData.limb = x > 0 ? -1 : 1;
      }
    }
    this.scene.add(g);
    this.models.set(e.id, g);
    return g;
  }
  private purposefulPerson(e:Entity,t:number,task:TaskChain,state:ResidentState|undefined,part:Part,detail=0) {
    let h=this.phases.get(e.id);if(h===undefined){h=identityHash(e.id);this.phases.set(e.id,h);}
    const look=task.look,phase=h%29,walking=Math.hypot(e.body.velocity.x,e.body.velocity.z)>.2;
    const action=!walking&&state?.taskActing?state.taskAction:undefined,swing=walking?Math.sin(t*7+phase)*.38:0;
    const holding=task.prop==="crate"||task.prop==="book"||task.prop==="tea";
    let left=holding?-.8:swing,right=holding?-.8:-swing;
    if(action==="greet"){right=-2.1+Math.sin(t*4+phase)*.25;}
    else if(action==="hammer"){right=-1.05+Math.sin(t*7+phase)*.6;left=-.5;}
    else if(action==="sweep"){left=right=-.75+Math.sin(t*3.2+phase)*.25;}
    else if(action==="converse"){right=-.6+Math.sin(t*2+phase)*.25;left=-.25;}
    else if(action==="sip"){left=right=-1.35;}
    else if(action==="browse"||action==="inspect"){right=-.75;}
    else if(action==="serve"||action==="arrange"||action==="shape"||action==="restock"){left=-.65+Math.sin(t*3+phase)*.2;right=-.8-Math.sin(t*3+phase)*.2;}
    this.actorScale.set(look.width,look.height,look.width);this.bodyMatrix.scale(this.actorScale);
    part(look.upper,0,.86,0,.55,.68,.32);
    if(look.apron&&detail<2)part(look.sash,0,.78,.174,.37,.46,.035);
    part(look.skin,0,1.43,0,.46,.46,.44,action==="inspect"||action==="read"?.1:0,action==="watch"?Math.sin(t*.8+phase)*.25:0);
    if(detail<2)part(look.hair,0,1.66,-.025,.48,.09,.44);
    if(look.hat==="cap")part(look.hatColor,0,1.73,0,.54,.15,.5);
    else if(look.hat==="wrap"){part(look.hatColor,0,1.68,0,.51,.14,.48);part(look.sash,.2,1.59,-.21,.09,.24,.09);}
    else if(look.hat==="straw"){part("#b7a16e",0,1.72,0,.76,.08,.69);part("#aa8b58",0,1.8,0,.39,.14,.36);}
    else if(look.hat==="topknot")part(look.hair,0,1.78,-.05,.19,.19,.2);
    if(detail===0)for(const x of[-.12,.12])part("#2b3e35",x,1.46,.225,.045,.05,.025);
    if(detail<2)part(look.sash,0,.64,.17,.56,.07,.035);
    part(look.upper,-.36,.85,0,.16,.6,.2,left);part(look.upper,.36,.85,0,.16,.6,.2,right);
    part(look.lower,-.16,.28,0,.2,.56,.23,-swing);part(look.lower,.16,.28,0,.2,.56,.23,swing);
    if(detail===0){part(look.hair,-.16,.07,.04,.22,.14,.29);part(look.hair,.16,.07,.04,.22,.14,.29);}
    if(task.prop==="crate"&&(walking||action==="carry"||action==="unload"||action==="restock")){part("#92704b",0,.86,.39,.46,.39,.37);part("#c7a472",0,.86,.59,.46,.055,.025);}
    if(task.prop==="book"){part("#465e58",0,1.01,.35,.4,.27,.065,-.25);part("#ded3ad",0,1.03,.39,.34,.2,.02,-.25);}
    if(task.prop==="basket"){part("#9d8050",-.43,.59,.12,.28,.27,.28);part("#c3a66a",-.43,.78,.12,.22,.1,.04);}
    if(task.prop==="tea"){part("#92704b",0,action==="sip"?1.24:.91,.4,.48,.045,.28);part("#d8d0aa",.1,action==="sip"?1.32:1,.4,.13,.13,.12);}
    if(task.prop==="tool"){part("#9e8053",.38,.92,.28,.045,.35,.045,right);part("#748782",.38,1.07+(action==="hammer"?Math.sin(t*7+phase)*.12:0),.29,.22,.12,.1);}
    if(task.prop==="broom"){part("#a08a58",.37,.72,.22,.045,1.25,.045,action==="sweep"?-.3+Math.sin(t*3+phase)*.15:-.15);part("#ae9863",.37,.13,.29,.25,.2,.11);}
    if(task.prop==="staff"){part("#846d4d",.4,.9,.16,.05,1.8,.05);part("#b7c5b8",.4,1.88,.16,.1,.22,.055);}
  }
  private appearanceSignature(e: Entity, task: TaskChain | undefined, detail: number) {
    let hash = 2166136261;
    hash = hashString(hash, e.profession);
    hash = hashNumber(hash, detail);
    hash = hashString(hash, task?.prop);
    const look = task?.look;
    if (look) {
      hash = hashString(hash, look.fingerprint);
      hash = hashString(hash, look.upper);
      hash = hashString(hash, look.lower);
      hash = hashString(hash, look.sash);
      hash = hashString(hash, look.hair);
      hash = hashString(hash, look.skin);
      hash = hashString(hash, look.hat);
      hash = hashString(hash, look.hatColor);
      hash = hashNumber(hash, look.width);
      hash = hashNumber(hash, look.height);
      hash = hashBoolean(hash, look.apron);
    }
    return hash >>> 0;
  }
  private poseSignature(e: Entity, info: ResidentRenderInfo) {
    const p = e.body.position, velocity = e.body.velocity;
    let hash = 2166136261;
    hash = hashString(hash, e.id);
    hash = hashNumber(hash, p.x); hash = hashNumber(hash, p.y); hash = hashNumber(hash, p.z);
    hash = hashNumber(hash, e.yaw);
    hash = hashNumber(hash, velocity.x); hash = hashNumber(hash, velocity.z);
    hash = hashNumber(hash, info.detail);
    hash = Math.imul(hash ^ info.appearanceSignature, 16777619) >>> 0;
    hash = hashString(hash, e.state);
    const action = info.state?.taskActing ? info.state.taskAction : undefined;
    hash = hashBoolean(hash, !!info.state?.taskActing);
    hash = hashString(hash, action);
    const walking = Math.hypot(velocity.x, velocity.z) > .2;
    const working = !walking && ["working", "browsing", "gathering", "guarding", "sightseeing"].includes(e.state);
    const animatedTaskAction = ["greet", "hammer", "sweep", "converse", "watch", "serve", "arrange", "shape", "restock"].includes(action ?? "");
    if (walking || (info.task ? animatedTaskAction : working))
      hash = hashNumber(hash, info.animationTime);
    return hash >>> 0;
  }
  private prepareResident(e: Entity, index: number, t: number, entities: Entities, camera: THREE.Camera | undefined, profile: GraphicsProfile) {
    let info = this.residentInfo[index];
    if (!info) this.residentInfo[index] = info = { detail: 0, animationTime: t, signature: 0, appearanceSignature: 0 };
    const dx = e.body.position.x - (camera?.position.x ?? e.body.position.x);
    const dy = e.body.position.y - (camera?.position.y ?? e.body.position.y);
    const dz = e.body.position.z - (camera?.position.z ?? e.body.position.z);
    const distance = dx * dx + dy * dy + dz * dz;
    info.detail = distance > profile.residentMidDistance ** 2 ? 2 : distance > profile.residentFullDistance ** 2 ? 1 : 0;
    if (info.detail === 0) this.stats.full++;
    else if (info.detail === 1) this.stats.mid++;
    else this.stats.far++;
    info.animationTime = info.detail > 0 ? Math.floor(t * profile.farAnimationHz) / profile.farAnimationHz : t;
    info.task = entities.life?.plan?.byId.get(e.id)?.task;
    info.state = entities.life?.states.get(e.id);
    info.appearanceSignature = this.appearanceSignature(e, info.task, info.detail);
    info.signature = this.poseSignature(e, info);
    return info;
  }
  private writeCivilianActor(e: Entity, info: ResidentRenderInfo, base: number, limit: number, writeColors: boolean) {
    let local = 0;
    const part = (color: string, x: number, y: number, z: number, w: number, h: number, d: number, rx = 0, ry = 0) => {
      const slot = base + local++;
      if (local > limit || slot >= this.civilians.instanceMatrix.count) return;
      this.pose.position.set(x, y, z);
      this.pose.scale.set(w, h, d);
      this.pose.rotation.set(rx, ry, 0);
      this.pose.updateMatrix();
      this.partMatrix.multiplyMatrices(this.bodyMatrix, this.pose.matrix);
      this.civilians.setMatrixAt(slot, this.partMatrix);
      if (writeColors) {
        let c = this.colors.get(color);
        if (!c) { c = new THREE.Color(color); this.colors.set(color, c); }
        this.civilians.setColorAt(slot, c);
      }
    };
    const p = e.body.position, walking = Math.hypot(e.body.velocity.x, e.body.velocity.z) > .2;
    const swing = walking ? Math.sin(info.animationTime * 7) * .35 : 0;
    this.bodyMatrix.makeRotationY(e.yaw);
    this.bodyMatrix.setPosition(p.x, p.y, p.z);
    if (info.task) {
      this.purposefulPerson(e, info.animationTime, info.task, info.state, part, info.detail);
      return local;
    }
    const robe = e.profession ? PROFESSIONS[e.profession].color : "#9b905b";
    const working = !walking && ["working", "browsing", "gathering", "guarding", "sightseeing"].includes(e.state);
    const carrying = e.profession === "dock_worker", book = e.profession === "scholar" || e.profession === "researcher";
    const workArm = working && ["potter", "carpenter", "blacksmith", "merchant", "chef"].includes(e.profession ?? "") ? -.3 + Math.sin(info.animationTime * 2.2 + p.x) * .18 : 0;
    part(robe, 0, .86, 0, .55, .68, .32);
    part("#c8aa7e", 0, 1.43, 0, .46, .46, .44, 0, working ? Math.sin(info.animationTime * .7 + p.z) * .09 : 0);
    part("#3e4539", 0, 1.68, 0, .51, .12, .49);
    if (info.detail === 0) for (const x of [-.12, .12]) part("#2b3e35", x, 1.46, .225, .045, .05, .025);
    if (info.detail < 2) part("#ceae6b", 0, .64, .17, .56, .06, .03);
    part(robe, -.36, .85, 0, .16, .6, .2, carrying || book ? -.8 : swing + workArm);
    part(robe, .36, .85, 0, .16, .6, .2, carrying || book ? -.8 : -swing + workArm);
    part("#475549", -.16, .28, 0, .2, .56, .23, -swing);
    part("#475549", .16, .28, 0, .2, .56, .23, swing);
    if (carrying) { part("#92704b", 0, .85, .4, .49, .43, .4); part("#c7a472", 0, .85, .61, .49, .055, .025); }
    if (book) { part("#465e58", 0, .99, .35, .43, .29, .065, -.25); part("#ded3ad", 0, 1.015, .39, .36, .21, .02, -.25); }
    if (e.profession === "fisherman") part("#b29669", .38, 1.15, .25, .045, 1.55, .045, -.25);
    if (e.profession === "guard") { part("#846d4d", .4, .9, .16, .05, 1.8, .05); part("#b7c5b8", .4, 1.88, .16, .1, .22, .055); }
    if (working && ["carpenter", "blacksmith"].includes(e.profession ?? "")) part("#73827c", .35, .93 + Math.sin(info.animationTime * 2.2) * .08, .25, .19, .12, .12);
    return local;
  }
  private uploadCivilianRanges(total: number, full: boolean) {
    const matrix = this.civilians.instanceMatrix;
    matrix.clearUpdateRanges();
    if (total > 0) {
      if (full) matrix.addUpdateRange(0, total * 16);
      else {
        for (const range of this.residentDirtyRanges) matrix.addUpdateRange(range.start * 16, range.count * 16);
      }
      matrix.needsUpdate = true;
    }
    const colors = this.civilians.instanceColor;
    if (!colors) return;
    colors.clearUpdateRanges();
    let changed = false;
    if (full) {
      if (total > 0) { colors.addUpdateRange(0, total * 3); changed = true; }
    } else {
      for (const range of this.residentDirtyRanges) if (range.colors) {
        colors.addUpdateRange(range.start * 3, range.count * 3);
        changed = true;
      }
    }
    if (changed) colors.needsUpdate = true;
  }
  private rebuildCivilianBatch(actors: Entity[], t: number, entities: Entities, camera: THREE.Camera | undefined, profile: GraphicsProfile) {
    this.stats.full = this.stats.mid = this.stats.far = 0;
    this.residentPoseCache.clear();
    this.residentOrder.length = 0;
    let total = 0;
    const capacity = this.civilians.instanceMatrix.count;
    for (let i = 0; i < actors.length; i++) {
      const e = actors[i], info = this.prepareResident(e, i, t, entities, camera, profile);
      const generated = this.writeCivilianActor(e, info, total, Infinity, true);
      const parts = Math.min(generated, Math.max(0, capacity - total));
      this.residentPoseCache.set(e.id, { signature: info.signature, appearanceSignature: info.appearanceSignature, start: total, parts });
      this.residentOrder.push(e.id);
      total += parts;
    }
    this.residentInfo.length = actors.length;
    this.civilians.count = total;
    this.civilians.visible = total > 0;
    this.stats.parts = total;
    this.uploadCivilianRanges(total, true);
  }
  private civilianBatch(actors: Entity[], t: number, entities: Entities, camera: THREE.Camera | undefined, profile: GraphicsProfile) {
    let orderChanged = actors.length !== this.residentOrder.length;
    if (!orderChanged) for (let i = 0; i < actors.length; i++) {
      if (actors[i].id !== this.residentOrder[i] || !this.residentPoseCache.has(actors[i].id)) { orderChanged = true; break; }
    }
    if (orderChanged) {
      this.rebuildCivilianBatch(actors, t, entities, camera, profile);
      return;
    }
    this.stats.full = this.stats.mid = this.stats.far = 0;
    this.residentDirtyRanges.length = 0;
    let dirtyActors = 0, layoutChanged = false;
    for (let i = 0; i < actors.length; i++) {
      const e = actors[i], info = this.prepareResident(e, i, t, entities, camera, profile);
      const cached = this.residentPoseCache.get(e.id)!;
      if (info.signature === cached.signature) continue;
      const writeColors = info.appearanceSignature !== cached.appearanceSignature;
      const generated = this.writeCivilianActor(e, info, cached.start, cached.parts, writeColors);
      const available = Math.max(0, this.civilians.instanceMatrix.count - cached.start);
      if (Math.min(generated, available) !== cached.parts) { layoutChanged = true; break; }
      cached.signature = info.signature;
      cached.appearanceSignature = info.appearanceSignature;
      if (cached.parts > 0) {
        const previous = this.residentDirtyRanges[this.residentDirtyRanges.length - 1];
        if (previous && previous.start + previous.count === cached.start && previous.colors === writeColors) previous.count += cached.parts;
        else this.residentDirtyRanges.push({ start: cached.start, count: cached.parts, colors: writeColors });
      }
      dirtyActors++;
    }
    if (layoutChanged) {
      this.rebuildCivilianBatch(actors, t, entities, camera, profile);
      return;
    }
    this.residentInfo.length = actors.length;
    if (dirtyActors > 0) {
      const total = this.civilians.count;
      const totalRanges = this.residentDirtyRanges.length;
      if (dirtyActors > actors.length * .55 || totalRanges > 24) {
        // A broad change is cheaper to upload as one contiguous matrix range.
        // Do not upload the color buffer unless appearance data also changed.
        const colorsDirty = this.residentDirtyRanges.some(range => range.colors);
        this.residentDirtyRanges.length = 0;
        if (total > 0) this.residentDirtyRanges.push({ start: 0, count: total, colors: colorsDirty });
      }
      this.uploadCivilianRanges(total, false);
    }
    this.stats.parts = this.civilians.count;
  }
  update(entities: Entities, t: number,camera?:THREE.Camera,profile:GraphicsProfile=GRAPHICS_PROFILES.high) {
    if(this.disposed)return;
    const residents=this.visibleResidents,others=this.visibleOthers,alive=this.alive;residents.length=0;others.length=0;alive.clear();
    this.stats.simulated=entities.life?.active.size??0;this.stats.full=this.stats.mid=this.stats.far=this.stats.culled=0;
    if(camera){camera.updateMatrixWorld();this.cameraMatrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);this.frustum.setFromProjectionMatrix(this.cameraMatrix);}
    for(const e of entities.renderActors()){
      // Entities supplies the bounded active resident set plus the small
      // encounter set. The full persistent registry is not scanned per frame.
      const p=e.body.position;
      if(!entities.world.loaded(p.x,p.z)){if(e.kind==="villager")this.stats.culled++;continue;}
      if(camera){this.actorSphere.center.set(p.x,p.y+1.1,p.z);if(this.actorSphere.center.distanceToSquared(camera.position)>16&&!this.frustum.intersectsSphere(this.actorSphere)){if(e.kind==="villager")this.stats.culled++;continue;}}
      if(e.kind==="villager")residents.push(e);else{others.push(e);alive.add(e.id);}
    }
    this.civilianBatch(residents,t,entities,camera,profile);
    for (const [id, g] of this.models)
      if (!alive.has(id)) {
        this.scene.remove(g);
        g.traverse(o=>{if(o instanceof THREE.Mesh)this.renderAudit?.untag(o);});
        this.models.delete(id);
      }
    for (const e of others) {
      const g = this.models.get(e.id) ?? this.create(e);
      g.position.set(e.body.position.x, e.body.position.y, e.body.position.z);
      g.rotation.y = e.yaw;
      for (const o of g.children)
        if (o.userData.limb)
          o.rotation.x =
            Math.abs(e.body.velocity.x) + Math.abs(e.body.velocity.z) > 0.2
              ? Math.sin(t * 7) * 0.35 * o.userData.limb
              : 0;
    }
    const dropIds=this.dropIds;dropIds.clear();for(const d of entities.drops)dropIds.add(d.id);
    for (const [id, m] of this.drops)
      if (!dropIds.has(id)) {
        this.scene.remove(m);
        this.renderAudit?.untag(m);
        this.drops.delete(id);
      }
    for (const d of entities.drops) {
      let m = this.drops.get(d.id);
      if (!m) {
        m = new THREE.Mesh(
          this.geometry,
          this.material(item(d.stack.id)?.color ?? "#e1ce9d"),
        );
        m.scale.setScalar(0.2);
        this.renderAudit?.tag(m, "drops");
        this.scene.add(m);
        this.drops.set(d.id, m);
      }
      m.position.set(
        d.position.x,
        d.position.y + Math.sin(t * 3) * 0.04,
        d.position.z,
      );
      m.rotation.y = t * 1.4;
    }
  }
  clear() {
    this.civilians.count = 0; this.civilians.visible = false;
    for (const g of this.models.values()) { this.scene.remove(g); g.traverse(o=>{if(o instanceof THREE.Mesh)this.renderAudit?.untag(o);}); }
    for (const m of this.drops.values()) { this.scene.remove(m); this.renderAudit?.untag(m); }
    this.models.clear();
    this.drops.clear();this.phases.clear();this.visibleResidents.length=this.visibleOthers.length=0;this.alive.clear();this.dropIds.clear();this.residentPoseCache.clear();this.residentOrder.length=0;this.residentInfo.length=0;this.residentDirtyRanges.length=0;
  }
  dispose(){
    if(this.disposed)return;
    this.disposed=true;
    this.clear();
    this.scene.remove(this.civilians);
    this.renderAudit?.untag(this.civilians);
    this.geometry.dispose();
    this.civilianMaterial.dispose();
    for(const material of this.materials.values())material.dispose();
    this.materials.clear();this.colors.clear();
  }

}
