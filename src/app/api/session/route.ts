import { NextRequest } from 'next/server';
import { AGENTS } from '../../../lib/agents';
import { streamRound1Reading, streamRound2Duel, generateRound3Vote, aggregateVotes } from '../../../lib/openrouter';
import { fetchCryptoEvidence } from '../../../lib/coingecko';
import { db } from '../../../lib/db';
import { redis } from '../../../lib/redis';
import { SeatVote, TranscriptMessage } from '../../../types';

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
        const round1Readings: Map<number, string> = new Map();
        const votes: SeatVote[] = [];

        function emit(event: string, data: unknown) {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        }

        // --- PHASE 1: Motion Filing & Evidentiary Snapshot ---
        emit('motion', {
          sessionId,
          asset: ticker,
          motion: query,
          llmProvider: process.env.OPENROUTER_API_KEY ? 'OpenRouter Real LLM Engine' : 'Deterministic Cognitive Simulator',
        });

        emit('evidence', evidence);

        // --- ROUND 1: Strictly Independent Readings (All 9 Personas) ---
        // Personas receive identical evidence and do NOT see peer outputs
        for (const agent of AGENTS) {
          emit('seat_start', { seat: agent.seat, name: agent.name });

          let readingText = '';
          for await (const chunk of streamRound1Reading(agent, query, `${evidence.name} ($${evidence.priceFormatted})`)) {
            readingText += chunk;
            emit('token', { seat: agent.seat, chunk });
          }

          round1Readings.set(agent.seat, readingText);
          transcript.push({
            type: 'speaking',
            who: agent.name,
            seat: agent.seat,
            time: new Date().toLocaleTimeString('en-US', { hour12: false }),
            text: readingText,
          });

          emit('speech', { seat: agent.seat, who: agent.name, text: readingText });
        }

        // --- ROUND 2: Cross-Examination Duel ---
        // Select Cathie Wood (Seat 4 - Growth) vs Taleb (Seat 6 - Tail Risk) or Munger (Seat 2)
        const challenger = AGENTS.find((a) => a.seat === 6) || AGENTS[5]; // Taleb
        const defender = AGENTS.find((a) => a.seat === 4) || AGENTS[3];   // Wood
        const defenderRound1 = round1Readings.get(defender.seat) || 'Promising technological adoption curve.';

        emit('duel_start', { seatA: challenger.seat, seatB: defender.seat });

        let challengeText = '';
        for await (const chunk of streamRound2Duel(challenger, defender, defenderRound1, query)) {
          challengeText += chunk;
          emit('duel_token', { seat: challenger.seat, chunk });
        }

        transcript.push({
          type: 'challenge',
          who: `${challenger.name} (CHALLENGE TO SEAT 0${defender.seat})`,
          seat: challenger.seat,
          time: new Date().toLocaleTimeString('en-US', { hour12: false }),
          text: challengeText,
        });

        emit('speech', { seat: challenger.seat, who: `${challenger.name} [CROSS-EXAM]`, text: challengeText });

        // --- ROUND 3: Voting Ballot & Aggregation ---
        for (const agent of AGENTS) {
          const r1 = round1Readings.get(agent.seat) || '';
          const ballot = await generateRound3Vote(agent, query, r1);
          votes.push(ballot);
          emit('vote_cast', ballot);
        }

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
          console.error('Failed to persist session to database:', dbErr);
        }

        emit('complete', { sessionId, verdictId: verdict.id });
        controller.close();
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
    return new Response(JSON.stringify({ error: 'Failed to process session deliberation.', details: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
