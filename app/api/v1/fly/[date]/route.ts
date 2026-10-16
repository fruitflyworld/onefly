/* GET /api/v1/fly/2026-10-16
   The whole day's clutch: eight siblings, one dish, and the ranking.
   ?compact=1 drops the per-tick arrays (keeps counts), for callers that only
   need the board. */

import { colony, COLONY_SIZE } from "@/sim/colony";
import { foundingOn, seedFromDate } from "@/sim/lineage";
import { ok, bad, isDate } from "../../json";

export const dynamic = "force-dynamic";

export function GET(req: Request, { params }: { params: { date: string } }) {
  const { date } = params;
  if (!isDate(date)) return bad("date must be YYYY-MM-DD");

  const compact = new URL(req.url).searchParams.get("compact") === "1";
  const c = colony(seedFromDate(date), date, foundingOn(date));

  return ok(
    {
      version: c.members[0].day.version,
      date: c.date,
      seed: c.seed,
      size: COLONY_SIZE,
      world: c.world,
      founding: c.founding,
      champion: c.members[c.champion].name,
      ranking: c.ranking.map((i) => c.members[i].name),
      members: c.members.map((m) => {
        const base = {
          index: m.index,
          name: m.name,
          genome: m.genome,
          genomeId: m.genomeId,
          lived: m.lived,
          meals: m.meals,
          gf: m.gf,
          alive: m.alive,
          hash: m.day.hash,
          ticks: m.day.ticks.length
        };
        return compact ? base : { ...base, trace: m.day.ticks };
      })
    },
    date
  );
}
