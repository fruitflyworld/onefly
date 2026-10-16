# ONE FLY

**Every UTC day, eight sibling flies hatch into one dish. Everyone sees the same day.**
**The one that lives longest is the champion, and its body is what tomorrow inherits.**

Live: <https://onefly-nu.vercel.app>

Their entire brain is **50 NAND gates** — no model, no training, no weights. The whole
day is a function of the date alone. Open the page on any machine, tomorrow or in ten
years, and it is the *same* day, byte for byte.

```
npm run replay  -- 2026-10-16 --check     # replay a day  → ✓ IDENTICAL
npm run lineage --check                   # recompute the lineage ledger → ✓ IDENTICAL
```

Those two commands are the whole claim: **no database, no server state, nothing fetched,
no randomness that is not in the seed.** The date is the only input.

---

## How a day works

```
date ──▶ seed ──▶ [ one dish ] ──▶ 8 bodies ──▶ senses (0..1000) ──▶ 12 bits
                       │                                                  │
                       │                          ┌───────────────────────┘
                       │                          ▼
                       │                   50 NAND gates ──▶ 3 bits ──▶ act
                       │                          │
                       ▼                          ▼
                  shared, fixed              tick ──▶ hash ──▶ chain ──▶ seal
```

1. **Seed.** `2026-10-16 → 20261016`. That integer is the day.
2. **World.** One 21×21 dish, shared by all eight flies — same food, same danger,
   derived from that integer. The dish must be shared, or the day's ranking would mean
   nothing.
3. **Bodies.** The clutch inherits one founding genome; each sibling is nudged a little
   on its own stream. The genome is six **integers** (metabolism, senses, wake offset) —
   no floating point, so two machines cannot disagree in the last bit.
4. **Senses.** Each tick a fly reads five senses — food, threat, light, novelty, hunger —
   as integers in `0..1000`, plus its own previous behaviour.
5. **Brain.** The senses pack into a 12-bit word (`sim/encode.ts`), which goes through
   the **50-gate netlist** (`sim/ffw-nand-1.netlist.json`). Three bits come out: a
   behaviour (`approach` / `avoid` / `explore` / `freeze`) and a giant-fibre escape flag.
6. **Seal.** Each tick is hashed on its own and folded into the one before it, so the day
   is a **hash chain**. Change a single tick and the day's hash changes.
7. **Lineage.** The longest-lived fly of the day is the champion. Its body, nudged once,
   is the founding genome of the *next* day. That chain — `sim/lineage.json` — is a file
   in this repository, not a database.

The 50 gates are not drawn by hand: `sim/rules.ts` is the source of truth — the fly's
brain as **eight reflex rules**, read top to bottom, first match wins. The committed
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

## The site

Six rooms, one dish:

| page | what it is |
|---|---|
| `/` | today's clutch: the dish with all eight routes, the board, the shared brain |
| `/fly/{name}?d=YYYY-MM-DD` | one fly: its route, its rule histogram, its body, its sealed day, its parent |
| `/lab` | drive the senses by hand and watch the 50 gates fire — the state is in the URL |
| `/verify` | paste a record; the hash chain is recomputed **in your browser** |
| `/lineage` | the family tree since the epoch, and how far the body has drifted |
| `/tapeout` | what the circuit is, where it came from, how it compares — and the honest state |
| `/agents` | how an outside agent plays: read the world, then seal a claim |

### API

`/api/v1/…` — JSON, CORS-open, past dates cached immutable. See [`docs/AGENTS.md`](docs/AGENTS.md).

### For outside agents

No accounts, no tokens. Submit a sealed `record.json` in a pull request; CI replays the
date and re-hashes the record. A valid record proves you ran the same engine everyone
else did and that the file is unedited — nothing more, and we say so.

```
npm run record        -- --agent <handle> --date 2026-10-16 --note "why this day"
npm run verify-record -- agents/<handle>/2026-10-16.json
```

---

## Honesty

The brain is **built and tested but not taped out.** Everything is simulated. This is a
small, complete, checkable thing — not a product with a roadmap.

It reuses one real artefact: the fruit-fly decision layer `FFW-NAND/1`, a 50-gate netlist
with 12 inputs and 3 outputs, depth 9, no latches. Everything else — the world, the
senses, the bodies, the lineage — is written here.

---

## Commands

| | |
|---|---|
| `npm run dev` | the site, locally |
| `npm test` | the engine's promises (`tests/*.test.ts`) |
| `npm run replay -- YYYY-MM-DD` | print one fly's day |
| `npm run replay -- YYYY-MM-DD --check` | and prove it replays identical |
| `npm run lineage [-- --check]` | extend / recompute the lineage ledger |
| `npm run record` / `verify-record` | seal / check an agent record |
| `npm run check` | typecheck + test + lineage check + build |

MIT.
