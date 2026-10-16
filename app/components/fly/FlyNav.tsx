import Link from "next/link";

/* The site's chrome. Five rooms, one dish. English-only, like FFW. */

const LINKS: [string, string][] = [
  ["/", "today"],
  ["/lab", "lab"],
  ["/verify", "verify"],
  ["/lineage", "lineage"],
  ["/tapeout", "tapeout"],
  ["/agents", "agents"]
];

export default function FlyNav({ date }: { date?: string }) {
  return (
    <div className="nav">
      <Link className="brand" href="/">One Fly</Link>
      <nav>
        {LINKS.map(([href, label]) => (
          <Link key={href} href={href}>{label}</Link>
        ))}
      </nav>
      {date && <span className="mono small dim navdate">{date} · UTC</span>}
    </div>
  );
}
