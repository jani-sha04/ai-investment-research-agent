import { StateGraph, START, END } from "@langchain/langgraph";
import { getLLM } from "./llm";
import { runResearchQueries, SearchResult } from "./search";
import {
  CompanyOverviewSchema,
  FinancialSnapshotSchema,
  SentimentAnalysisSchema,
  RiskAssessmentSchema,
  DecisionSchema
} from "./schemas";
import {
  OVERVIEW_SYSTEM_PROMPT,
  FINANCIALS_SYSTEM_PROMPT,
  SENTIMENT_SYSTEM_PROMPT,
  RISK_SYSTEM_PROMPT,
  DECISION_SYSTEM_PROMPT
} from "./prompts";
import { AgentState, AgentStateType } from "./state";

function formatResults(results: SearchResult[], maxSnippetChars = 1400): string {
  if (results.length === 0) return "(no search results found)";
  return results
    .map(
      (r, i) =>
        `[${i + 1}] "${r.title}" (${r.url})\n${r.content.slice(0, maxSnippetChars)}`
    )
    .join("\n\n");
}

// ---------------------------------------------------------------------------
// Node 1: gather research via web search
// ---------------------------------------------------------------------------
async function gatherResearchNode(state: AgentStateType) {
  const { results, sources } = await runResearchQueries(state.companyName);
  return {
    researchResults: results,
    sources,
    log: [`Gathered ${results.length} sources across 4 targeted searches.`]
  };
}

// ---------------------------------------------------------------------------
// Node 2: business overview
// ---------------------------------------------------------------------------
async function analyzeOverviewNode(state: AgentStateType) {
  const llm = (getLLM({ temperature: 0.1 }) as any).withStructuredOutput(
    CompanyOverviewSchema,
    { name: "company_overview" }
  );
  const overview = await llm.invoke([
    { role: "system", content: OVERVIEW_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Company: ${state.companyName}\n\nRaw research:\n${formatResults(
        state.researchResults
      )}`
    }
  ]);
  return { overview, log: ["Built company overview."] };
}

// ---------------------------------------------------------------------------
// Node 3: financial snapshot
// ---------------------------------------------------------------------------
async function analyzeFinancialsNode(state: AgentStateType) {
  const llm = (getLLM({ temperature: 0.1 }) as any).withStructuredOutput(
    FinancialSnapshotSchema,
    { name: "financial_snapshot" }
  );
  const financials = await llm.invoke([
    { role: "system", content: FINANCIALS_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Company: ${state.companyName}\n\nRaw research:\n${formatResults(
        state.researchResults
      )}`
    }
  ]);
  return { financials, log: ["Extracted financial snapshot."] };
}

// ---------------------------------------------------------------------------
// Node 4: sentiment / momentum
// ---------------------------------------------------------------------------
async function analyzeSentimentNode(state: AgentStateType) {
  const llm = (getLLM({ temperature: 0.2 }) as any).withStructuredOutput(
    SentimentAnalysisSchema,
    { name: "sentiment_analysis" }
  );
  const sentiment = await llm.invoke([
    { role: "system", content: SENTIMENT_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Company: ${state.companyName}\n\nRaw research:\n${formatResults(
        state.researchResults
      )}`
    }
  ]);
  return { sentiment, log: ["Assessed news sentiment and momentum."] };
}

// ---------------------------------------------------------------------------
// Node 5: risk assessment
// ---------------------------------------------------------------------------
async function assessRisksNode(state: AgentStateType) {
  const llm = (getLLM({ temperature: 0.1 }) as any).withStructuredOutput(
    RiskAssessmentSchema,
    { name: "risk_assessment" }
  );
  const risks = await llm.invoke([
    { role: "system", content: RISK_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Company: ${state.companyName}

Overview so far: ${JSON.stringify(state.overview)}
Financials so far: ${JSON.stringify(state.financials)}
Sentiment so far: ${JSON.stringify(state.sentiment)}

Raw research:
${formatResults(state.researchResults)}`
    }
  ]);
  return { risks, log: ["Assessed market, competitive, regulatory and execution risks."] };
}

// ---------------------------------------------------------------------------
// Node 6: final decision
// ---------------------------------------------------------------------------
async function makeDecisionNode(state: AgentStateType) {
  const llm = (getLLM({ temperature: 0.2 }) as any).withStructuredOutput(DecisionSchema, {
    name: "investment_decision"
  });
  const decision = await llm.invoke([
    { role: "system", content: DECISION_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Company: ${state.companyName}

RESEARCH PACKET

Overview:
${JSON.stringify(state.overview, null, 2)}

Financial snapshot:
${JSON.stringify(state.financials, null, 2)}

Sentiment analysis:
${JSON.stringify(state.sentiment, null, 2)}

Risk assessment:
${JSON.stringify(state.risks, null, 2)}

Make your final call.`
    }
  ]);
  return { decision, log: ["Rendered final verdict."] };
}

export function buildAgentGraph() {
  const graph = new StateGraph(AgentState)
    .addNode("gatherResearch", gatherResearchNode)
    .addNode("analyzeOverview", analyzeOverviewNode)
    .addNode("analyzeFinancials", analyzeFinancialsNode)
    .addNode("analyzeSentiment", analyzeSentimentNode)
    .addNode("assessRisks", assessRisksNode)
    .addNode("makeDecision", makeDecisionNode)
    .addEdge(START, "gatherResearch")
    .addEdge("gatherResearch", "analyzeOverview")
    .addEdge("analyzeOverview", "analyzeFinancials")
    .addEdge("analyzeFinancials", "analyzeSentiment")
    .addEdge("analyzeSentiment", "assessRisks")
    .addEdge("assessRisks", "makeDecision")
    .addEdge("makeDecision", END);

  return graph.compile();
}
