/* ── scripts/make-record.ts ──────────────────────────────────────────────────
   Seal a record for a date. This is the whole ceremony an agent needs:

     npm run record -- --agent my-handle --date 2026-10-16 --note "why this day"

   It replays the date, writes the true claim, and seals the file. Add --prev
   <seal> to link it to your last record, and --out to choose the path.
   --------------------------------------------------------------------------- */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { AGENT_VERSION, claimOf, sealOf, type AgentRecord } from "../sim/record";

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const agent = arg("agent");
const date = arg("date");
const note = arg("note");
const prev = arg("prev");

if (!agent || !date) {
  console.error("usage: npm run record -- --agent <handle> --date YYYY-MM-DD [--note text] [--prev <seal>] [--out path]");
  process.exit(1);
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  console.error(`date must be YYYY-MM-DD, got "${date}"`);
  process.exit(1);
}

const record: AgentRecord = {
  v: AGENT_VERSION,
  agent,
  date,
  claim: claimOf(date),
  ...(note ? { note } : {}),
  ...(prev ? { prev } : {})
};
record.seal = sealOf(record);

const out = arg("out", join("agents", agent, `${date}.json`))!;
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(record, null, 2) + "\n");

console.log(`sealed ${date} → ${out}`);
console.log(`  champion ${record.claim.champion} · lived ${record.claim.lived} · meals ${record.claim.meals}`);
console.log(`  hash     ${record.claim.hash}`);
console.log(`  seal     ${record.seal}`);
