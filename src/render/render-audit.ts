import type * as THREE from "three";

export const RENDER_AUDIT_CATEGORIES = [
  "voxel-opaque",
  "voxel-transparent",
  "water",
  "voxel-emissive",
  "distant-terrain",
  "distant-structures",
  "npc",
  "drops",
  "particles",
  "rain",
  "clouds",
  "sky",
  "player",
  "interaction",
] as const;

export type RenderAuditCategory = typeof RENDER_AUDIT_CATEGORIES[number];
export interface RenderAuditCategoryStats {
  calls: number;
  triangles: number;
  geometries: number;
}
export interface RenderAuditSnapshot {
  frame: number;
  totalTriangles: number;
  totalCalls: number;
  trackedTriangles: number;
  trackedCalls: number;
  unclassifiedTriangles: number;
  unclassifiedCalls: number;
  untrackedSubmittedCalls: number;
  untrackedSubmittedObjects: string;
  categories: Record<RenderAuditCategory, RenderAuditCategoryStats>;
}
type AuditObject = THREE.Object3D & {
  isMesh?: boolean;
  isInstancedMesh?: boolean;
  count?: number;
};
type BeforeRender = THREE.Object3D["onBeforeRender"];
type GeometryGroup = { start: number; count: number } | null | undefined;
type Counter = { calls: number; triangles: number; geometryIds: Set<number> };
export type RenderAuditTriangleBreakdown = Partial<Record<RenderAuditCategory, number>>;

export interface UntrackedRenderableSnapshot {
  count: number;
  examples: string[];
}

/**
 * Debug-only submitted-work accounting. Hooks are installed only while F3
 * diagnostics are enabled and are restored when diagnostics are disabled.
 * The audit never changes visibility, geometry, materials, simulation or input.
 */
export class RenderWorkloadAudit {
  private readonly objects = new Set<AuditObject>();
  private readonly categories = new WeakMap<AuditObject, RenderAuditCategory>();
  private readonly originals = new WeakMap<AuditObject, BeforeRender>();
  private readonly wrappers = new WeakMap<AuditObject, BeforeRender>();
  private readonly triangleBreakdowns = new WeakMap<AuditObject, RenderAuditTriangleBreakdown>();
  private readonly untrackedObjects = new Set<AuditObject>();
  private readonly untrackedOriginals = new WeakMap<AuditObject, BeforeRender>();
  private readonly untrackedWrappers = new WeakMap<AuditObject, BeforeRender>();
  private readonly untrackedSubmissions = new Map<AuditObject, number>();
  private untrackedSubmittedCalls = 0;
  private readonly counters = new Map<RenderAuditCategory, Counter>();
  private frame = 0;
  enabled = false;
  lastSnapshot: RenderAuditSnapshot | null = null;

  constructor() {
    // Reuse counters and geometry sets across frames; F3 must not create a new
    // Map/Set per active category on every render pass.
    for (const category of RENDER_AUDIT_CATEGORIES)
      this.counters.set(category, { calls: 0, triangles: 0, geometryIds: new Set<number>() });
  }

  tag<T extends THREE.Object3D>(
    object: T,
    category: RenderAuditCategory,
    triangleBreakdown?: RenderAuditTriangleBreakdown,
  ): T {
    const renderable = object as AuditObject;
    if (this.categories.has(renderable) && this.categories.get(renderable) !== category)
      this.detach(renderable);
    if (this.untrackedObjects.has(renderable)) this.detachUntracked(renderable);
    this.categories.set(renderable, category);
    if (triangleBreakdown) this.triangleBreakdowns.set(renderable, triangleBreakdown);
    else this.triangleBreakdowns.delete(renderable);
    this.objects.add(renderable);
    object.userData.renderAuditCategory = category;
    if (this.enabled) this.attach(renderable);
    return object;
  }

  untag(object: THREE.Object3D): void {
    const renderable = object as AuditObject;
    this.detach(renderable);
    this.detachUntracked(renderable);
    this.categories.delete(renderable);
    this.triangleBreakdowns.delete(renderable);
    this.objects.delete(renderable);
    if (object.userData.renderAuditCategory !== undefined)
      delete object.userData.renderAuditCategory;
  }

  setEnabled(enabled: boolean): void {
    if (this.enabled === enabled) return;
    this.enabled = enabled;
    for (const object of this.objects) {
      if (enabled) this.attach(object);
      else this.detach(object);
    }
    for (const object of this.untrackedObjects) {
      if (enabled) this.attachUntracked(object);
      else this.detachUntracked(object);
    }
    if (!enabled) this.resetCounters();
  }

  beginPass(): void {
    if (!this.enabled) return;
    this.frame++;
    this.resetCounters();
  }

