import { Stack, Inventory } from "./inventory";
export type GridRecipe = {
  name: string;
  pattern: string[];
  keys: Record<string, number>;
  output: [number, number];
};
export const GRID_RECIPES: GridRecipe[] = [
  { name: "Cedar planks", pattern: ["L"], keys: { L: 6 }, output: [8, 4] },
  {
    name: "Cedar sticks",
    pattern: ["P", "P"],
    keys: { P: 8 },
    output: [104, 4],
  },
  {
    name: "Crafting bench",
    pattern: ["PP", "PP"],
    keys: { P: 8 },
    output: [23, 1],
  },
  {
    name: "Cedar chest",
    pattern: ["PPP", "P P", "PPP"],
    keys: { P: 8 },
    output: [25, 1],
  },
  {
    name: "Kiln furnace",
    pattern: ["SSS", "S S", "SSS"],
    keys: { S: 3 },
    output: [24, 1],
  },
];
for (let tier = 0; tier < 4; tier++)
  for (let tool = 0; tool < 5; tool++) {
    const patterns = [
      ["MMM", " S ", " S "],
      ["MM", "MS", " S"],
      ["M", "S", "S"],
      ["MM", " S", " S"],
      ["M", "M", "S"],
    ];
    GRID_RECIPES.push({
      name:
        ["Wooden", "Stone", "Iron", "Jade"][tier] +
        " " +
        ["pickaxe", "axe", "shovel", "hoe", "sword"][tool],
      pattern: patterns[tool],
      keys: { M: [8, 3, 102, 103][tier], S: 104 },
      output: [120 + tier * 5 + tool, 1],
    });
  }
for (let tier = 0; tier < 2; tier++)
  for (let part = 0; part < 4; part++)
    GRID_RECIPES.push({
      name: `${tier ? "Jade" : "Iron"} armor`,
      pattern: [
        ["MMM", "M M"],
        ["M M", "MMM", "MMM"],
        ["MMM", "M M", "M M"],
        ["M M", "M M"],
      ][part],
      keys: { M: tier ? 103 : 102 },
      output: [150 + tier * 4 + part, 1],
    });
export function matchGrid(grid: (Stack | null)[], width: number) {
  let minX = width,
    minY = width,
    maxX = -1,
    maxY = -1;
  for (let i = 0; i < width * width; i++)
    if (grid[i]) {
      minX = Math.min(minX, i % width);
      maxX = Math.max(maxX, i % width);
      minY = Math.min(minY, Math.floor(i / width));
      maxY = Math.max(maxY, Math.floor(i / width));
    }
  if (maxX < 0) return null;
  const w = maxX - minX + 1,
    h = maxY - minY + 1;
  for (const recipe of GRID_RECIPES) {
    if (recipe.pattern.length !== h || recipe.pattern[0].length !== w) continue;
    for (const mirror of [false, true]) {
      let valid = true;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const token = recipe.pattern[y][mirror ? w - 1 - x : x],
            expected = recipe.keys[token] ?? 0,
            actual = grid[(minY + y) * width + minX + x]?.id ?? 0;
          if (actual !== expected) valid = false;
        }
      if (valid) return recipe;
    }
  }
  return null;
}
export function craftGrid(
  grid: (Stack | null)[],
  width: number,
  inventory: Inventory,
) {
  const recipe = matchGrid(grid, width);
  if (!recipe) return false;
  const copy = new Inventory(inventory.slots);
  if (copy.add(...recipe.output)) return false;
  for (let i = 0; i < width * width; i++)
    if (grid[i] && --grid[i]!.count === 0) grid[i] = null;
  inventory.slots = copy.slots;
  return true;
}
