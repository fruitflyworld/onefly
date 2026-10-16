"use client";

/* Recompute, in this browser, the whole day the page just showed you — and compare
   the champion's sealed hash to the one the server sent. If the two ever differ,
   the site is lying; the button is here so you never have to take that on trust. */

import { useState } from "react";
import { colony } from "@/sim/colony";
import { foundingOn, seedFromDate } from "@/sim/lineage";

export default function ReplayCheck({
  date,
  champion,
  hash
}: {
  date: string;
  champion: string;
  hash: string;
}) {
  const [state, setState] = useState<"idle" | "running" | "ok" | "bad">("idle");
  const [mine, setMine] = useState("");

  function run() {
    setState("running");
    // yield a frame so the button can show "running" before the work blocks
    setTimeout(() => {
      const c = colony(seedFromDate(date), date, foundingOn(date));
      const h = c.members[c.champion].day.hash;
      setMine(h);
      setState(h === hash ? "ok" : "bad");
    }, 16);
  }

  return (
    <div className="replaycheck card">
      <div className="row between">
        <h2>Check today's record</h2>
        <span className="mono small dim">{champion}</span>
      </div>
      <p className="verdict-line" style={{ lineHeight: 1.6 }}>
        Recompute the whole clutch from the date alone, right here in your browser,
        and compare the champion&rsquo;s hash with the one on this page.
      </p>
      <div className="controls" style={{ marginTop: 12 }}>
        <button onClick={run} disabled={state === "running"}>
          {state === "running" ? "recomputing…" : "replay in my browser"}
        </button>
        {state === "ok" && <span className="mono small" style={{ color: "var(--acid)" }}>✓ identical</span>}
        {state === "bad" && <span className="mono small" style={{ color: "var(--danger)" }}>✗ mismatch</span>}
      </div>
      {mine && (
        <div className="hash" style={{ marginTop: 12 }}>
          <span className="dim mono small">browser: </span>{mine}
        </div>
      )}
    </div>
  );
}
