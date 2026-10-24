import * as THREE from "three";
import { BLOCKS, B } from "../world/blocks";
import { hash } from "../world/noise";
export const TILE = 16,
  COLS = 16,
  ATLAS = 256;
export function makeAtlas() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = ATLAS;
  const c = canvas.getContext("2d")!;
  for (const b of BLOCKS)
    for (let face = 0; face < 3; face++) {
      const tile = b.id * 3 + face,
        ox = (tile % COLS) * TILE,
        oy = Math.floor(tile / COLS) * TILE;
      c.fillStyle = b.color;
      c.fillRect(ox, oy, TILE, TILE);
      for (let y = 0; y < TILE; y++)
        for (let x = 0; x < TILE; x++) {
          const r = hash(x + b.id * 27, y, 891 + face);
          c.fillStyle =
            r > 0.5
              ? `rgba(255,255,235,${(r - 0.5) * 0.2})`
              : `rgba(20,32,26,${(0.5 - r) * 0.23})`;
          c.fillRect(ox + x, oy + y, 1, 1);
        }
      const line = (
        x: number,
        y: number,
        w: number,
        h: number,
        color: string,
      ) => {
        c.fillStyle = color;
        c.fillRect(ox + x, oy + y, w, h);
      };
      if(b.id===B.Hopper) {line(2,2,12,12,"#304f49");line(4,4,8,8,"#789e8c");line(6,6,4,4,"#172f2d");}
      if(b.id===B.Timer) {line(3,2,10,12,"#e3d4a1");line(7,4,2,5,"#476a5a");line(7,8,4,2,"#476a5a");}
      if(b.id===B.Plate) {line(0,0,16,2,"#d9c999");line(0,14,16,2,"#655d43");line(6,4,4,8,"#746c50");}
      if(b.id===B.Enchanter) {
        line(1,1,14,2,"#dcca89");line(1,13,14,2,"#dcca89");
        if(face===0){line(3,4,10,7,"#e8dbc3");line(7,4,1,7,"#456a5a");line(4,6,2,1,"#456a5a");line(9,8,3,1,"#456a5a");}
        else {line(5,5,6,6,"#284e45");line(7,6,2,4,"#c4d0a2");}
      }
      if(b.id===B.Apothecary) {
        line(2,3,12,10,"#54493f");line(4,4,8,8,face===0?"#91b9a2":"#d0af77");
        line(6,5,4,1,"#e2d5ab");line(1,13,14,2,"#735037");
      }
      if(b.id===B.Anvil) {
        line(1,2,14,4,"#b5bcad");line(5,6,6,7,"#3e4c50");line(2,13,12,2,"#c3b27a");
      }
      if (
        [B.Planks, B.Log, B.Red, B.Chest, B.Workbench].includes(b.id as never)
      ) {
        for (let n = 3; n < 16; n += 4)
          line(
            b.id === B.Log ? n : 0,
            b.id === B.Log ? 0 : n,
            b.id === B.Log ? 1 : 16,
            b.id === B.Log ? 16 : 1,
            "#00000022",
          );
      }
      if (
        [B.Roof, B.JadeRoof, B.Stairs, B.RubyRoof, B.BrownRoof].includes(
          b.id as never,
        )
      ) {
        for (let n = 0; n < 16; n += 4) {
          line(n, 0, 1, 16, "#ffffff26");
          line(n + 3, 0, 1, 16, "#00000025");
        }
        line(0, 14, 16, 2, "#142b3344");
      }
      if ([B.Paving, B.Brick, B.Marble, B.Furnace].includes(b.id as never)) {
        line(0, 0, 16, 1, "#1d302e44");
        line(0, 8, 16, 1, "#1d302e44");
        line(8, 0, 1, 8, "#1d302e44");
        line(0, 8, 1, 8, "#1d302e44");
      }
      if (b.id === B.Grass && face !== 0) {
        line(0, 4, 16, 12, "#82684c");
        for (let n = 0; n < 16; n++)
          line(n, 3, 1, Math.floor(hash(n, 0, 2) * 4), "#81985a");
      }
      if ([B.Coal, B.Iron, B.Jade, B.Gold].includes(b.id as never)) {
        const col =
          b.id === B.Coal
            ? "#3d4543"
            : b.id === B.Iron
              ? "#d9af87"
              : b.id === B.Jade
                ? "#84e0b9"
                : "#f1cf67";
        for (let n = 0; n < 7; n++)
          line(
            Math.floor(hash(n, 1, 3) * 13),
            Math.floor(hash(n, 2, 4) * 13),
            3,
            2,
            col,
          );
      }
      if (b.id === B.Glass) {
        line(0, 0, 16, 2, "#775b40");
        line(0, 0, 2, 16, "#775b40");
        line(7, 0, 2, 16, "#846144");
        line(0, 7, 16, 2, "#846144");
      }
      if (b.id === B.Lantern) {
        line(0, 0, 16, 3, "#795135");
        line(0, 13, 16, 3, "#795135");
        for (let n = 3; n < 16; n += 4) line(n, 3, 1, 10, "#ffda8066");
        line(6, 6, 4, 4, "#ffdc91");
      }
      if (b.id === B.Chest) {
        line(0, 6, 16, 2, "#4a3829");
        line(7, 6, 2, 4, "#ebcb75");
      }
      if (b.id === B.Workbench) {
        line(3, 3, 10, 10, "#543c2e");
        line(4, 4, 8, 8, "#b49466");
        line(7, 4, 1, 8, "#4e4737");
        line(4, 7, 8, 1, "#4e4737");
      }
      if (b.id === B.Furnace) {
        line(3, 9, 10, 5, "#2d3634");
        line(4, 3, 8, 3, "#49514b");
      }
      if (b.id === B.Door) {
        line(1, 1, 14, 1, "#d7a565");
        line(1, 1, 1, 14, "#d7a565");
        line(11, 9, 2, 2, "#edc978");
      }
      if (
        [B.TeaSign, B.MarketSign, B.NoodleSign, B.PandaSign, B.Banner].includes(
          b.id as never,
        )
      ) {
        line(0, 0, 16, 1, "#e8c875");
        line(0, 15, 16, 1, "#e8c875");
        line(0, 0, 1, 16, "#e8c875");
        line(15, 0, 1, 16, "#e8c875");
        // Original pixel strokes: no dependence on installed CJK fonts.
        const glyphs: Record<number, string[]> = {
          [B.TeaSign]: [
            "00100000100",
            "11111111111",
            "00100000100",
            "00000100000",
            "00001010000",
            "00110001100",
            "01000100010",
            "01111111110",
            "00000100000",
            "00110101100",
            "01000100010",
          ],
          [B.MarketSign]: [
            "00000100000",
            "00000000000",
            "11111111111",
            "00000100000",
            "01111111110",
            "01000100010",
            "01000100010",
            "01000100010",
            "01000100110",
            "00000100000",
            "00000100000",
          ],
          [B.NoodleSign]: [
            "11111111111",
            "00000100000",
            "00001000000",
            "11111111111",
            "10010001001",
            "10011111001",
            "10010001001",
            "10011111001",
            "10010001001",
            "10010001001",
            "11111111111",
          ],
          [B.PandaSign]: [
            "01000010010",
            "10111010100",
            "11111010010",
            "10001011110",
            "11111010010",
            "10001010100",
            "11111011110",
            "10001000000",
            "10011000000",
            "00000000000",
            "10101010100",
          ],
          [B.Banner]: [
            "01000111111",
            "11110000000",
            "00100111111",
            "01010100001",
            "11010111111",
            "01000000000",
            "01000111111",
            "01000100101",
            "01000111111",
            "01000100101",
            "01000111111",
          ],
        };
        for (const [y, row] of glyphs[b.id].entries())
          for (let x = 0; x < row.length; x++)
            if (row[x] === "1") line(x + 2, y + 2, 1, 1, "#f4df9e");
      }
      if (b.id === B.PandaEye) {
        line(3, 3, 4, 4, "#ecebd9");
        line(10, 10, 2, 2, "#687974");
      }
      if (b.id === B.PandaMouth) {
        line(7, 0, 2, 8, "#28302c");
        line(4, 7, 7, 2, "#28302c");
        line(3, 5, 2, 3, "#28302c");
        line(10, 5, 2, 3, "#28302c");
      }
      if (b.id === B.Crate) {
        line(1, 0, 2, 16, "#554630");
        line(13, 0, 2, 16, "#554630");
        line(0, 6, 16, 2, "#6b5238");
      }
      if (b.id === B.GoldTrim) {
        line(1, 1, 14, 1, "#f8db8a");
        line(1, 14, 14, 1, "#876c32");
      }
      if (b.id === B.Paper) {
        line(0, 0, 16, 1, "#65523b");
        line(0, 0, 1, 16, "#65523b");
      }
    }
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestMipmapLinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  return { texture, canvas };
}
export function tileUV(id: number, face: number) {
  const tile = id * 3 + (face === 2 ? 0 : face === 3 ? 2 : 1),
    x = tile % COLS,
    y = Math.floor(tile / COLS);
  return [
    (x * 16 + 0.1) / 256,
    1 - ((y + 1) * 16 - 0.1) / 256,
    ((x + 1) * 16 - 0.1) / 256,
    1 - (y * 16 + 0.1) / 256,
  ];
}
