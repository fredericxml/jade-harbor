import * as THREE from "three";
import { Vec3 } from "../core/coords";
import type { RenderWorkloadAudit } from "./render-audit";
type Particle = { p: THREE.Vector3; v: THREE.Vector3; age: number; color: THREE.Color; slot: number; colorDirty: boolean };
export class Effects {
  particles: Particle[] = [];
  private readonly spareParticles: Particle[] = [];
  mesh: THREE.InstancedMesh;
  rain: THREE.Points;
  rainData = new Float32Array(900);
  rainCount=300;
  private disposed=false;
  setRainCount(count:number){this.rainCount=Math.max(0,Math.min(300,Math.floor(Number.isFinite(count)?count:300)));this.rain.geometry.setDrawRange(0,this.rainCount);}
  constructor(public scene: THREE.Scene, private readonly renderAudit?: RenderWorkloadAudit) {
    this.mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.09, 0.09, 0.09),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
      128,
    );
    this.renderAudit?.tag(this.mesh, "particles");
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    scene.add(this.mesh);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(this.rainData, 3));
    this.rain = new THREE.Points(
      g,
      new THREE.PointsMaterial({
        color: "#b9cecf",
        size: 0.055,
        transparent: true,
        opacity: 0.6,
      }),
    );
    this.rain.frustumCulled = false;
    this.renderAudit?.tag(this.rain, "rain");
    scene.add(this.rain);
  }
  burst(p: Vec3, color: string) {
    if(this.disposed)return;
    for (let i = 0; i < 10 && this.particles.length < 128; i++) {
      const q=this.spareParticles.pop();
      if(q){
        q.p.set(p.x+.5,p.y+.5,p.z+.5);
        q.v.set((Math.random()-.5)*3,Math.random()*3,(Math.random()-.5)*3);
        q.age=0;q.color.set(color);q.slot=-1;q.colorDirty=true;this.particles.push(q);
      }else this.particles.push({
        p:new THREE.Vector3(p.x+.5,p.y+.5,p.z+.5),
        v:new THREE.Vector3((Math.random()-.5)*3,Math.random()*3,(Math.random()-.5)*3),
        age:0,color:new THREE.Color(color),slot:-1,colorDirty:true,
      });
    }
  }
  /** Clear world-specific visuals while retaining the bounded particle pool and GPU objects. */
  clear() {
    if(this.disposed)return;
    for(const particle of this.particles){particle.slot=-1;particle.colorDirty=true;this.spareParticles.push(particle);}
    this.particles.length=0;
    this.mesh.count=0;
    this.rain.visible=false;
  }
  update(dt: number, p: Vec3, raining: boolean | number, t: number) {
    if(this.disposed)return;
    let live=0,colorChanged=false,colorRangeStart=-1,colorRangeEnd=-1;
    const matrices=this.mesh.instanceMatrix.array as Float32Array;
    this.mesh.instanceColor?.clearUpdateRanges();
    for(let read=0;read<this.particles.length;read++){
      const q=this.particles[read];
      if(q.age>=.7){q.slot=-1;this.spareParticles.push(q);continue;}
      const i=live++;this.particles[i]=q;
      q.age += dt;
      q.v.y -= 10 * dt;
      q.p.addScaledVector(q.v, dt);
      // Particle cubes never rotate. Write their affine matrices directly,
      // avoiding a temporary Object3D matrix composition for every particle.
      const scale=1-q.age/.8,offset=i*16;
      matrices[offset]=scale;matrices[offset+1]=0;matrices[offset+2]=0;matrices[offset+3]=0;
      matrices[offset+4]=0;matrices[offset+5]=scale;matrices[offset+6]=0;matrices[offset+7]=0;
      matrices[offset+8]=0;matrices[offset+9]=0;matrices[offset+10]=scale;matrices[offset+11]=0;
      matrices[offset+12]=q.p.x;matrices[offset+13]=q.p.y;matrices[offset+14]=q.p.z;matrices[offset+15]=1;
      if(q.colorDirty||q.slot!==i){
        this.mesh.setColorAt(i,q.color);q.colorDirty=false;q.slot=i;colorChanged=true;
        if(colorRangeStart<0)colorRangeStart=i;
        else if(i>colorRangeEnd+1){this.mesh.instanceColor?.addUpdateRange(colorRangeStart*3,(colorRangeEnd-colorRangeStart+1)*3);colorRangeStart=i;}
        colorRangeEnd=i;
      }
    }
    this.particles.length=live;
    this.mesh.count=live;
    if(live){this.mesh.instanceMatrix.clearUpdateRanges();this.mesh.instanceMatrix.addUpdateRange(0,live*16);this.mesh.instanceMatrix.needsUpdate=true;}
    if(colorChanged&&this.mesh.instanceColor){
      if(colorRangeStart>=0)this.mesh.instanceColor.addUpdateRange(colorRangeStart*3,(colorRangeEnd-colorRangeStart+1)*3);
      this.mesh.instanceColor.needsUpdate=true;
    }
    const wet=typeof raining==="number"?Math.max(0,Math.min(1,raining)):raining?1:0;
    this.rain.visible = wet>.015;
    (this.rain.material as THREE.PointsMaterial).opacity=.6*wet;
    if (this.rain.visible) {
      for (let i = 0; i < this.rainCount; i++) {
        this.rainData[i * 3] = p.x + ((i * 13.371) % 26) - 13;
        this.rainData[i * 3 + 1] =
          p.y + ((((i * 0.317 - t * 8) % 16) + 16) % 16);
        this.rainData[i * 3 + 2] = p.z + ((i * 7.137) % 26) - 13;
      }
      this.rain.geometry.attributes.position.needsUpdate = true;
    }
  }
  dispose(){
    if(this.disposed)return;
    this.disposed=true;
    this.scene.remove(this.mesh,this.rain);
    this.renderAudit?.untag(this.mesh);
    this.renderAudit?.untag(this.rain);
    this.mesh.geometry.dispose();
    for(const material of (Array.isArray(this.mesh.material)?this.mesh.material:[this.mesh.material]))material.dispose();
    this.rain.geometry.dispose();
    for(const material of (Array.isArray(this.rain.material)?this.rain.material:[this.rain.material]))material.dispose();
    this.particles.length=0;this.spareParticles.length=0;this.rainData.fill(0);this.mesh.count=0;
  }

}
