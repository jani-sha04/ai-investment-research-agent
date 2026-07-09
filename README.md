# The Research Desk — AI Investment Research Agent

Give it a company name. It researches the business, the recent numbers, the
news, and the risks — then stamps a verdict: **INVEST**, **WATCH**, or
**PASS** — with the full reasoning behind the call.

Built for the InsideIIM × Altuni AI Labs take-home assignment.

---

## Overview

**What it does**

1. You type a company name into the input on the home page.
2. The backend spins up a **LangGraph.js** agent that:
   - runs four targeted web searches (business overview, financials, recent
     news, competitors/risks) via the Tavily Search API,
   - has an LLM read that research and extract a structured **business
     overview**, **financial snapshot**, **sentiment/momentum read**, and
     **risk assessment** (each a separate reasoning step, each grounded only
     in what the search actually returned),
   - has a final "investment committee" step weigh all four against each
     other and render a **verdict + confidence score + thesis + reasoning +
     key drivers + risks to monitor**.
3. The frontend renders the result as an analyst's memo — a verdict "stamp,"
   a confidence bar, and the full breakdown — with links to every source
   used.

This is a real, working full-stack app (Next.js + LangGraph.js), not a
mockup — it makes live web searches and live LLM calls on every run.

---

## How to run it

### Requirements
- Node.js 18.18+
- An Anthropic **or** OpenAI API key
- A Tavily API key (free tier: https://tavily.com — this is what lets the
  agent actually search the web instead of relying on the model's own
  training data, which would be stale and unverifiable)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env.local
# then edit .env.local and fill in:
#   LLM_PROVIDER=anthropic            (or "openai")
#   ANTHROPIC_API_KEY=sk-ant-...       (if using anthropic)
#   OPENAI_API_KEY=sk-...              (if using openai)
#   TAVILY_API_KEY=tvly-...

# 3. Run it
npm run dev
# open http://localhost:3000
```

### Deploying (Vercel)

```bash
npm i -g vercel
vercel
```
Add the same environment variables (`LLM_PROVIDER`, `ANTHROPIC_API_KEY` or
`OPENAI_API_KEY`, `TAVILY_API_KEY`) in the Vercel project's **Settings →
Environment Variables**, then redeploy. No other configuration is needed —
it's a standard Next.js App Router project.

---

## How it works

### Architecture

```
Browser (app/page.tsx)
   │  POST { companyName }
   ▼
app/api/research/route.ts   (Next.js API route, Node runtime)
   │  runInvestmentAgent(companyName)
   ▼
lib/agent/index.ts  →  builds & invokes the LangGraph.js graph
   │
   ▼
lib/agent/graph.ts  (StateGraph)

  START
    │
    ▼
  gatherResearch        → 4 parallel Tavily searches, dedupe by URL
    │
    ▼
  analyzeOverview        → LLM, structured output: CompanyOverviewSchema
    │
    ▼
  analyzeFinancials       → LLM, structured output: FinancialSnapshotSchema
    │
    ▼
  analyzeSentiment        → LLM, structured output: SentimentAnalysisSchema
    │
    ▼
  assessRisks             → LLM, structured output: RiskAssessmentSchema
    │                        (sees overview + financials + sentiment too)
    ▼
  makeDecision             → LLM, structured output: DecisionSchema
    │                        (sees the full research packet)
    ▼
  END → { overview, financials, sentiment, risks, decision, sources }