  snapshot(
    totalTriangles: number,
    totalCalls: number,
    target?: RenderAuditSnapshot | null,
  ): RenderAuditSnapshot | null {
    if (!this.enabled) return null;
    const categories = target?.categories ?? ({} as Record<RenderAuditCategory, RenderAuditCategoryStats>);
    let trackedTriangles = 0, trackedCalls = 0;
    for (const category of RENDER_AUDIT_CATEGORIES) {
      const counter = this.counters.get(category)!;
      const stats = categories[category] ?? (categories[category] = { calls: 0, triangles: 0, geometries: 0 });
      stats.triangles = counter.triangles;
      stats.calls = counter.calls;
      stats.geometries = counter.geometryIds.size;
      trackedTriangles += stats.triangles;
      trackedCalls += stats.calls;
    }
    const result: RenderAuditSnapshot = target ?? {
      frame: 0,
      totalTriangles: 0,
      totalCalls: 0,
      trackedTriangles: 0,
      trackedCalls: 0,
      unclassifiedTriangles: 0,
      unclassifiedCalls: 0,
      untrackedSubmittedCalls: 0,
      untrackedSubmittedObjects: "",
      categories,
    };
    result.frame = this.frame;
    result.totalTriangles = totalTriangles;
    result.totalCalls = totalCalls;
    result.trackedTriangles = trackedTriangles;
    result.trackedCalls = trackedCalls;
    // Signed remainders deliberately expose missing or double-counted hooks.
    result.unclassifiedTriangles = totalTriangles - trackedTriangles;
    result.unclassifiedCalls = totalCalls - trackedCalls;
    result.untrackedSubmittedCalls = this.untrackedSubmittedCalls;
    const submitted: string[] = [];
    for (const [object, calls] of this.untrackedSubmissions) {
      if (calls <= 0 || submitted.length >= 4) continue;
      submitted.push(`${object.name || "unnamed"}×${calls}`);
    }
    result.untrackedSubmittedObjects = submitted.join(", ");
    this.lastSnapshot = result;
    return result;
  }

  /**
   * Debug-only scene inventory. It identifies visible renderable objects that
   * are not registered with a category, which helps explain a non-zero audit
   * call remainder. This is an inventory, not proof that every object was
   * submitted (frustum/material/render-list filtering still applies).
   */
  inspectUntracked(
    rootOrRoots: THREE.Object3D | readonly THREE.Object3D[],
    maxExamples = 5,
  ): UntrackedRenderableSnapshot {
    const roots: readonly THREE.Object3D[] = Array.isArray(rootOrRoots)
      ? rootOrRoots as readonly THREE.Object3D[]
      : [rootOrRoots as THREE.Object3D];
    const seen = new Set<AuditObject>();
    const examples: string[] = [];
    let count = 0;
    for (const root of roots) {
      root.traverseVisible(object => {
        const candidate = object as AuditObject & {
          isLine?: boolean;
          isPoints?: boolean;
          isSprite?: boolean;
          type?: string;
          name?: string;
          id?: number;
        };
        const renderable = candidate.isMesh === true || candidate.isLine === true ||
          candidate.isPoints === true || candidate.isSprite === true;
        if (!renderable || this.categories.has(candidate)) return;
        count++;
        seen.add(candidate);
        if (this.enabled) this.attachUntracked(candidate);
        if (examples.length < maxExamples) {
          const kind = candidate.isMesh ? "Mesh" : candidate.isLine ? "Line" :
            candidate.isPoints ? "Points" : "Sprite";
          examples.push(`${candidate.name || "unnamed"} (${kind}#${candidate.id ?? "?"})`);
        }
      });
    }
    // Detach objects that have left the visible scene so debug mode does not
    // retain dynamic renderables or their callbacks indefinitely.
    for (const object of this.untrackedObjects) {
      if (!seen.has(object)) this.detachUntracked(object);
    }
    return { count, examples };
  }

  format(snapshot: RenderAuditSnapshot | null): string {
    if (!snapshot) return "Render category audit: collecting";
    const labels: Record<RenderAuditCategory, string> = {
      "voxel-opaque": "voxel-O",
      "voxel-transparent": "voxel-T",
      water: "water",
      "voxel-emissive": "voxel-E",
      "distant-terrain": "distant-T",
      "distant-structures": "distant-S",
      npc: "NPC",
      drops: "drops",
      particles: "particles",
      rain: "rain",
      clouds: "clouds",
      sky: "sky",
      player: "player",
      interaction: "outline",
    };
    const active = RENDER_AUDIT_CATEGORIES
      .filter(category => snapshot.categories[category].calls > 0 || snapshot.categories[category].triangles > 0)
      .map(category => {
        const value = snapshot.categories[category];
        return `${labels[category]} ${value.triangles.toLocaleString("en-US")}/${value.calls}`;
      });
    const split = Math.ceil(active.length / 2);
    const groups = [active.slice(0, split).join(" · "), active.slice(split).join(" · ")].filter(Boolean);
    return [
      `Render groups tri/draw: ${groups.join("\n") || "no submitted draws"}`,
      `Audit remainder tri/draw: ${snapshot.unclassifiedTriangles}/${snapshot.unclassifiedCalls}` +
        (snapshot.untrackedSubmittedCalls
          ? ` · untagged submitted ${snapshot.untrackedSubmittedCalls}${snapshot.untrackedSubmittedObjects ? ` (${snapshot.untrackedSubmittedObjects})` : ""}`
          : " · untagged submitted 0"),
    ].join("\n");
  }

