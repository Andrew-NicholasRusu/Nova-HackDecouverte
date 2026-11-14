import { ConcordiaApiError } from '@/server/concordia/client';
import { fetchBuildings } from '@/server/concordia/buildings';

// GET /api/concordia/buildings — proxies Concordia Open Data so the API key stays on the server.
export async function GET() {
  try {
    return Response.json(await fetchBuildings());
  } catch (e) {
    if (e instanceof ConcordiaApiError) {
      // Don't leak upstream auth details; a 401 from Concordia is a server config problem for us.
      const status = e.status === 401 ? 502 : e.status >= 400 ? e.status : 502;
      return Response.json({ error: e.message }, { status });
    }
    return Response.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
