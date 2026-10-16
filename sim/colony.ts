/* ── sim/colony.ts ───────────────────────────────────────────────────────────
   One day, one dish, eight flies.

   They are siblings: all eight inherit the same founding genome and each is
   nudged on its own stream, so they differ a little. They live in the *same*
   dish — same food, same danger — which is what makes the day's leaderboard
   mean anything. The one that lives longest is the day's champion, and its
   genome is what tomorrow's clutch inherits (see sim/lineage.ts).

   Everything here is a function of the date. There is nothing to store.
   --------------------------------------------------------------------------- */
import { simulate, worldFor, daySeed, dayString, TUNE, WORLD, type Day, type World, type Cell } from "./engine";
import { mutate, genomeId, FOUNDER, type Genome } from "./genome";
import { namesFor } from "./names";
import { stream } from "./rand";

export const COLONY_SIZE = 8;

export interface Member {
  index: number;
  name: string;
  genome: Genome;
  genomeId: string;
  day: Day;
  lived: number;
  meals: number;
  gf: number;
  alive: boolean;
}

export interface Colony {
  date: string;
  seed: number;
  world: World;
  founding: Genome;
  members: Member[]; // in name order
  ranking: number[]; // member indices, best first
  champion: number; // member index of the day's winner
}

/** How a fly is scored: how long it lived, then how many meals it found. */
function score(m: Member): [number, number] {
  return [m.lived, m.meals];
}

function better(a: Member, b: Member): boolean {
  const [al, am] = score(a);
  const [bl, bm] = score(b);
  return al !== bl ? al > bl : am > bm;
}

/**
 * The day's clutch. `founding` is the genome the day starts from — in production
 * it comes from the lineage ledger; left out, the founder is used.
 */
export function colony(seed: number, date: string = String(seed), founding: Genome = FOUNDER): Colony {
  const names = namesFor(seed, COLONY_SIZE);

  // Bodies first — the dish must not put food or danger where a fly wakes up.
  const genomes: Genome[] = names.map((_, i) => (i === 0 ? { ...founding } : mutate(founding, stream(seed, 0x1000 + i))));
  const clampCell = (v: number, hi: number) => Math.max(0, Math.min(hi - 1, v));
  const starts: Cell[] = genomes.map((g) => ({
    x: clampCell((WORLD.w >> 1) + g.startX, WORLD.w),
    y: clampCell((WORLD.h >> 1) + g.startY, WORLD.h)
  }));

  const world = worldFor(seed, TUNE.food, TUNE.danger, starts);

  const members: Member[] = names.map((name, i) => {
    const g = genomes[i];
    const day = simulate(seed, date, { ...g }, world);
    return {
      index: i,
      name,
      genome: g,
      genomeId: genomeId(g),
      day,
      lived: day.ticks.length,
      meals: day.ticks.filter((t) => t.ate).length,
      gf: day.ticks.filter((t) => t.gf).length,
      alive: day.alive
    };
  });

  const ranking = members
    .map((m) => m.index)
    .sort((a, b) => (better(members[a], members[b]) ? -1 : better(members[b], members[a]) ? 1 : a - b));

  return {
    date,
    seed,
    world,
    founding,
    members,
    ranking,
    champion: ranking[0]
  };
}

/* ── what goes to the browser ─────────────────────────────────────────────────
   The chain array is 150 hashes per fly — 77 kB nobody renders. Every page sends
   the slim shape: the same day, minus the per-tick hashes, plus their count. */

export interface SlimDay extends Omit<Day, "chain"> {
  chainLength: number;
}

export interface SlimMember extends Omit<Member, "day"> {
  day: SlimDay;
}

export interface SlimColony extends Omit<Colony, "members"> {
  members: SlimMember[];
}

export function slim(c: Colony): SlimColony {
  return {
    ...c,
    members: c.members.map((m) => {
      const { chain, ...rest } = m.day;
      return { ...m, day: { ...rest, chainLength: chain.length } };
    })
  };
}

/** Today's clutch. */
export function todayColony(now: Date = new Date(), founding?: Genome): Colony {
  const d = daySeed(now);
  return colony(d, dayString(now), founding);
}
