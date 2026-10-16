/* ── sim/rand.ts ─────────────────────────────────────────────────────────────
   The one random number generator in the project. Everything that looks random
   — where food sits, which way a fly wanders, how a genome mutates — comes out
   of this, seeded by something that is itself derived from a date.

   mulberry32 is used for the same reason the rest of the family uses it: it is
   ten lines, it is integer-only apart from one final division by 2^32, and that
   division is exactly representable, so every machine agrees bit for bit.

   A number in [0,1) is only ever turned into an index with Math.floor(r * n),
   never compared against a float threshold. Keep it that way.
   --------------------------------------------------------------------------- */

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A generator that is a pure function of (seed, stream). Different streams never collide. */
export function stream(seed: number, streamId: number): () => number {
  return mulberry32((seed ^ Math.imul(streamId + 1, 0x9e3779b1)) >>> 0);
}

/** Pick one element deterministically. */
export function pick<T>(rnd: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}

/** An integer in [lo, hi], inclusive. */
export function rangeInt(rnd: () => number, lo: number, hi: number): number {
  return lo + Math.floor(rnd() * (hi - lo + 1));
}

/** A deterministic 32-bit seed from a string (FNV-1a). */
export function hash32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
