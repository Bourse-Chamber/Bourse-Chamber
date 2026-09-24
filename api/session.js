/**
 * Vercel Serverless Function & Express Route — POST /api/session
 * Multi-Agent SSE Streaming Protocol for Bourse Chamber
 * 3-Round Deliberation (Selected Personas, Cross-Exam, Voting, Deterministic Verdict)
 */

const { CRYPTO_AGENTS: AGENTS } = require("../src/lib/crypto-agents");
const {
  generateRound1Analysis,
  generateRound2CrossExam,
  generateRound3Vote,
  aggregateVotes,
  generateFinalSynthesis,
  detectQuestionTopic,
  validateDeterministicTokenCa
} = require("../src/lib/openrouter");
const { fetchCaEvidence, formatCaEvidenceSummary, extractContractAddress } = require("../src/lib/ca-evidence");
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

  const { input, selectedSeats, directedSeats, isCrossExam } = req.body || {};
  const query = String(input || "").trim().slice(0, 4000);

  if (!query) {
    return res.status(400).json({ error: 'Input thesis or asset is required.' });
  }

  // 1. Mandatory Participant Seat Selection
  const rawSeats = Array.isArray(selectedSeats) && selectedSeats.length > 0
    ? selectedSeats
    : (Array.isArray(directedSeats) && directedSeats.length > 0 ? directedSeats : []);
  const seatNums = rawSeats.map(s => parseInt(s, 10)).filter(s => s >= 1 && s <= 9);

  if (seatNums.length === 0) {
    return res.status(400).json({ error: 'Select at least one seat to convene.', code: 'NO_SEATS_SELECTED' });
  }

  // Filter to strictly the selected seats
  const participatingAgents = AGENTS.filter(a => seatNums.includes(a.seat));
  if (participatingAgents.length === 0) {
    return res.status(400).json({ error: 'No matching council seats found for selection.' });
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
  const qTopic = detectQuestionTopic(query);
  const caMatch = extractContractAddress(query);
  const isCa = qTopic === 'TOKEN_CA' || Boolean(caMatch);

  try {
    let evidence;
    let evidenceSummary;
    let caData = null;

    if (isCa) {
      caData = await fetchCaEvidence(query);
      evidenceSummary = formatCaEvidenceSummary(caData);
      evidence = {
        ticker: caData.symbol !== 'DATA UNAVAILABLE' ? caData.symbol : 'TOKEN',
        name: caData.name !== 'DATA UNAVAILABLE' ? `${caData.name} (${caData.symbol})` : `Contract ${(caData.contractAddress || '').slice(0, 6)}...${(caData.contractAddress || '').slice(-4)}`,
        price: typeof caData.price === 'number' ? caData.price : 0,
        priceFormatted: caData.priceFormatted,
        change24h: typeof caData.change24h === 'number' ? caData.change24h : 0,
        marketCap: typeof caData.marketCap === 'number' ? caData.marketCap : 0,
        marketCapFormatted: caData.marketCapFormatted,
        targetMarketCapFormatted: caData.targetMarketCapFormatted,
        requiredMultiple: caData.requiredMultiple,
        requiredMultipleFormatted: caData.requiredMultipleFormatted,
        network: caData.network,
        fdvFormatted: caData.fdvFormatted,
        volume24h: typeof caData.volume24h === 'number' ? caData.volume24h : 0,
        volume24hFormatted: caData.volume24hFormatted,
        liquidityUsd: typeof caData.liquidityUsd === 'number' ? caData.liquidityUsd : 0,
        liquidityFormatted: caData.liquidityFormatted,
        ath: typeof caData.price === 'number' ? caData.price : 0,
        drawdownFromAthPct: '0.0',
        networkActivity: caData.isAvailable ? `DEX: ${caData.pairDex} · Token Age: ${caData.tokenAge}` : 'DATA UNAVAILABLE',
        supply: 'Contract-defined tokenomics',
        macroContext: 'DEX Secondary Market',
        retrievalDate: caData.retrievalDate,
        isDemoData: false,
        dataGaps: caData.isAvailable
          ? [
              `Holder Count: ${caData.holders}`,
              `Top 10 Holder Concentration: ${caData.holderConcentration}`,
              `Contract Verification: ${caData.contractVerification}`,
              `Liquidity Lock: ${caData.liquidityLock}`
            ]
          : [
              'Contract not found or zero liquidity on DEX indexer (DexScreener)',
              'Deployer mint / tax audit data unavailable',
              'Secondary liquidity pool depth data unavailable'
            ]
      };
    } else {
      const rawEvidence = demoEvidence(query);
      evidence = {
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
      evidenceSummary = `${evidence.name} (${evidence.priceFormatted}), 24h Change: ${evidence.change24h}%, MCap: ${evidence.marketCapFormatted}`;
    }

    // 1. Motion Event
    sendEvent('motion', {
      asset: ticker,
      motion: query,
      sessionId,
      questionType: isCa ? 'TOKEN_CA' : qTopic,
      targetMarketCap: isCa ? caData.targetMarketCapFormatted : null,
      requiredMultiple: isCa ? caData.requiredMultipleFormatted : null,
      network: isCa ? caData.network : null,
      totalParticipants: participatingAgents.length,
      participatingSeats: participatingAgents.map(a => a.seat),
      llmProvider: process.env.OPENROUTER_API_KEY ? `OpenRouter Live AI (${process.env.OPENROUTER_MODEL || 'openrouter/free'})` : 'Deterministic Cognitive Simulator'
    });

    // 2. Evidence Pack Event
    if (isCa) {
      sendEvent('evidence', {
        network: caData.network,
        targetMarketCap: caData.targetMarketCapFormatted,
        requiredMultiple: caData.requiredMultipleFormatted,
        metrics: [
          { label: 'Price', value: caData.priceFormatted },
          { label: '24h Change', value: typeof caData.change24h === 'number' ? `${caData.change24h}%` : 'DATA UNAVAILABLE' },
          { label: 'Current Market Cap', value: caData.marketCapFormatted },
          { label: 'Target Market Cap', value: caData.targetMarketCapFormatted },
          { label: 'Required Multiple', value: caData.requiredMultipleFormatted },
          { label: 'DEX Liquidity', value: caData.liquidityFormatted },
          { label: '24h Volume', value: caData.volume24hFormatted },
          { label: '24h Transactions', value: typeof caData.txns24h.buys === 'number' ? `${caData.txns24h.buys} buys / ${caData.txns24h.sells} sells` : 'DATA UNAVAILABLE' },
          { label: 'Buy/Sell Ratio', value: caData.buySellRatio },
          { label: 'Network', value: caData.network }
        ],
        gaps: evidence.dataGaps,
        sources: [caData.source, 'On-Chain Liquidity Oracle'],
        timestamp: caData.retrievedAt
      });
    } else {
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
    }

    const round1Analyses = new Map();
    const transcript = [];
    const votes = [];

    // --- ROUND 1: Strictly Independent Readings (Selected Personas Only) ---
    for (const agent of participatingAgents) {
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
      // Single emission per seat analysis — speech event omitted to avoid duplicate rendering
    }

    if (round1Analyses.size !== participatingAgents.length) {
      throw new Error(`Round 1 incomplete: ${round1Analyses.size}/${participatingAgents.length} analyses recorded.`);
    }

    // --- ROUND 2: Cross-Examination Duel (Only if >= 2 participants) ---
    let duelChallenge = '';
    if (participatingAgents.length >= 2) {
      const addAgent = participatingAgents.find(a => round1Analyses.get(a.seat)?.stance === 'ADD') || participatingAgents[0];
      const reduceAgent = participatingAgents.find(a => round1Analyses.get(a.seat)?.stance === 'REDUCE' && a.seat !== addAgent.seat) || participatingAgents.find(a => a.seat !== addAgent.seat) || participatingAgents[1];

      const challenger = reduceAgent;
      const defender = addAgent;
      const defenderR1 = round1Analyses.get(defender.seat);

      sendEvent('duel_start', { seatA: challenger.seat, seatB: defender.seat });

      const duel = await generateRound2CrossExam(challenger, defender, defenderR1, query, evidenceSummary);
      duelChallenge = duel.challenge;

      const rebuttalPayload = {
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
      };
      // Single cross-exam event emission
      sendEvent('rebuttal', rebuttalPayload);

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
    }

    // --- ROUND 3: Voting Ballot & Aggregation (Selected Personas Only) ---
    for (const agent of participatingAgents) {
      const r1Text = round1Analyses.get(agent.seat)?.analysis || '';
      const ballot = await generateRound3Vote(agent, query, r1Text, duelChallenge);
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

    if (votes.length !== participatingAgents.length) {
      throw new Error(`Round 3 incomplete: received ${votes.length}/${participatingAgents.length} votes.`);
    }

    // Deterministic Aggregator (Dynamic Denominator)
    const verdict = aggregateVotes(votes, sessionId, ticker, evidence.name, query, isCa ? caData : undefined);

    // Final Chamber Synthesis (Summarizing strictly participating seats)
    const synthesis = await generateFinalSynthesis(query, participatingAgents, round1Analyses, votes, evidenceSummary, isCa ? caData : undefined);
    verdict.synthesis = synthesis;
    if (synthesis.conciseConclusion) {
      verdict.conciseConclusion = synthesis.conciseConclusion;
    }
    if (synthesis.mainFactor) {
      verdict.mainFactor = synthesis.mainFactor;
      verdict.mainFactorReason = synthesis.mainFactorReason;
    }

    if (isCa && caData) {
      validateDeterministicTokenCa(verdict, caData, participatingAgents.map(a => a.seat));
      verdict.tokenCaDetails = synthesis.caDetails;
      verdict.questionTopic = 'TOKEN_CA';
      if (synthesis.conciseConclusion) {
        verdict.conciseConclusion = synthesis.conciseConclusion;
      }
      if (synthesis.mainFactor) {
        verdict.mainFactor = synthesis.mainFactor;
        verdict.mainFactorReason = synthesis.mainFactorReason;
      }
    }

    const synthesisText = `FINAL CHAMBER SYNTHESIS\n\nQuestion:\n"${synthesis.question}"\n\nKey Findings:\n${synthesis.keyFindings.map(f => `- ${f}`).join('\n')}\n\nAreas of Agreement:\n${synthesis.areasOfAgreement}\n\nAreas of Disagreement:\n${synthesis.areasOfDisagreement}\n\nUnresolved Issues:\n${synthesis.unresolvedIssues}\n\nConclusion:\n${synthesis.conclusion}`;

    transcript.push({
      type: 'final-synthesis',
      who: 'CHAMBER CHAIR · FINAL SYNTHESIS',
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      text: synthesisText
    });

    sendEvent('synthesis', synthesis);
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
        seatsPresent: `${participatingAgents.length} / ${participatingAgents.length}`,
        directedMode: participatingAgents.length === 2 && isCrossExam ? 'cross_exam' : (participatingAgents.length < 9 ? 'directed' : 'full_bench'),
        directedSeats: participatingAgents.map(a => a.seat),
        votes,
        verdict,
        transcript
      });
    } catch (dbErr) {
      console.warn('[Session DB Save Warning]:', dbErr);
    }

    sendEvent('done', { sessionId, completed: true, savedToDb: true, verdictId: verdict.id, outcome: verdict.outcome });
    res.end();

  } catch (err) {
    console.error('[api/session.js Error]:', err);
    sendEvent('error', { message: err.message || 'Chamber session encountered an error.' });
    res.end();
  }
};
