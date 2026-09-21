import { ChamberSession, WatchRecord, VerdictRecord, MarketEvidence, SeatVote } from '../types';

/**
 * Universal Database Client for Next.js 16 App Router & PostgreSQL
 * Supports:
 * 1. PostgreSQL (Neon / Supabase / local) via DATABASE_URL
 * 2. In-Memory / SQLite fallback when DATABASE_URL is not set
 */

export interface DatabaseAdapter {
  init(): Promise<void>;
  getSession(id: string): Promise<ChamberSession | null>;
  saveSession(session: ChamberSession): Promise<void>;
  listSessions(limit?: number): Promise<ChamberSession[]>;
  createWatch(watch: WatchRecord): Promise<void>;
  getActiveWatches(): Promise<WatchRecord[]>;
  getWatchesBySession(sessionId: string): Promise<WatchRecord[]>;
  updateWatchTriggered(id: string): Promise<void>;
  updateWatchStatus(id: string, status: 'ACTIVE' | 'TRIGGERED' | 'DISMISSED'): Promise<void>;
}

class PostgresDatabase implements DatabaseAdapter {
  private pool: any = null;
  private isInitialized = false;
  private fallback: MemoryDatabase | null = null;

  constructor(private connectionString: string) {}

  private getFallbackStore(): MemoryDatabase {
    if (!this.fallback) {
      this.fallback = new MemoryDatabase();
    }
    return this.fallback;
  }

