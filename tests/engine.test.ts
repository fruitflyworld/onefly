/* ── tests/engine.test.ts ────────────────────────────────────────────────────
   The promises ONE FLY makes, checked:

     1. the committed netlist IS the seven rules, on all 4096 input words;
     2. SHA-256 here agrees with node:crypto;
     3. a day is a chain, and re-running a seed reproduces it bit for bit;
     4. the fly stays on the grid and its senses stay in range;
     5. hunger works: a meal feeds, starvation kills.
   --------------------------------------------------------------------------- */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import { BRAIN, evalWord, checkNetlist } from "../sim/netlist";
import { decideWord, RULES, RULE_PARAMS } from "../sim/rules";
import { sha256Hex, GENESIS, recordHash, chainHash } from "../sim/hash";
import { simulate, daySeed, dayString, TUNE } from "../sim/engine";
import { encodeInputs, decodeOutputs, levelInt } from "../sim/encode";

test("netlist is well-formed", () => {
  assert.doesNotThrow(() => checkNetlist(BRAIN));
  assert.equal(BRAIN.version, "FFW-NAND/1");
  assert.equal(BRAIN.nIn, 12);
  assert.equal(BRAIN.nOut, 3);
});

test("the circuit equals the seven rules on every input word", () => {
  for (let w = 0; w < 4096; w++) {
    const { out } = decideWord(w);
    assert.equal(evalWord(BRAIN, w), out, `word ${w} (${w.toString(2).padStart(12, "0")})`);
  }
});

test("the rules are the ones documented, in order", () => {
  assert.deepEqual(
    RULES.map((r) => r.id),
    ["escape", "danger", "feed", "lure", "pursue", "curious", "rest", "default"]
  );
  assert.equal(RULE_PARAMS.T_GF, 2);
});

test("sha256 agrees with node:crypto", () => {
  assert.equal(
    sha256Hex("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
  );
  assert.equal(
    sha256Hex(""),
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  );
  for (const s of ["ONE FLY", '{"a":1,"b":[2,3]}', "果蝇"]) {
    assert.equal(sha256Hex(s), createHash("sha256").update(s, "utf8").digest("hex"));
  }
});

test("the record hash does not depend on key order", () => {
  assert.equal(recordHash({ a: 1, b: 2 }), recordHash({ b: 2, a: 1 }));
  assert.notEqual(recordHash({ a: 1 }), recordHash({ a: 2 }));
});

test("a day is a chain, and the last link is the day's hash", () => {
  const day = simulate(20260101, "2026-01-01");
  assert.ok(day.ticks.length > 0);
  assert.equal(day.chain.length, day.ticks.length);
  let prev = GENESIS;
  for (let i = 0; i < day.ticks.length; i++) {
    const expect = chainHash(prev, recordHash(day.ticks[i]));
    assert.equal(day.chain[i], expect, `link ${i}`);
    prev = expect;
  }
  assert.equal(day.hash, prev);
  assert.equal(day.hash, day.chain[day.chain.length - 1]);
});

test("a day is reproducible, bit for bit", () => {
  const a = simulate(20260704, "2026-07-04");
  const b = simulate(20260704, "2026-07-04");
  assert.equal(a.hash, b.hash);
  assert.deepEqual(a.ticks, b.ticks);
  // and different days differ
  assert.notEqual(simulate(20260705, "2026-07-05").hash, a.hash);
});

test("tampering with one tick changes the day's hash", () => {
  const day = simulate(20260303, "2026-03-03");
  const forged = { ...day.ticks[0], x: day.ticks[0].x + 1 };
  const tampered = chainHash(day.chain[0] ?? GENESIS, recordHash(forged));
  assert.notEqual(tampered, day.chain[0]);
});

test("the fly stays on the grid and its senses stay in range", () => {
  for (let d = 1; d <= 40; d++) {
    const seed = 2026 * 10000 + 100 + d;
    const day = simulate(seed, String(seed));
    for (const t of day.ticks) {
      assert.ok(t.x >= 0 && t.x < day.world.w, `x ${t.x}`);
      assert.ok(t.y >= 0 && t.y < day.world.h, `y ${t.y}`);
      for (const v of [t.food, t.threat, t.light, t.novelty, t.hunger]) {
        assert.ok(v >= 0 && v <= 1000, `sense ${v} out of range`);
      }
      // the recorded word really is the senses + previous behaviour
      const decoded = decodeOutputs(t.outWord);
      assert.equal(decoded.behavior, t.behavior);
      assert.equal(decoded.gf, t.gf);
      assert.equal(t.rule, decideWord(t.inWord).rule);
      assert.equal(t.outWord, decideWord(t.inWord).out);
    }
  }
});

test("nothing is placed on the starting cell", () => {
  for (let d = 1; d <= 40; d++) {
    const day = simulate(2026 * 10000 + 200 + d);
    const s = day.world.start;
    assert.ok(!day.world.food.some((c) => c.x === s.x && c.y === s.y));
    assert.ok(!day.world.danger.some((c) => c.x === s.x && c.y === s.y));
  }
});

test("a meal feeds and starvation kills", () => {
  // a fly with no food at all dies of hunger, and only of hunger
  const barren = simulate(4242, "4242", { food: 0, danger: 0 });
  assert.equal(barren.world.food.length, 0);
  assert.equal(barren.alive, false);
  const last = barren.ticks[barren.ticks.length - 1];
  assert.ok(last.hunger >= TUNE.hMax);
  assert.equal(Math.ceil(TUNE.hMax / TUNE.hStep), barren.ticks.length);
  // a meal is worth exactly TUNE.hFood of hunger
  const fed = simulate(4242, "4242", { food: 0, danger: 0, ticks: 20 });
  const ate = simulate(12345, "12345", { food: 40, danger: 0, ticks: 20 });
  assert.ok(ate.ticks.some((t) => t.ate));
});

test("daySeed names the UTC date", () => {
  const d = new Date(Date.UTC(2026, 9, 16)); // 16 Oct 2026
  assert.equal(daySeed(d), 20261016);
  assert.equal(dayString(d), "2026-10-16");
});

test("levelInt is the integer twin of level", () => {
  // thresholds 0.1 / 0.35 / 0.65 on a 0..1000 integer
  assert.equal(levelInt(0), 0);
  assert.equal(levelInt(99), 0);
  assert.equal(levelInt(100), 1);
  assert.equal(levelInt(349), 1);
  assert.equal(levelInt(350), 2);
  assert.equal(levelInt(649), 2);
  assert.equal(levelInt(650), 3);
  assert.equal(levelInt(1000), 3);
});

test("the 12-bit word packs senses in the documented order", () => {
  const w = encodeInputs({ food: 1000, threat: 0, light: 1000, novelty: 0, hunger: 1000 }, 1);
  assert.equal(w & 3, 3); // food -> bits 0-1
  assert.equal((w >> 2) & 3, 0); // threat
  assert.equal((w >> 4) & 3, 3); // light
  assert.equal((w >> 6) & 3, 0); // novelty
  assert.equal((w >> 8) & 3, 3); // hunger
  assert.equal((w >> 10) & 3, 1); // previous behaviour
});
