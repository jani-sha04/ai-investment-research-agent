import { Annotation } from "@langchain/langgraph";
import { SearchResult } from "./search";
import {
  CompanyOverview,
  FinancialSnapshot,
  SentimentAnalysis,
  RiskAssessment,
  Decision
} from "./schemas";

/**
 * Shared state that flows through every node of the graph. Each node reads
 * what it needs and writes its own slice; LangGraph merges partial updates
 * back into this object between steps.
 */
export const AgentState = Annotation.Root({
  companyName: Annotation<string>(),
  researchResults: Annotation<SearchResult[]>({
    reducer: (_, next) => next,
    default: () => []
  }),
  sources: Annotation<string[]>({
    reducer: (_, next) => next,
    default: () => []
  }),
  overview: Annotation<CompanyOverview | null>({
    reducer: (_, next) => next,
    default: () => null
  }),
  financials: Annotation<FinancialSnapshot | null>({
    reducer: (_, next) => next,
    default: () => null
  }),
  sentiment: Annotation<SentimentAnalysis | null>({
    reducer: (_, next) => next,
    default: () => null
  }),
  risks: Annotation<RiskAssessment | null>({
    reducer: (_, next) => next,
    default: () => null
  }),
  decision: Annotation<Decision | null>({
    reducer: (_, next) => next,
    default: () => null
  }),
  log: Annotation<string[]>({
    reducer: (curr, next) => curr.concat(next),
    default: () => []
  })
});

export type AgentStateType = typeof AgentState.State;
