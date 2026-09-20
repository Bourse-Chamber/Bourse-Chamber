-- ============================================================================
-- Bourse Chamber — Production PostgreSQL / Supabase Database Schema
-- Multi-Agent Council Debate & Verdict Ledger
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table (Optional authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    display_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'researcher',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Agents table (The 9 canonical personas)
CREATE TABLE IF NOT EXISTS agents (
    id SERIAL PRIMARY KEY,
    seat_number INTEGER NOT NULL UNIQUE CHECK (seat_number BETWEEN 1 AND 9),
    name VARCHAR(100) NOT NULL,
    discipline VARCHAR(100) NOT NULL,
    school VARCHAR(50) NOT NULL CHECK (school IN ('VALUE', 'GROWTH', 'MACRO', 'RISK', 'CONTRARIAN')),
    philosophy TEXT NOT NULL,
    bio TEXT NOT NULL,
    avatar_seed VARCHAR(100) NOT NULL,
    trait_growth_bias INTEGER CHECK (trait_growth_bias BETWEEN 0 AND 10),
    trait_risk_aversion INTEGER CHECK (trait_risk_aversion BETWEEN 0 AND 10),
    trait_valuation_rigor INTEGER CHECK (trait_valuation_rigor BETWEEN 0 AND 10),
    historical_sessions INTEGER DEFAULT 0,
    historical_voted_in INTEGER DEFAULT 0,
    historical_dissents INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Agent key questioning criteria
CREATE TABLE IF NOT EXISTS agent_questions (
    id SERIAL PRIMARY KEY,
    agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 1
);

-- 3. Councils / Sessions table
CREATE TABLE IF NOT EXISTS councils (
    id VARCHAR(32) PRIMARY KEY, -- e.g. 'BC-0411'
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ticker VARCHAR(16) NOT NULL,
    asset_name VARCHAR(120),
    thesis_question TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'IDLE' CHECK (
        status IN ('IDLE', 'FILING', 'PREPARING_EVIDENCE', 'ROUND_1', 'ROUND_2', 'ROUND_3', 'SYNTHESIZING', 'COMPLETED', 'ERROR')
    ),
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE,
    seats_present VARCHAR(10) DEFAULT '9 / 9',
    speaking_turns INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Council Agents mapping (Seats assigned to a council session)
CREATE TABLE IF NOT EXISTS council_agents (
    council_id VARCHAR(32) REFERENCES councils(id) ON DELETE CASCADE,
    agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
    live_position VARCHAR(100),
    confidence_pct INTEGER,
    preliminary_ballot VARCHAR(16) CHECK (preliminary_ballot IN ('ADD', 'REDUCE', 'PASS', NULL)),
    PRIMARY KEY (council_id, agent_id)
);

-- 5. Evidence Packages table
CREATE TABLE IF NOT EXISTS evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    council_id VARCHAR(32) NOT NULL REFERENCES councils(id) ON DELETE CASCADE UNIQUE,
    price_usd NUMERIC(16, 4),
    change_24h_pct NUMERIC(8, 2),
    market_cap_usd NUMERIC(20, 2),
    volume_24h_usd NUMERIC(20, 2),
    network_activity TEXT,
    circulating_supply TEXT,
    macro_context TEXT,
    retrieval_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_demo_data BOOLEAN DEFAULT TRUE
);

-- 6. Transcript Messages table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    council_id VARCHAR(32) NOT NULL REFERENCES councils(id) ON DELETE CASCADE,
    sequence_number INTEGER NOT NULL,
    message_type VARCHAR(32) NOT NULL CHECK (
        message_type IN ('chair', 'analysis', 'challenge', 'response', 'vote', 'verdict', 'evidence')
    ),
    speaker_name VARCHAR(100) NOT NULL,
    speaker_seat INTEGER CHECK (speaker_seat BETWEEN 1 AND 9),
    target_speaker_name VARCHAR(100),
    target_speaker_seat INTEGER CHECK (target_speaker_seat BETWEEN 1 AND 9),
    body_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Recorded Ballots / Votes table
CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    council_id VARCHAR(32) NOT NULL REFERENCES councils(id) ON DELETE CASCADE,
    agent_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
    ballot VARCHAR(16) NOT NULL CHECK (ballot IN ('ADD', 'REDUCE', 'PASS')),
    stated_rationale TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_seat_per_council UNIQUE (council_id, agent_id)
);

-- 8. Verdicts table (Permanent decision record)
CREATE TABLE IF NOT EXISTS verdicts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    council_id VARCHAR(32) NOT NULL REFERENCES councils(id) ON DELETE CASCADE UNIQUE,
    outcome VARCHAR(16) NOT NULL CHECK (outcome IN ('ADD', 'REDUCE', 'PASS')),
    majority_ratio VARCHAR(16) NOT NULL, -- e.g. '6 / 9'
    dissent_breakdown VARCHAR(120) NOT NULL, -- e.g. '2 REDUCE, 1 PASS'
    position_size_band VARCHAR(64) NOT NULL, -- e.g. '2.0 – 3.5%'
    key_agreement TEXT NOT NULL,
    key_disagreement TEXT NOT NULL,
    unresolved_question TEXT NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Review Triggers table
CREATE TABLE IF NOT EXISTS review_triggers (
    id SERIAL PRIMARY KEY,
    verdict_id UUID NOT NULL REFERENCES verdicts(id) ON DELETE CASCADE,
    council_id VARCHAR(32) NOT NULL REFERENCES councils(id) ON DELETE CASCADE,
    trigger_condition TEXT NOT NULL,
    display_order INTEGER DEFAULT 1
);

-- 10. Review Trigger Watches table (F9 Email Watcher)
CREATE TABLE IF NOT EXISTS watches (
    id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(32) NOT NULL REFERENCES councils(id) ON DELETE CASCADE,
    asset VARCHAR(16) NOT NULL,
    trigger_condition TEXT NOT NULL,
    drawdown_threshold NUMERIC(5, 2) DEFAULT 30.0,
    email VARCHAR(255) NOT NULL,
    status VARCHAR(32) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'TRIGGERED', 'EXPIRED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for high-performance Ledger queries & search
CREATE INDEX IF NOT EXISTS idx_councils_ticker ON councils(ticker);
CREATE INDEX IF NOT EXISTS idx_councils_status ON councils(status);
CREATE INDEX IF NOT EXISTS idx_councils_opened_at ON councils(opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_verdicts_outcome ON verdicts(outcome);
CREATE INDEX IF NOT EXISTS idx_messages_council_seq ON messages(council_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_votes_council ON votes(council_id);
CREATE INDEX IF NOT EXISTS idx_watches_session ON watches(session_id);
CREATE INDEX IF NOT EXISTS idx_watches_status ON watches(status);
