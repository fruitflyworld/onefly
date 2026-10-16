/* ── sim/engine.ts ───────────────────────────────────────────────────────────
   One day in the life of ONE FLY, as pure integer arithmetic.

   Everything here is integers on purpose. The world is a 21×21 grid, every sense
   is a 0..1000 integer, every behaviour comes out of the 50-gate netlist. There
   is no floating point anywhere in the simulation path, so the same date yields
   the same fly — byte for byte — on any machine, in Node or in a browser.

   The seed is the UTC date: seed 20261016 is "the fly of 16 Oct 2026", and every
   visitor to the page computes that same fly. Nothing is fetched; nothing is
   stored; the whole day is derived from the calendar.

   A day is a chain. Each tick is hashed on its own and then folded into the
   previous chain hash (sim/hash.ts), so the transcript of the fly's day is
   tamper-evident: change one tick and the final hash changes.
   --------------------------------------------------------------------------- */
import { evalWord, BRAIN } from "./netlist";
import { encodeInputs, levelInt, decodeOutputs, type Senses, type Behavior } from "./encode";
import { decideWord, type RuleId } from "./rules";
import { GENESIS, recordHash, chainHash } from "./hash";
import { mulberry32 } from "./rand";

export const FLY_VERSION = "ONEFLY/1";
export const WORLD = { w: 21, h: 21 } as const;

/* Tunables, all integers. Kept few and named so a day is reproducible by hand,
   and recorded inside every Day so a transcript explains itself. */
export interface Tune {
  ticks: number; // how many ticks a full day lasts (dusk)
  food: number; // food cells scattered for the day
  danger: number; // danger cells the fly must not walk into
  hStep: number; // hunger added per tick
  hFood: number; // hunger removed by one meal
  hMax: number; // hunger at which the fly dies
  visitDecay: number; // novelty lost per time a cell is entered
  senseDecay: number; // sense value lost per cell of distance
  startX: number; // where on the dish this fly wakes up, as an offset from the centre
  startY: number;
}

export const TUNE: Tune = {
  ticks: 150,
  food: 14,
  danger: 3,
  hStep: 15,
  hFood: 450,
  hMax: 1000,
  visitDecay: 250,
  senseDecay: 160,
  startX: 0,
  startY: 0
};

export interface Cell {
  x: number;
  y: number;
}

/** A dish. Shared by every fly of one day, and a pure function of the day's seed. */
export interface World {
  w: number;
  h: number;
  start: Cell;
  food: Cell[];
  danger: Cell[];
}

/**
 * Scatter one day's dish. Food first, then danger, never on the start cell and
 * never overlapping — all from `seed`, so everyone gets the same dish.
 */
export function worldFor(seed: number, foodCount: number, dangerCount: number, reserved: Cell[] = []): World {
  const rnd = mulberry32(seed);
  const start: Cell = { x: WORLD.w >> 1, y: WORLD.h >> 1 };
  const taken = new Set<number>([start.y * WORLD.w + start.x]);
  for (const c of reserved) taken.add(c.y * WORLD.w + c.x);
  const place = (n: number): Cell[] => {
    const out: Cell[] = [];
    let guard = 0;
    while (out.length < n && guard++ < 10000) {
      const c: Cell = { x: Math.floor(rnd() * WORLD.w), y: Math.floor(rnd() * WORLD.h) };
      const k = c.y * WORLD.w + c.x;
      if (taken.has(k)) continue;
      taken.add(k);
      out.push(c);
    }
    return out;
  };
  return { w: WORLD.w, h: WORLD.h, start, food: place(foodCount), danger: place(dangerCount) };
}

export interface Tick {
  t: number;
  x: number;
  y: number;
  hunger: number;
  food: number; // raw 0..1000 senses
  threat: number;
  light: number;
  novelty: number;
  inWord: number; // the 12-bit word fed to the brain
  outWord: number; // the 3-bit word the netlist returned
  rule: RuleId; // which of the seven rules that word selects
  behavior: Behavior;
  gf: boolean; // Giant Fibre fired
  ate: boolean;
  alive: boolean;
}

export interface Day {
  version: string;
  seed: number;
  date: string;
  tune: Tune;
  world: World;
  ticks: Tick[];
  alive: boolean;
  /** hex SHA-256 of the whole transcript (chain of every tick). */
  hash: string;
  /** the per-tick chain hashes, in order. chain[chain.length-1] === hash. */
  chain: string[];
}


/** The integer that names a day: 20261016 for 16 Oct 2026 (UTC). */
export function daySeed(d: Date = new Date()): number {
  return (d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate()) >>> 0;
}

