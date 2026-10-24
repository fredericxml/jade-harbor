import { BLOCKS, B } from "../world/blocks";
import type { ArmorSlot } from "./equipment";
export type Item = {
  id: number;
  name: string;
  category: string;
  color: string;
  stack: number;
  block?: number;
  tool?: string;
  tier?: number;
  durability?: number;
  food?: number;
  damage?: number;
  armorSlot?: ArmorSlot;
  protection?: number;
};
export const ITEMS: Item[] = BLOCKS.filter((b) => !b.hidden).map((b) => ({
  id: b.id,
  name: b.name,
  category: b.category,
  color: b.color,
  stack: 64,
  block: b.id,
}));
ITEMS.push(
  {id:168,name:"Iron bucket",category:"Tools",color:"#c6cec5",stack:1},
  {id:169,name:"Water bucket",category:"Tools",color:"#81bfc1",stack:1},
  {id:170,name:"Lava bucket",category:"Tools",color:"#db9057",stack:1},
  {id:160,name:"Glass flask",category:"Brewing",color:"#b8d7d0",stack:16},
  {id:161,name:"Restoring infusion",category:"Brewing",color:"#e59b9b",stack:16},
  {id:162,name:"Swift current infusion",category:"Brewing",color:"#b0d5db",stack:16},
  {id:163,name:"Jade renewal infusion",category:"Brewing",color:"#82d4aa",stack:16},
  {id:164,name:"Ember shelter infusion",category:"Brewing",color:"#dd995f",stack:16},
  {id:165,name:"Tiger strength infusion",category:"Brewing",color:"#cb8b79",stack:16},
  {id:166,name:"Moon sight infusion",category:"Brewing",color:"#b6a2d5",stack:16},
  {id:167,name:"Bitter infusion",category:"Brewing",color:"#a8b856",stack:16},
  { id: 101, name: "Coal", category: "Materials", color: "#414947", stack: 64 },
  {
    id: 102,
    name: "Iron ingot",
    category: "Materials",
    color: "#c5cbc5",
    stack: 64,
  },
  {
    id: 103,
    name: "Jade shard",
    category: "Materials",
    color: "#77c9a5",
    stack: 64,
  },
  {
    id: 104,
    name: "Cedar stick",
    category: "Materials",
    color: "#ac845a",
    stack: 64,
  },
  {
    id: 105,
    name: "Steamed dumpling",
    category: "Food",
    color: "#eee0bb",
    stack: 64,
    food: 7,
  },
  {
    id: 106,
    name: "Gold ingot",
    category: "Materials",
    color: "#dbb76b",
    stack: 64,
  },
  {
    id: 107,
    name: "Rice seeds",
    category: "Farming",
    color: "#b2b777",
    stack: 64,
  },
  {
    id: 108,
    name: "Harvested rice",
    category: "Food",
    color: "#dccfa3",
    stack: 64,
    food: 1,
  },
  {
    id: 109,
    name: "Tea leaves",
    category: "Brewing",
    color: "#77a276",
    stack: 64,
  },
  {
    id: 110,
    name: "Cooked rice",
    category: "Food",
    color: "#f0e8d0",
    stack: 64,
    food: 5,
  },
  {
    id: 111,
    name: "Jade token",
    category: "Materials",
    color: "#8bc7ac",
    stack: 64,
  },
  {
    id: 112,
    name: "Warm tea",
    category: "Food",
    color: "#bda16c",
    stack: 16,
    food: 3,
  },
);
for (const [n, tier, material, color, durability] of [
  [0, 1, "Wooden", "#a9885d", 48],
  [1, 2, "Stone", "#9da79d", 112],
  [2, 3, "Iron", "#d4d8cb", 240],
  [3, 4, "Jade", "#8dd6b3", 680],
] as const) {
  for (const [i, name, tool] of [
    [0, "pickaxe", "pickaxe"],
    [1, "axe", "axe"],
    [2, "shovel", "shovel"],
    [3, "hoe", "hoe"],
    [4, "sword", "sword"],
  ] as const)
    ITEMS.push({
      id: 120 + n * 5 + i,
      name: `${material} ${name}`,
      category: "Tools",
      color,
      stack: 1,
      tool,
      tier,
      durability,
      damage: tool === "sword" ? tier * 2 + 2 : tier + 1,
    });
}
for (let tier = 0; tier < 2; tier++)
  for (let part = 0; part < 4; part++) {
    const slot = (["helmet", "tunic", "greaves", "boots"] as const)[part];
    ITEMS.push({
      id: 150 + tier * 4 + part,
      name: `${tier ? "Jade" : "Iron"} ${slot}`,
      category: "Equipment",
      color: tier ? "#8dd6b3" : "#d4d8cb",
      stack: 1,
      armorSlot: slot,
      protection: (tier ? [3, 8, 6, 3] : [2, 6, 5, 2])[part],
      durability: (tier ? 400 : 160) + part * 20,
    });
  }
export const item = (id: number) => ITEMS.find((i) => i.id === id);
export const STARTER_CREATIVE = [
  B.Red,
  B.JadeRoof,
  B.Planks,
  B.Paving,
  B.Lantern,
  B.Glass,
  B.Bamboo,
  B.Workbench,
  133,
];
