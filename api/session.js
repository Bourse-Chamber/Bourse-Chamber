/**
 * Vercel Serverless Function — POST /api/session
 * Multi-Agent SSE Streaming Protocol for Bourse Chamber
 */

const { AGENTS } = require("../db/agents");
const { evaluateSession, demoEvidence } = require("../db/engine");

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { input, directedSeats, isCrossExam } = req.body || {};
  const query = String(input || "").trim().slice(0, 280);

  if (!query) {
    return res.status(400).json({ error: 'Input thesis or asset is required.' });
  }

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  function sendEvent(type, payload) {
    res.write(`event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`);
  }

  const sessionId = `BC-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    // 1. Motion Event
    sendEvent('motion', {
      asset: query.split(' ')[0].toUpperCase(),
      motion: query,
      sessionId
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
      sources: ['CoinGecko v3 API (Simulated baseline)', 'On-chain RPC snapshot']
    });

    // Determine target seats (Full bench or Directed)
    let targetSeats = AGENTS;
    if (Array.isArray(directedSeats) && directedSeats.length > 0) {
      targetSeats = AGENTS.filter(a => directedSeats.includes(a.seat));
    }

    // 3. Readings: Stream tokens per seat
    for (const agent of targetSeats) {
      sendEvent('seat_start', { seatId: agent.seat, name: agent.name });

      const text = agent.say.replace(/\{A\}/g, query);
      const chunks = text.split(' ');

      // Stream tokens
      for (const chunk of chunks) {
        sendEvent('seat_token', { seatId: agent.seat, text: chunk + ' ' });
        await new Promise(r => setTimeout(r, 45));
      }

      sendEvent('seat_end', {
        seatId: agent.seat,
        stance: agent.traits.riskAversion >= 8 ? 'against' : 'for'
      });
    }

    // 4. Rebuttal Event (Cross-examination)
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

    // 5. Voting Event (Free)
    const evalResult = evaluateSession(query);
    evalResult.perAgent.forEach(p => {
      sendEvent('vote', {
        seatId: p.agent.seat,
        name: p.agent.name,
        vote: p.vote,
        reason: `${p.agent.discipline}: Deliberated from discipline tenets.`
      });
    });

    // 6. Verdict Event (Taleb Sizing Band)
    const taleb = AGENTS.find(a => a.seat === 6);
    const sizeBand = evalResult.verdict === 'ADD' ? '2.5 – 4.0%' : (evalResult.verdict === 'REDUCE' ? '0.0 – 1.0%' : '1.0 – 2.0%');

    sendEvent('verdict', {
      decision: evalResult.verdict,
      tally: `${evalResult.majority} / 9`,
      sizeBand,
      sizingSeat: 'Seat 06 · Nassim Nicholas Taleb (Tail risk)',
      reviewTrigger: [
        'On-chain transaction volume contracts by >35%',
        'Valuation expands >50% without matching fee economics'
      ],
      verdictId: sessionId
    });

    res.write('event: done\ndata: {}\n\n');
    res.end();

  } catch (err) {
    sendEvent('error', { scope: 'session', message: err.message, recoverable: false });
    res.end();
  }
};
