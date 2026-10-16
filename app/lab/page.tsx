"use client";

/* The lab: drive the fly's senses by hand and watch the 50 gates light up.
   Five sliders set the senses; the levels they fall into are packed into the same
   12-bit word the fly really uses, and the circuit is evaluated live. The word is
   written to the URL, so any state you reach is a link you can send. */

import { useEffect, useMemo, useState } from "react";
import FlyNav from "@/app/components/fly/FlyNav";
import FlyFooter from "@/app/components/fly/FlyFooter";
import BrainPanel from "@/app/components/fly/BrainPanel";
import { encodeInputs, decodeOutputs, levelInt, BEHAVIORS } from "@/sim/encode";
import { BRAIN, evalWord } from "@/sim/netlist";
import { decideWord, RULES } from "@/sim/rules";
import { BEHAVIOR_COLOR } from "@/app/components/fly/palette";

const RULE_TEXT = Object.fromEntries(RULES.map((r) => [r.id, r.text]));

// A representative sense value for each 0..3 level, used when loading from a URL.
const LEVEL_MID = [50, 225, 500, 825];
const SENSES = ["food", "threat", "light", "novelty", "hunger"] as const;
type Sense = (typeof SENSES)[number];

export default function LabPage() {
  const [v, setV] = useState<Record<Sense, number>>({ food: 50, threat: 50, light: 825, novelty: 50, hunger: 50 });
  const [prev, setPrev] = useState(0);

  // Load a shared state, then keep the URL in step with the sliders.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.has("w")) {
      const w = Number(p.get("w")) & 0xfff;
      setV({
        food: LEVEL_MID[w & 3],
        threat: LEVEL_MID[(w >> 2) & 3],
        light: LEVEL_MID[(w >> 4) & 3],
        novelty: LEVEL_MID[(w >> 6) & 3],
        hunger: LEVEL_MID[(w >> 8) & 3]
      });
      setPrev((w >> 10) & 3);
    }
  }, []);

  const word = encodeInputs(v, prev);
  const out = evalWord(BRAIN, word);
  const { behavior, gf } = decodeOutputs(out);
  const { rule } = decideWord(word);

  useEffect(() => {
    window.history.replaceState(null, "", `?w=${word}`);
  }, [word]);

  const levels = useMemo(
    () => SENSES.map((s) => `${s} ${levelInt(v[s])}`).join(" · "),
    [v]
  );

  return (
    <main>
      <FlyNav />
      <h1>Lab</h1>
      <p className="lede">
        Set the senses. The levels they fall into become the fly's 12-bit input
        word, and the circuit fires. Everything below is the same netlist the fly
        runs all day — no animation, just the gates.
      </p>

      <div className="stage">
        <div className="card">
          <div className="row between">
            <h2>Senses</h2>
            <span className="mono small dim">{levels}</span>
          </div>
          {SENSES.map((s) => (
            <div className="labrow" key={s}>
              <span className="mono">{s}</span>
              <input
                type="range" min={0} max={1000} value={v[s]}
                onChange={(e) => setV((p) => ({ ...p, [s]: +e.target.value }))}
              />
              <span className="mono v">{v[s]}</span>
              <span className="mono dim">lvl {levelInt(v[s])}</span>
            </div>
          ))}

          <div className="labrow" style={{ marginTop: 8 }}>
            <span className="mono">prev</span>
            <div className="segmented">
              {BEHAVIORS.map((b, i) => (
                <button key={b} className={prev === i ? "on" : ""} onClick={() => setPrev(i)}>{b}</button>
              ))}
            </div>
          </div>

          <div className="bitrow mono small" style={{ marginTop: 16 }}>
            in 0b{word.toString(2).padStart(12, "0")} → out 0b{out.toString(2).padStart(3, "0")}
            <span className="dim"> · share </span>
            <code>?w={word}</code>
          </div>
        </div>

        <div className="card readout">
          <h2>The decision</h2>
          <div className="behavior" style={{ color: BEHAVIOR_COLOR[behavior] }}>
            {behavior}<small>rule ￫ {rule}</small>
          </div>
          <div className="verdict-line" style={{ marginBottom: 12 }}>{RULE_TEXT[rule]}</div>
          {gf && <div className="verdict-line" style={{ color: "var(--danger)" }}>◆ Giant Fibre fired</div>}
          <div className="verdict-line">
            {v.food} {v.threat} {v.light} {v.novelty} {v.hunger} · prev {BEHAVIORS[prev]}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="row between">
          <h2>The brain, live</h2>
          <span className="mono small dim">50 NAND gates · click a gate</span>
        </div>
        <BrainPanel word={word} />
      </div>

      <FlyFooter />
    </main>
  );
}
