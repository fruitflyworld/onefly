/* ── tests/colony.test.ts ────────────────────────────────────────────────────
   The promises of a day's clutch: the eight flies share one dish, they are
   deterministic, their names are stable and distinct, and a genome never
   escapes its bounds however long a lineage runs.
   --------------------------------------------------------------------------- */
import { test } from "node:test";
import assert from "node:assert/strict";

import { colony, COLONY_SIZE } from "../sim/colony";
import { FOUNDER, GENOME_BOUNDS, GENOME_FIELDS, mutate, genomeId, sameGenome, type Genome } from "../sim/genome";
import { nameFor, namesFor, indexOfName } from "../sim/names";
import { stream } from "../sim/rand";
import { daySeed } from "../sim/engine";

const SEED = daySeed(new Date(Date.UTC(2026, 9, 16)));

test("a clutch is exactly eight named flies", () => {
  const c = colony(SEED, "2026-10-16");
  assert.equal(c.members.length, COLONY_SIZE);
  const names = c.members.map((m) => m.name);
  assert.equal(new Set(names).size, COLONY_SIZE, "names must be distinct within a day");
  assert.deepEqual(names, namesFor(SEED, COLONY_SIZE));
});

test("every fly of a day shares the same dish", () => {
  const c = colony(SEED, "2026-10-16");
  for (const m of c.members) {
    assert.deepEqual(m.day.world.food, c.world.food);
    assert.deepEqual(m.day.world.danger, c.world.danger);
  }
});

test("no fly wakes up on food or danger", () => {
  const clamp = (v: number, hi: number) => Math.max(0, Math.min(hi - 1, v));
  for (let k = 0; k < 12; k++) {
    const c = colony(2026 * 10000 + 900 + k);
    for (const m of c.members) {
      // where the fly is born — the dish centre shifted by its genome, not its first move
      const wake = {
        x: clamp(c.world.start.x + m.genome.startX, c.world.w),
        y: clamp(c.world.start.y + m.genome.startY, c.world.h)
      };
      assert.ok(!c.world.food.some((f) => f.x === wake.x && f.y === wake.y), `${m.name} woke on food`);
      assert.ok(!c.world.danger.some((d) => d.x === wake.x && d.y === wake.y), `${m.name} woke on danger`);
    }
  }
});

test("a day replays identically, and the ranking is stable", () => {
  const a = colony(SEED, "2026-10-16");
  const b = colony(SEED, "2026-10-16");
  assert.deepEqual(a.ranking, b.ranking);
  assert.equal(a.champion, b.champion);
  for (let i = 0; i < COLONY_SIZE; i++) assert.equal(a.members[i].day.hash, b.members[i].day.hash);
});

test("the ranking is ordered by life, then meals", () => {
  const c = colony(SEED, "2026-10-16");
  for (let i = 1; i < c.ranking.length; i++) {
    const prev = c.members[c.ranking[i - 1]];
    const here = c.members[c.ranking[i]];
    assert.ok(
      prev.lived > here.lived || (prev.lived === here.lived && prev.meals >= here.meals),
      `${prev.name} (${prev.lived}/${prev.meals}) should not rank below ${here.name} (${here.lived}/${here.meals})`
    );
  }
  assert.equal(c.ranking[0], c.champion);
});

test("the champion is a survivor on most days", () => {
  let survived = 0;
  const days = 24;
  for (let k = 0; k < days; k++) {
    const c = colony(2026 * 10000 + 1000 + k);
    if (c.members[c.champion].alive) survived++;
  }
  assert.ok(survived / days > 0.4, `best-of-eight should usually live; got ${survived}/${days}`);
});

test("a genome stays inside its bounds, however long you mutate it", () => {
  let g: Genome = { ...FOUNDER };
  for (let i = 0; i < 5000; i++) {
    g = mutate(g, stream(i, 0x77));
    for (const f of GENOME_FIELDS) {
      const b = GENOME_BOUNDS[f];
      assert.ok(g[f] >= b.lo && g[f] <= b.hi, `${f}=${g[f]} outside [${b.lo},${b.hi}] at ${i}`);
      assert.equal(g[f], Math.round(g[f]), `${f} must stay an integer`);
    }
  }
});

test("mutation is a nudge, not a re-roll", () => {
  const g = mutate(FOUNDER, stream(1, 0x99));
  let changed = 0;
  for (const f of GENOME_FIELDS) {
    const b = GENOME_BOUNDS[f];
    assert.ok(Math.abs(g[f] - FOUNDER[f]) <= b.step, `${f} moved more than ${b.step}`);
    if (g[f] !== FOUNDER[f]) changed++;
  }
  assert.ok(changed > 0, "a mutation should change something");
  assert.ok(!sameGenome(g, FOUNDER));
});

test("a genome id is stable and content-addressed", () => {
  assert.equal(genomeId(FOUNDER), genomeId({ ...FOUNDER }));
  assert.notEqual(genomeId(FOUNDER), genomeId(mutate(FOUNDER, stream(3, 1))));
});

test("names round-trip through their index", () => {
  for (let i = 0; i < COLONY_SIZE; i++) {
    assert.equal(indexOfName(SEED, nameFor(SEED, i), COLONY_SIZE), i);
  }
  assert.equal(indexOfName(SEED, "not-a-fly", COLONY_SIZE), -1);
});
