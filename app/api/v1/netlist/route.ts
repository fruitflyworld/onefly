/* GET /api/v1/netlist — the committed circuit, verbatim, plus its shape.
   Anyone can evaluate this themselves; signal numbering is TapeOut's, so the
   same bytes could be taped out unchanged. */

import { BRAIN, gateDepth } from "@/sim/netlist";
import { ok } from "../json";

export const dynamic = "force-dynamic";

export function GET() {
  const { cols, depth } = gateDepth(BRAIN);
  return ok({
    version: BRAIN.version,
    nIn: BRAIN.nIn,
    nOut: BRAIN.nOut,
    gates: BRAIN.gates.length,
    gateDepth: cols.length - 1,
    latches: 0,
    maxSignalDepth: Math.max(...depth),
    netlist: BRAIN
  });
}
