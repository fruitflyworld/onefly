/* ── sim/encode.ts ───────────────────────────────────────────────────────────
   The one interface between the fly's world and its gate-level brain:

     12 input bits  (bit 0 = input pin 0, the order TapeOut's eval() packs them)
       bits 0-1   food      level 0..3
       bits 2-3   threat    level 0..3
       bits 4-5   light     level 0..3
       bits 6-7   novelty   level 0..3
       bits 8-9   hunger    level 0..3
       bits 10-11 previous behaviour (0 approach · 1 avoid · 2 explore · 3 freeze)
     3 output bits
       bits 0-1   behaviour  (same numbering)
       bit 2      giant-fibre escape

   Everything is integer on purpose. A sense is a 0..1000 integer and levelInt()
   bins it with the exact same thresholds as level() — so the engine uses no
   floating point at all and two machines cannot disagree in the last bit.
   --------------------------------------------------------------------------- */

export const BRAIN_VERSION = "FFW-NAND/1";
export const LEVELS = [0.1, 0.35, 0.65] as const;
export const N_IN = 12;
export const N_OUT = 3;
export const BEHAVIORS = ["approach", "avoid", "explore", "freeze"] as const;
export type Behavior = (typeof BEHAVIORS)[number];

export function level(x: number): number {
  return x < LEVELS[0] ? 0 : x < LEVELS[1] ? 1 : x < LEVELS[2] ? 2 : 3;
}

/** The same thresholds as level(), on a 0..1000 integer: identical bytes everywhere. */
export function levelInt(v1000: number): number {
  return v1000 < 100 ? 0 : v1000 < 350 ? 1 : v1000 < 650 ? 2 : 3;
}

export function behaviorIndex(b: string): number {
  const i = (BEHAVIORS as readonly string[]).indexOf(b);
  return i < 0 ? 3 : i;
}

export interface Senses { food: number; threat: number; light: number; novelty: number; hunger: number }

/** Pack one decision's senses (each 0..1000) and the previous behaviour into the 12-bit word. */
export function encodeInputs(s: Senses, prev: number): number {
  return (
    levelInt(s.food) |
    (levelInt(s.threat) << 2) |
    (levelInt(s.light) << 4) |
    (levelInt(s.novelty) << 6) |
    (levelInt(s.hunger) << 8) |
    ((prev & 3) << 10)
  );
}

export function decodeOutputs(word: number): { behavior: Behavior; gf: boolean } {
  return { behavior: BEHAVIORS[word & 3], gf: ((word >> 2) & 1) === 1 };
}
