"use client";

/* Verify a record. Paste a fly's day — the JSON from /api/v1/fly or any transcript
   of ticks — and this page recomputes the chain with the same canonical-JSON rule
   the engine uses, in your browser, and tells you exactly where it first diverges.
   Nothing is uploaded: the hash runs here. */

import { useState } from "react";
import FlyNav from "@/app/components/fly/FlyNav";
import FlyFooter from "@/app/components/fly/FlyFooter";
import { stableStringify, recordHash, chainHash, GENESIS } from "@/sim/hash";

type AnyRecord = Record<string, unknown>;

interface Result {
  records: number;
  final: string;
  expected: string | null;
  ok: boolean;
  firstBad: number | null;
  providedChain: boolean;
}

function check(text: string, expectedText: string): Result | { error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return { error: `not JSON: ${(e as Error).message}` };
  }

  const obj = parsed as AnyRecord;
  const records: AnyRecord[] = Array.isArray(parsed)
    ? (parsed as AnyRecord[])
    : ((obj.trace as AnyRecord[]) ?? (obj.ticks as AnyRecord[]) ?? null)!;
  if (!records || !Array.isArray(records)) {
    return { error: "expected an array of ticks, or an object with `trace`/`ticks`" };
  }

  const chain: string[] | null = Array.isArray(obj.chain) ? (obj.chain as string[]) : null;
  const expected = expectedText.trim() || (typeof obj.hash === "string" ? (obj.hash as string) : null);

  let prev = GENESIS;
  let firstBad: number | null = null;
  records.forEach((r, i) => {
    const h = recordHash(r);
    const c = chainHash(prev, h);
    if (chain && firstBad === null && chain[i] !== c) firstBad = i;
    prev = c;
  });

  return {
    records: records.length,
    final: prev,
    expected,
    ok: expected === null ? firstBad === null : prev === expected && firstBad === null,
    firstBad,
    providedChain: !!chain
  };
}

const SAMPLE = `{"date":"2026-10-16","name":"mossy-wren","hash":"<paste the hash here>","trace":[ ... ]}`;

export default function VerifyPage() {
  const [text, setText] = useState("");
  const [expected, setExpected] = useState("");
  const [res, setRes] = useState<Result | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function run() {
    setRes(null);
    setErr(null);
    const r = check(text, expected);
    if ("error" in r) setErr(r.error);
    else setRes(r);
  }

  return (
    <main>
      <FlyNav />
      <h1>Verify</h1>
      <p className="lede">
        A fly&rsquo;s day is a hash chain: every tick is hashed on its own, then folded
        into the one before it. Paste a record and this page recomputes that chain
        here, in your browser, with the same canonical-JSON rule the engine uses.
        Nothing is sent anywhere.
      </p>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="row between">
          <h2>The record</h2>
          <span className="mono small dim">a fly JSON, or a bare array of ticks</span>
        </div>
        <textarea
          className="paste"
          spellCheck={false}
          rows={12}
          placeholder={SAMPLE}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="labrow" style={{ gridTemplateColumns: "1fr auto", marginTop: 14 }}>
          <input
            className="paste one"
            spellCheck={false}
            placeholder="expected final hash (optional — taken from the record's `hash` if omitted)"
            value={expected}
            onChange={(e) => setExpected(e.target.value)}
          />
          <button onClick={run} disabled={!text.trim()}>check</button>
        </div>
      </div>

      {err && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="behavior" style={{ color: "var(--danger)", fontSize: 20 }}>can&rsquo;t read it</div>
          <div className="verdict-line">{err}</div>
        </div>
      )}

      {res && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="behavior" style={{ color: res.ok ? "var(--acid)" : "var(--danger)", fontSize: 26 }}>
            {res.ok ? "✓ sealed" : "✗ does not match"}
          </div>
          <div className="verdict-line">{res.records} ticks recomputed in this browser</div>
          {res.firstBad !== null && (
            <div className="verdict-line" style={{ color: "var(--danger)" }}>
              first divergence at tick {res.firstBad} — every tick from there on is suspect
            </div>
          )}
          {res.expected === null && (
            <div className="verdict-line dim">no expected hash was given, so this only re-derives the record</div>
          )}
          <div className="hash" style={{ marginTop: 12 }}>
            <span className="dim mono small">recomputed: </span>{res.final}
          </div>
          {res.expected && (
            <div className="hash" style={{ marginTop: 6 }}>
              <span className="dim mono small">expected:&nbsp;&nbsp; </span>{res.expected}
            </div>
          )}
        </div>
      )}

      <div className="card" style={{ marginTop: 24 }}>
        <h2>What you are checking</h2>
        <div className="verdict-line" style={{ lineHeight: 1.8 }}>
          The rule is the one in <b>sim/hash.ts</b>: <code>canonical(tick)</code> → SHA-256,
          then <code>SHA-256({"{"} p: previous, r: this {"}"})</code>. Keys are sorted before
          hashing, so reordering JSON fields cannot change a hash. Pull a record from{" "}
          <code>/api/v1/fly/&#123;date&#125;/&#123;name&#125;</code> and paste it above.
          You can also read the canonical form directly: <code>stableStringify(tick)</code> is{" "}
          <span className="mono small">{stableStringify({ b: 1, a: 2 })}</span>.
        </div>
      </div>

      <FlyFooter />
    </main>
  );
}
