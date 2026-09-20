import { ChamberSession, WatchRecord, VerdictRecord } from '../types';

/**
 * Universal Database Client for Next.js 16 App Router
 * Seamlessly interfaces with Postgres (Neon/Supabase) or serverless fallback store
 */

export interface DatabaseAdapter {
  getSession(id: string): Promise<ChamberSession | null>;
  saveSession(session: ChamberSession): Promise<void>;
  listSessions(limit?: number): Promise<ChamberSession[]>;
  createWatch(watch: WatchRecord): Promise<void>;
  getActiveWatches(): Promise<WatchRecord[]>;
  getWatchesBySession(sessionId: string): Promise<WatchRecord[]>;
  updateWatchStatus(id: string, status: 'ACTIVE' | 'TRIGGERED' | 'DISMISSED'): Promise<void>;
}

// In-memory / Serverless runtime store
class MemoryDatabase implements DatabaseAdapter {
  private sessions: Map<string, ChamberSession> = new Map();
  private watches: Map<string, WatchRecord> = new Map();

  constructor() {
    // Seed canonical BC-0411
    this.sessions.set('BC-0411', {
      id: 'BC-0411',
      question: 'Is throughput a moat, or a commodity waiting to be priced?',
      ticker: 'SOL',
      assetName: 'Solana',
      createdAt: '2026-09-05T09:12:00Z',
      closedAt: '09:47',
      evidence: {
        ticker: 'SOL',
        name: 'Solana',
        price: 142.50,
        priceFormatted: '$142.50',
        change24h: 6.12,
        marketCap: 66800000000,
        marketCapFormatted: '$66.80B',
        volume24h: 4800000000,
        volume24hFormatted: '$4.80B',
        ath: 260,
        drawdownFromAthPct: '45.2',
        networkActivity: '2,850 sustained non-vote TPS; $5.2B DEX settlement',
        supply: '468.5M circulating',
        macroContext: 'High retail DEX throughput; hardware requirements centralizing validator set.',
        retrievalDate: '2026-09-05',
        isDemoData: true
      },
      speakingTurns: 18,
      seatsPresent: '9 / 9',
      directedMode: 'full_bench',
      directedSeats: [],
      votes: [
        { seat: 1, persona: 'Benjamin Graham', shortName: 'Graham', vote: 'PASS', weight: 1, rationale: 'No liquidation book value.' },
        { seat: 2, persona: 'Charlie Munger', shortName: 'Munger', vote: 'REDUCE', weight: 1, rationale: 'Hardware requirements lead to centralizing stupidity.' },
        { seat: 3, persona: 'Peter Lynch', shortName: 'Lynch', vote: 'ADD', weight: 1, rationale: 'Real retail DEX users.' },
        { seat: 4, persona: 'Cathie Wood', shortName: 'Wood', vote: 'ADD', weight: 1, rationale: 'Exponential throughput S-curve.' },
        { seat: 5, persona: 'Aswath Damodaran', shortName: 'Damodaran', vote: 'REDUCE', weight: 1, rationale: 'Token capture below cost of capital.' },
        { seat: 6, persona: 'Nassim Nicholas Taleb', shortName: 'Taleb', vote: 'REDUCE', weight: 1, rationale: 'Centralization creates fat tail ruin.' },
        { seat: 7, persona: 'Mohnish Pabrai', shortName: 'Pabrai', vote: 'ADD', weight: 1, rationale: 'Asymmetric retail upside.' },
        { seat: 8, persona: 'Bill Ackman', shortName: 'Ackman', vote: 'REDUCE', weight: 1, rationale: 'Lacks institutional governance protections.' },
        { seat: 9, persona: 'Michael Burry', shortName: 'Burry', vote: 'REDUCE', weight: 1, rationale: 'Hidden validator economic subsidies.' }
      ],
      verdict: {
        id: 'VR-0411',
        sessionId: 'BC-0411',
        ticker: 'SOL',
        assetName: 'Solana',
        question: 'Is throughput a moat, or a commodity waiting to be priced?',
        outcome: 'REDUCE',
        majorityRatio: '5 / 9',
        dissentBreakdown: '3 ADD, 1 PASS',
        positionSizeBand: '1.0 – 2.0%',
        keyAgreement: 'Solana has achieved genuine retail product-market fit in low-latency DEX activity.',
        keyDisagreement: 'Whether transaction execution throughput will remain a defensible competitive moat once rival rollups achieve sub-cent finality.',
        unresolvedQuestion: 'Can high validator hardware requirements and storage state growth survive without structural centralization?',
        reviewTriggers: [
          'Network activity declines materially below 1,500 non-vote TPS.',
          'Rival zero-knowledge rollup achieves sub-cent transactions at scale.',
          'Cumulative drawdown from cycle peak exceeds 30–35%.'
        ],
        votes: [],
        timestamp: '2026-09-05T09:47:00Z'
      },
      transcript: []
    });
  }

  async getSession(id: string): Promise<ChamberSession | null> {
    return this.sessions.get(id) || null;
  }

  async saveSession(session: ChamberSession): Promise<void> {
    this.sessions.set(session.id, session);
  }

  async listSessions(limit = 20): Promise<ChamberSession[]> {
    return Array.from(this.sessions.values()).slice(0, limit);
  }

  async createWatch(watch: WatchRecord): Promise<void> {
    this.watches.set(watch.id, watch);
  }

  async getActiveWatches(): Promise<WatchRecord[]> {
    return Array.from(this.watches.values()).filter(w => w.status === 'ACTIVE');
  }

  async getWatchesBySession(sessionId: string): Promise<WatchRecord[]> {
    return Array.from(this.watches.values()).filter(w => w.sessionId === sessionId);
  }

  async updateWatchStatus(id: string, status: 'ACTIVE' | 'TRIGGERED' | 'DISMISSED'): Promise<void> {
    const watch = this.watches.get(id);
    if (watch) {
      watch.status = status;
      this.watches.set(id, watch);
    }
  }
}

export const db: DatabaseAdapter = new MemoryDatabase();
