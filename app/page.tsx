"use client";

import { useState, useEffect, useRef } from "react";

interface CompanyOverview {
  legalOrCommonName: string;
  sector: string;
  businessModel: string;
  founded: string;
  keyProducts: string[];
}

interface FinancialSnapshot {
  revenueTrend: string;
  profitability: string;
  growthSignal: "strong" | "moderate" | "weak" | "declining" | "unclear";
  valuationNotes: string;
  balanceSheetNotes: string;
}

interface SentimentAnalysis {
  overallSentiment: "positive" | "mixed" | "negative" | "neutral";
  momentum: string;
  notableHeadlines: string[];
}

interface RiskAssessment {
  marketRisks: string[];
  competitiveRisks: string[];
  regulatoryOrLegalRisks: string[];
  executionRisks: string[];
  severityNote: string;
}

interface Decision {
  verdict: "INVEST" | "WATCH" | "PASS";
  confidence: number;
  thesis: string;
  keyDrivers: string[];
  risksToMonitor: string[];
  reasoning: string;
}

interface AgentResult {
  companyName: string;
  overview: CompanyOverview | null;
  financials: FinancialSnapshot | null;
  sentiment: SentimentAnalysis | null;
  risks: RiskAssessment | null;
  decision: Decision | null;
  sources: string[];
  log: string[];
}

const LOADING_STEPS = [
  "Opening a new file...",
  "Pulling public filings and coverage...",
  "Reading the business model...",
  "Checking the numbers...",
  "Reading the room (news & sentiment)...",
  "Weighing the risks...",
  "Drafting the memo...",
  "Reaching for the stamp..."
];

const VERDICT_STYLES: Record<
  Decision["verdict"],
  { text: string; bg: string; border: string }
> = {
  INVEST: { text: "text-verdict-invest", bg: "bg-verdict-investBg", border: "border-verdict-invest" },
  WATCH: { text: "text-verdict-watch", bg: "bg-verdict-watchBg", border: "border-verdict-watch" },
  PASS: { text: "text-verdict-pass", bg: "bg-verdict-passBg", border: "border-verdict-pass" }
};

function todayLedgerDate() {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  });
}

function fileNumber(companyName: string) {
  let hash = 0;
  for (let i = 0; i < companyName.length; i++) {
    hash = (hash * 31 + companyName.charCodeAt(i)) >>> 0;
  }
  return `RD-${(hash % 9000) + 1000}`;
}

