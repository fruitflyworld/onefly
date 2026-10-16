/* GET /api/v1/fly/2026-10-16/mossy-wren
   One fly: its body, its whole day tick by tick, the sealed hash chain, and how
   its brain spent the day, counted by rule. `parent` is yesterday's champion —
   the fly this one was born from. */

import { colony, COLONY_SIZE } from "@/sim/colony";
import { foundingOn, ledgerDay, seedFromDate, addDays } from "@/sim/lineage";
import { indexOfName } from "@/sim/names";
import { RULES } from "@/sim/rules";
import { ok, bad, isDate } from "../../../json";

export const dynamic = "force-dynamic";

export function GET(_req: Request, { params }: { params: { date: string; name: string } }) {
  const { date, name } = params;
  if (!isDate(date)) return bad("date must be YYYY-MM-DD");

  const index = indexOfName(seedFromDate(date), name, COLONY_SIZE);
  if (index < 0) return bad(`no fly named ${name} on ${date}`, 404);

  const c = colony(seedFromDate(date), date, foundingOn(date));
  const m = c.members[index];
  const prev = ledgerDay(addDays(date, -1));

  const counts: Record<string, number> = Object.fromEntries(RULES.map((r) => [r.id, 0]));
  for (const t of m.day.ticks) counts[t.rule]++;

  return ok(
    {
      date,
      index,
      name: m.name,
      champion: index === c.champion,
      genome: m.genome,
      genomeId: m.genomeId,
      lived: m.lived,
      dayTicks: m.day.tune.ticks,
      meals: m.meals,
      gf: m.gf,
      alive: m.alive,
      hash: m.day.hash,
      chain: m.day.chain,
      rules: counts,
      parent: prev ? { name: prev.name, date: prev.d, genome: prev.champion } : null,
      trace: m.day.ticks
    },
    date
  );
}
