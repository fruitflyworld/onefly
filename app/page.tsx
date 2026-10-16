import Fly from "./Fly";
import { today } from "@/sim/engine";

/* The fly is a function of the UTC date, so the page is computed per request.
   There is no database to read and nothing to cache — the day is derived. */
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <main>
      <Fly day={today()} />
    </main>
  );
}
