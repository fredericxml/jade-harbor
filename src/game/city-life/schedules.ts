import type { Profession } from "../professions";
import type { DistrictId } from "../../world/metropolis/districts";

export type SchedulePhase = "dawn" | "morning" | "midday" | "afternoon" | "evening" | "night";
export type Activity = "working" | "browsing" | "gathering" | "guarding" | "sightseeing" | "resting" | "returning home" | "sleeping";
export type Schedule = { phase: SchedulePhase; activity: Activity; destination: "home" | "work" | "public" };
/** The HUD and simulation already use zero = 06:00. No separate clock. */
export const clockHour = (time: number) => ((time * 24 + 6) % 24 + 24) % 24;
export function identityHash(id: string) { let n = 2166136261; for (const c of id) n = Math.imul(n ^ c.charCodeAt(0), 16777619); return n >>> 0; }
export const scheduleOffset = (id: string) => (identityHash(id) % 901 - 450) / 1000;
export function scheduleAt(id: string, profession: Profession, district: DistrictId, time: number, rain = false): Schedule {
  const h = (clockHour(time) + scheduleOffset(id) + 24) % 24;
  const phase: SchedulePhase = h < 6 || h >= 21 ? "night" : h < 8 ? "dawn" : h < 12 ? "morning" : h < 14 ? "midday" : h < 17 ? "afternoon" : "evening";
  if (profession === "guard") return { phase, activity: "guarding", destination: "work" };
  if (profession === "fisherman" || profession === "dock_worker") {
    if (h >= 5 && h < 17) return { phase, activity: "working", destination: "work" };
    return { phase, activity: h < 5 || h >= 21 ? "sleeping" : "returning home", destination: "home" };
  }
  if (district === "nightlife" || profession === "chef") {
    if (h >= 11 && h < 23) return { phase, activity: h >= 17 && !rain ? "gathering" : "working", destination: h >= 17 && !rain ? "public" : "work" };
    return { phase, activity: "sleeping", destination: "home" };
  }
  if (phase === "night") return { phase, activity: "sleeping", destination: "home" };
  if (phase === "dawn") return { phase, activity: "resting", destination: "home" };
  if (phase === "evening") return rain || district === "imperial" || h >= 19.5
    ? { phase, activity: "returning home", destination: "home" }
    : { phase, activity: "gathering", destination: "public" };
  if (phase === "midday" && !rain) return { phase, activity: profession === "scholar" || profession === "caretaker" ? "sightseeing" : "browsing", destination: "public" };
  return { phase, activity: "working", destination: "work" };
}
