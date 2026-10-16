"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Day } from "@/sim/engine";
import { BRAIN, evalTrace, gateDepth, type Netlist } from "@/sim/netlist";
import type { Behavior } from "@/sim/encode";
import { RULES } from "@/sim/rules";

const COLOR: Record<Behavior, string> = {
  approach: "var(--acid)",
  avoid: "var(--danger)",
  explore: "var(--amber)",
  freeze: "var(--muted)"
};

const RULE_TEXT = Object.fromEntries(RULES.map((r) => [r.id, r.text]));

/* ── the world, drawn once, with the route so far ──────────────────────────── */
function World({ day, upto }: { day: Day; upto: number }) {
  const C = 20;
  const { w, h, food, danger } = day.world;
  const ticks = day.ticks;
  const px = (x: number) => x * C + C / 2;
  const py = (y: number) => y * C + C / 2;
  const pts = (n: number) => ticks.slice(0, n).map((t) => `${px(t.x)},${py(t.y)}`).join(" ");
  const now = ticks[Math.min(upto, ticks.length - 1)];

  return (
    <svg className="world" viewBox={`0 0 ${w * C} ${h * C}`} role="img" aria-label="the fly's world">
      {Array.from({ length: w + 1 }, (_, i) => (
        <line key={`v${i}`} x1={i * C} y1={0} x2={i * C} y2={h * C} stroke="#191f27" strokeWidth={1} />
      ))}
      {Array.from({ length: h + 1 }, (_, i) => (
        <line key={`h${i}`} x1={0} y1={i * C} x2={w * C} y2={i * C} stroke="#191f27" strokeWidth={1} />
      ))}

      {/* light field: brighter band at the top */}
      <defs>
        <linearGradient id="light" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7cf5a0" stopOpacity="0.07" />
          <stop offset="100%" stopColor="#7cf5a0" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={w * C} height={h * C} fill="url(#light)" />

      {danger.map((c, i) => (
        <g key={`d${i}`} stroke="var(--danger)" strokeWidth={2} opacity={0.8}>
          <line x1={px(c.x) - 5} y1={py(c.y) - 5} x2={px(c.x) + 5} y2={py(c.y) + 5} />
          <line x1={px(c.x) + 5} y1={py(c.y) - 5} x2={px(c.x) - 5} y2={py(c.y) + 5} />
        </g>
      ))}
      {food.map((c, i) => (
        <circle key={`f${i}`} cx={px(c.x)} cy={py(c.y)} r={4.5} fill="none" stroke="var(--amber)" strokeWidth={2} />
      ))}

      <polyline points={pts(ticks.length)} fill="none" stroke="var(--ink)" strokeWidth={1.5} opacity={0.16} />
      <polyline points={pts(upto + 1)} fill="none" stroke="var(--acid)" strokeWidth={2.5} strokeLinejoin="round" />

      <circle cx={px(day.world.start.x)} cy={py(day.world.start.y)} r={2.5} fill="var(--muted)" />

      {now && (
        <g>
          <circle cx={px(now.x)} cy={py(now.y)} r={9} fill="var(--acid)" opacity={0.18} />
          <circle cx={px(now.x)} cy={py(now.y)} r={5} fill="var(--acid)" />
        </g>
      )}
    </svg>
  );
}

/* ── the brain, drawn from the netlist itself ──────────────────────────────── */
const IN_NAMES = ["F0", "F1", "T0", "T1", "L0", "L1", "N0", "N1", "H0", "H1", "P0", "P1"];
const OUT_NAMES = ["B0", "B1", "GF"];

function layout(n: Netlist) {
  const base = 2 + n.nIn;
  const { cols } = gateDepth(n);
  const colW = 76;
  const x0 = 156; // room for the input rail and its labels
  const rowH = 24;
  const maxCol = Math.max(...cols.map((c) => c.length));
  const height = Math.max(maxCol * rowH, (n.nIn + 2) * 21) + 44;
  const pad = 22;

  const pos: { x: number; y: number }[] = [];
  // constants 0/1 and the twelve sense bits, spread evenly down the left rail
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
  return { pos, width, height, outSigs, base, outX: width - 46 };
}

