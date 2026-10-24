import { item } from "./items";
import type { Inventory, Stack } from "./inventory";
import { cloneStack } from "./stack";
import { enchantLevel, wearStack } from "./progression";
export const ARMOR_SLOTS = ["helmet", "tunic", "greaves", "boots"] as const;
export type ArmorSlot = (typeof ARMOR_SLOTS)[number];
export class Equipment {
  slots: (Stack | null)[];
  constructor(slots?: (Stack | null)[]) {
    this.slots = ARMOR_SLOTS.map((_, i) =>
      cloneStack(slots?.[i] ?? null),
    );
  }
  get protection() {
    return this.slots.reduce(
      (sum, s) => sum + (s ? (item(s.id)?.protection ?? 0) : 0),
      0,
    );
  }
  click(index: number, inventory: Inventory) {
    if (!Number.isInteger(index) || index < 0 || index >= ARMOR_SLOTS.length) return false;
    const cursor = inventory.cursor;
    if (cursor && item(cursor.id)?.armorSlot !== ARMOR_SLOTS[index])
      return false;
    const old = this.slots[index];
    this.slots[index] = cursor;
    inventory.cursor = old;
    return true;
  }
  equipHeld(inventory: Inventory) {
    const held = inventory.held,
      slot = held && item(held.id)?.armorSlot;
    if (!held || !slot) return false;
    const index = ARMOR_SLOTS.indexOf(slot),
      old = this.slots[index];
    this.slots[index] = held;
    inventory.slots[inventory.selected] = old;
    return true;
  }
  absorb(damage: number, fire = false) {
    const ranks = this.slots.reduce((n,s)=>n+enchantLevel(s,fire ? "fire_protection" : "protection"),0);
    const received = damage * (1 - Math.min(20, this.protection) * 0.04) * (1-Math.min(fire ? .72 : .36,ranks*(fire ? .06 : .03)));
    for (let i = 0; i < 4; i++) {
      const s = this.slots[i];
      if (s?.durability !== undefined) {
        wearStack(s,Math.max(1, Math.floor(damage / 4)));
        if (s.durability <= 0) this.slots[i] = null;
      }
    }
    return received;
  }
}