  dispose(): void {
    this.setEnabled(false);
    this.objects.clear();
    for (const object of this.untrackedObjects) this.detachUntracked(object);
    this.untrackedObjects.clear();
    this.counters.clear();
    this.lastSnapshot = null;
  }

  private resetCounters(): void {
    for (const counter of this.counters.values()) {
      counter.calls = 0;
      counter.triangles = 0;
      counter.geometryIds.clear();
    }
    this.untrackedSubmittedCalls = 0;
    this.untrackedSubmissions.clear();
  }

  private attachUntracked(object: AuditObject): void {
    if (this.untrackedWrappers.has(object)) return;
    const original = object.onBeforeRender;
    const wrapper: BeforeRender = (renderer, scene, camera, geometry, material, group) => {
      original.call(object, renderer, scene, camera, geometry, material, group);
      if (!this.enabled) return;
      this.untrackedSubmittedCalls++;
      this.untrackedSubmissions.set(object, (this.untrackedSubmissions.get(object) ?? 0) + 1);
    };
    this.untrackedOriginals.set(object, original);
    this.untrackedWrappers.set(object, wrapper);
    this.untrackedObjects.add(object);
    object.onBeforeRender = wrapper;
  }

  private detachUntracked(object: AuditObject): void {
    const wrapper = this.untrackedWrappers.get(object);
    const original = this.untrackedOriginals.get(object);
    if (wrapper && original && object.onBeforeRender === wrapper)
      object.onBeforeRender = original;
    this.untrackedWrappers.delete(object);
    this.untrackedOriginals.delete(object);
    this.untrackedObjects.delete(object);
    this.untrackedSubmissions.delete(object);
  }

  private attach(object: AuditObject): void {
    if (this.wrappers.has(object)) return;
    const category = this.categories.get(object);
    if (!category) return;
    const original = object.onBeforeRender;
    const wrapper: BeforeRender = (renderer, scene, camera, geometry, material, group) => {
      original.call(object, renderer, scene, camera, geometry, material, group);
      this.record(category, object, geometry, group as unknown as GeometryGroup);
    };
    this.originals.set(object, original);
    this.wrappers.set(object, wrapper);
    object.onBeforeRender = wrapper;
  }

  private detach(object: AuditObject): void {
    const wrapper = this.wrappers.get(object);
    const original = this.originals.get(object);
    if (wrapper && original && object.onBeforeRender === wrapper)
      object.onBeforeRender = original;
    this.wrappers.delete(object);
    this.originals.delete(object);
  }

  private record(
    category: RenderAuditCategory,
    object: AuditObject,
    geometry: THREE.BufferGeometry,
    group: GeometryGroup,
  ): void {
    if (!this.enabled) return;
    const counter = this.counters.get(category);
    if (!counter) return;

    // onBeforeRender can run for an InstancedMesh whose instance count is
    // zero. Three.js then skips the actual GPU draw, so counting the callback
    // as a submitted call creates a negative audit remainder. Apply the same
    // non-empty range check used by the renderer before recording a call.
    const available = geometry.index?.count ?? geometry.attributes.position?.count ?? 0;
    const rangeStart = Math.max(0, geometry.drawRange.start || 0);
    const rangeEnd = Number.isFinite(geometry.drawRange.count)
      ? Math.min(available, rangeStart + Math.max(0, geometry.drawRange.count))
      : available;
    const validGroup = !!group && Number.isFinite(group.start) && Number.isFinite(group.count);
    const start = validGroup ? Math.max(rangeStart, group!.start) : rangeStart;
    const end = validGroup ? Math.min(rangeEnd, group!.start + group!.count) : rangeEnd;
    const vertices = Math.max(0, end - start);
    const instances = object.isInstancedMesh === true
      ? Math.max(0, Math.floor(object.count ?? 0))
      : 1;
    if (vertices <= 0 || instances <= 0) return;

    counter.calls++;
    counter.geometryIds.add(geometry.id);
    if (object.isMesh !== true) return;

    const triangles = Math.floor(vertices / 3) * instances;

    // Water shares the transparent voxel draw/material to preserve the exact
    // rendering path. Attribute its triangles from mesher metadata while the
    // shared draw call stays counted once under voxel-transparent. Only apply
    // this full-geometry metadata when the renderer submits the complete mesh.
    const isWholeDraw = !validGroup && rangeStart === 0 && rangeEnd === available;
    const breakdown = isWholeDraw ? this.triangleBreakdowns.get(object) : undefined;
    let attributed = 0;
    if (breakdown) {
      for (const subcategory of RENDER_AUDIT_CATEGORIES) {
        if (subcategory === category) continue;
        const raw = breakdown[subcategory];
        if (!Number.isFinite(raw) || raw! <= 0) continue;
        const count = Math.min(triangles - attributed, Math.floor(raw!) * instances);
        if (count <= 0) continue;
        const subcounter = this.counters.get(subcategory)!;
        subcounter.triangles += count;
        subcounter.geometryIds.add(geometry.id);
        attributed += count;
      }
    }
    counter.triangles += Math.max(0, triangles - attributed);
  }
}
