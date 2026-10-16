/* ── tests/record.test.ts ────────────────────────────────────────────────────
   The agent protocol has to be checkable with no trust at all, so every branch
   of checkRecord() gets exercised here: an honest record passes, and each way of
   lying about one is caught. */

import { test } from "node:test";
import assert from "node:assert/strict";
import { AGENT_VERSION, claimOf, sealOf, checkRecord, type AgentRecord } from "../sim/record";

const DATE = "2026-10-15";

function honest(): AgentRecord {
  const r: AgentRecord = { v: AGENT_VERSION, agent: "tester", date: DATE, claim: claimOf(DATE) };
  r.seal = sealOf(r);
  return r;
}

test("an honest record verifies", () => {
  const c = checkRecord(honest());
  assert.equal(c.ok, true, c.errors.join("; "));
  assert.equal(c.sealOk, true);
  assert.equal(c.claimOk, true);
});

test("the claim is the truth of the day", () => {
  const truth = claimOf(DATE);
  const r = honest();
  assert.equal(r.claim.champion, truth.champion);
  assert.equal(r.claim.lived, truth.lived);
  assert.equal(r.claim.hash, truth.hash);
});

test("a wrong claim is caught even if the seal is recomputed", () => {
  const r = honest();
  r.claim.lived = 999;
  r.seal = sealOf(r); // a liar who seals the lie
  const c = checkRecord(r);
  assert.equal(c.ok, false);
  assert.equal(c.claimOk, false);
  assert.equal(c.sealOk, true); // the seal is still internally consistent
  assert.match(c.errors.join(" "), /claim\.lived/);
});

test("editing a sealed record breaks the seal", () => {
  const r = honest();
  r.note = "added after sealing";
  const c = checkRecord(r);
  assert.equal(c.sealOk, false);
  assert.match(c.errors.join(" "), /seal does not match/);
});

test("field order does not matter, but a changed byte does", () => {
  const r = honest();
  const reordered = JSON.parse(JSON.stringify({ ...r })) as AgentRecord;
  assert.equal(sealOf(reordered), r.seal);
  const changed = { ...reordered, agent: "someone-else" };
  assert.notEqual(sealOf(changed), r.seal);
});

test("the wrong version and a bad date are rejected", () => {
  assert.equal(checkRecord({ v: "NOPE", agent: "a", date: DATE }).ok, false);
  assert.equal(checkRecord({ v: AGENT_VERSION, agent: "a", date: "yesterday" }).ok, false);
});

test("a different day's claim does not verify", () => {
  const today = claimOf("2026-10-16");
  const r: AgentRecord = { v: AGENT_VERSION, agent: "x", date: DATE, claim: today };
  r.seal = sealOf(r);
  const c = checkRecord(r);
  assert.equal(c.ok, false);
  assert.equal(c.claimOk, false);
});
