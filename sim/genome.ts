/* ── sim/genome.ts ───────────────────────────────────────────────────────────
   What a fly inherits from its parent: its body, as six integers.

   The world is not in here. One day's dish is shared by every fly of that day
   (see engine.worldFor); the genome only shapes the animal living in it — how
   fast it burns energy, what a meal is worth, how far it can smell, how quickly
   a place stops being interesting, and where on the dish it wakes up.

   Two rules, both from the same reason:

     - nothing is a float. FFW's genetics mutates with 0.08 and 0.015 and cannot
       be copied here; every step is an integer and every bound is inclusive.
     - a mutation is a small nudge, not a re-roll. A child resembles its parent,
       which is the only thing that makes a lineage a lineage.
   --------------------------------------------------------------------------- */
import { rangeInt, hash32 } from "./rand";

export interface Genome {
  hStep: number; // hunger gained per tick
  hFood: number; // hunger removed by one meal
  senseDecay: number; // smell lost per cell of distance
  visitDecay: number; // novelty lost per time a cell is entered
  startX: number; // waking offset from the dish centre
  startY: number;
}

/** The one genome every lineage starts from. */
export const FOUNDER: Genome = {
  hStep: 15,
  hFood: 450,
  senseDecay: 160,
  visitDecay: 250,
  startX: 0,
  startY: 0
};

interface Bound {
  lo: number;
  hi: number;
  step: number; // largest single-tick nudge, in the field's own units
}

/** Inclusive bounds and per-field nudge sizes. */
export const GENOME_BOUNDS: Record<keyof Genome, Bound> = {
  hStep: { lo: 8, hi: 30, step: 3 },
  hFood: { lo: 250, hi: 700, step: 60 },
  senseDecay: { lo: 100, hi: 260, step: 25 },
  visitDecay: { lo: 120, hi: 400, step: 35 },
  startX: { lo: -6, hi: 6, step: 2 },
  startY: { lo: -6, hi: 6, step: 2 }
};

export const GENOME_FIELDS = Object.keys(GENOME_BOUNDS) as (keyof Genome)[];

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/** A child: each field nudged by a small integer, or left alone, then clamped. */
export function mutate(parent: Genome, rnd: () => number): Genome {
  const out = { ...parent };
  for (const f of GENOME_FIELDS) {
    const b = GENOME_BOUNDS[f];
    if (rnd() < 0.55) out[f] = clamp(parent[f] + rangeInt(rnd, -b.step, b.step), b.lo, b.hi);
  }
  return out;
}

/** Eight siblings: the same parent, each mutated on its own stream. */
export function sibling(parent: Genome, rnd: () => number): Genome {
  return mutate(parent, rnd);
}

/** A short, stable id for a genome — what a badge shows. */
export function genomeId(g: Genome): string {
  return hash32(GENOME_FIELDS.map((f) => `${f}${g[f]}`).join("")).toString(16).padStart(8, "0");
}

/** How far a genome drifted from the founder, in integer per-mille (for a readout). */
export function genomeDrift(g: Genome): number {
  let d = 0;
  for (const f of GENOME_FIELDS) {
    const b = GENOME_BOUNDS[f];
    const span = b.hi - b.lo || 1;
    d += Math.floor((Math.abs(g[f] - FOUNDER[f]) * 1000) / span);
  }
  return Math.floor(d / GENOME_FIELDS.length);
}

export function sameGenome(a: Genome, b: Genome): boolean {
  return GENOME_FIELDS.every((f) => a[f] === b[f]);
}
