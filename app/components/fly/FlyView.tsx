"use client";

/* One fly's page: its own route on the shared dish, its own day, its own body. */

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import Dish from "./Dish";
import BrainPanel from "./BrainPanel";
import FlyNav from "./FlyNav";
import FlyFooter from "./FlyFooter";
import { flyColor, BEHAVIOR_COLOR } from "./palette";
import { RULES } from "@/sim/rules";
import { GENOME_FIELDS, GENOME_BOUNDS, genomeDrift, type Genome } from "@/sim/genome";
import type { SlimColony } from "@/sim/colony";

const RULE_TEXT = Object.fromEntries(RULES.map((r) => [r.id, r.text]));
const FIELD_NOTE: Record<keyof Genome, string> = {
  hStep: "hunger gained per tick",
  hFood: "hunger removed by a meal",
  senseDecay: "smell lost per cell of distance",
  visitDecay: "novelty lost per visit",
  startX: "waking offset, x",
  startY: "waking offset, y"
};

export default function FlyView({
  colony,
  index,
  parent
}: {
  colony: SlimColony;
  index: number;
  parent: { name: string; date: string; genome: Genome } | null;
}) {
  const m = colony.members[index];
  const ticks = m.day.ticks;
  const [upto, setUpto] = useState(ticks.length - 1);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setUpto((v) => (v + 1 >= ticks.length ? (setPlaying(false), v) : v + 1));
    }, 110);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [playing, ticks.length]);

  const t = ticks[Math.min(upto, ticks.length - 1)];

  const ruleCounts = useMemo(() => {
    const c = new Map<string, number>();
    for (const x of ticks) c.set(x.rule, (c.get(x.rule) ?? 0) + 1);
    return [...c.entries()].sort((a, b) => b[1] - a[1]);
  }, [ticks]);

  const bars: [string, number, string][] = t
    ? [
        ["food", t.food, "var(--amber)"],
        ["threat", t.threat, "var(--danger)"],
        ["light", t.light, "var(--ink)"],
        ["novelty", t.novelty, "var(--acid)"],
        ["hunger", t.hunger, t.hunger >= 650 ? "var(--danger)" : "var(--muted)"]
      ]
    : [];

  const color = flyColor(index);
  const drift = genomeDrift(m.genome);

  return (
    <>
      <FlyNav date={colony.date} />

      <h1 style={{ color }}>
        {m.name}
        {index === colony.champion && <span className="tag" style={{ marginLeft: 12, verticalAlign: "middle" }}>champion of {colony.date}</span>}
      </h1>
      <p className="lede">
        One of the eight flies born on {colony.date}. It lived <strong>{m.lived}</strong> of {m.day.tune.ticks} ticks,
        ate <strong>{m.meals}</strong> {m.meals === 1 ? "meal" : "meals"}, and its giant fibre fired{" "}
        <strong>{m.gf}</strong> times. Every decision below came out of the same 50 gates as every other fly —
        only its body differs.
      </p>

      <div className="stage">
        <div className="card">
          <Dish world={colony.world} routes={[{ name: m.name, color, ticks, champion: true }]} upto={upto} focus={0} />
          <div className="controls">
            <button onClick={() => { setUpto(0); setPlaying(true); }}>▶ replay</button>
            <button className="ghost" onClick={() => setPlaying((p) => !p)}>{playing ? "pause" : "play"}</button>
            <input type="range" min={0} max={ticks.length - 1} value={upto} onChange={(e) => { setPlaying(false); setUpto(+e.target.value); }} />
            <span className="mono small dim">{upto}/{ticks.length - 1}</span>
          </div>
        </div>

        <div className="card readout">
          <h2>Tick {t?.t ?? 0}</h2>
          {upto >= ticks.length - 1 && !m.alive ? (
            <div className="behavior" style={{ color: "var(--danger)" }}>dead<small>at tick {ticks.length - 1}</small></div>
          ) : (
            <>
              <div className="behavior" style={{ color: BEHAVIOR_COLOR[t.behavior] }}>
                {t.behavior}<small>rule ￫ {t.rule}</small>
              </div>
              <div className="verdict-line" style={{ marginBottom: 12 }}>{RULE_TEXT[t.rule]}</div>
            </>
          )}
          {t?.gf && <div className="verdict-line" style={{ color: "var(--danger)" }}>◆ Giant Fibre fired</div>}
          {t?.ate && <div className="verdict-line" style={{ color: "var(--amber)" }}>◆ ate</div>}
          <div style={{ marginTop: 14 }}>
            {bars.map(([name, v, col]) => (
              <div className="bar" key={name}>
                <span>{name}</span>
                <span className="track"><span className="fill" style={{ width: `${(v / 1000) * 100}%`, background: col }} /></span>
                <span className="v">{v}</span>
              </div>
            ))}
          </div>
          <div className="bitrow mono small">in 0b{(t?.inWord ?? 0).toString(2).padStart(12, "0")} → out 0b{(t?.outWord ?? 0).toString(2).padStart(3, "0")}</div>
        </div>
      </div>

      <div className="card">
        <div className="row between">
          <h2>What its brain did all day</h2>
          <span className="mono small dim">{ticks.length} ticks</span>
        </div>
        <div className="rules">
          {ruleCounts.map(([rule, n]) => (
            <div className="rulebar" key={rule}>
              <span className="mono small">{rule}</span>
              <span className="track"><span className="fill" style={{ width: `${(n / ticks.length) * 100}%`, background: "var(--acid)" }} /></span>
              <span className="mono small dim">{n}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="row between">
          <h2>The brain, at tick {t?.t ?? 0}</h2>
          <span className="mono small dim">click a gate</span>
        </div>
        <BrainPanel word={t?.inWord ?? 0} />
      </div>

      <section className="verdict">
        <div className="card">
          <h2>Its body</h2>
          <div className="kv">
            {GENOME_FIELDS.map((f) => (
              <div className="kvrow" key={f}>
                <span className="mono">{f}</span>
                <b className="mono">{m.genome[f]}</b>
                <span className="dim small">{FIELD_NOTE[f]}</span>
              </div>
            ))}
          </div>
          <div className="verdict-line" style={{ marginTop: 12 }}>
            genome <span className="mono" style={{ color }}>{m.genomeId}</span> · drift from the founder{" "}
            <b>{drift}‰</b>
          </div>
          {parent && (
            <div className="verdict-line" style={{ marginTop: 8 }}>
              inherited from <Link href={`/fly/${parent.name}?d=${parent.date}`}>{parent.name}</Link>, champion of {parent.date}
            </div>
          )}
        </div>

        <div className="card">
          <h2>The seal</h2>
          <p className="verdict-line" style={{ lineHeight: 1.6 }}>
            {m.day.chainLength} ticks, each hashed and folded into the one before. Change one tick of this fly's day
            and this hash changes.
          </p>
          <div className="hash">{m.day.hash}</div>
          <div className="controls" style={{ marginTop: 14 }}>
            <Link className="btn" href="/verify">check a record ↗</Link>
          </div>
        </div>
      </section>

      <FlyFooter date={colony.date} />
    </>
  );
}
