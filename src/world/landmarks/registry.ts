import { B } from "../blocks";
import type { LandmarkId, Palette, ReservationId } from "./types";

export const IMPERIAL: Palette = { wall: B.Red, timber: B.DarkTimber, roof: B.BrownRoof, accent: B.GoldTrim };
export const STONE: Palette = { wall: B.SculptureStone, timber: B.DarkTimber, roof: B.Roof, accent: B.Marble };
export const HARBOR: Palette = { wall: B.CreamWall, timber: B.DarkTimber, roof: B.BrownRoof, accent: B.GoldTrim };
export const GARDEN: Palette = { wall: B.Marble, timber: B.DarkTimber, roof: B.JadeRoof, accent: B.Moss };
export const LANDMARK_REGISTRY: readonly { id: LandmarkId; reservation: ReservationId; name: string; tier: 1 | 2; context: string }[] = [
  { id: "imperial-complex", reservation: "imperial-complex-reserve", name: "Jade Palace", tier: 1, context: "Imperial plateau and ceremonial axis" },
  { id: "ridge-fortification", reservation: "ridge-fortification-reserve", name: "Northern Ridge Wall", tier: 1, context: "Continuous northern ridge" },
  { id: "archaeology", reservation: "archaeology-reserve", name: "Terrace Excavations", tier: 1, context: "Archaeological outskirts" },
  { id: "harbor-front", reservation: "harbor-front-reserve", name: "Harbor Guild Beacon", tier: 1, context: "Merchant Docks shoreline" },
  { id: "mountain-temple", reservation: "mountain-temple-reserve", name: "Cloudstep Sanctuary", tier: 2, context: "Western scenic highlands" },
  { id: "cliff-grotto", reservation: "cliff-grotto-reserve", name: "East Cliff Chambers", tier: 2, context: "South-facing eastern cliff" },
  { id: "scenic-landscape", reservation: "scenic-landscape-reserve", name: "Reed Moon Garden", tier: 2, context: "Quiet western landscape" },
  { id: "western-viewpoint", reservation: "western-viewpoint-reserve", name: "Western Lookout Pagoda", tier: 2, context: "Western scenic viewpoint" },
];
