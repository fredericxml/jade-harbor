import type { Profession } from "../professions";
import type { DistrictId } from "../../world/metropolis/districts";

export type SchedulePhase = "dawn" | "morning" | "midday" | "afternoon" | "evening" | "night";
export type Activity = "working" | "browsing" | "gathering" | "guarding" | "sightseeing" | "resting" | "returning home" | "sleeping";
export type Schedule = { phase: SchedulePhase; activity: Activity; destination: "home" | "work" | "public" };
/** The HUD and simulation already use zero = 06:00. No separate clock. */
export const clockHour = (time: number) => ((time * 24 + 6) % 24 + 24) % 24;
export function identityHash(id: string) { let n = 2166136261; for (const c of id) n = Math.imul(n ^ c.charCodeAt(0), 16777619); return n >>> 0; }
export const scheduleOffset = (id: string) => (identityHash(id) % 901 - 450) / 1000;
export type MutableSchedule = { phase: SchedulePhase; activity: Activity; destination?: Schedule["destination"] };
export function scheduleAtInto(out: MutableSchedule, id: string, profession: Profession, district: DistrictId,
  time: number, rain = false, offset = scheduleOffset(id), hour = clockHour(time)): MutableSchedule {
  const h = (hour + offset + 24) % 24;
  const phase: SchedulePhase = h < 6 || h >= 21 ? "night" : h < 8 ? "dawn" : h < 12 ? "morning" : h < 14 ? "midday" : h < 17 ? "afternoon" : "evening";
  let activity: Activity, destination: Schedule["destination"];
  if (profession === "guard") { activity = "guarding"; destination = "work"; }
  else if (profession === "fisherman" || profession === "dock_worker") {
    if (h >= 5 && h < 17) { activity = "working"; destination = "work"; }
    else { activity = h < 5 || h >= 21 ? "sleeping" : "returning home"; destination = "home"; }
  } else if (district === "nightlife" || profession === "chef") {
    if (h >= 11 && h < 23) {
      activity = h >= 17 && !rain ? "gathering" : "working";
      destination = h >= 17 && !rain ? "public" : "work";
    } else { activity = "sleeping"; destination = "home"; }
  } else if (phase === "night") { activity = "sleeping"; destination = "home"; }
  else if (phase === "dawn") { activity = "resting"; destination = "home"; }
  else if (phase === "evening") {
    if (rain || district === "imperial" || h >= 19.5) { activity = "returning home"; destination = "home"; }
    else { activity = "gathering"; destination = "public"; }
  } else if (phase === "midday" && !rain) {
    activity = profession === "scholar" || profession === "caretaker" ? "sightseeing" : "browsing";
    destination = "public";
  } else { activity = "working"; destination = "work"; }
  out.phase = phase; out.activity = activity; out.destination = destination;
  return out;
}
export function scheduleAt(id: string, profession: Profession, district: DistrictId, time: number, rain = false): Schedule {
  const out: Schedule = { phase: "dawn", activity: "resting", destination: "home" };
  scheduleAtInto(out, id, profession, district, time, rain);
  return out;
}
