import { item } from "./items";
import type { Inventory } from "./inventory";
import type { Stack, Enchantment } from "./stack";
export const ENCHANTMENTS: Record<Enchantment, {name: string; max: number; description: string}> = {
  efficiency: { name: "Artisan speed", max: 3, description: "+40% correct-tool mining speed per rank." },
  unbreaking: { name: "Enduring jade", max: 3, description: "Spend durability once every rank + 1 uses." },
  fortune: { name: "Prosperity", max: 2, description: "+1 coal or jade per rank; incompatible with Gentle touch." },
  silk: { name: "Gentle touch", max: 1, description: "Collect coal and jade ore intact; incompatible with Prosperity." },
  protection: { name: "Guardian script", max: 3, description: "Armor: 3% less combat damage per rank, up to 36%." },
  fire_protection: { name: "Ember ward", max: 3, description: "Armor: 6% less fire damage per rank, up to 72%." },
  sharpness: { name: "Keen edge", max: 3, description: "+1 melee damage per rank for swords and axes." },
};
export const enchantLevel = (s: Stack | null | undefined, e: Enchantment) => s?.enchants?.[e] ?? 0;
export function compatible(id: number, e: Enchantment) {
  const d = item(id);
  if (!d?.durability) return false;
  if (e === "unbreaking") return true;
  if (e === "protection" || e === "fire_protection") return !!d.armorSlot;
  if (e === "sharpness") return d.tool === "sword" || d.tool === "axe";
  if (e === "fortune" || e === "silk") return d.tool === "pickaxe";
  return !!d.tool && d.tool !== "sword";
}
export function enchantCost(rank: number) { return { xp: 8 + (rank - 1) * 4, jade: rank }; }
export function enchantHeld(inv: Inventory, xp: number, e: Enchantment) {
  const s = inv.held, def = ENCHANTMENTS[e];
  if (!s || !def || !compatible(s.id, e)) return { ok: false, xp };
  const rank = enchantLevel(s, e) + 1, cost = enchantCost(rank);
  if (rank > def.max || xp < cost.xp || inv.count(103) < cost.jade ||
      (e === "fortune" && enchantLevel(s, "silk")) || (e === "silk" && enchantLevel(s, "fortune")))
    return { ok: false, xp };
  inv.remove(103, cost.jade);
  s.enchants = { ...s.enchants, [e]: rank };
  return { ok: true, xp: xp - cost.xp };
}
export function repairMaterial(id: number) {
  const d = item(id);
  return d?.armorSlot ? (id >= 154 ? 103 : 102) : [0, 8, 3, 102, 103][d?.tier ?? 0];
}
export function repairHeld(inv: Inventory, xp: number) {
  const s = inv.held, max = s && item(s.id)?.durability, material = s && repairMaterial(s.id);
  if (!s || !max || !material || s.durability === undefined || s.durability >= max || xp < 2 || !inv.count(material))
    return { ok: false, xp };
  inv.remove(material);
  s.durability = Math.min(max, s.durability + Math.ceil(max / 4));
  return { ok: true, xp: xp - 2 };
}
export function wearStack(s: Stack, amount = 1) {
  if (s.durability === undefined) return;
  const period = enchantLevel(s, "unbreaking") + 1, counter = (s.wearCounter ?? 0) + amount;
  s.durability -= Math.floor(counter / period);
  s.wearCounter = counter % period;
}
export function validMetadata(s: Stack) {
  if (s.enchants !== undefined && (!s.enchants || typeof s.enchants !== "object" || Array.isArray(s.enchants))) return false;
  for (const [key, level] of Object.entries(s.enchants ?? {})) {
    const e = key as Enchantment;
    if (!Object.hasOwn(ENCHANTMENTS,e) || !compatible(s.id,e) || !Number.isInteger(level) || level < 1 || level > ENCHANTMENTS[e].max) return false;
  }
  return !(enchantLevel(s,"silk") && enchantLevel(s,"fortune")) && (s.wearCounter === undefined ||
    (!!item(s.id)?.durability && Number.isInteger(s.wearCounter) && s.wearCounter >= 0 && s.wearCounter <= enchantLevel(s,"unbreaking")));
}
export const EFFECTS = {
  speed: { name: "Swift current", duration: 60 },
  regeneration: { name: "Jade renewal", duration: 40 },
  fire_resistance: { name: "Ember shelter", duration: 60 },
  strength: { name: "Tiger strength", duration: 60 },
  night_vision: { name: "Moon sight", duration: 90 },
  poison: { name: "Bitter infusion", duration: 15 },
} as const;
export type EffectId = keyof typeof EFFECTS;
export type ActiveEffect = { id: EffectId; remaining: number; pulse: number };
export const POTIONS: Record<number, EffectId | "healing"> = {161:"healing",162:"speed",163:"regeneration",164:"fire_resistance",165:"strength",166:"night_vision",167:"poison"};
export class StatusEffects {
  list: ActiveEffect[];
  constructor(data: ActiveEffect[] = []) { this.list = data.map(e=>({...e})); }
  has(id: EffectId) { return this.list.some(e=>e.id===id && e.remaining>0); }
  apply(id: EffectId) {
    const old = this.list.find(e=>e.id===id);
    if (old) old.remaining = EFFECTS[id].duration;
    else this.list.push({id,remaining:EFFECTS[id].duration,pulse:0});
  }
  tick(dt: number, health: number, invulnerable = false) {
    for (const e of this.list) {
      const active = Math.min(e.remaining,dt);
      e.remaining = Math.max(0,e.remaining-dt); e.pulse += active;
      while (e.pulse >= 2) {
        e.pulse -= 2;
        if(e.id === "regeneration") health = Math.min(20,health+1);
        if(e.id === "poison" && !invulnerable && health>1) health = Math.max(1,health-1);
      }
    }
    this.list = this.list.filter(e=>e.remaining>0);
    return health;
  }
}
export function validEffects(value: unknown): value is ActiveEffect[] {
  if (!Array.isArray(value) || value.length>6) return false;
  const seen = new Set<string>();
  return value.every(e=> {
    if (!e || !Object.hasOwn(EFFECTS,e.id) || seen.has(e.id)) return false;
    seen.add(e.id);
    return Number.isFinite(e.remaining) && e.remaining > 0 && e.remaining <= EFFECTS[e.id as EffectId].duration &&
      Number.isFinite(e.pulse) && e.pulse>=0 && e.pulse<2;
  });
}
