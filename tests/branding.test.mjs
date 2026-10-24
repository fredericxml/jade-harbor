import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");

describe("Jade Harbor branding", () => {
  it("uses the canonical title, tagline and package name", () => {
    expect(read("index.html")).toContain("Jade Harbor — Build Beyond Boundaries");
    expect(JSON.parse(read("package.json")).name).toBe("jade-harbor");
    expect(JSON.parse(read("package-lock.json")).name).toBe("jade-harbor");
  });

  it("uses Jade Harbor across the game UI and error screens", () => {
    const ui = read("src/ui/ui.ts");
    expect(ui).toContain("JADE HARBOR");
    expect(ui).toContain("A CHINATOWN VOXEL SANDBOX");
    expect(ui).toContain("Build beyond.");
    expect(ui).not.toMatch(/lanterncraft/i);
    expect(read("src/main.ts")).toContain("Jade Harbor needs WebGL 2.");
  });

  it("exports correctly branded world backups without changing the save schema", () => {
    const storage = read("src/persistence/saves.ts");
    expect(storage).toContain(".jadeharbor.json");
    expect(storage).toContain('format: "jade-harbor-engine"');
    expect(storage).toContain('DATABASE_NAME = "jade-harbor-engine-v1"');
    expect(read("src/core/game.ts")).toContain("jade-harbor-settings");
  });
});
