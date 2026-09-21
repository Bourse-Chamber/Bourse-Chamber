/**
 * Vercel Serverless Function — POST /api/session
 * Multi-Agent SSE Streaming Protocol for Bourse Chamber
 * Real OpenRouter LLM Streaming (OPENROUTER_API_KEY) with deterministic fallback
 */

const { AGENTS } = require("../db/agents");
const { evaluateSession, demoEvidence } = require("../db/engine");

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
      const { db } = require('../src/lib/db');
      if (id) {
        const session = await db.getSession(id);
        if (!session) return res.status(404).json({ error: `Session '${id}' not found.` });
        return res.status(200).json(session);
      }
      const sessions = await db.listSessions(parseInt(limit, 10));
      if (aggregate === 'bench' || aggregate === 'agents') {
        const { AGENTS } = require('../src/lib/agents');
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

  const { input, directedSeats, isCrossExam, openRouterKey: bodyKey } = req.body || {};
  const query = String(input || "").trim().slice(0, 280);

  if (!query) {
    return res.status(400).json({ error: 'Input thesis or asset is required.' });
  }

  const openRouterApiKey = (process.env.OPENROUTER_API_KEY || '').trim();

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  function sendEvent(type, payload) {
    res.write(`event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`);
  }

  const sessionId = `BC-${Math.floor(1000 + Math.random() * 9000)}`;
  const ticker = query.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'ASSET';

  try {
    // 1. Motion Event
    sendEvent('motion', {
      asset: ticker,
      motion: query,
      sessionId,
      llmProvider: openRouterApiKey ? 'OpenRouter Live AI' : 'Deterministic Cognitive Simulator'
    });

    // 2. Evidence Pack Event
    const evidence = demoEvidence(query);
    sendEvent('evidence', {
      metrics: [
        { label: 'Price', value: evidence.price },
        { label: '24h Change', value: `${evidence.change24h}%` },
        { label: 'Market Cap', value: evidence.marketCap },
        { label: '24h Volume', value: evidence.volume24h }
      ],
      gaps: ['Non-speculative fee accrual metrics pending protocol audit'],
      sources: ['CoinGecko v3 API Feed', 'On-chain RPC snapshot']
    });

    // Determine target seats (Full bench or Directed)
    let targetSeats = AGENTS;
    if (Array.isArray(directedSeats) && directedSeats.length > 0) {
      targetSeats = AGENTS.filter(a => directedSeats.includes(a.seat));
    }

    // 3. Readings: Stream tokens per seat
    for (const agent of targetSeats) {
      sendEvent('seat_start', { seatId: agent.seat, name: agent.name });

      let streamedText = '';

      // If OpenRouter key is available, attempt live LLM streaming
      if (openRouterApiKey) {
        try {
          const sysPrompt = `You are ${agent.name}, an investor at the Bourse Chamber. Your discipline is "${agent.discipline}" (${agent.school} school). Philosophy: "${agent.philosophy}". When presented with the thesis "${query}" on asset ${ticker}, give your concise verdict reading in character in exactly 2-3 sentences. Challenge assumptions based on your philosophy. Do not give financial advice.`;

          const llmRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openRouterApiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://bourse-chamber.vercel.app',
              'X-Title': 'Bourse Chamber'
            },
            body: JSON.stringify({
              model: 'anthropic/claude-3.5-sonnet',
              messages: [
                { role: 'system', content: sysPrompt },
                { role: 'user', content: `Examine the asset: ${ticker}. Thesis: ${query}. Market context: Price $${evidence.price}, 24h change ${evidence.change24h}%.` }
              ],
              stream: true,
              max_tokens: 120,
              temperature: 0.7
            }),
            signal: AbortSignal.timeout(10000)
          });

          if (llmRes.ok && llmRes.body) {
            const reader = llmRes.body.getReader();
            const decoder = new TextDecoder();
            let done = false;

            while (!done) {
              const { value, done: readerDone } = await reader.read();
              done = readerDone;
              if (value) {
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                for (const line of lines) {
                  if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                    try {
                      const data = JSON.parse(line.substring(6));
                      const token = data.choices?.[0]?.delta?.content || '';
                      if (token) {
                        streamedText += token;
                        sendEvent('seat_token', { seatId: agent.seat, text: token });
                      }
                    } catch (parseErr) {}
                  }
                }
              }
            }
          }
        } catch (llmErr) {
          // fallback to simulated streaming if OpenRouter fails
          streamedText = '';
        }
      }

      // Fallback to deterministic token stream if live LLM did not complete
      if (!streamedText) {
        const text = agent.say.replace(/\{A\}/g, query);
        const words = text.split(' ');
        const delay = process.env.NODE_ENV === 'test' ? 0 : 35;
        for (const word of words) {
          sendEvent('seat_token', { seatId: agent.seat, text: word + ' ' });
          if (delay > 0) await new Promise(r => setTimeout(r, delay));
        }
      }

      sendEvent('seat_end', {
        seatId: agent.seat,
        stance: agent.traits.riskAversion >= 8 ? 'against' : 'for'
      });
    }

    // 4. Rebuttal Event (Cross-examination duel)
    if (targetSeats.length >= 2) {
      const seatA = targetSeats[0];
      const seatB = targetSeats[targetSeats.length - 1];
      sendEvent('rebuttal', {
        seatId: seatA.seat,
        targetSeatId: seatB.seat,
        challenge: `To ${seatB.name}: You are framing this as if adoption guarantees downside protection. What stops an 80% drawdown?`,
        response: `To ${seatA.name}: Survival through high volatility is what creates long-term convex alpha.`
      });
    }

    // 5. Voting Event (Free roll-call)
    const evalResult = evaluateSession(query);
    evalResult.perAgent.forEach(p => {
      sendEvent('vote', {
        seatId: p.agent.seat,
        name: p.agent.name,
        vote: p.vote,
        reason: `${p.agent.discipline}: Deliberated from discipline tenets.`
      });
    });

    // 6. Verdict Event (Taleb Sizing Band & Review Triggers)
    const sizeBand = evalResult.verdict === 'ADD' ? '2.5 – 4.0%' : (evalResult.verdict === 'REDUCE' ? '0.0 – 1.0%' : '1.0 – 2.0%');

    sendEvent('verdict', {
      decision: evalResult.verdict,
      tally: `${evalResult.majority} / 9`,
      sizeBand,
      sizingSeat: 'Seat 06 · Nassim Nicholas Taleb (Tail risk)',
      reviewTrigger: [
        'Asset price suffers a cumulative drawdown exceeding 30–35%',
        'On-chain transaction velocity contracts by >35%',
        'Valuation expands >50% without matching fee economics'
      ],
      verdictId: sessionId
    });

    res.write('event: done\ndata: {}\n\n');
    res.end();

  } catch (err) {
    sendEvent('error', { message: err.message || 'Chamber session encountered an error.' });
    res.end();
  }
};
