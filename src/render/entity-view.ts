import * as THREE from "three";
import { Entities, Entity } from "../game/entities";
import { PROFESSIONS } from "../game/professions";
import { item } from "../game/items";
export class EntityView {
  models = new Map<string, THREE.Group>();
  drops = new Map<string, THREE.Mesh>();
  geometry = new THREE.BoxGeometry(1, 1, 1);
  materials = new Map<string, THREE.MeshLambertMaterial>();
  constructor(public scene: THREE.Scene) {}
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
  update(entities: Entities, t: number) {
    const alive = new Set(entities.list.map((e) => e.id));
    for (const [id, g] of this.models)
      if (!alive.has(id)) {
        this.scene.remove(g);
        this.models.delete(id);
      }
    for (const e of entities.list) {
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
    const dropIds = new Set(entities.drops.map((d) => d.id));
    for (const [id, m] of this.drops)
      if (!dropIds.has(id)) {
        this.scene.remove(m);
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
    for (const g of this.models.values()) this.scene.remove(g);
    for (const m of this.drops.values()) this.scene.remove(m);
    this.models.clear();
    this.drops.clear();
  }
}