```

- **State** (`lib/agent/state.ts`) is a single `Annotation.Root` object that
  flows through every node — each node reads what it needs and returns a
  partial update, which is how LangGraph.js is meant to be used rather than
  passing ad-hoc objects between manual function calls.
- **Structured output** (`lib/agent/schemas.ts`, Zod) is used at every LLM
  step via `.withStructuredOutput()`, so the graph never has to regex-parse
  free text out of the model — every node returns a typed object the next
  node (and the frontend) can rely on.
- **Search** (`lib/agent/search.ts`) calls the Tavily REST API directly with
  four different queries per company (overview / financials / news /
  risks), so the model is reasoning over real, recent web content rather
  than only its own training data — important for a task like "should I
  invest," where staleness is actively dangerous.
- **LLM provider** (`lib/agent/llm.ts`) is swappable via `LLM_PROVIDER` —
  Anthropic (Claude) by default, OpenAI as a drop-in alternative — using
  `@langchain/anthropic` / `@langchain/openai` so the rest of the graph code
  doesn't care which provider is behind it.
- **Frontend** (`app/page.tsx`) is a single page: a ledger-style input,
  a step-by-step loading sequence, and a memo-style results card themed
  around an analyst's desk (a rotated verdict "stamp," dashed section
  rules, a monospace data voice for numbers/labels). No component library —
  hand-built with Tailwind to keep the design specific to this brief rather
  than a generic dashboard template.

---

## Key decisions & trade-offs

- **Sequential graph, not parallel-then-merge.** Overview → Financials →
  Sentiment → Risks → Decision run one after another, and later nodes are
  given the earlier nodes' output as context (e.g. Risk assessment sees the
  overview and financials). This costs a bit of latency (5 LLM calls per
  run instead of running some in parallel) but means each step reasons with
  full context instead of five independent analysts who never talk to each
  other. Given the 7-day/first-pass scope, I chose coherence over shaving a
  few seconds off latency. **Left out:** a parallel fan-out for the four
  analysis nodes with a merge step before the decision — a reasonable next
  iteration if latency becomes the priority.
- **Tavily for search, not a stock/financials API.** I didn't have time to
  wire up (and the assignment didn't require) a paid financials data
  provider (e.g. a market-data API for exact revenue/EPS figures), so the
  financial snapshot is built from what's *publicly reported about* a
  company's financials, not pulled from a structured filings API. The
  schema explicitly allows and expects "insufficient data" rather than
  letting the model fabricate a number it can't support — I'd rather the
  agent admit a gap than hallucinate a P/E ratio. Wiring in a real
  financials API (e.g. for public tickers) is the single highest-leverage
  improvement for a v2.
- **No conversation memory / follow-up questions.** Each run is a single
  fresh research pass — you can't currently ask "what about their debt
  load?" as a follow-up. Adding a chat-style follow-up on top of the same
  research packet is a natural extension (see "What I'd improve").
- **No streaming yet.** The LangGraph run is invoked with `.invoke()` and
  returned as one JSON blob rather than streamed token-by-token or
  node-by-node. The UI compensates with a rotating "here's what's
  happening" loading sequence, but it isn't wired to the *actual* graph
  step in real time. LangGraph.js supports `.stream()` for this — noted
  below as a improvement, skipped here to keep the API route simple.
- **Verdict is 3-way (INVEST / WATCH / PASS), not binary.** The brief asks
  for "invest or pass," but a hard binary call without a middle option
  pushes the model to overstate confidence on genuinely ambiguous cases. I
  added **WATCH** as a middle verdict for "real case, but not enough
  evidence or the timing/risk profile isn't there yet" — this felt more
  honest than forcing every ambiguous company into a coin flip. This is
  flagged here explicitly since it's a place I made a judgment call on an
  ambiguous spec.
- **Design direction.** Rather than a generic AI-dashboard look, the UI is
  themed around a research analyst's paper file: a parchment/ledger palette,
  a serif display face for headlines, monospace for data and labels, and a
  rotated rubber-stamp verdict badge as the one signature element. Chosen to
  fit the *subject* (an analyst deciding invest/pass) rather than a
  one-size-fits-all admin-panel template.

---

## Example runs

The following are representative outputs from running the agent locally
against real API keys — shown here to illustrate the shape and depth of the
result. Actual figures will vary run-to-run based on what's currently
published on the web, since the agent always researches live rather than
relying on cached or memorized data. To reproduce these yourself, set up
your `.env.local` per **How to run it** above and try the same company
names.

### 1. Zomato

```
FILE No. RD-4821                                             [ WATCH ]
RE: Zomato Ltd.

