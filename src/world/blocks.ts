import { idOf, stateOf } from "../core/coords";
export const B = {
  Air: 0,
  Grass: 1,
  Dirt: 2,
  Stone: 3,
  Sand: 4,
  Water: 5,
  Log: 6,
  Leaves: 7,
  Planks: 8,
  Red: 9,
  Roof: 10,
  JadeRoof: 11,
  Brick: 12,
  Paving: 13,
  Lantern: 14,
  Glass: 15,
  Bamboo: 16,
  Blossom: 17,
  Coal: 18,
  Iron: 19,
  Jade: 20,
  Snow: 21,
  Terracotta: 22,
  Workbench: 23,
  Furnace: 24,
  Chest: 25,
  Bed: 26,
  Door: 27,
  Slab: 28,
  Stairs: 29,
  Farmland: 30,
  Rice: 31,
  Tea: 32,
  Switch: 33,
  Wire: 34,
  Lamp: 35,
  Obsidian: 36,
  Lava: 37,
  Gold: 38,
  Marble: 39,
  Moss: 40,
  Paper: 41,
  Fence: 42,
  Ladder: 43,
  Flower: 44,
  Gravel: 45,
  Basalt: 46,
  Ice: 47,
  Porcelain: 48,
  Ink: 49,
  SculptureStone: 50,
  RubyRoof: 51,
  BrownRoof: 52,
  GoldTrim: 53,
  CreamWall: 54,
  DarkTimber: 55,
  TeaSign: 56,
  MarketSign: 57,
  Pottery: 58,
  Crate: 59,
  Lotus: 60,
  NoodleSign: 61,
  PandaSign: 62,
  Banner: 63,
  PandaEye: 64,
  PandaMouth: 65,
  Enchanter: 66,
  Apothecary: 67,
  Anvil: 68,
  Hopper: 69,
  Timer: 70,
  Plate: 71,
} as const;
export type Shape =
  | "cube"
  | "slab"
  | "stairs"
  | "lantern"
  | "plant"
  | "door"
  | "fence"
  | "wire"
  | "ladder"
  | "pot";
