export type Enchantment = "efficiency" | "unbreaking" | "fortune" | "silk" | "protection" | "fire_protection" | "sharpness";
export type Stack = {
  id: number;
  count: number;
  durability?: number;
  enchants?: Partial<Record<Enchantment, number>>;
  wearCounter?: number;
};
export const cloneStack = (s: Stack | null): Stack | null =>
  s ? { ...s, ...(s.enchants ? { enchants: { ...s.enchants } } : {}) } : null;
export function sameStack(a: Stack, b: Stack) {
  return a.id === b.id && a.durability === b.durability && (a.wearCounter ?? 0) === (b.wearCounter ?? 0) &&
    Object.entries(a.enchants ?? {}).every(([k,v]) => b.enchants?.[k as Enchantment] === v) &&
    Object.keys(a.enchants ?? {}).length === Object.keys(b.enchants ?? {}).length;
}