export default function Home() {
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AgentResult | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (loading) {
      setStepIndex(0);
      timerRef.current = setInterval(() => {
        setStepIndex((i) => (i + 1 < LOADING_STEPS.length ? i + 1 : i));
      }, 1400);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: companyName.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-3xl">
        {/* Hero */}
        <header className="mb-10 border-b-2 border-ledger-ink pb-6">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-ledger-brassDark">
            The Research Desk
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-ledger-ink sm:text-5xl">
            Name a company.
            <br />
            We&rsquo;ll open a file on it.
          </h1>
          <p className="mt-3 max-w-xl font-body text-ledger-inkSoft">
            An AI research agent reads up on the business, the numbers, the
            recent news, and the risks &mdash; then stamps a verdict:{" "}
            <span className="font-semibold text-verdict-invest">Invest</span>,{" "}
            <span className="font-semibold text-verdict-watch">Watch</span>,
            or <span className="font-semibold text-verdict-pass">Pass</span> &mdash;
            with the reasoning behind it.
          </p>
        </header>

        {/* Input ledger line */}
        <form onSubmit={handleSubmit} className="mb-10">
          <label
            htmlFor="company"
            className="mb-2 block font-mono text-xs uppercase tracking-widest text-ledger-inkSoft"
          >
            Company
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="company"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Zomato, Tata Motors, Nvidia..."
              className="w-full flex-1 border-b-2 border-ledger-line bg-transparent px-1 py-3 font-display text-2xl text-ledger-ink placeholder:text-ledger-line/80 focus:border-ledger-brass focus:outline-none focus-visible:ring-2 focus-visible:ring-ledger-brass"
              disabled={loading}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={loading || !companyName.trim()}
              className="whitespace-nowrap rounded-sm bg-ledger-ink px-6 py-3 font-mono text-sm uppercase tracking-widest text-ledger-paper transition hover:bg-ledger-brassDark disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-ledger-brass focus-visible:ring-offset-2"
            >
              {loading ? "Researching…" : "Open the file"}
            </button>
          </div>
        </form>

        {/* Loading state */}
        {loading && (
          <div className="ledger-card rounded-sm p-6">
            <p className="font-mono text-sm text-ledger-inkSoft">
              {LOADING_STEPS[stepIndex]}
              <span className="caret">_</span>
            </p>
            <div className="mt-4 h-1 w-full overflow-hidden rounded bg-ledger-line/50">
              <div
                className="h-full bg-ledger-brass transition-all duration-700"
                style={{
                  width: `${((stepIndex + 1) / LOADING_STEPS.length) * 100}%`
                }}
              />
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="rounded-sm border-2 border-verdict-pass bg-verdict-passBg p-5 font-body text-ledger-ink">
            <p className="font-mono text-xs uppercase tracking-widest text-verdict-pass">
              Couldn&rsquo;t finish the file
            </p>
            <p className="mt-2">{error}</p>
            <p className="mt-2 text-sm text-ledger-inkSoft">
              Check that your API keys are set in <code>.env.local</code> (see
              the README) and try again.
            </p>
          </div>
        )}

        {/* Results memo */}
        {result && !loading && (
          <article className="ledger-card rounded-sm p-6 sm:p-8">
            {/* Memo header */}
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-ledger-line pb-4 font-mono text-xs uppercase tracking-widest text-ledger-inkSoft">
              <div>
                <p>File No. {fileNumber(result.companyName)}</p>
                <p>Date: {todayLedgerDate()}</p>
                <p>Analyst: Research Desk Agent</p>
              </div>
              {result.decision && (
                <div
                  className={`stamp ${VERDICT_STYLES[result.decision.verdict].text} ${
                    VERDICT_STYLES[result.decision.verdict].bg
                  }`}
                >
                  {result.decision.verdict}
                </div>
              )}
            </div>

            <h2 className="font-display text-2xl font-semibold text-ledger-ink">
              RE: {result.overview?.legalOrCommonName || result.companyName}
            </h2>

            {result.decision && (
              <div className="mt-4">
                <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest text-ledger-inkSoft">
                  <span>Confidence</span>
                  <span>{result.decision.confidence}/100</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded bg-ledger-line/50">
                  <div
                    className={`h-full ${
                      result.decision.verdict === "INVEST"
                        ? "bg-verdict-invest"
                        : result.decision.verdict === "WATCH"
                        ? "bg-verdict-watch"
                        : "bg-verdict-pass"
                    }`}
                    style={{ width: `${result.decision.confidence}%` }}
                  />
                </div>
                <p className="mt-3 font-body text-lg italic text-ledger-ink">
                  &ldquo;{result.decision.thesis}&rdquo;
                </p>
              </div>
            )}

            <Section title="Business Overview">
              {result.overview && (
                <div className="space-y-2 text-ledger-ink">
                  <p>
                    <span className="font-semibold">Sector:</span>{" "}
                    {result.overview.sector} &nbsp;·&nbsp;{" "}
                    <span className="font-semibold">Founded:</span>{" "}
                    {result.overview.founded}
                  </p>
                  <p>{result.overview.businessModel}</p>
                  {result.overview.keyProducts.length > 0 && (
                    <ul className="list-inside list-disc text-ledger-inkSoft">
                      {result.overview.keyProducts.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </Section>

            <Section title="Financial Snapshot">
              {result.financials && (
                <div className="space-y-2 text-ledger-ink">
                  <p>
                    <span className="font-semibold">Growth signal:</span>{" "}
                    <span className="uppercase">{result.financials.growthSignal}</span>
                  </p>
                  <p>
                    <span className="font-semibold">Revenue:</span>{" "}
                    {result.financials.revenueTrend}
                  </p>
                  <p>
                    <span className="font-semibold">Profitability:</span>{" "}
                    {result.financials.profitability}
                  </p>
                  <p>
                    <span className="font-semibold">Valuation:</span>{" "}
                    {result.financials.valuationNotes}
                  </p>
                  <p>
                    <span className="font-semibold">Balance sheet:</span>{" "}
                    {result.financials.balanceSheetNotes}
                  </p>
                </div>
              )}
            </Section>

            <Section title="Sentiment &amp; Momentum">
              {result.sentiment && (
                <div className="space-y-2 text-ledger-ink">
                  <p>
                    <span className="font-semibold">Overall tone:</span>{" "}
                    <span className="uppercase">{result.sentiment.overallSentiment}</span>
                  </p>
                  <p>{result.sentiment.momentum}</p>
                  {result.sentiment.notableHeadlines.length > 0 && (
                    <ul className="list-inside list-disc text-ledger-inkSoft">
                      {result.sentiment.notableHeadlines.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </Section>

            <Section title="Risk Assessment">
              {result.risks && (
                <div className="space-y-3 text-ledger-ink">
                  <p className="text-ledger-inkSoft">{result.risks.severityNote}</p>
                  <RiskGroup label="Market" items={result.risks.marketRisks} />
                  <RiskGroup label="Competitive" items={result.risks.competitiveRisks} />
                  <RiskGroup
                    label="Regulatory / Legal"
                    items={result.risks.regulatoryOrLegalRisks}
                  />
                  <RiskGroup label="Execution" items={result.risks.executionRisks} />
                </div>
              )}
            </Section>

            {result.decision && (
              <Section title="Reasoning &amp; Verdict">
                <div className="space-y-4 text-ledger-ink">
                  <p>{result.decision.reasoning}</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="font-mono text-xs uppercase tracking-widest text-ledger-inkSoft">
                        Key drivers
                      </p>
                      <ul className="mt-1 list-inside list-disc">
                        {result.decision.keyDrivers.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-mono text-xs uppercase tracking-widest text-ledger-inkSoft">
                        Risks to monitor
                      </p>
                      <ul className="mt-1 list-inside list-disc">
                        {result.decision.risksToMonitor.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </Section>
            )}

            {result.sources.length > 0 && (
              <Section title="Sources Consulted">
                <ul className="space-y-1 font-mono text-xs text-ledger-inkSoft">
                  {result.sources.map((s, i) => (
                    <li key={i} className="truncate">
                      <a
                        href={s}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-ledger-line decoration-dotted underline-offset-2 hover:text-ledger-brassDark"
                      >
                        {s}
                      </a>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </article>
        )}

        <footer className="mt-12 text-center font-mono text-xs text-ledger-inkSoft">
          Built for the AI Product Development Engineer take-home &middot;
          InsideIIM × Altuni AI Labs
        </footer>
      </div>
    </main>
  );
}

function Section({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="ledger-rule mt-6 pt-6">
      <h3 className="mb-2 font-mono text-xs uppercase tracking-widest text-ledger-brassDark">
        {title}
      </h3>
      {children}
    </section>
  );
}

function RiskGroup({ label, items }: { label: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <p className="font-semibold">{label}</p>
      <ul className="list-inside list-disc text-ledger-inkSoft">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}
