/* GET /api/v1/rules — the fly's behaviour, as data. */

import { RULES, RULE_PARAMS } from "@/sim/rules";
import { BRAIN_VERSION, LEVELS } from "@/sim/encode";
import { ok } from "../json";

export const dynamic = "force-dynamic";

export function GET() {
  return ok({
    brain: BRAIN_VERSION,
    levels: LEVELS,
    params: RULE_PARAMS,
    rules: RULES
  });
}
