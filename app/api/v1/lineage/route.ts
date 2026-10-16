/* GET /api/v1/lineage            — the whole ledger (every day's champion)
   GET /api/v1/lineage?days=30    — just the most recent N champions
   The ledger is a file in the repository, not a database; `npm run lineage
   --check` recomputes it from the founder and asserts it is unchanged. */

import { LEDGER, recentChampions, ledgerThrough, seedFromDate } from "@/sim/lineage";
import { ok, bad } from "../json";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const days = new URL(req.url).searchParams.get("days");
  if (days !== null) {
    const n = Number(days);
    if (!Number.isInteger(n) || n < 1 || n > 5000) return bad("days must be an integer 1..5000");
  }

  const through = ledgerThrough();
  return ok(
    {
      version: LEDGER.version,
      epoch: LEDGER.epoch,
      founder: LEDGER.founder,
      days: LEDGER.days.length,
      through,
      lastSeed: seedFromDate(through),
      champions: days === null ? LEDGER.days : recentChampions(Number(days))
    },
    through
  );
}
