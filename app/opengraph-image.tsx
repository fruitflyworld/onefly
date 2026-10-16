import { ImageResponse } from "next/og";
import { daySeed, dayString } from "@/sim/engine";
import { colony } from "@/sim/colony";
import { foundingOn } from "@/sim/lineage";

/* The card that stands in for the day when a link is shared: today's champion,
   how long it lived, what it ate, and the head of its sealed hash. */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const alt = "One Fly — today's clutch";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#07090b";
const PANEL = "#0f1216";
const INK = "#eef2f7";
const MUTED = "#8a94a4";
const ACID = "#7cf5a0";
const AMBER = "#ffcf4d";

export default function Image() {
  const now = new Date();
  const date = dayString(now);
  const c = colony(daySeed(now), date, foundingOn(date));
  const m = c.members[c.champion];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          background: BG, color: INK, padding: 56, fontFamily: "sans-serif"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: ACID, fontSize: 24, letterSpacing: 8, fontFamily: "monospace" }}>ONE FLY</div>
          <div style={{ color: MUTED, fontSize: 22, fontFamily: "monospace" }}>{`${date} · UTC`}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 32 }}>
          <div style={{ color: MUTED, fontSize: 24, fontFamily: "monospace" }}>today&rsquo;s champion</div>
          <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: -2, marginTop: 4 }}>{m.name}</div>
        </div>

        <div style={{ display: "flex", marginTop: 24, gap: 18 }}>
          <Stat n={String(m.lived)} label="ticks lived" color={ACID} />
          <Stat n={String(m.meals)} label="meals" color={AMBER} />
          <Stat n={String(m.gf)} label="giant fibre" color="#ff5d5d" />
          <Stat n={String(c.members.length)} label="flies, one dish" color={INK} />
        </div>

        <div style={{
          display: "flex", flexDirection: "column", marginTop: 24,
          background: PANEL, borderRadius: 16, padding: 20
        }}>
          <div style={{ color: MUTED, fontSize: 19, fontFamily: "monospace" }}>{`sealed hash · ${m.day.ticks.length} ticks folded into one`}</div>
          <div style={{ color: ACID, fontSize: 23, fontFamily: "monospace", marginTop: 8 }}>
            {`${m.day.hash.slice(0, 48)}…`}
          </div>
          <div style={{ color: MUTED, fontSize: 20, marginTop: 12 }}>
            a brain of 50 NAND gates · no server state · replayable from the date alone
          </div>
        </div>
      </div>
    ),
    size
  );
}

function Stat({ n, label, color }: { n: string; label: string; color: string }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", background: PANEL, borderRadius: 14,
      padding: "14px 22px", minWidth: 170
    }}>
      <div style={{ fontSize: 42, fontWeight: 800, color, fontFamily: "monospace" }}>{n}</div>
      <div style={{ fontSize: 19, color: MUTED, marginTop: 2 }}>{label}</div>
    </div>
  );
}
