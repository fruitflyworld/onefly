"use client";

/* The dish. One world, up to eight routes, one moment in time.
   Everything is drawn from the ticks themselves — this file knows nothing about
   how a fly decides. */

import type { Tick } from "@/sim/engine";
import type { World } from "@/sim/engine";

const C = 20;

export interface Route {
  name: string;
  color: string;
  ticks: Tick[];
  champion?: boolean;
}

export default function Dish({
  world,
  routes,
  upto,
  focus,
  onPick
}: {
  world: World;
  routes: Route[];
  upto: number;
  focus?: number;
  onPick?: (i: number) => void;
}) {
  const { w, h, food, danger } = world;
  const px = (x: number) => x * C + C / 2;
  const py = (y: number) => y * C + C / 2;

  return (
    <svg className="dish" viewBox={`0 0 ${w * C} ${h * C}`} role="img" aria-label="the day's dish">
      <defs>
        <linearGradient id="daylight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7cf5a0" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#7cf5a0" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={w * C} height={h * C} fill="url(#daylight)" />

      {Array.from({ length: w + 1 }, (_, i) => (
        <line key={`v${i}`} x1={i * C} y1={0} x2={i * C} y2={h * C} stroke="#191f27" strokeWidth={1} />
      ))}
      {Array.from({ length: h + 1 }, (_, i) => (
        <line key={`h${i}`} x1={0} y1={i * C} x2={w * C} y2={i * C} stroke="#191f27" strokeWidth={1} />
      ))}

      {danger.map((c, i) => (
        <g key={`d${i}`} stroke="var(--danger)" strokeWidth={2} opacity={0.75}>
          <line x1={px(c.x) - 5} y1={py(c.y) - 5} x2={px(c.x) + 5} y2={py(c.y) + 5} />
          <line x1={px(c.x) + 5} y1={py(c.y) - 5} x2={px(c.x) - 5} y2={py(c.y) + 5} />
        </g>
      ))}
      {food.map((c, i) => (
        <circle key={`f${i}`} cx={px(c.x)} cy={py(c.y)} r={4.5} fill="none" stroke="var(--amber)" strokeWidth={2} />
      ))}

      {/* every route, whole, faint — the shape of the day */}
      {routes.map((r, i) => (
        <polyline
          key={`full${i}`}
          points={r.ticks.map((t) => `${px(t.x)},${py(t.y)}`).join(" ")}
          fill="none"
          stroke={r.color}
          strokeWidth={1.5}
          opacity={0.2}
        />
      ))}

      {/* each route as far as the scrubber has reached */}
      {routes.map((r, i) => (
        <g key={`now${i}`}>
          <polyline
            points={r.ticks.slice(0, upto + 1).map((t) => `${px(t.x)},${py(t.y)}`).join(" ")}
            fill="none"
            stroke={r.color}
            strokeWidth={focus === i ? 3 : 2}
            strokeLinejoin="round"
            opacity={focus === undefined || focus === i ? 0.95 : 0.45}
          />
          {r.ticks[Math.min(upto, r.ticks.length - 1)] && (
            <circle
              cx={px(r.ticks[Math.min(upto, r.ticks.length - 1)].x)}
              cy={py(r.ticks[Math.min(upto, r.ticks.length - 1)].y)}
              r={focus === i ? 6 : 4}
              fill={r.color}
              stroke={r.champion ? "var(--ink)" : "none"}
              strokeWidth={1.5}
              onClick={onPick ? () => onPick(i) : undefined}
              style={onPick ? { cursor: "pointer" } : undefined}
            />
          )}
        </g>
      ))}

      {focus !== undefined && routes[focus] && routes[focus].ticks[Math.min(upto, routes[focus].ticks.length - 1)] && (
        <text
          x={px(routes[focus].ticks[Math.min(upto, routes[focus].ticks.length - 1)].x) + 11}
          y={py(routes[focus].ticks[Math.min(upto, routes[focus].ticks.length - 1)].y) + 4}
          fontSize={11}
          fill={routes[focus].color}
          fontFamily="var(--mono)"
        >
          {routes[focus].name}
        </text>
      )}
    </svg>
  );
}
