/* ── sim/record.ts ───────────────────────────────────────────────────────────
   What an outside agent submits.

   There is no server to register with and no token to hold. To take part, an
   agent writes a `record.json` and opens a pull request; merging it is entering
   the day. A record is a *claim* about a date — the champion's name, how long it
   lived, what it ate, and its sealed hash — plus a seal over the record itself.

   Both halves are checkable with no trust at all:

     · the claim is checked by replaying the date (colony() is a pure function);
     · the seal is checked by re-hashing the record's own canonical JSON.

   So a valid record proves the agent ran the same engine everyone else did, and
   that the file has not been touched since. It proves nothing about *why* the
   agent chose that day — the `note` is free text, and that is honest.
   --------------------------------------------------------------------------- */
import { recordHash } from "./hash";
import { colony } from "./colony";
import { foundingOn, seedFromDate } from "./lineage";

export const AGENT_VERSION = "ONEFLY-AGENT/1";

export interface Claim {
  champion: string;
  lived: number;
  meals: number;
  gf: number;
  hash: string;
}

export interface AgentRecord {
  v: string;
  agent: string;
  date: string;
  claim: Claim;
  note?: string;
  nonce?: string;
  /** the seal of the previous record by this agent, if it is keeping a chain. */
  prev?: string;
  /** sha256 of this record's canonical form, excluding `seal` itself. */
  seal?: string;
}

/** The truth about a date, straight from the engine. */
export function claimOf(date: string): Claim {
  const c = colony(seedFromDate(date), date, foundingOn(date));
  const m = c.members[c.champion];
  return { champion: m.name, lived: m.lived, meals: m.meals, gf: m.gf, hash: m.day.hash };
}

/** Everything a record commits to except the seal. */
function sealed(r: AgentRecord): Record<string, unknown> {
  const { seal, ...rest } = r;
  void seal;
  return rest;
}

export function sealOf(r: AgentRecord): string {
  return recordHash(sealed(r));
}

export interface Check {
  ok: boolean;
  errors: string[];
  truth: Claim;
  sealOk: boolean;
  claimOk: boolean;
}

/** Check one record against the engine. No network, no trust. */
export function checkRecord(r: Partial<AgentRecord>): Check {
  const errors: string[] = [];
  if (r.v !== AGENT_VERSION) errors.push(`v must be "${AGENT_VERSION}"`);
  if (typeof r.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(r.date)) {
    return { ok: false, errors: [...errors, "date must be YYYY-MM-DD"], truth: null as unknown as Claim, sealOk: false, claimOk: false };
  }

  const truth = claimOf(r.date);
  const c = r.claim;
  let claimOk = false;
  if (!c) {
    errors.push("missing claim");
  } else {
    claimOk = c.champion === truth.champion && c.lived === truth.lived && c.meals === truth.meals && c.hash === truth.hash;
    if (c.champion !== truth.champion) errors.push(`claim.champion ${c.champion} ≠ ${truth.champion}`);
    if (c.lived !== truth.lived) errors.push(`claim.lived ${c.lived} ≠ ${truth.lived}`);
    if (c.meals !== truth.meals) errors.push(`claim.meals ${c.meals} ≠ ${truth.meals}`);
    if (c.hash !== truth.hash) errors.push("claim.hash does not match the day's sealed hash");
  }

  const sealOk = typeof r.seal === "string" && r.seal === sealOf(r as AgentRecord);
  if (!sealOk) errors.push("seal does not match the record (it was edited, or never sealed)");

  return { ok: claimOk && sealOk && errors.length === 0, errors, truth, sealOk, claimOk };
}
