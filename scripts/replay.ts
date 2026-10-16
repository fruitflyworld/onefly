/* ── scripts/replay.ts ───────────────────────────────────────────────────────
   Replay one fly's day from its date alone, and prove the day is a function of
   that date and nothing else.

     npm run replay -- 2026-10-16          show the day
     npm run replay -- 2026-10-16 --check  re-derive it and assert IDENTICAL

   The second form is the whole claim of the project: no database, no server, no
   randomness that is not in the seed. Anyone can run it, tomorrow or in ten
   years, and get the same fly.
   --------------------------------------------------------------------------- */
import { simulate, daySeed, dayString, type Day } from "../sim/engine";
import { BEHAVIORS } from "../sim/encode";

function parseDate(arg: string | undefined): Date {
  if (!arg) return new Date();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(arg);
  if (!m) throw new Error(`bad date "${arg}", want YYYY-MM-DD`);
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
}

const BAR = ["·", "▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];

function draw(day: Day): string {
  const { w, h, start, food, danger } = day.world;
  const last = day.ticks[day.ticks.length - 1];
  const visited = new Map<number, number>();
  day.ticks.forEach((t, i) => visited.set(t.y * w + t.x, i));
  const lines: string[] = [];
  for (let y = 0; y < h; y++) {
    let row = "";
    for (let x = 0; x < w; x++) {
      const k = y * w + x;
      const isFly = last && last.x === x && last.y === y;
      if (isFly) row += "@";
      else if (x === start.x && y === start.y) row += "S";
      else if (danger.some((c) => c.x === x && c.y === y)) row += "x";
      else if (food.some((c) => c.x === x && c.y === y)) row += "o";
      else if (visited.has(k)) row += "+";
      else row += " ";
    }
    lines.push(row);
  }
  return lines.join("\n");
}

function report(day: Day): void {
  const meals = day.ticks.filter((t) => t.ate).length;
  const gf = day.ticks.filter((t) => t.gf).length;
  const rules = new Map<string, number>();
  for (const t of day.ticks) rules.set(t.rule, (rules.get(t.rule) ?? 0) + 1);

  console.log(`ONE FLY — ${day.date}  (seed ${day.seed})`);
  console.log(`brain ${day.version} · 50 NAND gates · derived from the date, nothing fetched`);
  console.log("");
  console.log(draw(day));
  console.log("");
  console.log(`lived   ${day.ticks.length} / ${day.tune.ticks} ticks  (${day.alive ? "survived the day" : "died"})`);
  console.log(`meals   ${meals}`);
  console.log(`giant fibre fired ${gf} times`);
  console.log(`rules   ${[...rules].map(([r, n]) => `${r}×${n}`).join("  ")}`);
  console.log("");
  console.log("tick  pos     behaviour  rule      hunger  gf");
  for (const t of day.ticks) {
    console.log(
      `${String(t.t).padStart(4)}  (${String(t.x).padStart(2)},${String(t.y).padStart(2)})  ` +
        `${t.behavior.padEnd(9)}  ${t.rule.padEnd(8)}  ${String(t.hunger).padStart(4)}  ${t.gf ? "!!" : "  "}`
    );
  }
  console.log("");
  console.log(`hash    ${day.hash}`);
  console.log(`chain   ${day.chain.length} links, each sealing the one before`);
}

const args = process.argv.slice(2);
const check = args.includes("--check");
const dateArg = args.find((a) => !a.startsWith("--"));
const date = parseDate(dateArg);
const seed = daySeed(date);
const str = dayString(date);

const day = simulate(seed, str);
report(day);

if (check) {
  const again = simulate(seed, str);
  const same = again.hash === day.hash && JSON.stringify(again.ticks) === JSON.stringify(day.ticks);
  console.log("");
  console.log(same ? "✓ IDENTICAL — the day is a function of the date" : "✗ DIVERGED — the day is not reproducible");
  process.exit(same ? 0 : 1);
}

// keep the import used even in the plain path (behaviour names are part of the contract)
void BEHAVIORS;
