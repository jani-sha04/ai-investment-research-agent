export interface SearchResult {
  title: string;
  url: string;
  content: string;
  query: string;
}

/**
 * Thin wrapper around the Tavily Search API (https://tavily.com).
 * We call the REST endpoint directly rather than pulling in the LangChain
 * community Tavily tool, to keep the dependency surface small and the
 * request/response shape fully under our control.
 */
export async function tavilySearch(
  query: string,
  maxResults = 5
): Promise<SearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error(
      "TAVILY_API_KEY is missing. Get a free key at https://tavily.com and add it to your .env.local file."
    );
  }

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "advanced",
      max_results: maxResults,
      include_answer: false
    })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Tavily search failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  const results = (data.results || []) as Array<{
    title: string;
    url: string;
    content: string;
  }>;

  return results.map((r) => ({
    title: r.title,
    url: r.url,
    content: r.content,
    query
  }));
}

/**
 * Runs several targeted queries in parallel and flattens/dedupes the results
 * by URL. Each query targets a different lens on the company (overview,
 * financials, news, risks/competition) so the downstream analysis nodes get
 * a broad but relevant slice of the web rather than one generic search.
 */
export async function runResearchQueries(
  companyName: string
): Promise<{ results: SearchResult[]; sources: string[] }> {
  const queries = [
  `${companyName} official investor relations company overview`,
  `${companyName} latest quarterly earnings revenue net income annual report`,
  `${companyName} latest product launches market share growth 2026`,
  `${companyName} latest news opportunities challenges competitors analyst outlook`
];

  const settled = await Promise.allSettled(
    queries.map((q) => tavilySearch(q, 5))
  );

  const results: SearchResult[] = [];
  const errors: string[] = [];

  for (const outcome of settled) {
    if (outcome.status === "fulfilled") {
      results.push(...outcome.value);
    } else {
      errors.push(String(outcome.reason?.message || outcome.reason));
    }
  }

  if (results.length === 0 && errors.length > 0) {
    // All queries failed (e.g. bad/missing API key) - surface a clear error.
    throw new Error(errors[0]);
  }

  const seen = new Set<string>();
  const deduped = results.filter((r) => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  const sources = Array.from(new Set(deduped.map((r) => r.url)));

  return { results: deduped, sources };
}
