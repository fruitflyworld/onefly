# ONE FLY

**Every day there is one fly. Everyone sees the same one.**

Its entire brain is **50 NAND gates** — no model, no training, no weights. Its whole
day is a function of the date alone. Come back tomorrow and it is a different fly;
open the page on any machine, tomorrow or in ten years, and it is the *same* fly,
byte for byte.

```
npm run replay -- 2026-10-16 --check      # → ✓ IDENTICAL
```

That one command is the whole claim: **no database, nothing fetched, no randomness
that is not in the seed.** The date is the only input.

---

## How it works

```
date ──▶ seed ──▶ [ world ]  ──▶  senses (0..1000)  ──▶  12 bits
                                                                 │
                                          ┌──────────────────────┘
                                          ▼
                                   50 NAND gates  ──▶  3 bits  ──▶  act
                                          │
                                          ▼
                                   tick ──▶ hash ──▶ chain
```

1. **Seed.** `2026-10-16 → 20261016`. That integer is the day.
2. **World.** A 21×21 grid. Food and danger cells are scattered from a
   `mulberry32` PRNG seeded by that integer — nothing is stored, it is derived.
3. **Senses.** Each tick the fly reads five senses — food, threat, light, novelty,
   hunger — as integers in `0..1000`, plus its own previous behaviour. No floating
   point anywhere in the simulation path, so two machines cannot disagree in the
   last bit.
4. **Brain.** The senses pack into a 12-bit word (see `sim/encode.ts`), which goes
   through the **50-gate netlist** (`sim/ffw-nand-1.netlist.json`). Three bits come
   out: a behaviour (`approach` / `avoid` / `explore` / `freeze`) and a giant-fibre
   escape flag.
5. **Seal.** Each tick is hashed on its own and folded into the one before it, so the
   day is a **hash chain**. Change a single tick and the day's hash changes.

The 50 gates are not drawn by hand: `sim/rules.ts` is the source of truth — the fly's
brain as **seven reflex rules**, read top to bottom, first match wins. The committed
netlist is checked against those rules on **all 4096 possible input words**.

| # | rule | |
|---|------|---|
| 1 | escape | threat ≥ 2 → avoid, and the Giant Fibre fires |
| 2 | danger | threat ≥ 1 and (previous was avoid or hunger < 2) → avoid |
| 3 | feed | hunger ≥ 3 and food ≥ 1 → approach |
| 4 | lure | food ≥ 3 → approach |
| 5 | pursue | previous was approach and food ≥ 2 → approach |
| 6 | curious | novelty ≥ 2 → explore |
| 7 | rest | previous was freeze and hunger < 3 → freeze |
| — | default | explore in the light, freeze in the dark |

---

## The page

One page, no backend state:

- **the world** — the fly's route drawn tick by tick, with a scrubber and replay;
- **the readout** — the live behaviour, the rule that fired, the five senses, the bit word;
- **the brain** — the actual netlist, 50 gates, with each signal lit green when it is 1
  *at the tick you are looking at*;
- **the seal** — the day's hash chain, and a shareable one-line result.

---

## Honesty

The brain is **built and tested but not taped out.** The numbers on the page are
simulated. This is a small, complete, checkable thing — not a product with a roadmap.

It reuses one real artefact: the fruit-fly decision layer `FFW-NAND/1`, a 50-gate
netlist with 12 inputs and 3 outputs, depth 9. Everything else — the world, the
senses, the day — is written here.

---

## Commands

| | |
|---|---|
| `npm run dev` | the page, locally |
| `npm test` | the engine's promises (`tests/engine.test.ts`) |
| `npm run replay -- YYYY-MM-DD` | print one fly's day |
| `npm run replay -- YYYY-MM-DD --check` | and prove it replays identical |
| `npm run typecheck` | |
| `npm run build` | |

MIT.
