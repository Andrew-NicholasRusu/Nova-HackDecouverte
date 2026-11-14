import { ConcordiaApiError } from '@/server/concordia/client';
import { findCourse } from '@/server/concordia/courses';

// GET /api/concordia/courses?code=COMP%20352 — catalog lookup (title, credits) for autofill.
export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get('code') ?? '';
  const m = /^\s*([A-Za-z]{3,4})[\s-]*(\d{3,4}[A-Za-z]?)\s*$/.exec(code);
  if (!m) {
    return Response.json({ error: 'Use a course code like COMP 352.' }, { status: 400 });
  }
  try {
    return Response.json(await findCourse(m[1], m[2]));
  } catch (e) {
    if (e instanceof ConcordiaApiError) {
      return Response.json({ error: e.message }, { status: 502 });
    }
    return Response.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
