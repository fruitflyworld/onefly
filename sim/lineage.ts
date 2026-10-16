/* ── sim/lineage.ts ──────────────────────────────────────────────────────────
   The fly does not appear from nowhere each morning. The day's clutch descends
   from yesterday's champion: whatever body lived longest yesterday is what
   today's eight siblings are born from, nudged a little.

   That chain is a *ledger*, and the ledger is a file in this repository
   (sim/lineage.json) rather than something the site computes per request. The
   reason is arithmetic, not taste: from 2026-01-01 to today is ~289 days of 8
   flies — about seven seconds — which is fine in a script and wrong inside a
   web request.

   The file is not a database. It is a public record with the same standing as
   the netlist: anyone can run `npm run lineage --check` and recompute every row
   from the founder and the calendar. If the file and the recomputation ever
   disagree, the file is wrong.
   --------------------------------------------------------------------------- */
import ledgerFile from "./lineage.json";
import { colony, COLONY_SIZE } from "./colony";
import { mutate, FOUNDER, type Genome } from "./genome";
import { stream } from "./rand";

export const LEDGER_VERSION = "ONEFLY-LINEAGE/1";
export const EPOCH = "2026-01-01";

export interface LedgerDay {
  d: string; // YYYY-MM-DD (UTC)
  founding: Genome; // the genome every fly of this day inherited
  champion: Genome; // the winner's genome — tomorrow's parent
  name: string;
  lived: number;
  alive: boolean;
  hash: string; // the champion's sealed day
}

export interface Ledger {
  version: string;
  epoch: string;
  founder: Genome;
  days: LedgerDay[];
}

/* ── dates, as plain strings ───────────────────────────────────────────────── */

export function seedFromDate(date: string): number {
  return Number(date.replace(/-/g, "")) >>> 0;
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
}

export function daysBetween(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

/* ── the one step that makes a lineage ─────────────────────────────────────── */

/** Tomorrow's founding genome: the champion's body, nudged on the day's own stream. */
export function nextFounding(day: LedgerDay): Genome {
  return mutate(day.champion, stream(seedFromDate(day.d), 0x11ca)); // "LINC"
}

/** Play one whole day and report what it produced. */
export function runDay(date: string, founding: Genome): LedgerDay {
  const c = colony(seedFromDate(date), date, founding);
  const champ = c.members[c.champion];
  return {
    d: date,
    founding,
    champion: champ.genome,
    name: champ.name,
    lived: champ.lived,
    alive: champ.alive,
    hash: champ.day.hash
  };
}

/**
 * The ledger from the epoch to `toDate`, computed from nothing but the founder
 * and the calendar. This is what `npm run lineage --check` asserts the file equals.
 */
export function build(founder: Genome = FOUNDER, toDate: string): Ledger {
  const days: LedgerDay[] = [];
  let founding = founder;
  for (const date of daysBetween(EPOCH, toDate)) {
    const day = runDay(date, founding);
    days.push(day);
    founding = nextFounding(day);
  }
  return { version: LEDGER_VERSION, epoch: EPOCH, founder, days };
}

/** Extend a ledger to a later date, keeping every row it already has. */
export function extend(ledger: Ledger, toDate: string): Ledger {
  const last = ledger.days[ledger.days.length - 1];
  if (last && last.d >= toDate) return ledger;
  const from = last ? addDays(last.d, 1) : EPOCH;
  const days = [...ledger.days];
  let founding = last ? nextFounding(last) : (ledger.founder ?? FOUNDER);
  for (const date of daysBetween(from, toDate)) {
    const day = runDay(date, founding);
    days.push(day);
    founding = nextFounding(day);
  }
  return { ...ledger, days };
}

/* ── reading it ────────────────────────────────────────────────────────────── */

export const LEDGER: Ledger = ledgerFile as unknown as Ledger;

const byDate = new Map(LEDGER.days.map((d) => [d.d, d]));

/** The day's row, if the ledger reaches that far. */
export function ledgerDay(date: string): LedgerDay | null {
  return byDate.get(date) ?? null;
}

/** The genome a given day starts from — from the ledger, or the founder if unseen. */
export function foundingOn(date: string): Genome {
  return byDate.get(date)?.founding ?? FOUNDER;
}

/** The last day the ledger covers. */
export function ledgerThrough(): string {
  return LEDGER.days.length ? LEDGER.days[LEDGER.days.length - 1].d : EPOCH;
}

/** Consecutive champions, most recent first — the family tree for /lineage. */
export function recentChampions(n = 30): LedgerDay[] {
  return LEDGER.days.slice(-n).reverse();
}

export { COLONY_SIZE };
