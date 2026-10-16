import { notFound } from "next/navigation";
import FlyView from "@/app/components/fly/FlyView";
import { colony, slim, COLONY_SIZE } from "@/sim/colony";
import { indexOfName } from "@/sim/names";
import { foundingOn, ledgerDay } from "@/sim/lineage";

/* One fly's page. The name resolves back into an index of the day's clutch, and
   the parent is read off the lineage ledger — the champion of the day before. */
export const dynamic = "force-dynamic";

function seedFromDate(date: string): number {
  return Number(date.replace(/-/g, "")) >>> 0;
}

export default async function FlyPage({
  params,
  searchParams
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ d?: string }>;
}) {
  const { name } = await params;
  const { d } = await searchParams;
  const date = d ?? "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  const seed = seedFromDate(date);
  const index = indexOfName(seed, name, COLONY_SIZE);
  if (index < 0) notFound();

  const c = colony(seed, date, foundingOn(date));
  const m = c.members[index];

  // The fly above this one: yesterday's champion, the body it was born from.
  const prev = ledgerDay(prevDay(date));
  const parent = prev ? { name: prev.name, date: prev.d, genome: prev.champion } : null;

  return (
    <main>
      <FlyView colony={slim(c)} index={index} parent={parent} />
    </main>
  );
}

function prevDay(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d - 1));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
}
