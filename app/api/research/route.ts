import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runInvestmentAgent } from "@/lib/agent";

// LangGraph/LangChain need Node APIs (fetch with streaming, etc.) - run on
// the Node.js runtime rather than the Edge runtime.
export const runtime = "nodejs";
// This can take a while (multiple LLM calls + web searches) - avoid caching.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const RequestSchema = z.object({
  companyName: z.string().trim().min(2).max(120)
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please provide a valid company name (2-120 characters)." },
      { status: 400 }
    );
  }

  try {
    const result = await runInvestmentAgent(parsed.data.companyName);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Agent run failed:", err);
    return NextResponse.json(
      {
        error:
          err?.message ||
          "The research agent hit an unexpected error. Check server logs for details."
      },
      { status: 500 }
    );
  }
}
