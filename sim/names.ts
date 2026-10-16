/* ── sim/names.ts ────────────────────────────────────────────────────────────
   Every fly of a day has a name, and the name is derived from the day, so the
   same eight names are on everyone's screen. A name is an adjective and a noun,
   joined by a hyphen: `dusty-ember`.

   The lists are short on purpose. A name is a handle for a fly you will read
   about for one page, not a brand.
   --------------------------------------------------------------------------- */
import { stream } from "./rand";

const ADJECTIVES = [
  "dusty", "amber", "quiet", "restless", "pale", "hollow", "brittle", "lucid",
  "feral", "patient", "wiry", "mossy", "taut", "sullen", "golden", "raw",
  "dim", "eager", "spare", "copper", "ash", "nimble", "vague", "stark"
] as const;

const NOUNS = [
  "ember", "moth", "sable", "lark", "drifter", "cinder", "harrier", "plume",
  "sparrow", "kite", "glider", "wren", "falcon", "swift", "heron", "finch",
  "rover", "siskin", "magpie", "tern"
] as const;

/** The name of bird `i` of the day seeded by `seed`. Stable forever. */
export function nameFor(seed: number, i: number): string {
  const r = stream(seed, 0x4e414d45 + i); // "NAME"
  const a = ADJECTIVES[Math.floor(r() * ADJECTIVES.length)];
  const n = NOUNS[Math.floor(r() * NOUNS.length)];
  return `${a}-${n}`;
}

/** The whole clutch's names, in order. */
export function namesFor(seed: number, count: number): string[] {
  return Array.from({ length: count }, (_, i) => nameFor(seed, i));
}

/** Turn a name back into the index it came from, or -1. Used by /fly/[name]. */
export function indexOfName(seed: number, name: string, count: number): number {
  for (let i = 0; i < count; i++) if (nameFor(seed, i) === name) return i;
  return -1;
}
