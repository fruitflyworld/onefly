/* GET /api/v1/world/2026-10-16
   The dish itself: its size, the wake cell, and where the day's food and danger
   sit. Every fly of the day shares exactly this. */

import { colony } from "@/sim/colony";
import { foundingOn, seedFromDate } from "@/sim/lineage";
import { ok, bad, isDate } from "../../json";

export const dynamic = "force-dynamic";

export function GET(_req: Request, { params }: { params: { date: string } }) {
  const { date } = params;
  if (!isDate(date)) return bad("date must be YYYY-MM-DD");

  const seed = seedFromDate(date);
  // The real dish the colony uses reserves every fly's wake cell; reproduce it.
  const world = colony(seed, date, foundingOn(date)).world;

  return ok({ date, seed, ...world }, date);
}
