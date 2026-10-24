import { item, STARTER_CREATIVE } from "./items";
import { Equipment } from "./equipment";
import { Stack, cloneStack, sameStack } from "./stack";
import { wearStack } from "./progression";
export { type Stack, cloneStack } from "./stack";
export class Inventory {
  equipment = new Equipment();
  slots: (Stack | null)[];
  selected = 0;
  cursor: Stack | null = null;
  constructor(slots?: (Stack | null)[], size = 36) {
    this.slots = Array.from({ length: size }, (_, i) =>
      cloneStack(slots?.[i] ?? null),
    );
  }
  static creative() {
    const inv = new Inventory();
    STARTER_CREATIVE.forEach(
      (id, i) =>
        (inv.slots[i] = {
          id,
          count: 64,
          ...(item(id)?.durability
            ? { durability: item(id)!.durability, count: 1 }
            : {}),
        }),
    );
    return inv;
  }
  get held() {
    return this.slots[this.selected];
  }
  count(id: number) {
    return this.slots.reduce((n, s) => n + (s?.id === id ? s.count : 0), 0);
  }
  add(id: number, count = 1, durability?: number) {
    return this.addStack({id,count,...(durability === undefined ? {} : {durability})});
  }
  addStack(value: Stack) {
    const {id} = value;
    let {count} = value;
    const def = item(id);
    if (!def || !Number.isSafeInteger(count) || count<=0) return count;
    const d = value.durability ?? def.durability;
    const incoming = {...cloneStack(value)!,...(d === undefined ? {} : {durability:d})};
    for (let i = 0; i < this.slots.length && count > 0; i++) {
      const s = this.slots[i];
      if (s && sameStack(s,incoming) && s.count < def.stack) {
        const n = Math.min(count, def.stack - s.count);
        s.count += n;
        count -= n;
      }
    }
    for (let i = 0; i < this.slots.length && count > 0; i++)
      if (!this.slots[i]) {
        const n = Math.min(count, def.stack);
        this.slots[i] = {
          ...cloneStack(incoming)!,
          count: n,
        };
        count -= n;
      }
    return count;
  }
  remove(id: number, count = 1) {
    if(!Number.isSafeInteger(count) || count<=0) return false;
    if (this.count(id) < count) return false;
    for (let i = 0; i < this.slots.length && count; i++) {
      const s = this.slots[i];
      if (s?.id === id) {
        const n = Math.min(count, s.count);
        s.count -= n;
        count -= n;
        if (s.count === 0) this.slots[i] = null;
      }
    }
    return true;
  }
  consumeHeld() {
    const s = this.held;
    if (s && --s.count <= 0) this.slots[this.selected] = null;
  }
  wear() {
    const s = this.held;
    if (s?.durability !== undefined) {
      wearStack(s);
      if(s.durability<=0) {
        this.slots[this.selected] = null;
        return true;
      }
    }
    return false;
  }
  insertHeld(id: number) {
    const def = item(id);
    if (def)
      this.slots[this.selected] = {
        id,
        count: def.stack,
        ...(def.durability ? { durability: def.durability } : {}),
      };
  }
  click(index: number, right = false, external?: (Stack | null)[]) {
    const slots = external ?? this.slots,
      s = slots[index];
    if(!Number.isInteger(index) || index<0 || index>=slots.length) return;
    if (right) {
      if (!this.cursor && s) {
        const n = Math.ceil(s.count / 2);
        this.cursor = { ...cloneStack(s)!, count: n };
        s.count -= n;
        if (!s.count) slots[index] = null;
      } else if (
        this.cursor &&
        (!s ||
          (sameStack(s,this.cursor) &&
            s.count < (item(s.id)?.stack ?? 64)))
      ) {
        if (s) s.count++;
        else slots[index] = { ...cloneStack(this.cursor)!, count: 1 };
        if (--this.cursor.count === 0) this.cursor = null;
      }
    } else if (
      s &&
      this.cursor &&
      sameStack(s,this.cursor)
    ) {
      const n = Math.min(
        this.cursor.count,
        (item(s.id)?.stack ?? 64) - s.count,
      );
      s.count += n;
      this.cursor.count -= n;
      if (!this.cursor.count) this.cursor = null;
    } else {
      slots[index] = this.cursor;
      this.cursor = s;
    }
  }
  /** Move a stack directly between slots without touching the cursor stack.
   * Used by drag-and-drop. The operation is synchronous and lossless:
   * compatible stacks merge up to their item limit, otherwise they swap.
   */
  move(
    from: number,
    to: number,
    source: (Stack | null)[] = this.slots,
    destination: (Stack | null)[] = this.slots,
  ): boolean {
    if (!Number.isInteger(from) || from < 0 || from >= source.length ||
        !Number.isInteger(to) || to < 0 || to >= destination.length ||
        (source === destination && from === to)) return false;
    const moving = source[from];
    if (!moving || !item(moving.id) || !Number.isSafeInteger(moving.count) || moving.count <= 0) return false;
    const current = destination[to];
    if (current && sameStack(moving, current)) {
      const limit = item(current.id)?.stack ?? 64;
      const amount = Math.min(moving.count, Math.max(0, limit - current.count));
      if (amount <= 0) return false;
      const merged = cloneStack(current)!;
      merged.count += amount;
      const remainder = cloneStack(moving)!;
      remainder.count -= amount;
      destination[to] = merged;
      source[from] = remainder.count ? remainder : null;
    } else {
      // Snapshot both stacks before assigning; supports source === destination.
      source[from] = cloneStack(current);
      destination[to] = cloneStack(moving);
    }
    return true;
  }
  settleCursor() {
    if (this.cursor) {
      const c = this.cursor,
        remaining = this.addStack(c);
      this.cursor = remaining ? { ...cloneStack(c)!, count: remaining } : null;
    }
    return !this.cursor;
  }
  transaction(cost: [number, number][], output: [number, number]) {
    const totals = new Map<number,number>();
    for(const [id,n] of [...cost,output]) if(!item(id) || !Number.isSafeInteger(n) || n<=0 || n>1e6) return false;
    for(const [id,n] of cost) totals.set(id,(totals.get(id)??0)+n);
    if ([...totals].some(([id, n]) => this.count(id) < n)) return false;
    const copy = new Inventory(this.slots);
    for(const [id,n] of totals) if(!copy.remove(id,n)) return false;
    if (copy.add(...output)) return false;
    this.slots = copy.slots;
    return true;
  }
}
export type Recipe = {
  id: string;
  name: string;
  cost: [number, number][];
  output: [number, number];
  station?: "bench";
};
export const RECIPES: Recipe[] = [
  {id:"hopper",name:"Jade hopper",cost:[[102,5],[25,1]],output:[69,1],station:"bench"},
  {id:"timer",name:"Festival timer",cost:[[102,2],[103,1],[3,3]],output:[70,1],station:"bench"},
  {id:"plate",name:"Pressure plate",cost:[[3,2]],output:[71,1]},
  {id:"bucket",name:"Iron bucket",cost:[[102,3]],output:[168,1],station:"bench"},
  { id:"inscription", name:"Jade inscription table", cost:[[39,4],[103,3],[8,4]], output:[66,1], station:"bench" },
  { id:"apothecary", name:"Apothecary kettle", cost:[[8,4],[15,2],[102,1]], output:[67,1], station:"bench" },
  { id:"anvil", name:"Artisan anvil", cost:[[102,6],[3,3]], output:[68,1], station:"bench" },
  { id:"flask", name:"Glass flasks", cost:[[15,3]], output:[160,3], station:"bench" },
  { id: "planks", name: "Cedar planks", cost: [[6, 1]], output: [8, 4] },
  { id: "sticks", name: "Cedar sticks", cost: [[8, 2]], output: [104, 4] },
  { id: "bench", name: "Crafting bench", cost: [[8, 4]], output: [23, 1] },
  {
    id: "chest",
    name: "Cedar chest",
    cost: [[8, 8]],
    output: [25, 1],
    station: "bench",
  },
  {
    id: "kiln",
    name: "Kiln furnace",
    cost: [[3, 8]],
    output: [24, 1],
    station: "bench",
  },
  {
    id: "lantern",
    name: "Festival lantern",
    cost: [
      [16, 2],
      [101, 1],
    ],
    output: [14, 4],
    station: "bench",
  },
  {
    id: "roof",
    name: "Jade roof tiles",
    cost: [
      [3, 2],
      [103, 1],
    ],
    output: [11, 8],
    station: "bench",
  },
  {
    id: "red",
    name: "Vermilion pillars",
    cost: [
      [8, 4],
      [44, 1],
    ],
    output: [9, 4],
  },
  {
    id: "door",
    name: "Courtyard door",
    cost: [[8, 6]],
    output: [27, 2],
    station: "bench",
  },
  { id: "slab", name: "Stone slabs", cost: [[3, 3]], output: [28, 6] },
  {
    id: "stairs",
    name: "Jade roof stairs",
    cost: [[11, 6]],
    output: [29, 4],
    station: "bench",
  },
  {
    id: "fence",
    name: "Timber railing",
    cost: [
      [8, 4],
      [104, 2],
    ],
    output: [42, 4],
  },
  { id: "ladder", name: "Bamboo ladder", cost: [[16, 4]], output: [43, 4] },
  {
    id: "bed",
    name: "Resting mat",
    cost: [
      [8, 3],
      [16, 3],
    ],
    output: [26, 1],
    station: "bench",
  },
  {
    id: "switch",
    name: "Jade switch",
    cost: [
      [3, 1],
      [104, 1],
    ],
    output: [33, 1],
  },
  {
    id: "wire",
    name: "Qi wire",
    cost: [
      [103, 1],
      [102, 1],
    ],
    output: [34, 8],
    station: "bench",
  },
  {
    id: "lamp",
    name: "Jade lamp",
    cost: [
      [103, 1],
      [14, 1],
    ],
    output: [35, 1],
    station: "bench",
  },
  { id: "tea", name: "Warm tea", cost: [[109, 3]], output: [112, 1] },
  {
    id: "dumpling",
    name: "Steamed dumplings",
    cost: [
      [110, 2],
      [109, 1],
    ],
    output: [105, 2],
    station: "bench",
  },
];
for (let tier = 0; tier < 4; tier++)
  for (let tool = 0; tool < 5; tool++) {
    const id = 120 + tier * 5 + tool;
    RECIPES.push({
      id: `tool-${id}`,
      name: item(id)!.name,
      cost: [
        [104, 2],
        [
          [8, 3, 102, 103][tier],
          tool === 2 ? 1 : tool === 3 || tool === 4 ? 2 : 3,
        ],
      ],
      output: [id, 1],
      station: "bench",
    });
  }

for (let tier = 0; tier < 2; tier++)
  for (let part = 0; part < 4; part++) {
    const id = 150 + tier * 4 + part;
    RECIPES.push({
      id: `armor-${id}`,
      name: item(id)!.name,
      cost: [[tier ? 103 : 102, [5, 8, 7, 4][part]]],
      output: [id, 1],
      station: "bench",
    });
  }
