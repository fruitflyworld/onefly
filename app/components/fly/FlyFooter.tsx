import Link from "next/link";

/* Every page ends the same way: the honest state of the project, and the one
   command anyone can run to check today's record for themselves. */
export default function FlyFooter({ date }: { date?: string }) {
  return (
    <footer>
      <p>
        Every day is a pure function of the UTC date: eight flies, one dish, one
        brain of 50 NAND gates, each tick folded into a hash chain. There is no
        database and no server state.
      </p>
      {date && (
        <p style={{ marginTop: 12 }}>
          Replay today yourself — nothing but the date is needed:
          <br />
          <code>npm run replay -- {date} --check</code>
        </p>
      )}
      <p style={{ marginTop: 12 }} className="dim">
        The brain is built and tested against its rules on all 4096 input words.
        This layer has <b>not been taped out</b> — it is a netlist, not silicon.
        {" · "}
        <Link href="/tapeout">read the honest state</Link>
      </p>
    </footer>
  );
}
