/* ── sim/netlist.ts ──────────────────────────────────────────────────────────
   The fly's brain, loaded from the committed netlist, and an evaluator that runs
   it gate by gate. This is the whole brain: fifty NAND gates, twelve input bits,
   three output bits, no memory of its own (the fly's "previous behaviour" is
   carried in two of the input bits).

   Signal numbering is TapeOut's, so the same bytes could be taped out unchanged:

     signal 0 = constant 0 · signal 1 = constant 1 · signals 2..2+nIn-1 = inputs
     gate i writes signal 2+nIn+i · a gate may only read lower signals
     the last nOut signals are the outputs; output k = bit k of the result word

   The netlist is not written by hand: sim/rules.ts is the source of truth, and
   tests/engine.test.ts checks this circuit against those seven rules on all 4096
   possible input words.
   --------------------------------------------------------------------------- */
import official from "./ffw-nand-1.netlist.json";

export interface Netlist {
  version: string;
  nIn: number;
  nOut: number;
  /** gates[i] = [a, b]: the two signals NAND-ed into signal 2 + nIn + i. */
  gates: [number, number][];
}

export const BRAIN = official as unknown as Netlist;

export function checkNetlist(n: Netlist): void {
  const base = 2 + n.nIn;
  n.gates.forEach(([a, b], i) => {
    const self = base + i;
    if (!(a >= 0 && a < self && b >= 0 && b < self)) throw new Error(`gate ${i}: future signal`);
  });
  if (n.gates.length < n.nOut) throw new Error("fewer gates than outputs");
}

/** Evaluate every gate once, in order. Returns the 3-bit output word. */
export function evalWord(n: Netlist, word: number): number {
  return outputOf(evalTrace(n, word), n);
}

function outputOf(sig: Uint8Array, n: Netlist): number {
  let out = 0;
  const first = sig.length - n.nOut;
  for (let k = 0; k < n.nOut; k++) out |= sig[first + k] << k;
  return out;
}

/** The same evaluation, but returns every signal — for drawing the circuit live. */
export function evalTrace(n: Netlist, word: number): Uint8Array {
  const sig = new Uint8Array(2 + n.nIn + n.gates.length);
  sig[1] = 1;
  for (let i = 0; i < n.nIn; i++) sig[2 + i] = (word >>> i) & 1;
  const base = 2 + n.nIn;
  for (let i = 0; i < n.gates.length; i++) {
    const g = n.gates[i];
    sig[base + i] = sig[g[0]] & sig[g[1]] ? 0 : 1;
  }
  return sig;
}

/** Placement for a drawing: each gate's depth (longest path from an input). */
export function gateDepth(n: Netlist): { depth: number[]; cols: number[][] } {
  const base = 2 + n.nIn;
  const total = base + n.gates.length;
  const depth = new Array<number>(total).fill(0);
  let maxD = 0;
  for (let i = 0; i < n.gates.length; i++) {
    const [a, b] = n.gates[i];
    const d = 1 + Math.max(depth[a], depth[b]);
    depth[base + i] = d;
    if (d > maxD) maxD = d;
  }
  const cols: number[][] = Array.from({ length: maxD + 1 }, () => []);
  for (let i = 0; i < n.gates.length; i++) cols[depth[base + i]].push(base + i);
  return { depth, cols };
}
