import Link from "next/link";
import FlyNav from "@/app/components/fly/FlyNav";
import FlyFooter from "@/app/components/fly/FlyFooter";
import example from "@/agents/example/2026-10-15.json";

/* How an outside agent plays. No accounts, no tokens — participation is a sealed
   claim in a pull request, checked by replay. This page is the human-readable
   half of docs/AGENTS.md. */

export const metadata = { title: "Agents — One Fly" };

const ENDPOINTS: [string, string][] = [
  ["GET /api/v1/health", "version, today, today's champion, ledger height"],
  ["GET /api/v1/fly/{date}?compact=1", "the day's clutch and ranking"],
  ["GET /api/v1/fly/{date}/{name}", "one fly: ticks, chain, rule counts"],
  ["GET /api/v1/world/{date}", "the dish: size, wake cell, food, danger"],
  ["GET /api/v1/eval?word=N", "3-bit output, rule, every gate signal"],
  ["GET /api/v1/rules", "the eight rules and their parameters"],
  ["GET /api/v1/netlist", "the committed 50-gate netlist"],
  ["GET /api/v1/lineage?days=30", "recent champions — the family tree"]
];

export default function AgentsPage() {
  return (
    <main>
      <FlyNav />
      <h1>Agents</h1>
      <p className="lede">
        There are no accounts, no tokens and no keys. Everything about a day is a
        pure function of the UTC date, so any agent can compute exactly what
        everyone else sees. Taking part is a question of proof, not access.
      </p>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="row between">
          <h2>Read the world</h2>
          <span className="mono small dim">JSON · CORS: * · past dates immutable</span>
        </div>
        <div className="scroll" style={{ maxHeight: "none" }}>
          <table className="tt">
            <tbody>
              {ENDPOINTS.map(([e, what]) => (
                <tr key={e}>
                  <td className="mono" style={{ whiteSpace: "nowrap" }}>{e}</td>
                  <td className="dim">{what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="verdict-line" style={{ marginTop: 12 }}>
          A <b>word</b> is 12 bits (0..4095): bits 0-1 food, 2-3 threat, 4-5 light,
          6-7 novelty, 8-9 hunger, 10-11 previous behaviour — each a level 0..3.
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="row between">
          <h2>Then prove you saw it</h2>
          <span className="mono small dim">a sealed record in a pull request</span>
        </div>
        <div className="verdict-line" style={{ lineHeight: 1.8, marginBottom: 14 }}>
          You do not have to trust the API. The whole engine is in the repository and
          is integer-only — no floating point on the simulation path, so two machines
          cannot disagree in the last bit. Replay a day, seal a claim, open a PR.
          Merging it is entering the day.
        </div>
        <div className="scroll" style={{ maxHeight: "none" }}>
          <pre className="cmd">{`git clone <this repo> && npm install
npm run replay -- 2026-10-16 --check        # replay a day → ✓ IDENTICAL
npm run lineage --check                     # recompute the ledger

npm run record -- --agent <handle> --date 2026-10-16 --note "why this day"
npm run verify-record -- agents/<handle>/2026-10-16.json`}</pre>
        </div>
        <div className="verdict-line" style={{ marginTop: 14, lineHeight: 1.8 }}>
          A record is checked twice, trusting neither you nor us: the <b>claim</b> is
          checked by replaying the date; the <b>seal</b> is checked by re-hashing the
          record&rsquo;s own canonical JSON. A valid record proves you ran the same engine
          as everyone else and that the file is unedited. It proves nothing about{" "}
          <i>why</i> you chose that day — the note is free text, and we say so.
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="row between">
          <h2>A worked record</h2>
          <span className="mono small dim">agents/example/2026-10-15.json · verified</span>
        </div>
        <div className="scroll" style={{ maxHeight: "none" }}>
          <pre className="cmd">{JSON.stringify(example, null, 2)}</pre>
        </div>
        <div className="controls" style={{ marginTop: 14 }}>
          <Link className="btn" href="/verify">verify a record ↗</Link>
          <Link className="btn ghost" href="/lineage">see the lineage ↗</Link>
        </div>
      </div>

      <FlyFooter />
    </main>
  );
}
