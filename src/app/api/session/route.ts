import { NextRequest } from 'next/server';
import { CRYPTO_AGENTS as AGENTS } from '../../../lib/crypto-agents';
import {
  generateRound1Analysis,
  generateRound2CrossExam,
  generateRound3Vote,
  aggregateVotes
} from '../../../lib/openrouter';
import { fetchCryptoEvidence } from '../../../lib/coingecko';
import { db } from '../../../lib/db';
import { redis } from '../../../lib/redis';
import { SeatVote, TranscriptMessage, Round1Analysis } from '../../../types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // 1. Rate Limiting Protection (10 requests per minute per IP)
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  const { allowed, remaining, resetAt } = await redis.checkRateLimit(`session:${clientIp}`, 10, 60);

  if (!allowed) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded for deliberation sessions. Please wait before submitting another thesis.',
        resetAt,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.max(1, resetAt - Math.floor(Date.now() / 1000))),
        },
      }
    );
  }

  try {
    const body = await req.json();
    const query = String(body.input || '').trim().slice(0, 500);

    // 2. Input Validation
    if (!query) {
      return new Response(JSON.stringify({ error: 'Input thesis or asset is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ticker = query.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 12) || 'BTC';
    const evidence = await fetchCryptoEvidence(ticker);
    const sessionId = `BC-${Math.floor(1000 + Math.random() * 9000)}`;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const transcript: TranscriptMessage[] = [];
        const round1Analyses = new Map<number, Round1Analysis>();
        const votes: SeatVote[] = [];

        function emit(event: string, data: unknown) {
          try {
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
          } catch (_) {}
        }

        try {
          // --- PHASE 1: Motion Filing & Evidentiary Snapshot ---
          emit('motion', {
            sessionId,
            asset: ticker,
            motion: query,
            llmProvider: process.env.OPENROUTER_API_KEY ? 'OpenRouter Real LLM Engine' : 'Deterministic Cognitive Simulator',
          });

          emit('evidence', evidence);

          const evidenceSummary = `${evidence.name} ($${evidence.priceFormatted || evidence.price}), 24h Change: ${evidence.change24h}%, MCap: $${evidence.marketCapFormatted || evidence.marketCap}`;

          // --- ROUND 1: Strictly Independent Readings (All 9 Personas) ---
          // All 9 personas receive the IDENTICAL Evidence Pack.
          // Never allows empty analysis.
          for (const agent of AGENTS) {
            emit('seat_start', { seat: agent.seat, seatId: agent.seat, name: agent.name });

            const r1 = await generateRound1Analysis(agent, query, evidenceSummary);
            round1Analyses.set(agent.seat, r1);

            // Stream words progressively to frontend
            const words = r1.analysis.split(' ');
            for (const w of words) {
              emit('seat_token', { seat: agent.seat, seatId: agent.seat, text: w + ' ', chunk: w + ' ' });
            }

            emit('seat_end', {
              type: 'seat_end',
              seat: agent.seat,
              seatId: agent.seat,
              persona: agent.name,
              name: agent.name,
              stance: r1.stance,
              analysis: r1.analysis,
              key_claims: r1.key_claims,
              risk: r1.risk,
            });

            transcript.push({
              type: 'speaking',
              who: agent.name,
              seat: agent.seat,
              time: new Date().toLocaleTimeString('en-US', { hour12: false }),
              text: r1.analysis,
            });

            emit('speech', { seat: agent.seat, who: agent.name, text: r1.analysis });
          }

          if (round1Analyses.size !== 9) {
            throw new Error(`Round 1 incomplete: ${round1Analyses.size}/9 analyses recorded.`);
          }

          // --- ROUND 2: Cross-Examination Duel ---
          // Identify opposing personas based on Round 1 stances
          const addAgent = AGENTS.find((a) => round1Analyses.get(a.seat)?.stance === 'ADD') || AGENTS.find((a) => a.seat === 4) || AGENTS[3];
          const reduceAgent = AGENTS.find((a) => round1Analyses.get(a.seat)?.stance === 'REDUCE' && a.seat !== addAgent.seat) || AGENTS.find((a) => a.seat === 6) || AGENTS[5];

          const challenger = reduceAgent;
          const defender = addAgent;
          const defenderR1 = round1Analyses.get(defender.seat)!;

          emit('duel_start', { seatA: challenger.seat, seatB: defender.seat });

          const duel = await generateRound2CrossExam(
            challenger,
            defender,
            defenderR1,
            query,
            evidenceSummary
          );

          emit('rebuttal', {
            type: 'rebuttal',
            seatId: challenger.seat,
            targetSeatId: defender.seat,
            seatA: challenger.seat,
            seatB: defender.seat,
            persona: challenger.name,
            challenger: challenger.name,
            defender: defender.name,
            challenge: duel.challenge,
            response: duel.response,
          });

          transcript.push({
            type: 'challenge',
            who: `${challenger.name} (CHALLENGE TO SEAT 0${defender.seat})`,
            seat: challenger.seat,
            time: new Date().toLocaleTimeString('en-US', { hour12: false }),
            text: duel.challenge,
          });

          transcript.push({
            type: 'response',
            who: `${defender.name} (RESPONSE TO SEAT 0${challenger.seat})`,
            seat: defender.seat,
            time: new Date().toLocaleTimeString('en-US', { hour12: false }),
            text: duel.response,
          });

          emit('speech', { seat: challenger.seat, who: `${challenger.name} [CROSS-EXAM]`, text: duel.challenge });
          emit('speech', { seat: defender.seat, who: `${defender.name} [REBUTTAL]`, text: duel.response });

          // --- ROUND 3: Voting Ballot & Aggregation ---
          // Ask ALL 9 personas to cast ADD / REDUCE / PASS
          for (const agent of AGENTS) {
            const r1 = round1Analyses.get(agent.seat)?.analysis || '';
            const ballot = await generateRound3Vote(agent, query, r1, duel.challenge);
            votes.push(ballot);

            emit('vote', {
              type: 'vote',
              seat: agent.seat,
              seatId: agent.seat,
              name: agent.name,
              persona: agent.name,
              shortName: agent.shortName,
              vote: ballot.vote,
              reason: ballot.rationale,
              rationale: ballot.rationale,
            });
          }

          if (votes.length !== 9) {
            throw new Error(`Round 3 incomplete: received ${votes.length}/9 votes.`);
          }

          // Deterministic Aggregator
          const verdict = aggregateVotes(votes, sessionId, ticker, evidence.name, query);
          emit('verdict', verdict);

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
              transcript,
            });
          } catch (dbErr) {
            console.warn('[Session DB Save Warning]:', dbErr);
          }

          emit('done', { sessionId, completed: true, savedToDb: true, verdictId: verdict.id, outcome: verdict.outcome });
          emit('complete', { sessionId, completed: true, savedToDb: true, verdictId: verdict.id, outcome: verdict.outcome });
          controller.close();
        } catch (execErr: any) {
          console.error('[Session Deliberation Error]:', execErr);
          emit('error', { message: execErr.message || 'Chamber deliberation encountered an error.' });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const aggregate = searchParams.get('aggregate');
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  if (id) {
    const session = await db.getSession(id);
    if (!session) {
      return new Response(JSON.stringify({ error: `Session '${id}' not found.` }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify(session), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const sessions = await db.listSessions(limit);
  if (aggregate === 'bench' || aggregate === 'agents') {
    const records = AGENTS.map((agent) => {
      let participated = 0;
      let votedFor = 0;
      let dissents = 0;
      const recentVotes: Array<{ sessionId: string; vote: string; ticker: string; rationale: string }> = [];

      for (const s of sessions) {
        if (Array.isArray(s.votes)) {
          const v = s.votes.find((item: any) => item.seat === agent.seat || item.name === agent.name || item.persona === agent.name);
          if (v) {
            participated++;
            if (s.verdict && v.vote === s.verdict.outcome) {
              votedFor++;
            } else if (s.verdict) {
              dissents++;
            }
            if (recentVotes.length < 5) {
              recentVotes.push({
                sessionId: s.id,
                vote: v.vote,
                ticker: s.ticker || 'ASSET',
                rationale: v.rationale || (v as any).reason || '',
              });
            }
          }
        }
      }

      return {
        seat: agent.seat,
        name: agent.name,
        shortName: agent.shortName,
        discipline: agent.discipline,
        participated,
        votedFor,
        dissents,
        recentVotes,
      };
    });

    return new Response(JSON.stringify({ agents: records, totalSessions: sessions.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(sessions), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
