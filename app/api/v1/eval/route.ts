/* GET /api/v1/eval?word=1234
   Ask the brain one question. Give it a 12-bit input word and get back the 3-bit
   output, the decoded behaviour, the rule that word selects, and the value of
   every signal in the circuit — the same thing the /lab page draws. */

import { BRAIN, evalTrace, evalWord, gateDepth } from "@/sim/netlist";
import { decodeOutputs, encodeInputs, type Senses } from "@/sim/encode";
import { decideWord } from "@/sim/rules";
import { ok, bad } from "../json";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const raw = sp.get("word");

  // Either a packed 12-bit word, or five senses + prev, packed for the caller.
  let word: number;
  if (raw !== null) {
    word = Number(raw);
    if (!Number.isInteger(word) || word < 0 || word > 0xfff) return bad("word must be an integer 0..4095");
  } else if (["food", "threat", "light", "novelty", "hunger"].every((k) => sp.has(k))) {
    const s: Senses = {
      food: +sp.get("food")!, threat: +sp.get("threat")!, light: +sp.get("light")!,
      novelty: +sp.get("novelty")!, hunger: +sp.get("hunger")!
    };
    word = encodeInputs(s, +(sp.get("prev") ?? 0));
  } else {
    return bad("give ?word=N (0..4095) or all of ?food&threat&light&novelty&hunger (&prev)");
  }

  const out = evalWord(BRAIN, word);
  const { behavior, gf } = decodeOutputs(out);
  const { rule } = decideWord(word);

  return ok({
    word,
    wordBits: "0b" + word.toString(2).padStart(12, "0"),
    out,
    outBits: "0b" + out.toString(2).padStart(3, "0"),
    behavior,
    giantFibre: gf,
    rule,
    signals: Array.from(evalTrace(BRAIN, word)),
    gates: BRAIN.gates.length,
    depth: gateDepth(BRAIN).cols.length - 1
  });
}
