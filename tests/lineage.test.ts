/* ── tests/lineage.test.ts ───────────────────────────────────────────────────
   The ledger is a claim: "these 289 days follow from one founder and a
   calendar." These tests make the claim checkable without paying for all 289
   days on every run — they check the shape, the chain rule link by link, and
   then recompute a real window end to end.
   --------------------------------------------------------------------------- */
import { test } from "node:test";
import assert from "node:assert/strict";

import { LEDGER, EPOCH, addDays, daysBetween, nextFounding, runDay, seedFromDate, foundingOn, ledgerDay, ledgerThrough } from "../sim/lineage";
import { FOUNDER } from "../sim/genome";
import { colony } from "../sim/colony";

test("the ledger is shaped like a calendar", () => {
  assert.ok(LEDGER.days.length > 200, `expected a long ledger, got ${LEDGER.days.length}`);
  assert.equal(LEDGER.epoch, EPOCH);
  assert.deepEqual(LEDGER.days[0].founding, FOUNDER, "day one starts from the founder");
  for (let i = 0; i < LEDGER.days.length; i++) {
    assert.equal(LEDGER.days[i].d, addDays(EPOCH, i), `row ${i} must be the ${i}th day after the epoch`);
  }
});

test("every row's date seeds its own day", () => {
  for (const d of [LEDGER.days[0], LEDGER.days[10], LEDGER.days[LEDGER.days.length - 1]]) {
    assert.equal(seedFromDate(d.d), Number(d.d.replace(/-/g, "")));
  }
});

test("the chain rule holds link by link: each day descends from the one before", () => {
  for (let i = 1; i < LEDGER.days.length; i++) {
    assert.deepEqual(LEDGER.days[i].founding, nextFounding(LEDGER.days[i - 1]), `break between ${LEDGER.days[i - 1].d} and ${LEDGER.days[i].d}`);
  }
});

test("every row is what that day actually produced", () => {
  for (const i of [0, 7, LEDGER.days.length - 1]) {
    const row = LEDGER.days[i];
    const day = runDay(row.d, row.founding);
    assert.deepEqual(day, row, `row ${i} (${row.d}) does not match a fresh run`);
  }
});

test("a window recomputes from its founding genome", () => {
  const through = ledgerThrough();
  const from = addDays(through, -13);
  let founding = foundingOn(from);
  for (const date of daysBetween(from, through)) {
    const row = LEDGER.days.find((d) => d.d === date)!;
    const day = runDay(date, founding);
    assert.deepEqual(day, row, `${date} diverged`);
    founding = nextFounding(day);
  }
});

test("lookups reach exactly as far as the ledger does", () => {
  assert.equal(ledgerDay(ledgerThrough())?.d, ledgerThrough());
  assert.equal(ledgerDay(addDays(ledgerThrough(), 1)), null);
  assert.deepEqual(foundingOn(addDays(ledgerThrough(), 1)), FOUNDER, "an unseen day falls back to the founder");
});

test("the champion of a ledger day is the champion of its colony", () => {
  const row = LEDGER.days[LEDGER.days.length - 1];
  const c = colony(seedFromDate(row.d), row.d, row.founding);
  assert.equal(c.members[c.champion].name, row.name);
  assert.equal(c.members[c.champion].lived, row.lived);
  assert.equal(c.members[c.champion].day.hash, row.hash);
});
