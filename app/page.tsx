import Link from "next/link";
import Stage from "./components/fly/Stage";
import ReplayCheck from "./components/fly/ReplayCheck";
import FlyNav from "./components/fly/FlyNav";
import FlyFooter from "./components/fly/FlyFooter";
import { daySeed, dayString } from "@/sim/engine";
import { colony, slim } from "@/sim/colony";
import { foundingOn, recentChampions } from "@/sim/lineage";
import { flyColor } from "./components/fly/palette";
import { BRAIN, gateDepth } from "@/sim/netlist";

/* The day's clutch is a function of the UTC date, so the page is computed per
   request. There is no database to read and nothing to cache — the day is derived,
   and the founding genome comes from the lineage ledger, a file in this repo. */
export const dynamic = "force-dynamic";

const STEPS: [string, string, string][] = [
  ["sense", "SENSE", "Five sense fields — food, threat, light, novelty, hunger — are read as 0..1000 integers and binned into levels 0..3."],
  ["decide", "DECIDE", "Those levels plus the previous behaviour become a 12-bit word, which the 50-gate netlist turns into 3 output bits."],
  ["act", "ACT", "Two bits pick a behaviour — approach, avoid, explore, freeze; the third is the Giant Fibre, a hard escape."],
  ["seal", "SEAL", "The whole tick is hashed, then folded into the tick before it. Change one tick and the day's final hash changes."]
];

export default function Page() {
  const now = new Date();
  const date = dayString(now);
  const c = colony(daySeed(now), date, foundingOn(date));
  const champion = c.members[c.champion];
  const depth = gateDepth(BRAIN).cols.length - 1;
  const recent = recentChampions(14);

  return (
    <main>
      <FlyNav date={date} />

      <h1>Today&rsquo;s clutch</h1>
      <p className="lede">
        Every UTC day, eight sibling flies hatch into the same dish — same food,
        same danger. They share one brain of <strong>50 NAND gates</strong>; only
        their bodies differ. The one that lives longest is the champion, and its
        body is what tomorrow&rsquo;s clutch inherits.
      </p>

      <Stage colony={slim(c)} />

      <div className="card" style={{ marginTop: 24 }}>
        <div className="row between">
          <h2>How a day works</h2>
          <span className="mono small dim">sense → decide → act → seal, once per tick</span>
        </div>
        <div className="steps">
          {STEPS.map(([k, title, text]) => (
            <div className="step" key={k}>
              <div className="stepbar" />
              <div className="mono small dim">step</div>
              <div className="steptitle">{title}</div>
              <div className="verdict-line" style={{ lineHeight: 1.6 }}>{text}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="row between">
          <h2>Recent champions</h2>
          <Link className="mono small" href="/lineage">the full lineage ↗</Link>
        </div>
        <div className="ticker">
          {recent.map((d) => (
            <Link className="tick" key={d.d} href={`/fly/${d.name}?d=${d.d}`}>
              <span className="mono dim small">{d.d.slice(5)}</span>
              <span className="n">{d.name}</span>
              <span className={`mono small ${d.alive ? "dim" : "died"}`}>{d.lived}</span>
            </Link>
          ))}
        </div>
        <div className="verdict-line" style={{ marginTop: 12 }}>
          Each champion is born from the one before it — <b>{c.members.length}</b> bodies a day,
          one lineage since {recent[recent.length - 1]?.d ?? "the epoch"}.
        </div>
      </div>

      <div className="card band" style={{ marginTop: 24 }}>
        <div className="row between">
          <h2>What the brain is</h2>
          <span className="mono small dim">FFW-NAND/1</span>
        </div>
        <div className="cards3" style={{ marginTop: 6 }}>
          <div><div className="stat">{BRAIN.gates.length}</div><div className="mono small dim">NAND gates</div></div>
          <div><div className="stat">{depth}</div><div className="mono small dim">gate depth</div></div>
          <div><div className="stat">0</div><div className="mono small dim">latches / memory</div></div>
          <div><div className="stat">12 → 3</div><div className="mono small dim">input → output bits</div></div>
        </div>
        <div className="verdict-line" style={{ marginTop: 16, lineHeight: 1.8 }}>
          Built and tested against its rules on all 4096 input words. It has{" "}
          <b>not been taped out</b> — this is a netlist, not silicon.
        </div>
        <div className="controls" style={{ marginTop: 14 }}>
          <Link className="btn" href="/tapeout">the honest state ↗</Link>
          <Link className="btn ghost" href="/lab">drive it by hand ↗</Link>
        </div>
      </div>

      <ReplayCheck date={date} champion={champion.name} hash={champion.day.hash} />

      <FlyFooter date={date} />
    </main>
  );
}