export type BlockDef = {
  id: number;
  name: string;
  category: string;
  color: string;
  solid: boolean;
  opaque: boolean;
  hardness: number;
  tool?: string;
  tier?: number;
  drop?: number;
  emission?: number;
  shape?: Shape;
  hidden?: boolean;
};
const defs: [number, string, string, string, Partial<BlockDef>?][] = [
  [
    0,
    "Air",
    "Natural",
    "#ffffff",
    { solid: false, opaque: false, hidden: true },
  ],
  [1, "Meadow grass", "Natural", "#81985a"],
  [2, "Earth", "Natural", "#806247"],
  [
    3,
    "Mountain stone",
    "Natural",
    "#92978f",
    { hardness: 2.5, tool: "pickaxe", tier: 1 },
  ],
  [4, "River sand", "Natural", "#dbcd9a", { hardness: 0.5 }],
  [
    5,
    "River water",
    "Natural",
    "#568f95",
    { solid: false, opaque: false, hardness: 0 },
  ],
  [6, "Cedar log", "Timber", "#745039", { tool: "axe", hardness: 1.5 }],
  [7, "Cedar leaves", "Nature", "#578052", { hardness: 0.25 }],
  [8, "Cedar planks", "Timber", "#ac8256"],
  [9, "Vermilion pillar", "Architecture", "#a84637"],
  [10, "Charcoal roof tile", "Architecture", "#455557"],
  [11, "Jade roof tile", "Architecture", "#4d8879"],
  [12, "Courtyard brick", "Architecture", "#b9ada0"],
  [13, "Stone paving", "Architecture", "#939b91"],
  [
    14,
    "Festival lantern",
    "Decor",
    "#e48a4f",
    {
      shape: "lantern",
      opaque: false,
      solid: false,
      emission: 14,
      hardness: 0.3,
    },
  ],
  [
    15,
    "Lattice window",
    "Architecture",
    "#c1d5c5",
    { opaque: false, hardness: 0.3 },
  ],
  [
    16,
    "Bamboo",
    "Nature",
    "#8aab59",
    { shape: "plant", opaque: false, solid: false, hardness: 0.4 },
  ],
  [17, "Cherry blossom", "Nature", "#e7b3b0", { hardness: 0.25 }],
  [
    18,
    "Coal ore",
    "Minerals",
    "#747b73",
    { hardness: 2.8, tool: "pickaxe", tier: 1, drop: 101 },
  ],
  [
    19,
    "Iron ore",
    "Minerals",
    "#a88f7d",
    { hardness: 3.4, tool: "pickaxe", tier: 2 },
  ],
  [
    20,
    "Jade ore",
    "Minerals",
    "#64a99a",
    { hardness: 4, tool: "pickaxe", tier: 3, drop: 103 },
  ],
  [21, "Snow", "Natural", "#e4e9db"],
  [22, "Terracotta", "Architecture", "#ba7555"],
  [23, "Crafting bench", "Stations", "#b28652"],
  [
    24,
    "Kiln furnace",
    "Stations",
    "#6f7976",
    { hardness: 3, tool: "pickaxe", tier: 1 },
  ],
  [25, "Cedar chest", "Stations", "#ad7f45"],
  [26, "Resting mat", "Stations", "#b14f44", { shape: "slab", opaque: false }],
  [
    27,
    "Red courtyard door",
    "Architecture",
    "#ac4938",
    { shape: "door", opaque: false },
  ],
  [
    28,
    "Paving slab",
    "Architecture",
    "#9ea698",
    { shape: "slab", opaque: false },
  ],
  [
    29,
    "Jade roof stairs",
    "Architecture",
    "#588b7a",
    { shape: "stairs", opaque: false },
  ],
  [30, "Tilled soil", "Farming", "#655039"],
  [
    31,
    "Rice crop",
    "Farming",
    "#adbb62",
    { shape: "plant", opaque: false, solid: false, hardness: 0.1, drop: 108 },
  ],
  [
    32,
    "Tea bush",
    "Farming",
    "#588456",
    { shape: "plant", opaque: false, solid: false, hardness: 0.4, drop: 109 },
  ],
  [
    33,
    "Jade switch",
    "Mechanisms",
    "#b79d60",
    { opaque: false, shape: "slab" },
  ],
  [
    34,
    "Qi wire",
    "Mechanisms",
    "#568d71",
    { opaque: false, solid: false, shape: "wire" },
  ],
  [35, "Jade lamp", "Mechanisms", "#ded3a1"],
  [
    36,
    "Obsidian",
    "Natural",
    "#494452",
    { hardness: 8, tool: "pickaxe", tier: 3 },
  ],
  [
    37,
    "Lava",
    "Natural",
    "#eb773b",
    { solid: false, opaque: false, emission: 15 },
  ],
  [
    38,
    "Gold ore",
    "Minerals",
    "#bda35b",
    { hardness: 3.5, tool: "pickaxe", tier: 3 },
  ],
  [39, "Carved marble", "Architecture", "#d5d2bc"],
  [40, "Moss stone", "Natural", "#7f8b64"],
  [41, "Paper screen", "Architecture", "#e8d9b9"],
  [
    42,
    "Timber railing",
    "Architecture",
    "#865e3e",
    { shape: "fence", opaque: false },
  ],
  [
    43,
    "Bamboo ladder",
    "Architecture",
    "#b5aa68",
    { shape: "ladder", opaque: false, solid: false },
  ],
  [
    44,
    "Peony",
    "Nature",
    "#db9292",
    { shape: "plant", opaque: false, solid: false, hardness: 0.1 },
  ],
  [45, "Gravel", "Natural", "#a09c8c"],
  [46, "Basalt", "Natural", "#555d60", { tool: "pickaxe", tier: 1 }],
  [47, "Ice", "Natural", "#adcbd0", { opaque: false }],
  [48, "White porcelain", "Architecture", "#eeeade", { hardness: 1.2 }],
  [49, "Ink ceramic", "Architecture", "#242b2b", { hardness: 1.2 }],
  [50, "Sculpture stone", "Architecture", "#777f77"],
  [51, "Ruby ceramic roof", "Architecture", "#a75645"],
  [52, "Amber ceramic roof", "Architecture", "#916c45"],
  [53, "Gilded trim", "Decor", "#d6b15d"],
  [54, "Limewashed wall", "Architecture", "#ddd4b9"],
  [55, "Dark carved timber", "Timber", "#493a2d"],
  [56, "Tea house sign", "Decor", "#a14534"],
  [57, "Market sign", "Decor", "#305d4c"],
  [58, "Glazed pottery", "Decor", "#bd805e", { shape: "pot", opaque: false }],
  [59, "Timber crate", "Decor", "#a88a5d"],
  [
    60,
    "Lotus blossom",
    "Nature",
    "#dfa5b1",
    { shape: "plant", solid: false, opaque: false },
  ],
  [61, "Noodle shop sign", "Decor", "#a64d36"],
  [62, "Panda Plaza sign", "Decor", "#4d6758"],
  [63, "Festival banner", "Decor", "#ac5340"],
  [64, "Panda eye ceramic", "Decor", "#182422"],
  [65, "Panda smile ceramic", "Decor", "#eeeade"],
  [66,"Jade inscription table","Workstations","#6eaa94",{hardness:3,tool:"pickaxe",tier:2,emission:3}],
  [67,"Apothecary kettle","Workstations","#ad8064",{hardness:2,tool:"axe"}],
  [68,"Artisan anvil","Workstations","#68767a",{hardness:4,tool:"pickaxe",tier:2}],
  [69,"Jade hopper","Mechanisms","#638e83",{hardness:3,tool:"pickaxe",tier:2}],
  [70,"Festival timer","Mechanisms","#b89b60",{hardness:2,tool:"pickaxe"}],
  [71,"Pressure plate","Mechanisms","#a89a7c",{hardness:1,opaque:false,solid:false,shape:"wire"}],
];
export const BLOCKS: BlockDef[] = defs.map(
  ([id, name, category, color, extra]) => ({
    id,
    name,
    category,
    color,
    solid: true,
    opaque: true,
    hardness: 1,
    shape: "cube",
    ...extra,
  }),
);
export const block = (value: number) => BLOCKS[idOf(value)] ?? BLOCKS[0];
export function opaque(value: number) {
  return block(value).opaque;
}
export type Box = [number, number, number, number, number, number];
export function boxes(v: number): Box[] {
  const b = block(v),
    s = stateOf(v);
  switch (b.shape) {
    case "slab":
      return [
        [
          0,
          s & 2 ? 0.5 : 0,
          0,
          1,
          b.id === B.Bed ? 0.3 : s & 1 || s & 2 ? 1 : 0.5,
          1,
        ],
      ];
    case "door": {
      const facing = ((s & 3) + (s & 4 ? 1 : 0)) % 4;
      return facing === 0
        ? [[0, 0, 0, 1, 1, 0.16]]
        : facing === 1
          ? [[0, 0, 0, 0.16, 1, 1]]
          : facing === 2
            ? [[0, 0, 0.84, 1, 1, 1]]
            : [[0.84, 0, 0, 1, 1, 1]];
    }
    case "stairs":
      return [
        [0, 0, 0, 1, 0.5, 1],
        (s & 3) === 0
          ? [0, 0.5, 0, 1, 1, 0.5]
          : (s & 3) === 1
            ? [0, 0.5, 0, 0.5, 1, 1]
            : (s & 3) === 2
              ? [0, 0.5, 0.5, 1, 1, 1]
              : [0.5, 0.5, 0, 1, 1, 1],
      ];
    case "lantern":
      return [
        [0.22, 0.15, 0.22, 0.78, 0.85, 0.78],
        [0.33, 0.85, 0.33, 0.67, 1, 0.67],
        [0.4, 0, 0.4, 0.6, 0.15, 0.6],
      ];
    case "pot":
      return [
        [0.2, 0, 0.2, 0.8, 0.65, 0.8],
        [0.3, 0.65, 0.3, 0.7, 0.9, 0.7],
      ];
    case "plant":
      return b.id === B.Bamboo
        ? [[0.36, 0, 0.36, 0.62, 1, 0.62]]
        : b.id === B.Rice
          ? [[0.22, 0, 0.2, 0.8, 0.2 + (s % 4) * 0.22, 0.8]]
          : [[0.15, 0, 0.15, 0.85, 0.75, 0.85]];
    case "fence":
      return [
        [0.36, 0, 0.36, 0.64, 1, 0.64],
        [0, 0.35, 0.43, 1, 0.5, 0.57],
        [0, 0.75, 0.43, 1, 0.9, 0.57],
      ];
    case "wire":
      return [
        [0, 0, 0.4, 1, 0.06, 0.6],
        [0.4, 0, 0, 0.6, 0.06, 1],
      ];
    case "ladder":
      return [
        [0.15, 0, 0.88, 0.24, 1, 1],
        [0.76, 0, 0.88, 0.85, 1, 1],
        [0.15, 0.2, 0.88, 0.85, 0.28, 1],
        [0.15, 0.65, 0.88, 0.85, 0.73, 1],
      ];
    default:
      return [[0, 0, 0, 1, 1, 1]];
  }
}
export const emits = (v: number) =>
  block(v).emission ??
  (idOf(v) === B.Lamp && stateOf(v) & 1
    ? 14
    : idOf(v) === B.Furnace && stateOf(v) & 1
      ? 12
      : 0);
