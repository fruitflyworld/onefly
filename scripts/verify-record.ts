/* ── scripts/verify-record.ts ────────────────────────────────────────────────
   Check records with no trust at all. Every file is replayed and re-hashed here.

     npm run verify-record -- agents/example/2026-10-15.json
     npm run verify-record -- agents/example/2026-10-15.json agents/other.json

   Exit code is non-zero if any record fails, so CI can gate merges on it.
   --------------------------------------------------------------------------- */
import { readFileSync } from "node:fs";
import { checkRecord, type AgentRecord } from "../sim/record";

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("usage: npm run verify-record -- <record.json> [...]");
  process.exit(1);
}

let failed = 0;
for (const file of files) {
  let record: AgentRecord;
  try {
    record = JSON.parse(readFileSync(file, "utf8")) as AgentRecord;
  } catch (e) {
    console.log(`✗ ${file}\n    unreadable: ${(e as Error).message}`);
    failed++;
    continue;
  }

  const c = checkRecord(record);
  if (c.ok) {
    console.log(`✓ ${file}  ${record.date} · ${record.agent} · champion ${record.claim.champion} (lived ${record.claim.lived}, ate ${record.claim.meals})`);
  } else {
    failed++;
    console.log(`✗ ${file}`);
    for (const e of c.errors) console.log(`    ${e}`);
    console.log(`    the day really was: ${c.truth.champion} · lived ${c.truth.lived} · meals ${c.truth.meals} · ${c.truth.hash}`);
  }
}

console.log(failed ? `\n${failed} record(s) failed.` : `\nall ${files.length} record(s) verified.`);
process.exit(failed ? 1 : 0);
