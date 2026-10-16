"use client";

/* The brain, drawn from the netlist itself — not from a hand-made picture.
   Every node is a signal; every curve is a wire; a signal is green when it is 1
   for the word currently on the input rail. Click any gate to see what it read. */

import { useMemo, useState } from "react";
import { BRAIN, evalTrace, evalWord, gateDepth, type Netlist } from "@/sim/netlist";
import { decodeOutputs } from "@/sim/encode";

const IN_NAMES = ["F0", "F1", "T0", "T1", "L0", "L1", "N0", "N1", "H0", "H1", "P0", "P1"];
const IN_GROUPS: [string, number, number][] = [
  ["food", 0, 2],
  ["threat", 2, 2],
  ["light", 4, 2],
  ["novelty", 6, 2],
  ["hunger", 8, 2],
  ["previous behaviour", 10, 2]
];
const OUT_NAMES = ["B0", "B1", "GF"];

function layout(n: Netlist) {
  const base = 2 + n.nIn;
  const { cols, depth } = gateDepth(n);
  const colW = 76;
  const x0 = 156;
  const rowH = 24;
  const maxCol = Math.max(...cols.map((c) => c.length));
  const height = Math.max(maxCol * rowH, (n.nIn + 2) * 21) + 44;
  const pad = 22;

  const pos: { x: number; y: number }[] = [];
  for (let s = 0; s <= 1 + n.nIn; s++) {
    pos[s] = { x: 52, y: pad + ((height - pad * 2) * (s + 0.5)) / (n.nIn + 2) };
  }
  cols.forEach((col, d) => {
    const top = (height - col.length * rowH) / 2;
    col.forEach((sig, r) => {
      pos[sig] = { x: x0 + d * colW, y: top + rowH * (r + 0.5) };
    });
  });

  const outSigs = Array.from({ length: n.nOut }, (_, k) => base + n.gates.length - n.nOut + k);
  const width = x0 + cols.length * colW + 84;
  return { pos, width, height, outSigs, base, outX: width - 46, depth, maxD: cols.length - 1 };
}

export default function BrainPanel({ word, compact }: { word: number; compact?: boolean }) {
  const L = useMemo(() => layout(BRAIN), []);
  const sig = useMemo(() => evalTrace(BRAIN, word), [word]);
  const [sel, setSel] = useState<number | null>(null);
  const c = (s: number) => (sig[s] ? "var(--acid)" : "#2b333f");

  const outWord = evalWord(BRAIN, word);
  const { behavior, gf } = decodeOutputs(outWord);

  const selGate = sel === null ? null : BRAIN.gates[sel];

  return (
    <div className={`brain${compact ? " compact" : ""}`}>
      <svg viewBox={`0 0 ${L.width} ${L.height}`} role="img" aria-label="the 50-gate brain">
        {/* the input rail and its sense groups */}
        {IN_GROUPS.map(([label, start, len]) => {
          const a = L.pos[2 + start];
          const b = L.pos[2 + start + len - 1];
          return (
            <g key={label}>
              <line x1={30} y1={a.y - 8} x2={30} y2={b.y + 8} stroke="#232a35" strokeWidth={1} />
              <text x={24} y={(a.y + b.y) / 2 + 4} textAnchor="end" fontSize={9} fill="var(--muted)" fontFamily="var(--mono)">
                {start === 10 ? "PREV" : label.slice(0, 4).toUpperCase()}
              </text>
            </g>
          );
        })}
        <text x={44} y={L.pos[0].y + 4} textAnchor="end" fontSize={10} fill="var(--muted)">0</text>
        <circle cx={L.pos[0].x} cy={L.pos[0].y} r={4} fill={c(0)} />
        <text x={44} y={L.pos[1].y + 4} textAnchor="end" fontSize={10} fill="var(--muted)">1</text>
        <circle cx={L.pos[1].x} cy={L.pos[1].y} r={4} fill={c(1)} />

        {Array.from({ length: BRAIN.nIn }, (_, i) => {
          const s = 2 + i;
          const p = L.pos[s];
          return (
            <g key={`in${i}`}>
              <text x={p.x - 12} y={p.y + 4} textAnchor="end" fontSize={10} fill="var(--muted)" fontFamily="var(--mono)">{IN_NAMES[i]}</text>
              <circle cx={p.x} cy={p.y} r={4} fill={c(s)} />
            </g>
          );
        })}

        {/* wires */}
        {BRAIN.gates.map(([a, b], i) => {
          const g = L.pos[L.base + i];
          const hot = sel === i;
          return (
            <g key={`w${i}`} strokeWidth={hot ? 2.4 : 1.4} fill="none" opacity={sel === null || hot ? 0.9 : 0.3}>
              <path d={`M${L.pos[a].x} ${L.pos[a].y} C ${L.pos[a].x + 26} ${L.pos[a].y} ${g.x - 26} ${g.y} ${g.x - 7} ${g.y}`} stroke={c(a)} />
              <path d={`M${L.pos[b].x} ${L.pos[b].y} C ${L.pos[b].x + 26} ${L.pos[b].y} ${g.x - 26} ${g.y} ${g.x - 7} ${g.y}`} stroke={c(b)} />
            </g>
          );
        })}

        {/* gates */}
        {BRAIN.gates.map((_, i) => {
          const s = L.base + i;
          const p = L.pos[s];
          const isOut = L.outSigs.includes(s);
          return (
            <g key={`g${i}`} onClick={() => setSel(sel === i ? null : i)} style={{ cursor: "pointer" }}>
              {sel === i && <circle cx={p.x} cy={p.y} r={12} fill="none" stroke="var(--ink)" strokeWidth={1} opacity={0.6} />}
              <circle cx={p.x} cy={p.y} r={isOut ? 8 : 7} fill={c(s)} stroke="var(--bg)" strokeWidth={1.5} />
              <circle cx={p.x + (isOut ? 12 : 10)} cy={p.y} r={2.4} fill={c(s)} />
            </g>
          );
        })}

        {/* the output rail */}
        {L.outSigs.map((s, k) => {
          const p = L.pos[s];
          return (
            <g key={`o${k}`}>
              <line x1={p.x + 12} y1={p.y} x2={L.outX - 8} y2={p.y} stroke={c(s)} strokeWidth={1.6} />
              <text x={L.outX} y={p.y + 4} fontSize={11} fill={sig[s] ? "var(--acid)" : "var(--muted)"} fontFamily="var(--mono)">{OUT_NAMES[k]}</text>
            </g>
          );
        })}
      </svg>

      <div className="braindetail">
        {selGate === null ? (
          <>
            <span className="mono">{BRAIN.gates.length} gates · depth {L.maxD} · 0 latches</span>
            <span className="mono">{IN_NAMES.join(" ")} → {OUT_NAMES.join(" ")}</span>
            <span className="mono">→ {behavior}{gf ? " + giant fibre" : ""}</span>
            <span className="hint">click a gate to read it</span>
          </>
        ) : (
          <>
            <span className="mono">gate {sel} · depth {L.depth[L.base + sel!]}</span>
            <span className="mono">
              NAND(sig {selGate[0]}={sig[selGate[0]]}, sig {selGate[1]}={sig[selGate[1]]}) = <b style={{ color: c(L.base + sel!) }}>{sig[L.base + sel!]}</b>
            </span>
            <span className="hint">click it again to release</span>
          </>
        )}
      </div>
    </div>
  );
}