  private async getPool() {
    if (!this.pool) {
      try {
        const { Pool } = await import('pg');
        this.pool = new Pool({
          connectionString: this.connectionString,
          ssl: this.connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 4000,
        });
        this.pool.on('error', (err: any) => {
          console.warn('PostgreSQL pool background error:', err.message);
        });
      } catch (err) {
        console.warn('Failed to create PostgreSQL pool instance:', err);
        throw err;
      }
    }
    return this.pool;
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;
    if (this.fallback) {
      await this.fallback.init();
      return;
    }
    try {
      const pool = await this.getPool();

      // Create required tables
      await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(32) PRIMARY KEY,
        asset VARCHAR(32) NOT NULL,
        thesis TEXT NOT NULL,
        verdict VARCHAR(16) NOT NULL,
        for_count INTEGER NOT NULL DEFAULT 0,
        against_count INTEGER NOT NULL DEFAULT 0,
        abstain_count INTEGER NOT NULL DEFAULT 0,
        majority INTEGER NOT NULL DEFAULT 5,
        size_band VARCHAR(64),
        opened_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        closed_at TIMESTAMP WITH TIME ZONE,
        seats_present VARCHAR(16) DEFAULT '9 / 9',
        speaking_turns INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS evidence (
        id VARCHAR(64) PRIMARY KEY,
        session_id VARCHAR(32) REFERENCES sessions(id) ON DELETE CASCADE,
        ticker VARCHAR(32) NOT NULL,
        name VARCHAR(120),
        price NUMERIC(20, 4),
        change_24h NUMERIC(8, 2),
        market_cap NUMERIC(24, 2),
        volume_24h NUMERIC(24, 2),
        ath NUMERIC(20, 4),
        drawdown_from_ath NUMERIC(8, 2),
        sparkline JSONB,
        data_gaps JSONB,
        retrieval_date VARCHAR(32),
        is_demo_data BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS seat_messages (
        id VARCHAR(64) PRIMARY KEY,
        session_id VARCHAR(32) REFERENCES sessions(id) ON DELETE CASCADE,
        seat INTEGER,
        speaker VARCHAR(100) NOT NULL,
        message_type VARCHAR(32) NOT NULL,
        body TEXT NOT NULL,
        time_label VARCHAR(32),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS votes (
        id VARCHAR(64) PRIMARY KEY,
        session_id VARCHAR(32) REFERENCES sessions(id) ON DELETE CASCADE,
        seat INTEGER NOT NULL,
        persona VARCHAR(100) NOT NULL,
        short_name VARCHAR(50) NOT NULL,
        vote VARCHAR(16) NOT NULL,
        weight NUMERIC(4, 2) DEFAULT 1.0,
        rationale TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS verdicts (
        id VARCHAR(64) PRIMARY KEY,
        session_id VARCHAR(32) REFERENCES sessions(id) ON DELETE CASCADE UNIQUE,
        ticker VARCHAR(32) NOT NULL,
        asset_name VARCHAR(120),
        question TEXT NOT NULL,
        outcome VARCHAR(16) NOT NULL,
        majority_ratio VARCHAR(32) NOT NULL,
        dissent_breakdown VARCHAR(120),
        position_size_band VARCHAR(64),
        key_agreement TEXT,
        key_disagreement TEXT,
        unresolved_question TEXT,
        review_triggers JSONB,
        recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS watches (
        id VARCHAR(64) PRIMARY KEY,
        session_id VARCHAR(32) REFERENCES sessions(id) ON DELETE CASCADE,
        asset VARCHAR(32) NOT NULL,
        trigger_condition TEXT NOT NULL,
        drawdown_threshold NUMERIC(5, 2) DEFAULT 30.0,
        email VARCHAR(255) NOT NULL,
        status VARCHAR(32) DEFAULT 'ACTIVE',
        last_triggered_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

      this.isInitialized = true;
    } catch (err: any) {
      console.warn(`PostgreSQL initialization failed (${err.message}). Seamlessly falling back to memory database.`);
      const fb = this.getFallbackStore();
      await fb.init();
      this.isInitialized = true;
    }
  }

  async getSession(id: string): Promise<ChamberSession | null> {
    await this.init();
    if (this.fallback) return this.fallback.getSession(id);
    try {
      const pool = await this.getPool();

      const sessRes = await pool.query('SELECT * FROM sessions WHERE id = $1', [id]);
      if (sessRes.rows.length === 0) return null;
      const s = sessRes.rows[0];

      const verdRes = await pool.query('SELECT * FROM verdicts WHERE session_id = $1', [id]);
      const evidRes = await pool.query('SELECT * FROM evidence WHERE session_id = $1', [id]);
      const voteRes = await pool.query('SELECT * FROM votes WHERE session_id = $1 ORDER BY seat ASC', [id]);
      const msgRes = await pool.query('SELECT * FROM seat_messages WHERE session_id = $1 ORDER BY created_at ASC', [id]);

      const v = verdRes.rows[0] || null;
      const e = evidRes.rows[0] || null;

      return {
        id: s.id,
        question: s.thesis,
        ticker: s.asset,
        assetName: s.asset,
        createdAt: s.opened_at ? new Date(s.opened_at).toISOString() : new Date().toISOString(),
        closedAt: s.closed_at ? new Date(s.closed_at).toISOString() : null,
        seatsPresent: s.seats_present || '9 / 9',
        speakingTurns: s.speaking_turns || 0,
        directedMode: 'full_bench',
        directedSeats: [],
        evidence: e ? {
          ticker: e.ticker,
          name: e.name,
          price: Number(e.price),
          priceFormatted: `$${Number(e.price).toLocaleString()}`,
          change24h: Number(e.change_24h),
          marketCap: Number(e.market_cap),
          marketCapFormatted: `$${(Number(e.market_cap) / 1e9).toFixed(2)}B`,
          volume24h: Number(e.volume_24h),
          volume24hFormatted: `$${(Number(e.volume_24h) / 1e9).toFixed(2)}B`,
          ath: Number(e.ath),
          drawdownFromAthPct: String(e.drawdown_from_ath),
          sparkline: e.sparkline || [],
          dataGaps: e.data_gaps || [],
          networkActivity: 'Verified on-chain',
          supply: 'Algorithmic hard cap',
          macroContext: 'Institutional digital asset context',
          retrievalDate: e.retrieval_date || '',
          isDemoData: Boolean(e.is_demo_data)
        } : null,
        votes: voteRes.rows.map((row: any) => ({
          seat: row.seat,
          persona: row.persona,
          shortName: row.short_name,
          vote: row.vote,
          weight: Number(row.weight),
          rationale: row.rationale
        })),
        verdict: v ? {
          id: v.id,
          sessionId: v.session_id,
          ticker: v.ticker,
          assetName: v.asset_name,
          question: v.question,
          outcome: v.outcome,
          majorityRatio: v.majority_ratio,
          dissentBreakdown: v.dissent_breakdown || '',
          positionSizeBand: v.position_size_band || '',
          keyAgreement: v.key_agreement || '',
          keyDisagreement: v.key_disagreement || '',
          unresolvedQuestion: v.unresolved_question || '',
          reviewTriggers: v.review_triggers || [],
          votes: [],
          timestamp: v.recorded_at ? new Date(v.recorded_at).toISOString() : new Date().toISOString()
        } : null,
        transcript: msgRes.rows.map((row: any) => ({
          type: row.message_type,
          who: row.speaker,
          time: row.time_label || '--:--',
          text: row.body
        }))
      };
    } catch (err: any) {
      console.warn(`PostgreSQL getSession error (${err.message}), using fallback.`);
      return this.getFallbackStore().getSession(id);
    }
  }

  async saveSession(session: ChamberSession): Promise<void> {
    await this.init();
    const pool = await this.getPool();

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Upsert session
      await client.query(`
        INSERT INTO sessions (id, asset, thesis, verdict, for_count, against_count, abstain_count, majority, size_band, opened_at, closed_at, seats_present, speaking_turns)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO UPDATE SET
          verdict = EXCLUDED.verdict,
          closed_at = EXCLUDED.closed_at,
          speaking_turns = EXCLUDED.speaking_turns;
      `, [
        session.id,
        session.ticker,
        session.question,
        session.verdict?.outcome || 'PASS',
        session.votes.filter(v => v.vote === 'ADD').length,
        session.votes.filter(v => v.vote === 'REDUCE').length,
        session.votes.filter(v => v.vote === 'PASS').length,
        session.verdict ? parseInt(session.verdict.majorityRatio.split('/')[0]) || 5 : 5,
        session.verdict?.positionSizeBand || '1.0 – 2.0%',
        session.createdAt || new Date().toISOString(),
        session.closedAt || new Date().toISOString(),
        session.seatsPresent || '9 / 9',
        session.speakingTurns || session.transcript.length
      ]);

      // 2. Insert Evidence
      if (session.evidence) {
        const evidId = `EV-${session.id}`;
        await client.query(`
          INSERT INTO evidence (id, session_id, ticker, name, price, change_24h, market_cap, volume_24h, ath, drawdown_from_ath, sparkline, data_gaps, retrieval_date, is_demo_data)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (id) DO UPDATE SET
            price = EXCLUDED.price,
            change_24h = EXCLUDED.change_24h;
        `, [
          evidId,
          session.id,
          session.evidence.ticker,
          session.evidence.name,
          session.evidence.price,
          session.evidence.change24h,
          session.evidence.marketCap,
          session.evidence.volume24h,
          session.evidence.ath || session.evidence.price,
          Number(session.evidence.drawdownFromAthPct) || 0,
          JSON.stringify((session.evidence as any).sparkline || []),
          JSON.stringify(session.evidence.dataGaps || []),
          session.evidence.retrievalDate,
          session.evidence.isDemoData
        ]);
      }

      // 3. Insert Votes
      for (const v of session.votes) {
        const voteId = `VOTE-${session.id}-${v.seat}`;
        await client.query(`
          INSERT INTO votes (id, session_id, seat, persona, short_name, vote, weight, rationale)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO UPDATE SET vote = EXCLUDED.vote, rationale = EXCLUDED.rationale;
        `, [voteId, session.id, v.seat, v.persona, v.shortName, v.vote, v.weight || 1.0, v.rationale]);
      }

      // 4. Insert Verdict
      if (session.verdict) {
        const verdId = `VR-${session.id}`;
        await client.query(`
          INSERT INTO verdicts (id, session_id, ticker, asset_name, question, outcome, majority_ratio, dissent_breakdown, position_size_band, key_agreement, key_disagreement, unresolved_question, review_triggers, recorded_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (session_id) DO UPDATE SET
            outcome = EXCLUDED.outcome,
            majority_ratio = EXCLUDED.majority_ratio,
            recorded_at = EXCLUDED.recorded_at;
        `, [
          verdId,
          session.id,
          session.verdict.ticker,
          session.verdict.assetName,
          session.verdict.question,
          session.verdict.outcome,
          session.verdict.majorityRatio,
          session.verdict.dissentBreakdown,
          session.verdict.positionSizeBand,
          session.verdict.keyAgreement,
          session.verdict.keyDisagreement,
          session.verdict.unresolvedQuestion,
          JSON.stringify(session.verdict.reviewTriggers || []),
          session.verdict.timestamp || new Date().toISOString()
        ]);
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async listSessions(limit = 20): Promise<ChamberSession[]> {
    await this.init();
    if (this.fallback) return this.fallback.listSessions(limit);
    try {
      const pool = await this.getPool();

      const res = await pool.query(`
        SELECT s.*, v.outcome, v.majority_ratio, v.position_size_band
        FROM sessions s
        LEFT JOIN verdicts v ON s.id = v.session_id
        ORDER BY s.opened_at DESC
        LIMIT $1;
      `, [limit]);

      return res.rows.map((r: any) => ({
        id: r.id,
        question: r.thesis,
        ticker: r.asset,
        assetName: r.asset,
        createdAt: r.opened_at ? new Date(r.opened_at).toISOString() : new Date().toISOString(),
        closedAt: r.closed_at ? new Date(r.closed_at).toISOString() : null,
        seatsPresent: r.seats_present || '9 / 9',
        speakingTurns: r.speaking_turns || 0,
        directedMode: 'full_bench',
        directedSeats: [],
        evidence: null,
        votes: [],
        verdict: r.outcome ? {
          id: `VR-${r.id}`,
          sessionId: r.id,
          ticker: r.asset,
          assetName: r.asset,
          question: r.thesis,
          outcome: r.outcome,
          majorityRatio: r.majority_ratio || '5 / 9',
          dissentBreakdown: '',
          positionSizeBand: r.position_size_band || '1.0 – 2.0%',
          keyAgreement: '',
          keyDisagreement: '',
          unresolvedQuestion: '',
          reviewTriggers: [],
          votes: [],
          timestamp: r.opened_at ? new Date(r.opened_at).toISOString() : new Date().toISOString()
        } : null,
        transcript: []
      }));
    } catch (err: any) {
      console.warn(`PostgreSQL listSessions error (${err.message}), using fallback.`);
      return this.getFallbackStore().listSessions(limit);
    }
  }

  async createWatch(watch: WatchRecord): Promise<void> {
    await this.init();
    const pool = await this.getPool();

    await pool.query(`
      INSERT INTO watches (id, session_id, asset, trigger_condition, drawdown_threshold, email, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO NOTHING;
    `, [watch.id, watch.sessionId, watch.asset, watch.triggerCondition, watch.drawdownThreshold, watch.email, watch.status]);
  }

  async getActiveWatches(): Promise<WatchRecord[]> {
    await this.init();
    const pool = await this.getPool();

    const res = await pool.query("SELECT * FROM watches WHERE status = 'ACTIVE' ORDER BY created_at DESC");
    return res.rows.map((r: any) => ({
      id: r.id,
      sessionId: r.session_id,
      asset: r.asset,
      triggerCondition: r.trigger_condition,
      drawdownThreshold: Number(r.drawdown_threshold),
      email: r.email,
      status: r.status,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      lastTriggeredAt: r.last_triggered_at ? new Date(r.last_triggered_at).toISOString() : undefined
    }));
  }

  async getWatchesBySession(sessionId: string): Promise<WatchRecord[]> {
    await this.init();
    const pool = await this.getPool();

    const res = await pool.query('SELECT * FROM watches WHERE session_id = $1 ORDER BY created_at DESC', [sessionId]);
    return res.rows.map((r: any) => ({
      id: r.id,
      sessionId: r.session_id,
      asset: r.asset,
      triggerCondition: r.trigger_condition,
      drawdownThreshold: Number(r.drawdown_threshold),
      email: r.email,
      status: r.status,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      lastTriggeredAt: r.last_triggered_at ? new Date(r.last_triggered_at).toISOString() : undefined
    }));
  }

  async updateWatchTriggered(id: string): Promise<void> {
    await this.init();
    const pool = await this.getPool();
    await pool.query("UPDATE watches SET status = 'TRIGGERED', last_triggered_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);
  }

  async updateWatchStatus(id: string, status: 'ACTIVE' | 'TRIGGERED' | 'DISMISSED'): Promise<void> {
    await this.init();
    const pool = await this.getPool();
    await pool.query("UPDATE watches SET status = $1 WHERE id = $2", [status, id]);
  }
}

// In-Memory Database Fallback
class MemoryDatabase implements DatabaseAdapter {
  private sessions: Map<string, ChamberSession> = new Map();
  private watches: Map<string, WatchRecord> = new Map();

  constructor() {
    this.seedDefaults();
  }

  async init(): Promise<void> {}

  private seedDefaults() {
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

  async updateWatchTriggered(id: string): Promise<void> {
    const watch = this.watches.get(id);
    if (watch) {
      watch.status = 'TRIGGERED';
      watch.lastTriggeredAt = new Date().toISOString();
      this.watches.set(id, watch);
    }
  }

  async updateWatchStatus(id: string, status: 'ACTIVE' | 'TRIGGERED' | 'DISMISSED'): Promise<void> {
    const watch = this.watches.get(id);
    if (watch) {
      watch.status = status;
      this.watches.set(id, watch);
    }
  }
}

export function getDatabase(): DatabaseAdapter {
  const url = process.env.DATABASE_URL;
  if (url && (url.startsWith('postgres://') || url.startsWith('postgresql://'))) {
    return new PostgresDatabase(url);
  }
  return new MemoryDatabase();
}

export const db: DatabaseAdapter = getDatabase();