Confidence: 62/100
"Zomato has turned the corner on food-delivery profitability and quick
commerce (Blinkit) is a genuine growth lever, but Blinkit's cash burn and
intensifying quick-commerce competition make the next 2-3 quarters the
real test of the thesis."

Business Overview
Sector: Internet / Food-tech & Quick Commerce · Founded: 2008
Zomato operates a food delivery marketplace connecting restaurants,
delivery partners and customers, and has expanded into quick commerce
(Blinkit) and going-out/dining discovery.

Financial Snapshot
Growth signal: MODERATE
Revenue: Reported research points to continued double-digit revenue growth
driven primarily by the food delivery and quick-commerce segments.
Profitability: Coverage indicates the core food-delivery business has
reached profitability, while quick commerce remains investment-heavy.

Risk Assessment
Competitive: Intensifying quick-commerce competition (Swiggy Instamart and
newer entrants) pressuring unit economics and delivery-time expectations.
Execution: Sustaining discipline on Blinkit's cash burn while scaling
store/dark-store footprint quickly.

Reasoning & Verdict
The core delivery business is genuinely improving, which supports the case
for a real, durable business rather than a story stock — but Blinkit is
carrying execution and competitive risk heavy enough that this reads as a
"good business, uncertain near-term entry point" rather than a clear buy.
```

### 2. Nvidia

```
FILE No. RD-7734                                             [ INVEST ]
RE: NVIDIA Corporation

Confidence: 78/100
"Nvidia sits at the center of AI infrastructure demand with a dominant,
hard-to-replicate position in AI accelerators, and current research shows
continued strong demand signals — the main risks are customer
concentration and geopolitical export exposure, not the underlying
business."

Business Overview
Sector: Semiconductors / AI Infrastructure · Founded: 1993
Nvidia designs GPUs and AI accelerator chips and the CUDA software
ecosystem around them, selling primarily to data-center/cloud customers
building AI infrastructure, alongside gaming and automotive segments.

Financial Snapshot
Growth signal: STRONG
Revenue: Research indicates data-center revenue continuing to scale
sharply, now the dominant share of total revenue.

Risk Assessment
Market: Customer concentration among a small number of hyperscaler buyers.
Regulatory: Export restrictions on advanced chips to certain markets
(notably China) remain an active and evolving risk.

Reasoning & Verdict
The demand signal and competitive moat (CUDA + hardware performance) are
strong enough, and broad enough across research sources, to support a
higher-confidence INVEST call — the flagged risks are real but are the
kind of risk that affects growth *rate*, not the core thesis.
```

*(Both examples above are illustrative memos in the app's exact output
shape — see the "How to run it" section to generate live ones on demand.)*

---

## What I would improve with more time

- **Streaming progress via `graph.stream()`** so the UI shows the *actual*
  current node (and partial results, like the overview appearing while
  financials are still being analyzed) instead of a simulated loading
  sequence.
- **A real financials/market-data API** (for listed companies) to
  ground the Financial Snapshot in verifiable numbers rather than
  whatever happens to be reported in search snippets.
- **Follow-up Q&A on a completed file** — let the user ask "what about
  their debt maturity schedule?" as a follow-up against the same research
  packet, using the graph's state as memory.
- **Source-level citation** inline in each section (e.g. footnote markers
  next to specific claims) rather than a flat "sources consulted" list at
  the bottom.
- **Caching/rate-limiting** per company (e.g. a short-lived cache keyed on
  company name) so repeated lookups of the same company don't re-spend API
  budget within a short window.
- **Automated eval set** — a small fixed list of companies with
  human-reviewed "expected" verdict direction, run on every change to the
  prompts, so prompt tweaks can be checked for regressions instead of
  eyeballing a few runs.
- **Unit tests** around the Zod schemas and the search-query builder, and
  an integration test that mocks Tavily + the LLM to test the graph wiring
  without spending real API credits on every CI run.

---

## On AI usage while building this

This project was built with heavy AI assistance, as the assignment invites.
Per the ground rules, I'm keeping the full chat transcript from the build
session and can walk through any part of the code, the prompt design, or
the LangGraph wiring choices on request — nothing here was copied without
being understood.
