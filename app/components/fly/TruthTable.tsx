"use client";

/* The whole brain, exhaustively: all 4096 possible 12-bit input words, grouped by
   which of the eight rules decides them. The netlist in the file is checked
   against these rules on every one of these words — this panel is that check,
   made browsable. */

import { useMemo, useState } from "react";
import { RULES, decideWord, type RuleId } from "@/sim/rules";
import { decodeOutputs, BEHAVIORS } from "@/sim/encode";

const LEVEL_NAMES = ["0", "1", "2", "3"];
const PREV = ["approach", "avoid", "explore", "freeze"];

function senses(word: number) {
  return {
    food: word & 3,
    threat: (word >> 2) & 3,
    light: (word >> 4) & 3,
    novelty: (word >> 6) & 3,
    hunger: (word >> 8) & 3,
    prev: (word >> 10) & 3
  };
}

const LIMIT = 64;

export default function TruthTable() {
  const { groups, counts } = useMemo(() => {
    const g = new Map<RuleId, number[]>();
    for (const r of RULES) g.set(r.id, []);
    for (let w = 0; w < 4096; w++) g.get(decideWord(w).rule)!.push(w);
    const c = new Map<RuleId, number>();
    for (const [id, ws] of g) c.set(id, ws.length);
    return { groups: g, counts: c };
  }, []);

  const [rule, setRule] = useState<RuleId>("escape");
  const words = groups.get(rule) ?? [];
  const shown = words.slice(0, LIMIT);
  const meta = RULES.find((r) => r.id === rule)!;

  return (
    <div className="truth">
      <div className="ruletabs">
        {RULES.map((r) => (
          <button
            key={r.id}
            className={`chip${rule === r.id ? " on" : ""}`}
            onClick={() => setRule(r.id)}
          >
            {r.id} <span className="dim">{counts.get(r.id)}</span>
          </button>
        ))}
      </div>

      <p className="verdict-line" style={{ marginTop: 14 }}>
        <b>{meta.id}</b> — {meta.text}
      </p>

      <div className="scroll">
        <table className="tt">
          <thead>
            <tr>
              <th>word</th><th>food</th><th>threat</th><th>light</th><th>novelty</th>
              <th>hunger</th><th>prev</th><th>→ behaviour</th><th>gf</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((w) => {
              const s = senses(w);
              const { behavior, gf } = decodeOutputs(decideWord(w).out);
              return (
                <tr key={w}>
                  <td className="mono dim">{w}</td>
                  <td className="mono">{LEVEL_NAMES[s.food]}</td>
                  <td className="mono">{LEVEL_NAMES[s.threat]}</td>
                  <td className="mono">{LEVEL_NAMES[s.light]}</td>
                  <td className="mono">{LEVEL_NAMES[s.novelty]}</td>
                  <td className="mono">{LEVEL_NAMES[s.hunger]}</td>
                  <td className="mono dim">{PREV[s.prev]}</td>
                  <td className="mono">{behavior}</td>
                  <td className="mono" style={{ color: gf ? "var(--danger)" : "var(--muted)" }}>{gf ? "◆" : ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="verdict-line">
        showing {shown.length} of {words.length} words · {BEHAVIORS.length} behaviours · every word of the 4096 is decided
      </div>
    </div>
  );
}
