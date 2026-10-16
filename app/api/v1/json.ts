/* Shared response helpers for /api/v1/*.
   A day is a pure function of its date, so every response for a past date is
   immutable and can be cached forever; only "today" may still change at midnight. */

import { NextResponse } from "next/server";
import { dayString } from "@/sim/engine";

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const today = () => dayString(new Date());

export function isDate(s: string): boolean {
  return DATE_RE.test(s);
}

export function ok(data: unknown, date?: string): NextResponse {
  const cacheable = !!date && date < today();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": cacheable
        ? "public, max-age=31536000, immutable"
        : "public, max-age=60, must-revalidate",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

export function bad(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status, headers: { "Access-Control-Allow-Origin": "*" } });
}
