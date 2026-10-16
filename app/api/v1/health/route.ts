/* GET /api/v1/health — is the world alive, and how far does its ledger reach? */

import { FLY_VERSION, dayString } from "@/sim/engine";
import { COLONY_SIZE, todayColony } from "@/sim/colony";
import { ledgerThrough, LEDGER, foundingOn } from "@/sim/lineage";
import { BRAIN } from "@/sim/netlist";
import { ok } from "../json";

export const dynamic = "force-dynamic";

export function GET() {
  const date = dayString(new Date());
  const c = todayColony(new Date(), foundingOn(date));
  return ok({
    ok: true,
    version: FLY_VERSION,
    today: date,
    colonySize: COLONY_SIZE,
    champion: c.members[c.champion].name,
    brain: { version: BRAIN.version, gates: BRAIN.gates.length, nIn: BRAIN.nIn, nOut: BRAIN.nOut },
    ledger: { version: LEDGER.version, epoch: LEDGER.epoch, through: ledgerThrough(), days: LEDGER.days.length }
  });
}
