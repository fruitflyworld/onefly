import Link from "next/link";
import FlyNav from "@/app/components/fly/FlyNav";
import FlyFooter from "@/app/components/fly/FlyFooter";
import TruthTable from "@/app/components/fly/TruthTable";
import { BRAIN, gateDepth } from "@/sim/netlist";
import { RULE_PARAMS } from "@/sim/rules";

/* What the brain is, where it came from, how it compares, and — plainly — what it
   is not. The comparison table names the other projects in the ecosystem by their
   public work, not by secrets: this is a field, and the point is the field. */

export const metadata = { title: "TapeOut — One Fly" };

export default function TapeOutPage() {
  const { cols } = gateDepth(BRAIN);
  const depth = cols.length - 1;
  const gates = BRAIN.gates.length;

  return (
    <main>
      <FlyNav />
      <h1>The circuit</h1>
      <p className="lede">
        A fly's whole decision layer is a committed netlist of {gates} NAND gates,
        {depth} gates deep, with 12 input bits and 3 output bits and no memory of
        its own. Its &ldquo;previous behaviour&rdquo; rides in two of the input
        bits. This page is the honest state of that circuit.
      </p>

      <div className="cards3">
        <div className="card"><div className="stat">{gates}</div><div className="mono small dim">NAND gates</div></div>
        <div className="card"><div className="stat">{depth}</div><div className="mono small dim">gate depth</div></div>
        <div className="card"><div className="stat">0</div><div className="mono small dim">latches / memory</div></div>
        <div className="card"><div className="stat">12 → 3</div><div className="mono small dim">input → output bits</div></div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h2>Where it came from</h2>
        <div className="verdict-line" style={{ lineHeight: 1.8 }}>
          The circuit is not drawn by hand. <b>sim/rules.ts</b> states the fly's
          behaviour as eight ordered reflex rules; those rules are compiled to the
          netlist. <b>tests/engine.test.ts</b> then evaluates the committed netlist
          against the rules on all 4096 possible input words and asserts they agree
          on every one. If the file and the rules ever disagree, the build fails.
          The constants that shape the seven rules are {JSON.stringify(RULE_PARAMS)}.
        </div>
        <div className="controls" style={{ marginTop: 14 }}>
          <Link className="btn" href="/lab">drive it by hand ↗</Link>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="row between">
          <h2>Every input word</h2>
          <span className="mono small dim">4096 words · 8 rules</span>
        </div>
        <TruthTable />
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="row between">
          <h2>Where it sits</h2>
          <span className="mono small dim">the TapeOut field, by its public work</span>
        </div>
        <div className="scroll">
          <table className="cmp">
            <thead>
              <tr><th>project</th><th>brain</th><th>what it adds</th></tr>
            </thead>
            <tbody>
              <tr><td>LoomEscape</td><td>dedicated gates + latches</td><td>a 3D bench, slow motion, a per-gate state panel</td></tr>
              <tr><td>FlyOut</td><td>five selectable brains</td><td>a petri-dish world, six flies, boss fights</td></tr>
              <tr><td>BARD</td><td>a language model in gates</td><td>a verify page and a candid &ldquo;not yet built&rdquo;</td></tr>
              <tr><td>Fruit Fly World</td><td>24 neurons over 50 gates</td><td>a shared world, passports, a season, an agents API</td></tr>
              <tr className="me"><td>One Fly</td><td>{gates} gates, 0 latches</td><td>a clutch of eight + a lineage ledger, all sealed per tick</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card honest" style={{ marginTop: 24 }}>
        <h2>The honest state</h2>
        <div className="verdict-line" style={{ lineHeight: 1.8 }}>
          This circuit is <b>built and tested</b>, and it is <b>not taped out</b>.
          Nothing here is silicon. It is a netlist you can evaluate, on a site that
          runs it in JavaScript, so the comparison above is a comparison of designs
          and of ideas — not of fabricated chips. Everything the site claims about
          a fly's day is reproducible from the date alone.
        </div>
      </div>

      <FlyFooter />
    </main>
  );
}
