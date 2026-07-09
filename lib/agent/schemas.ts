import { z } from "zod";

export const CompanyOverviewSchema = z.object({
  legalOrCommonName: z.string().describe("The company's common/legal name"),
  sector: z.string().describe("Industry / sector the company operates in"),
  businessModel: z
    .string()
    .describe("2-4 sentence plain-English summary of how the company makes money"),
  founded: z.string().describe("Founding year or 'unknown' if not found"),
  keyProducts: z.array(z.string()).describe("Main products, services, or revenue lines")
});
export type CompanyOverview = z.infer<typeof CompanyOverviewSchema>;

export const FinancialSnapshotSchema = z.object({
  revenueTrend: z
    .string()
    .describe("What the research shows about revenue direction and scale, or 'insufficient data'"),
  profitability: z
    .string()
    .describe("Notes on margins, profit/loss, or 'insufficient data'"),
  growthSignal: z
    .enum(["strong", "moderate", "weak", "declining", "unclear"])
    .describe("Overall growth signal inferred from the research"),
  valuationNotes: z
    .string()
    .describe("Any valuation, market cap, or stock performance context found, or 'not found'"),
  balanceSheetNotes: z
    .string()
    .describe("Debt, cash position, or funding notes found, or 'not found'")
});
export type FinancialSnapshot = z.infer<typeof FinancialSnapshotSchema>;

export const SentimentAnalysisSchema = z.object({
  overallSentiment: z
    .enum(["positive", "mixed", "negative", "neutral"])
    .describe("Overall tone of recent news/coverage"),
  momentum: z
    .string()
    .describe("2-3 sentences on recent momentum: product launches, expansion, funding, leadership changes etc."),
  notableHeadlines: z
    .array(z.string())
    .describe("Short paraphrased (not quoted) summaries of the most relevant recent stories found")
});
export type SentimentAnalysis = z.infer<typeof SentimentAnalysisSchema>;

export const RiskAssessmentSchema = z.object({
  marketRisks: z.array(z.string()).describe("Market/demand-side risks"),
  competitiveRisks: z.array(z.string()).describe("Competitive positioning risks"),
  regulatoryOrLegalRisks: z.array(z.string()).describe("Regulatory, legal, or compliance risks"),
  executionRisks: z.array(z.string()).describe("Team, operations, or execution risks"),
  severityNote: z
    .string()
    .describe("1-2 sentence overall read on how severe these risks are right now")
});
export type RiskAssessment = z.infer<typeof RiskAssessmentSchema>;

export const DecisionSchema = z.object({
  verdict: z
    .enum(["INVEST", "WATCH", "PASS"])
    .describe(
      "INVEST = compelling case with acceptable risk, WATCH = interesting but needs more evidence or a better entry point, PASS = case is weak or risk outweighs opportunity"
    ),
  confidence: z
    .number()
    .min(0)
    .max(100)
    .describe("Confidence in this verdict, 0-100"),
  thesis: z
    .string()
    .describe("2-3 sentence investment thesis summarizing the core argument for the verdict"),
  keyDrivers: z
    .array(z.string())
    .describe("3-5 bullet points that most strongly support the verdict"),
  risksToMonitor: z
    .array(z.string())
    .describe("3-5 bullet points on what could invalidate the thesis"),
  reasoning: z
    .string()
    .describe(
      "4-6 sentence full reasoning walking through overview, financials, sentiment and risk to arrive at the verdict, written like an analyst memo"
    )
});
export type Decision = z.infer<typeof DecisionSchema>;
