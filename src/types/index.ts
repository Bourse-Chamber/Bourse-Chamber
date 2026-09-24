/**
 * Bourse Chamber — Core TypeScript 5 Domain Types
 * Based on Dev Brief specifications (@bim 18 Sept 2026)
 */

export type TokenCaVote = 'SUPPORTED' | 'NOT_SUPPORTED' | 'INSUFFICIENT_EVIDENCE';
export type TokenCaAssessment = TokenCaVote | 'DIVIDED';

export type VoteOutcome = 'ADD' | 'REDUCE' | 'PASS' | 'DIVIDED' | TokenCaVote;

export type SeatNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface TokenCaSynthesisDetails {
  ca: string;
  network: string;
  currentMarketCap: string;
  targetMarketCap: string;
  requiredMultiple: number | null;
  requiredMultipleFormatted: string;
  liquidity: string;
  volume24h: string;
  buysSells: string;
  holderCount: string;
  holderConcentration: string;
  lpStatus: string;
  contractRisks: string;
  evidenceGaps: string[];
  conditionsRequired: string[];
  weakestConditions: string[];
  chamberAssessment: TokenCaAssessment;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  reason: string;
  targetInterpretation?: string;
  marketCapChangeRequired?: string;
  greatestObservableConstraint?: string;
  greatestConstraintEvidence?: string;
  contractAddress?: string;
  currentLiquidity?: string;
  overallFeasibility?: TokenCaAssessment;
  confidenceScore?: 'LOW' | 'MEDIUM' | 'HIGH';
  confidenceReason?: string;
  marketCapDiffFormatted?: string;
  fdvFormatted?: string;
  buySellRatio?: string;
  txnsFormatted?: string;
}

export interface FinalChamberSynthesis {
  question: string;
  keyEvidence?: string[];
  keyFindings: string[];
  areasOfAgreement: string;
  areasOfDisagreement: string;
  unresolvedIssues: string;
  conclusion: string;
  conciseConclusion?: string;
  mainFactor?: string;
  mainFactorReason?: string;
  caDetails?: TokenCaSynthesisDetails;
}

export interface CaEvidence {
  contractAddress: string;
  name: string;
  symbol: string;
  network: string;
  chainId: string;
  pairDex: string;
  pairAddress: string;
  tradingPair: string;
  price: number | 'DATA UNAVAILABLE';
  priceFormatted: string;
  marketCap: number | 'DATA UNAVAILABLE';
  marketCapFormatted: string;
  targetMarketCap: number | null;
  targetMarketCapFormatted: string;
  requiredMultiple: number | null;
  requiredMultipleFormatted: string;
  fdv: number | 'DATA UNAVAILABLE';
  fdvFormatted: string;
  liquidityUsd: number | 'DATA UNAVAILABLE';
  liquidityFormatted: string;
  volume24h: number | 'DATA UNAVAILABLE';
  volume24hFormatted: string;
  change24h: number | 'DATA UNAVAILABLE';
  txns24h: { buys: number | 'DATA UNAVAILABLE'; sells: number | 'DATA UNAVAILABLE' };
  buySellRatio: string;
  tokenAge: string;
  holders: string;
  holderConcentration: string;
  contractVerification: string;
  liquidityLock: string;
  contractRisks: string;
  isAvailable: boolean;
  isAmbiguous?: boolean;
  isNotFound?: boolean;
  source: string;
  retrievalDate: string;
  retrievedAt: string;
}

export interface AgentPersona {
  seat: SeatNumber;
  name: string;
  shortName: string;
  handle: string;
  discipline: string;
  era: string;
  bias: string;
  quote: string;
  bio: string;
  avatarSeed: string;
  color: string;
  primaryMetric: string;
  fatalFlaw: string;
  firstQuestion: string;
  questions: string[];
  systemPrompt: string;
  avatarImg?: string;
}

export interface MarketEvidence {
  ticker: string;
  name: string;
  price: number;
  priceFormatted: string;
  change24h: number;
  marketCap: number;
  marketCapFormatted: string;
  volume24h: number;
  volume24hFormatted: string;
  ath?: number;
  drawdownFromAthPct?: string;
  networkActivity: string;
  supply: string;
  macroContext: string;
  stakingApy?: number;
  revenuePDR?: number;
  retrievalDate: string;
  isDemoData: boolean;
  liveSource?: string;
  sparkline?: number[];
  dataGaps?: string[];
}

export interface TranscriptMessage {
  type: 'chair' | 'speaking' | 'challenge' | 'response' | 'vote' | 'verdict' | 'system' | 'final-synthesis';
  who: string;
  seat?: SeatNumber;
  time: string;
  text: string;
  modelUsed?: string;
}

export interface SeatVote {
  seat: SeatNumber;
  persona: string;
  shortName: string;
  vote: VoteOutcome;
  weight: number;
  rationale: string;
  timestamp?: string;
}

export interface VerdictRecord {
  id: string;
  sessionId: string;
  ticker: string;
  assetName: string;
  question: string;
  outcome: VoteOutcome;
  majorityRatio: string;
  dissentBreakdown: string;
  positionSizeBand: string;
  keyAgreement: string;
  keyDisagreement: string;
  unresolvedQuestion: string;
  reviewTriggers: string[];
  votes: SeatVote[];
  synthesis?: FinalChamberSynthesis;
  totalParticipants?: number;
  isSizingRequested?: boolean;
  timestamp: string;
}

export interface ChamberSession {
  id: string;
  question: string;
  ticker: string;
  assetName: string;
  createdAt: string;
  closedAt: string | null;
  evidence: MarketEvidence | null;
  speakingTurns: number;
  seatsPresent: string;
  directedMode: 'full_bench' | 'directed' | 'cross_exam';
  directedSeats: number[];
  votes: SeatVote[];
  verdict: VerdictRecord | null;
  transcript: TranscriptMessage[];
}

export interface WatchRecord {
  id: string;
  sessionId: string;
  asset: string;
  triggerCondition: string;
  drawdownThreshold: number;
  email: string;
  status: 'ACTIVE' | 'TRIGGERED' | 'DISMISSED';
  createdAt: string;
  lastCheckedAt?: string;
  lastTriggeredAt?: string;
}

export interface BudgetHudState {
  remainingCredits: number;
  dailyCap: number;
  resetIsoTimestamp: string;
}

export interface Round1Analysis {
  persona: string;
  analysis: string;
  key_claims: string[];
  risk: string;
  stance: VoteOutcome;
}

export interface Round2Duel {
  persona: string;
  challenge: string;
  response: string;
}

export interface Round3Vote {
  persona: string;
  vote: VoteOutcome;
  reason: string;
}

export interface AggregatedVerdict extends VerdictRecord {
  addCount: number;
  reduceCount: number;
  passCount: number;
  supportedCount?: number;
  notSupportedCount?: number;
  insufficientCount?: number;
  totalVotes: number;
  majorityCount: number;
  majority: boolean;
  tie: boolean;
  questionTopic?: string;
  tokenCaDetails?: TokenCaSynthesisDetails;
  conciseConclusion?: string;
  mainFactor?: string;
  mainFactorReason?: string;
}

