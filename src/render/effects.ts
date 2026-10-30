import * as THREE from "three";
import { Vec3 } from "../core/coords";
export class Effects {
  particles: {
    p: THREE.Vector3;
    v: THREE.Vector3;
    age: number;
    color: THREE.Color;
  }[] = [];
  mesh: THREE.InstancedMesh;
  rain: THREE.Points;
  rainData = new Float32Array(900);
  dummy = new THREE.Object3D();
  constructor(public scene: THREE.Scene) {
    this.mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.09, 0.09, 0.09),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
      128,
    );
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
    scene.add(this.rain);
  }
  burst(p: Vec3, color: string) {
    for (let i = 0; i < 10 && this.particles.length < 128; i++)
      this.particles.push({
        p: new THREE.Vector3(p.x + 0.5, p.y + 0.5, p.z + 0.5),
        v: new THREE.Vector3(
          (Math.random() - 0.5) * 3,
          Math.random() * 3,
          (Math.random() - 0.5) * 3,
        ),
        age: 0,
        color: new THREE.Color(color),
      });
  }
  update(dt: number, p: Vec3, raining: boolean | number, t: number) {
    this.particles = this.particles.filter((q) => q.age < 0.7);
    this.particles.forEach((q, i) => {
      q.age += dt;
      q.v.y -= 10 * dt;
      q.p.addScaledVector(q.v, dt);
      this.dummy.position.copy(q.p);
      this.dummy.scale.setScalar(1 - q.age / 0.8);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
      this.mesh.setColorAt(i, q.color);
    });
    this.mesh.count = this.particles.length;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    const wet=typeof raining==="number"?Math.max(0,Math.min(1,raining)):raining?1:0;
    this.rain.visible = wet>.015;
    (this.rain.material as THREE.PointsMaterial).opacity=.6*wet;
    if (this.rain.visible) {
      for (let i = 0; i < 300; i++) {
        this.rainData[i * 3] = p.x + ((i * 13.371) % 26) - 13;
        this.rainData[i * 3 + 1] =
          p.y + ((((i * 0.317 - t * 8) % 16) + 16) % 16);
        this.rainData[i * 3 + 2] = p.z + ((i * 7.137) % 26) - 13;
      }
      this.rain.geometry.attributes.position.needsUpdate = true;
    }
  }
}
