/**
 * Bourse Chamber — Core TypeScript 5 Domain Types
 * Based on Dev Brief specifications (@bim 18 Sept 2026)
 */

export type VoteOutcome = 'ADD' | 'REDUCE' | 'PASS';

export type SeatNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

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
  type: 'chair' | 'speaking' | 'challenge' | 'response' | 'vote' | 'verdict' | 'system';
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
