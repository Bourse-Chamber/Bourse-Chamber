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
    if (this.fallback) {
      return this.fallback.saveSession(session);
    }

    try {
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
      } catch (txErr) {
        await client.query('ROLLBACK');
        throw txErr;
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.warn(`PostgreSQL saveSession failed (${err.message}). Falling back to memory store.`);
      return this.getFallbackStore().saveSession(session);
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

      const sessionIds = res.rows.map((r: any) => r.id);
      const votesMap: Record<string, SeatVote[]> = {};
      if (sessionIds.length > 0) {
        try {
          const votesRes = await pool.query(
            'SELECT * FROM votes WHERE session_id = ANY($1::text[]) ORDER BY seat ASC',
            [sessionIds]
          );
          votesRes.rows.forEach((row: any) => {
            if (!votesMap[row.session_id]) votesMap[row.session_id] = [];
            votesMap[row.session_id].push({
              seat: row.seat,
              persona: row.persona,
              shortName: row.short_name,
              vote: row.vote,
              weight: Number(row.weight),
              rationale: row.rationale
            });
          });
        } catch (vErr) {
          console.warn('Failed to load votes for listSessions:', vErr);
        }
      }

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
        votes: votesMap[r.id] || [],
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
    if (this.fallback) return this.fallback.createWatch(watch);
    try {
      const pool = await this.getPool();
      await pool.query(`
        INSERT INTO watches (id, session_id, asset, trigger_condition, drawdown_threshold, email, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING;
      `, [watch.id, watch.sessionId, watch.asset, watch.triggerCondition, watch.drawdownThreshold, watch.email, watch.status]);
    } catch (err: any) {
      console.warn(`PostgreSQL createWatch failed (${err.message}). Falling back to memory store.`);
      return this.getFallbackStore().createWatch(watch);
    }
  }

  async getActiveWatches(): Promise<WatchRecord[]> {
    await this.init();
    if (this.fallback) return this.fallback.getActiveWatches();
    try {
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
    } catch (err: any) {
      console.warn(`PostgreSQL getActiveWatches failed (${err.message}). Falling back to memory store.`);
      return this.getFallbackStore().getActiveWatches();
    }
  }

  async getWatchesBySession(sessionId: string): Promise<WatchRecord[]> {
    await this.init();
    if (this.fallback) return this.fallback.getWatchesBySession(sessionId);
    try {
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
    } catch (err: any) {
      console.warn(`PostgreSQL getWatchesBySession failed (${err.message}). Falling back to memory store.`);
      return this.getFallbackStore().getWatchesBySession(sessionId);
    }
  }

  async updateWatchTriggered(id: string): Promise<void> {
    await this.init();
    if (this.fallback) return this.fallback.updateWatchTriggered(id);
    try {
      const pool = await this.getPool();
      await pool.query("UPDATE watches SET status = 'TRIGGERED', last_triggered_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);
    } catch (err: any) {
      console.warn(`PostgreSQL updateWatchTriggered failed (${err.message}). Falling back to memory store.`);
      return this.getFallbackStore().updateWatchTriggered(id);
    }
  }

  async updateWatchStatus(id: string, status: 'ACTIVE' | 'TRIGGERED' | 'DISMISSED'): Promise<void> {
    await this.init();
    if (this.fallback) return this.fallback.updateWatchStatus(id, status);
    try {
      const pool = await this.getPool();
      await pool.query("UPDATE watches SET status = $1 WHERE id = $2", [status, id]);
    } catch (err: any) {
      console.warn(`PostgreSQL updateWatchStatus failed (${err.message}). Falling back to memory store.`);
      return this.getFallbackStore().updateWatchStatus(id, status);
    }
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

    this.sessions.set('BC-0101', {
      id: 'BC-0101',
      question: 'Is BTC still a reasonable core holding at current market levels?',
      ticker: 'BTC',
      assetName: 'Bitcoin',
      createdAt: '2026-09-12T14:20:00Z',
      closedAt: '14:52',
      evidence: {
        ticker: 'BTC',
        name: 'Bitcoin',
        price: 64280,
        priceFormatted: '$64,280',
        change24h: 2.35,
        marketCap: 1268000000000,
        marketCapFormatted: '$1.27T',
        volume24h: 28400000000,
        volume24hFormatted: '$28.40B',
        ath: 73750,
        drawdownFromAthPct: '12.8',
        networkActivity: '840,000 active settlement addresses / 24h',
        supply: '19.75M circulating / 21.0M hard cap',
        macroContext: 'Global liquidity expansion; institutional ETF inflows; sovereign treasury diversification.',
        retrievalDate: '2026-09-12',
        isDemoData: true
      },
      speakingTurns: 16,
      seatsPresent: '9 / 9',
      directedMode: 'full_bench',
      directedSeats: [],
      votes: [
        { seat: 1, persona: 'Benjamin Graham', shortName: 'Graham', vote: 'PASS', weight: 1, rationale: 'Monetary brand acknowledged, but absence of cash flow floor warrants caution.' },
        { seat: 2, persona: 'Charlie Munger', shortName: 'Munger', vote: 'REDUCE', weight: 1, rationale: 'Remains an artificial speculative token with non-productive economics.' },
        { seat: 3, persona: 'Peter Lynch', shortName: 'Lynch', vote: 'ADD', weight: 1, rationale: 'Global brand awareness is total; institutional adoption has crossed the chasm.' },
        { seat: 4, persona: 'Cathie Wood', shortName: 'Wood', vote: 'ADD', weight: 1, rationale: 'Global monetary protocol on track for multi-trillion market capture; supreme conviction.' },
        { seat: 5, persona: 'Aswath Damodaran', shortName: 'Damodaran', vote: 'REDUCE', weight: 1, rationale: 'Without contractual cash flows, valuation is driven entirely by market moods.' },
        { seat: 6, persona: 'Nassim Nicholas Taleb', shortName: 'Taleb', vote: 'ADD', weight: 1, rationale: 'Proven survival through multiple 80% drawdowns gives it antifragile convexity.' },
        { seat: 7, persona: 'Mohnish Pabrai', shortName: 'Pabrai', vote: 'ADD', weight: 1, rationale: 'Sovereign game theory makes terminal downside remote while liquidity upside remains convex.' },
        { seat: 8, persona: 'Bill Ackman', shortName: 'Ackman', vote: 'ADD', weight: 1, rationale: 'Digital store-of-value monopoly with massive structural network moats.' },
        { seat: 9, persona: 'Michael Burry', shortName: 'Burry', vote: 'REDUCE', weight: 1, rationale: 'Derivative leverage concentration creates severe risk of flash liquidation spirals.' }
      ],
      verdict: {
        id: 'VR-0101',
        sessionId: 'BC-0101',
        ticker: 'BTC',
        assetName: 'Bitcoin',
        question: 'Is BTC still a reasonable core holding at current market levels?',
        outcome: 'ADD',
        majorityRatio: '5 / 9',
        dissentBreakdown: '3 REDUCE, 1 PASS',
        positionSizeBand: '3.0 – 5.0%',
        keyAgreement: 'BTC retains unmatched monetary liquidity, institutional custody adoption, and unforgeable scarcity.',
        keyDisagreement: 'Whether absent cash flows, Bitcoin can sustain a trillion-dollar valuation across sovereign liquidity drawdowns.',
        unresolvedQuestion: 'Will long-term transaction fee revenue adequately incentivize hashpower security after subsequent halvings?',
        reviewTriggers: [
          'Material deterioration in global on-chain settlement volume.',
          'Significant synchronous tightening in G10 central bank balance sheets.',
          'Structural shift in US/global regulatory clarity for regulated custody.'
        ],
        votes: [],
        timestamp: '2026-09-12T14:52:00Z'
      },
      transcript: []
    });

    this.sessions.set('BC-0202', {
      id: 'BC-0202',
      question: 'Does Layer-2 fragmentation permanently impair Ethereum fee accrual moat?',
      ticker: 'ETH',
      assetName: 'Ethereum',
      createdAt: '2026-09-15T11:00:00Z',
      closedAt: '11:35',
      evidence: {
        ticker: 'ETH',
        name: 'Ethereum',
        price: 2640,
        priceFormatted: '$2,640',
        change24h: -0.85,
        marketCap: 317800000000,
        marketCapFormatted: '$317.80B',
        volume24h: 14200000000,
        volume24hFormatted: '$14.20B',
        ath: 4890,
        drawdownFromAthPct: '46.0',
        networkActivity: '1.24M L1 txs; 8.2M L2 rollups txs daily',
        supply: '120.2M circulating / dynamic burn',
        macroContext: 'Staking yield 3.25%; blob transaction fees compressing L1 fee burn.',
        retrievalDate: '2026-09-15',
        isDemoData: true
      },
      speakingTurns: 13,
      seatsPresent: '9 / 9',
      directedMode: 'full_bench',
      directedSeats: [],
      votes: [
        { seat: 1, persona: 'Benjamin Graham', shortName: 'Graham', vote: 'PASS', weight: 1, rationale: '3.2% staking yield offers cash flow, but compressed L1 burn clouds earnings visibility.' },
        { seat: 2, persona: 'Charlie Munger', shortName: 'Munger', vote: 'REDUCE', weight: 1, rationale: 'Unnecessary complexity and agency dilemmas between L1 and competing L2 teams.' },
        { seat: 3, persona: 'Peter Lynch', shortName: 'Lynch', vote: 'ADD', weight: 1, rationale: 'Massive developer ecosystem and genuine financial applications running continuously.' },
        { seat: 4, persona: 'Cathie Wood', shortName: 'Wood', vote: 'ADD', weight: 1, rationale: 'The foundational settlement layer for global financial market tokenization.' },
        { seat: 5, persona: 'Aswath Damodaran', shortName: 'Damodaran', vote: 'PASS', weight: 1, rationale: 'Fee generation is real, but terminal discount rate must reflect constant protocol shifts.' },
        { seat: 6, persona: 'Nassim Nicholas Taleb', shortName: 'Taleb', vote: 'ADD', weight: 1, rationale: 'Longest unbroken track record of smart contract execution and battle-tested consensus.' },
        { seat: 7, persona: 'Mohnish Pabrai', shortName: 'Pabrai', vote: 'PASS', weight: 1, rationale: 'Unclear whether value accrues to the base asset or to competing Layer-2 execution tokens.' },
        { seat: 8, persona: 'Bill Ackman', shortName: 'Ackman', vote: 'ADD', weight: 1, rationale: 'Monopoly on institutional DeFi liquidity and deeply established validator decentralization.' },
        { seat: 9, persona: 'Michael Burry', shortName: 'Burry', vote: 'REDUCE', weight: 1, rationale: 'L2 cannibalization strips L1 economic rent, exposing stakers to real negative carry.' }
      ],
      verdict: {
        id: 'VR-0202',
        sessionId: 'BC-0202',
        ticker: 'ETH',
        assetName: 'Ethereum',
        question: 'Does Layer-2 fragmentation permanently impair Ethereum fee accrual moat?',
        outcome: 'PASS',
        majorityRatio: '5 / 9',
        dissentBreakdown: '4 ADD, 2 REDUCE',
        positionSizeBand: '2.0 – 3.0%',
        keyAgreement: 'Ethereum remains the undisputed settlement layer for institutional tokenized assets and DeFi TVL.',
        keyDisagreement: 'Whether value capture accrues to the ETH token or is captured by external sequencing and application rollups.',
        unresolvedQuestion: 'Can synchronous composability between fragmented Layer-2 chains be resolved without compromising base layer security?',
        reviewTriggers: [
          'Layer-1 burn rate drops below net issuance for more than two consecutive quarters.',
          'Alternative execution layers capture more than 50% of total stablecoin settlement.',
          'Major enterprise tokenization moves natively to non-EVM architecture.'
        ],
        votes: [],
        timestamp: '2026-09-15T11:35:00Z'
      },
      transcript: []
    });

    this.sessions.set('BC-0305', {
      id: 'BC-0305',
      question: 'Subnet architecture vs monolithic scaling in a liquidity-constrained cycle',
      ticker: 'AVAX',
      assetName: 'Avalanche',
      createdAt: '2026-09-17T16:15:00Z',
      closedAt: '16:48',
      evidence: {
        ticker: 'AVAX',
        name: 'Avalanche',
        price: 28.40,
        priceFormatted: '$28.40',
        change24h: -1.40,
        marketCap: 11200000000,
        marketCapFormatted: '$11.20B',
        volume24h: 420000000,
        volume24hFormatted: '$420.00M',
        ath: 146,
        drawdownFromAthPct: '80.5',
        networkActivity: '180,000 active daily C-chain addresses',
        supply: '394M circulating / 720M maximum cap',
        macroContext: 'Institutional subnet trials; unlock schedules moderating.',
        retrievalDate: '2026-09-17',
        isDemoData: true
      },
      speakingTurns: 12,
      seatsPresent: '9 / 9',
      directedMode: 'full_bench',
      directedSeats: [],
      votes: [
        { seat: 1, persona: 'Benjamin Graham', shortName: 'Graham', vote: 'REDUCE', weight: 1, rationale: 'Token emissions outpace organic burn, diluting underlying holder equity.' },
        { seat: 2, persona: 'Charlie Munger', shortName: 'Munger', vote: 'REDUCE', weight: 1, rationale: 'Institutions using subnets have no economic reason to enrich AVAX spot holders.' },
        { seat: 3, persona: 'Peter Lynch', shortName: 'Lynch', vote: 'PASS', weight: 1, rationale: 'Solid gaming and enterprise trials, but end-user retail traction is lagging.' },
        { seat: 4, persona: 'Cathie Wood', shortName: 'Wood', vote: 'ADD', weight: 1, rationale: 'Subnet architecture represents a breakthrough in customizable sovereign application chains.' },
        { seat: 5, persona: 'Aswath Damodaran', shortName: 'Damodaran', vote: 'REDUCE', weight: 1, rationale: 'Cost of capital exceeds protocol fee capture; net negative cash margins.' },
        { seat: 6, persona: 'Nassim Nicholas Taleb', shortName: 'Taleb', vote: 'REDUCE', weight: 1, rationale: 'Ecosystem relies heavily on subsidized incentive programs that shatter when treasury dries up.' },
        { seat: 7, persona: 'Mohnish Pabrai', shortName: 'Pabrai', vote: 'PASS', weight: 1, rationale: 'Uncertainty is too high without clear downside protection.' },
        { seat: 8, persona: 'Bill Ackman', shortName: 'Ackman', vote: 'REDUCE', weight: 1, rationale: 'Subnet dilution prevents concentrated value capture at the root governance token.' },
        { seat: 9, persona: 'Michael Burry', shortName: 'Burry', vote: 'REDUCE', weight: 1, rationale: 'Scheduled unlocks and validator emissions represent continuous sell-side overhang.' }
      ],
      verdict: {
        id: 'VR-0305',
        sessionId: 'BC-0305',
        ticker: 'AVAX',
        assetName: 'Avalanche',
        question: 'Subnet architecture vs monolithic scaling in a liquidity-constrained cycle',
        outcome: 'REDUCE',
        majorityRatio: '6 / 9',
        dissentBreakdown: '2 PASS, 1 ADD',
        positionSizeBand: '0.5 – 1.5%',
        keyAgreement: 'Avalanche provides robust subnet isolation for regulated institutions.',
        keyDisagreement: 'Whether capital fragmentation across subnets diminishes core token value capture.',
        unresolvedQuestion: 'Will private institutional subnets require AVAX staking in sufficient volume?',
        reviewTriggers: [
          'Net validator count drops below 1,000 active nodes.',
          'Subnet gas fee burn fails to exceed validator reward emissions.',
          'Rival enterprise platforms capture major institutional asset pilots.'
        ],
        votes: [],
        timestamp: '2026-09-17T16:48:00Z'
      },
      transcript: []
    });

    this.sessions.set('BC-0189', {
      id: 'BC-0189',
      question: 'Is Cross-Chain Interoperability Protocol (CCIP) the definitive plumbing of tokenized RWAs?',
      ticker: 'LINK',
      assetName: 'Chainlink',
      createdAt: '2026-09-18T10:10:00Z',
      closedAt: '10:45',
      evidence: {
        ticker: 'LINK',
        name: 'Chainlink',
        price: 13.80,
        priceFormatted: '$13.80',
        change24h: 3.45,
        marketCap: 8200000000,
        marketCapFormatted: '$8.20B',
        volume24h: 380000000,
        volume24hFormatted: '$380.00M',
        ath: 52.88,
        drawdownFromAthPct: '73.9',
        networkActivity: 'Oracle services securing >$24B TVL across 14 networks',
        supply: '608M circulating / 1.0B total supply',
        macroContext: 'SWIFT and DTCC integration partnerships; staking participation growing.',
        retrievalDate: '2026-09-18',
        isDemoData: true
      },
      speakingTurns: 15,
      seatsPresent: '9 / 9',
      directedMode: 'full_bench',
      directedSeats: [],
      votes: [
        { seat: 1, persona: 'Benjamin Graham', shortName: 'Graham', vote: 'PASS', weight: 1, rationale: 'Monopolistic market share provides defensive comfort, but fee capture model remains young.' },
        { seat: 2, persona: 'Charlie Munger', shortName: 'Munger', vote: 'ADD', weight: 1, rationale: 'Like the plumbing in a major city: you cannot easily replace the pipes without breaking the buildings.' },
        { seat: 3, persona: 'Peter Lynch', shortName: 'Lynch', vote: 'ADD', weight: 1, rationale: 'Standard of the industry. When everyone needs your data feed, you have pricing power.' },
        { seat: 4, persona: 'Cathie Wood', shortName: 'Wood', vote: 'ADD', weight: 1, rationale: 'The universal interoperability protocol connecting legacy finance to decentralized blockchains.' },
        { seat: 5, persona: 'Aswath Damodaran', shortName: 'Damodaran', vote: 'PASS', weight: 1, rationale: 'Essential infrastructure, but valuation trades at speculative multiple to current fee capture.' },
        { seat: 6, persona: 'Nassim Nicholas Taleb', shortName: 'Taleb', vote: 'ADD', weight: 1, rationale: 'Battle-tested during historic market flash crashes without critical oracle failure.' },
        { seat: 7, persona: 'Mohnish Pabrai', shortName: 'Pabrai', vote: 'ADD', weight: 1, rationale: 'Toll bridge on all institutional smart contracts; asymmetric risk profile.' },
        { seat: 8, persona: 'Bill Ackman', shortName: 'Ackman', vote: 'ADD', weight: 1, rationale: 'Defensible competitive moat; near-zero customer churn and SWIFT/DTCC relationships.' },
        { seat: 9, persona: 'Michael Burry', shortName: 'Burry', vote: 'REDUCE', weight: 1, rationale: 'Foundation token distribution history warrants caution; enterprise pilots take years to monetize.' }
      ],
      verdict: {
        id: 'VR-0189',
        sessionId: 'BC-0189',
        ticker: 'LINK',
        assetName: 'Chainlink',
        question: 'Is Cross-Chain Interoperability Protocol (CCIP) the definitive plumbing of tokenized RWAs?',
        outcome: 'ADD',
        majorityRatio: '6 / 9',
        dissentBreakdown: '1 REDUCE, 2 PASS',
        positionSizeBand: '2.5 – 4.0%',
        keyAgreement: 'Chainlink maintains a nearly unbreachable monopoly as the critical standard for blockchain data connectivity.',
        keyDisagreement: 'The extent to which commercial enterprise oracle volume translates directly to token staking cash flows.',
        unresolvedQuestion: 'Will traditional financial consortia launch closed proprietary oracle consortiums to bypass public tokens?',
        reviewTriggers: [
          'Secured TVL drops below $15B.',
          'Direct enterprise revenue accrual to staking pools falls short of projected roadmaps.',
          'Major SWIFT or DTCC pilot shifts away from public CCIP deployment.'
        ],
        votes: [],
        timestamp: '2026-09-18T10:45:00Z'
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