export function dayString(d: Date = new Date()): string {
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${d.getUTCFullYear()}-${m}-${day}`;
}

/** Manhattan distance is all this world needs. */
const dist = (a: Cell, b: Cell) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

/** A sense from a distance: 1000 on the cell, fading by T.senseDecay per step. */
function senseFromDist(d: number, T: Tune): number {
  return d <= 0 ? 1000 : Math.max(0, 1000 - d * T.senseDecay);
}

/** A static light field: bright along the top edge, dark along the bottom (integer steps). */
function lightAt(y: number): number {
  return Math.max(0, 1000 - y * Math.floor(1000 / (WORLD.h - 1)));
}

function nearest(from: Cell, cells: Cell[]): { cell: Cell; d: number } | null {
  let best: { cell: Cell; d: number } | null = null;
  for (const c of cells) {
    const d = dist(from, c);
    if (best === null || d < best.d) best = { cell: c, d };
  }
  return best;
}

/** One step from `from` toward `to` (larger axis first; ties go x). Stays in grid. */
function stepToward(from: Cell, to: Cell): Cell {
  const dx = Math.sign(to.x - from.x);
  const dy = Math.sign(to.y - from.y);
  let { x, y } = from;
  if (dx !== 0 && Math.abs(to.x - from.x) >= Math.abs(to.y - from.y)) x += dx;
  else if (dy !== 0) y += dy;
  return { x: clamp(x, 0, WORLD.w - 1), y: clamp(y, 0, WORLD.h - 1) };
}

/** One step from `from` away from `away`. */
function stepAway(from: Cell, away: Cell): Cell {
  return stepToward(from, { x: from.x + (from.x - away.x), y: from.y + (from.y - away.y) });
}

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

const key = (c: Cell) => c.y * WORLD.w + c.x;

/**
 * The single source of truth for a fly: feed it a seed, get its whole life.
 *
 * `over` tunes the body (metabolism, senses) and `dish` supplies a world another
 * caller already built — that is how the eight flies of one day share a dish.
 * Left out, the dish is derived from `seed`.
 */
export function simulate(seed: number, date: string = String(seed), over: Partial<Tune> = {}, dish?: World): Day {
  const T: Tune = { ...TUNE, ...over };
  const world = dish ?? worldFor(seed, T.food, T.danger);
  const { start, food, danger } = world;

  const visits = new Map<number, number>();
  const ticks: Tick[] = [];
  const chain: string[] = [];
  let prevChain = GENESIS;

  let pos: Cell = {
    x: clamp(start.x + T.startX, 0, WORLD.w - 1),
    y: clamp(start.y + T.startY, 0, WORLD.h - 1)
  };
  let hunger = 0;
  let alive = true;
  let prevBehavior = 2; // a fly starts out exploring (rule 6's novelty keeps it that way early)
  const foodLeft = food.map((c) => ({ ...c }));

  for (let t = 0; t < T.ticks; t++) {
    // ── sense the world, as integers ─────────────────────────────────────────
    const nFood = nearest(pos, foodLeft);
    const nDanger = nearest(pos, danger);
    const foodS = nFood ? senseFromDist(nFood.d, T) : 0;
    const threatS = nDanger ? senseFromDist(nDanger.d, T) : 0;
    const lightS = lightAt(pos.y);
    const v = visits.get(key(pos)) ?? 0;
    const noveltyS = Math.max(0, 1000 - v * T.visitDecay);
    const hungerS = Math.min(1000, hunger);

    const senses: Senses = {
      food: foodS,
      threat: threatS,
      light: lightS >>> 0,
      novelty: noveltyS,
      hunger: hungerS
    };

    // ── think: the 12-bit word goes through the 50-gate netlist ──────────────
    const inWord = encodeInputs(senses, prevBehavior);
    const outWord = evalWord(BRAIN, inWord);
    const { behavior, gf } = decodeOutputs(outWord);
    const { rule } = decideWord(inWord); // label only; the netlist already agrees (tests)

    // ── act ──────────────────────────────────────────────────────────────────
    if (behavior === "approach" && nFood) pos = stepToward(pos, nFood.cell);
    else if (behavior === "avoid" && nDanger) pos = stepAway(pos, nDanger.cell);
    else if (behavior === "explore") {
      const r = mulberry32((seed ^ Math.imul(t + 1, 0x9e3779b1)) >>> 0);
      const d = Math.floor(r() * 4);
      const dx = d === 0 ? -1 : d === 1 ? 1 : 0;
      const dy = d === 2 ? -1 : d === 3 ? 1 : 0;
      pos = { x: clamp(pos.x + dx, 0, WORLD.w - 1), y: clamp(pos.y + dy, 0, WORLD.h - 1) };
    } // freeze: stays put

    visits.set(key(pos), (visits.get(key(pos)) ?? 0) + 1);

    // ── consequences ─────────────────────────────────────────────────────────
    let ate = false;
    const fi = foodLeft.findIndex((c) => c.x === pos.x && c.y === pos.y);
    if (fi >= 0) {
      foodLeft.splice(fi, 1);
      hunger = Math.max(0, hunger - T.hFood);
      ate = true;
    }
    hunger += T.hStep;
    if (danger.some((c) => c.x === pos.x && c.y === pos.y)) alive = false;
    if (hunger >= T.hMax) alive = false;

    const tick: Tick = {
      t,
      x: pos.x,
      y: pos.y,
      hunger: Math.min(hunger, T.hMax),
      food: foodS,
      threat: threatS,
      light: lightS >>> 0,
      novelty: noveltyS,
      inWord,
      outWord,
      rule,
      behavior,
      gf,
      ate,
      alive
    };
    ticks.push(tick);

    const h = recordHash(tick);
    const c = chainHash(prevChain, h);
    chain.push(c);
    prevChain = c;

    prevBehavior = ["approach", "avoid", "explore", "freeze"].indexOf(behavior);
    if (!alive) break;
  }

  return {
    version: FLY_VERSION,
    seed,
    date,
    tune: T,
    world,
    ticks,
    alive: ticks.length > 0 && ticks[ticks.length - 1].alive,
    hash: prevChain,
    chain
  };
}

/** Today's fly, in one call. */
export function today(now: Date = new Date()): Day {
  return simulate(daySeed(now), dayString(now));
}

export { levelInt };
