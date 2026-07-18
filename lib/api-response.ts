import { NextResponse } from "next/server";

// Consistent, predictable response shapes for every Route Handler
// in this project (context/code-standards.md > API Routes).
// Success: { data }. Failure: { error: { message } }.

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function apiError(message: string, status: number) {
  return NextResponse.json({ error: { message } }, { status });
}
