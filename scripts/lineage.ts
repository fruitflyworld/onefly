/* ── scripts/lineage.ts ──────────────────────────────────────────────────────
   Extend, or verify, the lineage ledger.

     npm run lineage            extend sim/lineage.json to today (UTC)
     npm run lineage --check    recompute the whole ledger and compare

   `--check` is the point. It rebuilds every row from the founder and the
   calendar and asserts the committed file matches, row for row. If it ever
   disagrees, someone edited the ledger by hand, or the engine changed under it.
   --------------------------------------------------------------------------- */
import { writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { build, extend, LEDGER, LEDGER_VERSION, EPOCH, type Ledger } from "../sim/lineage";
import { FOUNDER } from "../sim/genome";
import { dayString } from "../sim/engine";

const FILE = join(process.cwd(), "sim", "lineage.json");
const today = dayString(new Date());
const check = process.argv.includes("--check");

function read(): Ledger {
  try {
    return JSON.parse(readFileSync(FILE, "utf8")) as Ledger;
  } catch {
    return { version: LEDGER_VERSION, epoch: EPOCH, founder: FOUNDER, days: [] };
  }
}

function summarize(l: Ledger): string {
  const days = l.days;
  const survivors = days.filter((d) => d.alive).length;
  const last = days[days.length - 1];
  return `${days.length} days · ${survivors} survived to dusk · ${last ? `last ${last.d} (${last.name}, ${last.lived} ticks)` : "empty"}`;
}

if (check) {
  const t0 = Date.now();
  const rebuilt = build(FOUNDER, today);
  const file = read();
  const same = JSON.stringify(rebuilt.days) === JSON.stringify(file.days.slice(0, rebuilt.days.length));
  // the file may legitimately hold days the rebuild does not (a later run); it must not differ
  const extra = file.days.length - rebuilt.days.length;
  console.log(`recomputed ${rebuilt.days.length} days from ${EPOCH} in ${Date.now() - t0}ms`);
  console.log(`file: ${summarize(file)}`);
  if (!same) {
    const i = file.days.findIndex((d, k) => JSON.stringify(d) !== JSON.stringify(rebuilt.days[k]));
    console.error(`✗ LEDGER DIFFERS at row ${i} (${file.days[i]?.d ?? "?"} / ${rebuilt.days[i]?.d ?? "?"})`);
    process.exit(1);
  }
  if (extra > 0) {
    console.log(`(file also has ${extra} later day(s), not rebuilt)`);
    process.exit(0);
  }
  console.log("✓ IDENTICAL — the ledger is a function of the founder and the calendar");
  process.exit(0);
}

const before = read();
const grew = JSON.stringify(before.days) !== JSON.stringify(extend(before, today).days);
const next = extend(before, today);
writeFileSync(FILE, JSON.stringify(next, null, 2) + "\n");
console.log(`${grew ? "extended" : "already current"} → ${FILE}`);
console.log(summarize(next));
void LEDGER;
