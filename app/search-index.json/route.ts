import { getContent } from "@/lib/content";
import { buildSearchPayload } from "@/lib/search";

// Written to out/search-index.json at build time.
export const dynamic = "force-static";

export function GET() {
  return Response.json(buildSearchPayload(getContent()));
}
