import { buildAgentGraph } from "./graph";
import { AgentStateType } from "./state";

export interface AgentResult {
  companyName: string;
  overview: AgentStateType["overview"];
  financials: AgentStateType["financials"];
  sentiment: AgentStateType["sentiment"];
  risks: AgentStateType["risks"];
  decision: AgentStateType["decision"];
  sources: string[];
  log: string[];
}

export async function runInvestmentAgent(companyName: string): Promise<AgentResult> {
  const app = buildAgentGraph();

  const finalState = (await app.invoke({
    companyName
  })) as AgentStateType;

  return {
    companyName,
    overview: finalState.overview,
    financials: finalState.financials,
    sentiment: finalState.sentiment,
    risks: finalState.risks,
    decision: finalState.decision,
    sources: finalState.sources,
    log: finalState.log
  };
}
