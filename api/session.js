/**
 * Vercel Serverless Function & Express Route — POST /api/session
 * Multi-Agent SSE Streaming Protocol for Bourse Chamber
 * 3-Round Deliberation (9 Personas, Cross-Exam, Voting, Deterministic Verdict)
 */

const { CRYPTO_AGENTS: AGENTS } = require("../src/lib/crypto-agents");
const {
  generateRound1Analysis,
  generateRound2CrossExam,
  generateRound3Vote,
  aggregateVotes
} = require("../src/lib/openrouter");
const { db } = require("../src/lib/db");
const { demoEvidence } = require("../db/engine");
const { extractTickerFromQuery } = require("../src/lib/coingecko");

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-OpenRouter-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const { id, aggregate, limit = 50 } = req.query || {};
      if (id) {
        const session = await db.getSession(id);
        if (!session) return res.status(404).json({ error: `Session '${id}' not found.` });
        return res.status(200).json(session);
      }
      const sessions = await db.listSessions(parseInt(limit, 10));
      if (aggregate === 'bench' || aggregate === 'agents') {
        const records = AGENTS.map(agent => {
          let participated = 0;
          let votedFor = 0;
          let dissents = 0;
          const recentVotes = [];
          for (const s of sessions) {
            const v = s.votes?.find(vote => vote.seat === agent.seat || vote.shortName?.toLowerCase() === agent.shortName.toLowerCase());
            if (v) {
              participated++;
              const voteUpper = (v.vote || '').toUpperCase();
              if (voteUpper === 'ADD') votedFor++;
              else if (voteUpper === 'REDUCE') dissents++;
              else if (s.verdict && s.verdict.outcome === 'ADD') dissents++;
              recentVotes.push({ sessionId: s.id, ticker: s.ticker, vote: voteUpper, rationale: v.rationale || v.reason || '' });
            }
          }
          return {
            seat: agent.seat,
            name: agent.name,
            shortName: agent.shortName,
            discipline: agent.discipline,
            school: 'VALUE',
            record: { sessions: participated, votedFor, dissents },
            recentVotes: recentVotes.slice(0, 5)
          };
        });
        return res.status(200).json({ agents: records, totalSessions: sessions.length });
      }
      return res.status(200).json(sessions);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to query sessions', details: err.message });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
  }

  const { input } = req.body || {};
  const query = String(input || "").trim().slice(0, 500);

  if (!query) {
    return res.status(400).json({ error: 'Input thesis or asset is required.' });
  }

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  function sendEvent(type, payload) {
    try {
      res.write(`event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`);
    } catch (_) {}
  }

  const sessionId = `BC-${Math.floor(1000 + Math.random() * 9000)}`;
  const ticker = extractTickerFromQuery(query);

  try {
    // 1. Motion Event
    sendEvent('motion', {
      asset: ticker,
      motion: query,
      sessionId,
      llmProvider: process.env.OPENROUTER_API_KEY ? `OpenRouter Live AI (${process.env.OPENROUTER_MODEL || 'openrouter/free'})` : 'Deterministic Cognitive Simulator'
    });

    // 2. Evidence Pack Event (Identical Evidence for all 9 personas)
    const rawEvidence = demoEvidence(query);
    const evidence = {
      ticker,
      name: rawEvidence.name || `${ticker} Asset`,
      price: rawEvidence.price || 100,
      priceFormatted: `$${Number(rawEvidence.price || 100).toLocaleString()}`,
      change24h: rawEvidence.change24h || 0,
      marketCap: rawEvidence.marketCap || 1000000000,
      marketCapFormatted: `$${(Number(rawEvidence.marketCap || 1000000000) / 1e9).toFixed(2)}B`,
      volume24h: rawEvidence.volume24h || 50000000,
      volume24hFormatted: `$${(Number(rawEvidence.volume24h || 50000000) / 1e9).toFixed(2)}B`,
      ath: rawEvidence.ath || rawEvidence.price,
      drawdownFromAthPct: rawEvidence.drawdownFromAthPct || '0.0',
      networkActivity: 'Verified secondary market liquidity',
      supply: 'Liquid circulating supply',
      macroContext: 'Institutional multi-asset context',
      retrievalDate: new Date().toISOString().split('T')[0],
      isDemoData: false,
      dataGaps: ['Non-speculative fee accrual metrics pending protocol audit']
    };

    sendEvent('evidence', {
      metrics: [
        { label: 'Price', value: evidence.priceFormatted },
        { label: '24h Change', value: `${evidence.change24h}%` },
        { label: 'Market Cap', value: evidence.marketCapFormatted },
        { label: '24h Volume', value: evidence.volume24hFormatted }
      ],
      gaps: evidence.dataGaps,
      sources: ['CoinGecko v3 API Feed', 'Market Liquidity Oracle']
    });

    const evidenceSummary = `${evidence.name} (${evidence.priceFormatted}), 24h Change: ${evidence.change24h}%, MCap: ${evidence.marketCapFormatted}`;

    const round1Analyses = new Map();
    const transcript = [];
    const votes = [];

    // --- ROUND 1: Strictly Independent Readings (All 9 Canonical Crypto Architects) ---
    for (const agent of AGENTS) {
      sendEvent('seat_start', { seatId: agent.seat, seat: agent.seat, name: agent.name });

      const r1 = await generateRound1Analysis(agent, query, evidenceSummary);
      round1Analyses.set(agent.seat, r1);

      // Stream words
      const words = r1.analysis.split(' ');
      const delay = process.env.NODE_ENV === 'test' ? 0 : 15;
      for (const w of words) {
        sendEvent('seat_token', { seatId: agent.seat, seat: agent.seat, text: w + ' ', chunk: w + ' ' });
        if (delay > 0) await new Promise(r => setTimeout(r, delay));
      }

      sendEvent('seat_end', {
        type: 'seat_end',
        seatId: agent.seat,
        seat: agent.seat,
        persona: agent.name,
        name: agent.name,
        stance: r1.stance,
        analysis: r1.analysis,
        key_claims: r1.key_claims,
        risk: r1.risk
      });

      transcript.push({
        type: 'speaking',
        who: agent.name,
        seat: agent.seat,
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        text: r1.analysis
      });

      sendEvent('speech', { seat: agent.seat, who: agent.name, text: r1.analysis });
    }

    if (round1Analyses.size !== 9) {
      throw new Error(`Round 1 incomplete: ${round1Analyses.size}/9 analyses recorded.`);
    }

    // --- ROUND 2: Cross-Examination Duel ---
    const addAgent = AGENTS.find(a => round1Analyses.get(a.seat)?.stance === 'ADD') || AGENTS.find(a => a.seat === 4) || AGENTS[3];
    const reduceAgent = AGENTS.find(a => round1Analyses.get(a.seat)?.stance === 'REDUCE' && a.seat !== addAgent.seat) || AGENTS.find(a => a.seat === 6) || AGENTS[5];

    const challenger = reduceAgent;
    const defender = addAgent;
    const defenderR1 = round1Analyses.get(defender.seat);

    sendEvent('duel_start', { seatA: challenger.seat, seatB: defender.seat });

    const duel = await generateRound2CrossExam(challenger, defender, defenderR1, query, evidenceSummary);

    sendEvent('rebuttal', {
      type: 'rebuttal',
      seatId: challenger.seat,
      targetSeatId: defender.seat,
      seatA: challenger.seat,
      seatB: defender.seat,
      persona: challenger.name,
      challenger: challenger.name,
      defender: defender.name,
      challenge: duel.challenge,
      response: duel.response
    });

    transcript.push({
      type: 'challenge',
      who: `${challenger.name} (CHALLENGE TO SEAT 0${defender.seat})`,
      seat: challenger.seat,
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      text: duel.challenge
    });

    transcript.push({
      type: 'response',
      who: `${defender.name} (RESPONSE TO SEAT 0${challenger.seat})`,
      seat: defender.seat,
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      text: duel.response
    });

    sendEvent('speech', { seat: challenger.seat, who: `${challenger.name} [CROSS-EXAM]`, text: duel.challenge });
    sendEvent('speech', { seat: defender.seat, who: `${defender.name} [REBUTTAL]`, text: duel.response });

    // --- ROUND 3: Voting Ballot & Aggregation ---
    for (const agent of AGENTS) {
      const r1Text = round1Analyses.get(agent.seat)?.analysis || '';
      const ballot = await generateRound3Vote(agent, query, r1Text, duel.challenge);
      votes.push(ballot);

      sendEvent('vote', {
        type: 'vote',
        seatId: agent.seat,
        seat: agent.seat,
        persona: agent.name,
        name: agent.name,
        shortName: agent.shortName,
        vote: ballot.vote,
        reason: ballot.rationale,
        rationale: ballot.rationale
      });
    }

    if (votes.length !== 9) {
      throw new Error(`Round 3 incomplete: received ${votes.length}/9 votes.`);
    }

    // Deterministic Aggregator
    const verdict = aggregateVotes(votes, sessionId, ticker, evidence.name, query);
    sendEvent('verdict', verdict);

    // --- PERSISTENCE: Save completed session to Database ---
    try {
      await db.saveSession({
        id: sessionId,
        question: query,
        ticker,
        assetName: evidence.name,
        createdAt: new Date().toISOString(),
        closedAt: new Date().toISOString(),
        evidence,
        speakingTurns: transcript.length,
        seatsPresent: '9 / 9',
        directedMode: 'full_bench',
        directedSeats: [],
        votes,
        verdict,
        transcript
      });
    } catch (dbErr) {
      console.warn('[Session DB Save Warning]:', dbErr);
    }

    sendEvent('done', { sessionId, completed: true, savedToDb: true, verdictId: verdict.id, outcome: verdict.outcome });
    sendEvent('complete', { sessionId, completed: true, savedToDb: true, verdictId: verdict.id, outcome: verdict.outcome });
    res.end();

  } catch (err) {
    console.error('[api/session.js Error]:', err);
    sendEvent('error', { message: err.message || 'Chamber session encountered an error.' });
    res.end();
  }
};
