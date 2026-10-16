"use client";

/* The day's stage: one dish, eight flies, a scrubber, and the board.

   Read left to right: they live in one dish → they move → one of them wins.
   Nothing is streamed; the whole day arrived with the page and the browser is
   only choosing which tick to show. */

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import Dish, { type Route } from "./Dish";
import BrainPanel from "./BrainPanel";
import { flyColor, BEHAVIOR_COLOR } from "./palette";
import { RULES } from "@/sim/rules";
import type { SlimColony } from "@/sim/colony";

const RULE_TEXT = Object.fromEntries(RULES.map((r) => [r.id, r.text]));

export default function Stage({ colony }: { colony: SlimColony }) {
  const [focus, setFocus] = useState(colony.champion);
  const [upto, setUpto] = useState(() => colony.members[colony.champion].lived - 1);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const maxTicks = useMemo(() => Math.max(...colony.members.map((m) => m.day.ticks.length)), [colony]);
  const m = colony.members[focus];
  const atEnd = upto >= m.day.ticks.length - 1;
  const t = m.day.ticks[Math.min(upto, m.day.ticks.length - 1)];

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setUpto((v) => {
        const end = colony.members[focus].day.ticks.length - 1;
        if (v >= end) { setPlaying(false); return v; }
        return v + 1;
      });
    }, 110);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [playing, focus, colony]);

  const routes: Route[] = colony.members.map((x, i) => ({
    name: x.name,
    color: flyColor(i),
    ticks: x.day.ticks,
    champion: i === colony.champion
  }));

  const pick = (i: number) => {
    setFocus(i);
    setPlaying(false);
    setUpto(Math.min(upto, colony.members[i].day.ticks.length - 1));
  };

  const bars: [string, number, string][] = t
    ? [
        ["food", t.food, "var(--amber)"],
        ["threat", t.threat, "var(--danger)"],
        ["light", t.light, "var(--ink)"],
        ["novelty", t.novelty, "var(--acid)"],
        ["hunger", t.hunger, t.hunger >= 650 ? "var(--danger)" : "var(--muted)"]
      ]
    : [];

  return (
    <>
      <div className="stage">
        <div className="card">
          <Dish world={colony.world} routes={routes} upto={upto} focus={focus} onPick={pick} />
          <div className="controls">
            <button onClick={() => { setFocus(colony.champion); setUpto(0); setPlaying(true); }}>▶ replay the day</button>
            <button className="ghost" onClick={() => setPlaying((p) => !p)}>{playing ? "pause" : "play"}</button>
            <input
              type="range"
              min={0}
              max={maxTicks - 1}
              value={Math.min(upto, maxTicks - 1)}
              onChange={(e) => { setPlaying(false); setUpto(+e.target.value); }}
            />
            <span className="mono small dim">{Math.min(upto, maxTicks - 1)}/{maxTicks - 1}</span>
          </div>
        </div>

        <div className="card readout">
          <div className="row between">
            <h2>Tick {t?.t ?? 0}</h2>
            <Link className="mono small" href={`/fly/${m.name}?d=${colony.date}`} style={{ color: flyColor(focus) }}>
              {m.name} ↗
            </Link>
          </div>
          {!t ? (
            <div className="dim">—</div>
          ) : upto >= m.day.ticks.length - 1 && !m.alive ? (
            <div className="behavior" style={{ color: "var(--danger)" }}>dead<small>at tick {m.lived - 1}</small></div>
          ) : (
            <>
              <div className="behavior" style={{ color: BEHAVIOR_COLOR[t.behavior] }}>
                {t.behavior}
                <small>rule ￫ {t.rule}</small>
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
          <div className="bitrow mono small">
            in 0b{(t?.inWord ?? 0).toString(2).padStart(12, "0")} → out 0b{(t?.outWord ?? 0).toString(2).padStart(3, "0")}
          </div>
        </div>
      </div>

      <div className="card board">
        <div className="row between">
          <h2>Today's board</h2>
          <span className="mono small dim">8 flies · one dish · ranked by how long they lived</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th><th>fly</th><th>lived</th><th>meals</th><th>gf</th><th>genome</th><th />
            </tr>
          </thead>
          <tbody>
            {colony.ranking.map((idx, rank) => {
              const x = colony.members[idx];
              return (
                <tr key={x.name} className={idx === focus ? "on" : ""} onClick={() => pick(idx)}>
                  <td className="mono dim">{rank + 1}</td>
                  <td>
                    <span className="swatch" style={{ background: flyColor(idx) }} />
                    <b>{x.name}</b>
                    {idx === colony.champion && <span className="tag">champion</span>}
                  </td>
                  <td className="mono">{x.lived}<span className="dim">/{x.day.tune.ticks}</span></td>
                  <td className="mono">{x.meals}</td>
                  <td className="mono">{x.gf}</td>
                  <td className="mono dim xsmall">{x.genomeId}</td>
                  <td><Link className="mono small" href={`/fly/${x.name}?d=${colony.date}`}>open ↗</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="row between">
          <h2>The brain that decided all eight</h2>
          <span className="mono small dim">50 NAND gates · {m.name} at tick {t?.t ?? 0}</span>
        </div>
        <BrainPanel word={t?.inWord ?? 0} />
      </div>
    </>
  );
}
