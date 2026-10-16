import Link from "next/link";
import FlyNav from "@/app/components/fly/FlyNav";
import FlyFooter from "@/app/components/fly/FlyFooter";
import { LEDGER, recentChampions, ledgerThrough, EPOCH } from "@/sim/lineage";
import { genomeDrift } from "@/sim/genome";

/* The family tree. One row per day since the epoch: who won, how long it lived,
   and how far its body has drifted from the founder. The ledger is a file in the
   repository, not a database — `npm run lineage --check` recomputes it and
   asserts it is unchanged. */

export const dynamic = "force-dynamic";

export const metadata = { title: "Lineage — One Fly" };

export default function LineagePage() {
  const champions = recentChampions(60);
  const through = ledgerThrough();
  const survived = LEDGER.days.filter((d) => d.alive).length;
  const byStage = LEDGER.days[LEDGER.days.length - 1];
  const drift = byStage ? genomeDrift(byStage.champion) : 0;

  return (
    <main>
      <FlyNav />
      <h1>Lineage</h1>
      <p className="lede">
        The fly does not appear from nowhere each morning. Each day&rsquo;s clutch descends
        from yesterday&rsquo;s champion: whatever body lived longest is what the eight
        siblings are born from, nudged a little. That chain is the ledger below.
      </p>

      <div className="cards3">
        <div className="card"><div className="stat">{LEDGER.days.length}</div><div className="mono small dim">days since {EPOCH}</div></div>
        <div className="card"><div className="stat">{survived}</div><div className="mono small dim">champions reached dusk</div></div>
        <div className="card"><div className="stat">{drift}‰</div><div className="mono small dim">drift from the founder</div></div>
        <div className="card"><div className="stat">{through.slice(5)}</div><div className="mono small dim">ledger reaches</div></div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="row between">
          <h2>Recent champions</h2>
          <span className="mono small dim">most recent first · the newest 60</span>
        </div>
        <div style={{ marginTop: 6 }}>
          {champions.map((d) => (
            <div className="lineagerow" key={d.d}>
              <span className="d">{d.d}</span>
              <Link className="n" href={`/fly/${d.name}?d=${d.d}`}>{d.name}</Link>
              <span className="mono">{d.lived} <span className="dim">ticks</span></span>
              <span className={`mono ${d.alive ? "" : "died"}`}>{d.alive ? "dusk" : "died"}</span>
              <span className="mono dim">{genomeDrift(d.champion)}‰</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="row between">
          <h2>How this is kept</h2>
          <span className="mono small dim">a file, not a database</span>
        </div>
        <div className="verdict-line" style={{ lineHeight: 1.8 }}>
          The ledger is <b>sim/lineage.json</b> — a public file with the same standing
          as the netlist. It is not computed per request because that would mean
          replaying {LEDGER.days.length} days of eight flies on every page load; instead
          the file is committed, and anyone can check it:
        </div>
        <div className="scroll" style={{ maxHeight: "none", marginTop: 12 }}>
          <pre className="cmd">{`npm run lineage --check     # recompute every row from the founder → ✓ IDENTICAL`}</pre>
        </div>
        <div className="verdict-line" style={{ marginTop: 14 }}>
          If the file and the recomputation ever disagree, the file is wrong. Read the
          same data as JSON at <Link href="/api/v1/lineage?days=60">/api/v1/lineage</Link>.
        </div>
      </div>

      <FlyFooter />
    </main>
  );
}