function Circuit({ word }: { word: number }) {
  const L = useMemo(() => layout(BRAIN), []);
  const sig = useMemo(() => evalTrace(BRAIN, word), [word]);
  const c = (s: number) => (sig[s] ? "var(--acid)" : "#2b333f");

  return (
    <svg viewBox={`0 0 ${L.width} ${L.height}`} role="img" aria-label="the 50-gate brain">
      {/* the left rail: the two constants and the twelve sense bits */}
      {["0", "1"].map((name, k) => {
        const p = L.pos[k];
        return (
          <g key={`c${k}`}>
            <text x={p.x - 12} y={p.y + 4} textAnchor="end" fontSize={10} fill="var(--muted)">{name}</text>
            <circle cx={p.x} cy={p.y} r={4} fill={c(k)} />
          </g>
        );
      })}
      {Array.from({ length: BRAIN.nIn }, (_, i) => {
        const s = 2 + i;
        const p = L.pos[s];
        return (
          <g key={`in${i}`}>
            <text x={p.x - 12} y={p.y + 4} textAnchor="end" fontSize={10} fill="var(--muted)">{IN_NAMES[i]}</text>
            <circle cx={p.x} cy={p.y} r={4} fill={c(s)} />
          </g>
        );
      })}

      {/* wires, then gates on top */}
      {BRAIN.gates.map(([a, b], i) => {
        const g = L.pos[L.base + i];
        return (
          <g key={`w${i}`} strokeWidth={1.4} fill="none">
            <path d={`M${L.pos[a].x} ${L.pos[a].y} C ${L.pos[a].x + 26} ${L.pos[a].y} ${g.x - 26} ${g.y} ${g.x - 7} ${g.y}`} stroke={c(a)} opacity={0.85} />
            <path d={`M${L.pos[b].x} ${L.pos[b].y} C ${L.pos[b].x + 26} ${L.pos[b].y} ${g.x - 26} ${g.y} ${g.x - 7} ${g.y}`} stroke={c(b)} opacity={0.85} />
          </g>
        );
      })}
      {BRAIN.gates.map((_, i) => {
        const s = L.base + i;
        const p = L.pos[s];
        const isOut = L.outSigs.includes(s);
        return (
          <g key={`g${i}`}>
            <circle cx={p.x} cy={p.y} r={isOut ? 8 : 7} fill={c(s)} stroke="var(--bg)" strokeWidth={1.5} />
            <circle cx={p.x + (isOut ? 12 : 10)} cy={p.y} r={2.4} fill={c(s)} />
          </g>
        );
      })}

      {/* the right rail: the three outputs the fly acts on */}
      {L.outSigs.map((s, k) => {
        const p = L.pos[s];
        return (
          <g key={`o${k}`}>
            <line x1={p.x + 12} y1={p.y} x2={L.outX - 8} y2={p.y} stroke={c(s)} strokeWidth={1.6} />
            <text x={L.outX} y={p.y + 4} fontSize={11} fill={sig[s] ? "var(--acid)" : "var(--muted)"}>{OUT_NAMES[k]}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── the page ──────────────────────────────────────────────────────────────── */
export default function Fly({ day }: { day: Day }) {
  const ticks = day.ticks;
  const [i, setI] = useState(ticks.length - 1);
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setI((v) => (v + 1 >= ticks.length ? (setPlaying(false), v) : v + 1));
    }, 180);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [playing, ticks.length]);

  const t = ticks[i];
  const meals = ticks.filter((x) => x.ate).length;
  const gf = ticks.filter((x) => x.gf).length;

  const share = `ONE FLY — ${day.date}: lived ${ticks.length}/${day.tune.ticks} ticks, ate ${meals}. ${day.hash.slice(0, 12)}…`;

  const copy = async () => {
    try { await navigator.clipboard.writeText(share); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch {}
  };

  const bars: [string, number, string][] = [
    ["food", t.food, "var(--amber)"],
    ["threat", t.threat, "var(--danger)"],
    ["light", t.light, "var(--ink)"],
    ["novelty", t.novelty, "var(--acid)"],
    ["hunger", t.hunger, t.hunger >= 650 ? "var(--danger)" : "var(--muted)"]
  ];

  return (
    <>
      <div className="top">
        <div className="brand">One Fly</div>
        <div className="date">{day.date} · UTC · seed {day.seed}</div>
      </div>

      <h1>今天的果蝇，全世界同一只。</h1>
      <p className="lede">
        Every day there is <strong>one fly</strong>. Its entire brain is <strong>50 NAND gates</strong> — no model, no
        training. Its whole day is a function of the date alone: the same seed on any machine, tomorrow or in ten
        years, replays the same life, byte for byte.
      </p>

      <div className="stage">
        <div className="card">
          <World day={day} upto={i} />
          <div className="controls">
            <button onClick={() => { setI(0); setPlaying(true); }}>▶ replay</button>
            <button className="ghost" onClick={() => setPlaying((p) => !p)}>{playing ? "pause" : "play"}</button>
            <input type="range" min={0} max={ticks.length - 1} value={i} onChange={(e) => { setPlaying(false); setI(+e.target.value); }} />
            <span className="verdict-line" style={{ minWidth: 64, textAlign: "right" }}>{i}/{ticks.length - 1}</span>
          </div>
        </div>

        <div className="card readout">
          <h2>Tick {t.t}</h2>
          <div className="behavior" style={{ color: COLOR[t.behavior] }}>
            {t.behavior}
            <small>rule ￫ {t.rule}</small>
          </div>
          <div className="verdict-line" style={{ marginBottom: 14 }}>{RULE_TEXT[t.rule]}</div>

          {t.gf && <div className="verdict-line" style={{ color: "var(--danger)" }}>◆ Giant Fibre fired</div>}
          {t.ate && <div className="verdict-line" style={{ color: "var(--amber)" }}>◆ ate, hunger −{day.tune.hFood}</div>}

          <div style={{ marginTop: 16 }}>
            {bars.map(([name, v, col]) => (
              <div className="bar" key={name}>
                <span>{name}</span>
                <span className="track"><span className="fill" style={{ width: `${(v / 1000) * 100}%`, background: col }} /></span>
                <span className="v">{v}</span>
              </div>
            ))}
          </div>

          <div className="bitrow">
            in  0b{t.inWord.toString(2).padStart(12, "0")}<br />
            out 0b{t.outWord.toString(2).padStart(3, "0")}
          </div>
        </div>
      </div>

      <section className="circuit">
        <h2 style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted)" }}>
          The whole brain · 50 NAND gates · depth 9
        </h2>
        <Circuit word={t.inWord} />
        <div className="legend">
          <span className="dot" style={{ background: "var(--acid)" }} />signal is 1 at this tick
          <span className="dot" style={{ background: "#2b333f", marginLeft: 18 }} />signal is 0
          <br />
          left: the 12 sense bits (F food · T threat · L light · N novelty · H hunger · P previous behaviour).
          right: the 3 outputs the fly acts on (B behaviour · GF giant-fibre escape).
        </div>
      </section>

      <section className="verdict">
        <div className="card">
          <h2>Today's fly</h2>
          <div className="behavior" style={{ color: day.alive ? "var(--acid)" : "var(--danger)", fontSize: 22 }}>
            {day.alive ? "survived the day" : `died on tick ${ticks.length - 1}`}
          </div>
          <div className="verdict-line">lived <b>{ticks.length}</b> / {day.tune.ticks} ticks</div>
          <div className="verdict-line">meals eaten <b>{meals}</b></div>
          <div className="verdict-line">giant fibre fired <b>{gf}</b> times</div>
          <div className="controls" style={{ marginTop: 16 }}>
            <button onClick={copy}>{copied ? "copied ✓" : "copy result"}</button>
          </div>
        </div>

        <div className="card">
          <h2>The seal</h2>
          <p className="verdict-line" style={{ lineHeight: 1.6 }}>
            Each tick is hashed on its own and folded into the one before it, so the day is a chain: change a single
            tick and this hash changes.
          </p>
          <div className="hash">{day.hash}</div>
          <p className="verdict-line" style={{ marginTop: 12 }}>
            {day.chain.length} links · SHA-256 · genesis 00000000…
          </p>
        </div>
      </section>

      <footer>
        <p>
          Replay any day yourself — no server, no database, nothing fetched:
          <br />
          <code>npm run replay -- {day.date} --check</code>
        </p>
        <p style={{ marginTop: 12 }}>
          The brain is the fruit-fly decision layer <code>{day.version}</code>, compiled to {BRAIN.gates.length} NAND
          gates. It is built and tested but <strong>not taped out</strong> — the numbers here are simulated, and honest
          about it.
        </p>
      </footer>
    </>
  );
}
