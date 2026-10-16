import type { Behavior } from "@/sim/encode";

/** Eight colours, one per fly of the day, distinguishable on the dark dish. */
export const FLY_COLORS = [
  "#7cf5a0",
  "#ffcf4d",
  "#ff7a5d",
  "#ff5da2",
  "#b98cff",
  "#5db8ff",
  "#4fe0c8",
  "#c9d94f"
] as const;

export const flyColor = (i: number) => FLY_COLORS[i % FLY_COLORS.length];

/** The colour a behaviour is drawn in, everywhere. */
export const BEHAVIOR_COLOR: Record<Behavior, string> = {
  approach: "var(--acid)",
  avoid: "var(--danger)",
  explore: "var(--amber)",
  freeze: "var(--muted)"
};

export const BEHAVIOR_SHORT: Record<Behavior, string> = {
  approach: "approach",
  avoid: "avoid",
  explore: "explore",
  freeze: "freeze"
};
