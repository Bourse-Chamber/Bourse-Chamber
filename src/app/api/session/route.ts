import { NextRequest } from 'next/server';
import { CRYPTO_AGENTS as AGENTS } from '../../../lib/crypto-agents';
import {
  generateRound1Analysis,
  generateRound2CrossExam,
  generateRound3Vote,
  aggregateVotes,
  generateFinalSynthesis,
  detectQuestionTopic,
  validateDeterministicTokenCa
} from '../../../lib/openrouter';
import { fetchCryptoEvidence, extractTickerFromQuery } from '../../../lib/coingecko';
import { fetchCaEvidence, formatCaEvidenceSummary, extractContractAddress, extractTokenNameFromQuery } from '../../../lib/ca-evidence';
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
    const query = String(body.input || '').trim().slice(0, 4000);

    // 2. Input Validation
    if (!query) {
      return new Response(JSON.stringify({ error: 'Input thesis or asset is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Mandatory Participant Seat Selection
    const rawSeats = Array.isArray(body.selectedSeats) && body.selectedSeats.length > 0
      ? body.selectedSeats
      : (Array.isArray(body.directedSeats) && body.directedSeats.length > 0 ? body.directedSeats : []);
    const seatNums = rawSeats.map((s: any) => parseInt(s, 10)).filter((s: number) => s >= 1 && s <= 9);

    if (seatNums.length === 0) {
      return new Response(JSON.stringify({ error: 'Select at least one seat to convene.', code: 'NO_SEATS_SELECTED' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const participatingAgents = AGENTS.filter(a => seatNums.includes(a.seat));
    if (participatingAgents.length === 0) {
      return new Response(JSON.stringify({ error: 'No matching council seats found for selection.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Evidence Pack Gathering (CA-specific or Crypto Market)
    const qTopic = detectQuestionTopic(query);
    const caMatch = extractContractAddress(query);
    const isCa = qTopic === 'TOKEN_CA' || Boolean(caMatch);

    console.log('[SESSION DEBUG] query:', query.slice(0, 120));
    console.log('[SESSION DEBUG] qTopic:', qTopic, '| isCa:', isCa, '| caMatch:', caMatch);

    let evidence: any;
    let evidenceSummary: string;
    const extractedTokenName = extractTokenNameFromQuery(query);
    let ticker = extractedTokenName || extractTickerFromQuery(query);
    let caData: any = null;

    if (isCa) {
      caData = await fetchCaEvidence(query);

      // Debug: log CA evidence snapshot to Vercel runtime logs
      console.log('[SESSION DEBUG] caData.isAvailable:', caData.isAvailable);
      console.log('[SESSION DEBUG] caData.name:', caData.name, '| symbol:', caData.symbol);
      console.log('[SESSION DEBUG] caData.network:', caData.network);
      console.log('[SESSION DEBUG] caData.marketCapFormatted:', caData.marketCapFormatted);
      console.log('[SESSION DEBUG] caData.targetMarketCapFormatted:', caData.targetMarketCapFormatted);
      console.log('[SESSION DEBUG] caData.requiredMultipleFormatted:', caData.requiredMultipleFormatted);
      console.log('[SESSION DEBUG] caData.liquidityFormatted:', caData.liquidityFormatted);
      console.log('[SESSION DEBUG] caData.volume24hFormatted:', caData.volume24hFormatted);
      console.log('[SESSION DEBUG] caData.txns24h:', JSON.stringify(caData.txns24h));

      evidenceSummary = formatCaEvidenceSummary(caData);
      if (caData.symbol && caData.symbol !== 'DATA UNAVAILABLE') {
        ticker = caData.symbol;
      } else if (extractedTokenName) {
        ticker = extractedTokenName;
        caData.symbol = extractedTokenName;
        if (caData.name === 'DATA UNAVAILABLE' || caData.name === 'Contract Token') {
          caData.name = extractedTokenName;
        }
      } else {
        ticker = 'TOKEN';
      }
      evidence = {
        ticker,
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
      evidence = await fetchCryptoEvidence(ticker);
      evidenceSummary = `${evidence.name} ($${evidence.priceFormatted || evidence.price}), 24h Change: ${evidence.change24h}%, MCap: $${evidence.marketCapFormatted || evidence.marketCap}`;
    }

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
            questionType: isCa ? 'TOKEN_CA' : qTopic,
            targetMarketCap: isCa ? caData?.targetMarketCapFormatted : null,
            requiredMultiple: isCa ? caData?.requiredMultipleFormatted : null,
            network: isCa ? caData?.network : null,
            totalParticipants: participatingAgents.length,
            participatingSeats: participatingAgents.map(a => a.seat),
            llmProvider: process.env.OPENROUTER_API_KEY ? 'OpenRouter Real LLM Engine' : 'Deterministic Cognitive Simulator',
          });

          if (isCa && caData) {
            emit('evidence', {
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
            emit('evidence', evidence);
          }

          // --- ROUND 1: Strictly Independent Readings (Selected Personas Only) ---
          for (const agent of participatingAgents) {
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
            // Single emission per seat analysis — speech event omitted to avoid duplicate rendering
          }

          if (round1Analyses.size !== participatingAgents.length) {
            throw new Error(`Round 1 incomplete: ${round1Analyses.size}/${participatingAgents.length} analyses recorded.`);
          }

          // --- ROUND 2: Cross-Examination Duel (Only if >= 2 participants) ---
          let duelChallenge = '';
          if (participatingAgents.length >= 2) {
            // TOKEN_CA: pair SUPPORTED vs NOT_SUPPORTED/INSUFFICIENT_EVIDENCE
            // Standard: pair ADD vs REDUCE
            const isTokenCa = isCa;
            const proStances = isTokenCa ? ['SUPPORTED'] : ['ADD'];
            const conStances = isTokenCa ? ['NOT_SUPPORTED', 'INSUFFICIENT_EVIDENCE'] : ['REDUCE', 'PASS'];

            const addAgent =
              participatingAgents.find((a) => proStances.includes(round1Analyses.get(a.seat)?.stance || '')) ||
              participatingAgents[0];
            const reduceAgent =
              participatingAgents.find((a) => conStances.includes(round1Analyses.get(a.seat)?.stance || '') && a.seat !== addAgent.seat) ||
              participatingAgents.find(a => a.seat !== addAgent.seat) ||
              participatingAgents[1];

            const challenger = reduceAgent;
            const defender = addAgent;
            const defenderR1 = round1Analyses.get(defender.seat)!;

            console.log(`[SESSION DEBUG] Round 2 duel: ${challenger.name} (Seat ${challenger.seat}, stance: ${round1Analyses.get(challenger.seat)?.stance}) vs ${defender.name} (Seat ${defender.seat}, stance: ${round1Analyses.get(defender.seat)?.stance})`);

            emit('duel_start', { seatA: challenger.seat, seatB: defender.seat });

            const duel = await generateRound2CrossExam(
              challenger,
              defender,
              defenderR1,
              query,
              evidenceSummary
            );
            duelChallenge = duel.challenge;

            const duelPayload = {
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
            };
            // Single cross-exam event emission
            emit('rebuttal', duelPayload);

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
          }

          // --- ROUND 3: Voting Ballot & Aggregation (Selected Personas Only) ---
          for (const agent of participatingAgents) {
            const r1 = round1Analyses.get(agent.seat)?.analysis || '';
            const ballot = await generateRound3Vote(agent, query, r1, duelChallenge);
            votes.push(ballot);

            console.log(`[SESSION DEBUG] Vote — Seat ${agent.seat} ${agent.name}: ${ballot.vote}`);

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

          if (votes.length !== participatingAgents.length) {
            throw new Error(`Round 3 incomplete: received ${votes.length}/${participatingAgents.length} votes.`);
          }

          // Deterministic Aggregator (Dynamic Denominator)
          const verdict = aggregateVotes(votes, sessionId, ticker, evidence.name, query, isCa ? caData : undefined);
          console.log(`[SESSION DEBUG] Verdict: outcome=${verdict.outcome} | majorityRatio=${verdict.majorityRatio} | questionTopic=${verdict.questionTopic}`);

          // Final Chamber Synthesis
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

          const synthesisText = `FINAL CHAMBER SYNTHESIS\n\nQuestion:\n"${synthesis.question}"\n\nKey Findings:\n${synthesis.keyFindings.map((f: string) => `- ${f}`).join('\n')}\n\nAreas of Agreement:\n${synthesis.areasOfAgreement}\n\nAreas of Disagreement:\n${synthesis.areasOfDisagreement}\n\nUnresolved Issues:\n${synthesis.unresolvedIssues}\n\nConclusion:\n${synthesis.conclusion}`;

          transcript.push({
            type: 'final-synthesis',
            who: 'CHAMBER CHAIR · FINAL SYNTHESIS',
            time: new Date().toLocaleTimeString('en-US', { hour12: false }),
            text: synthesisText
          });

          emit('synthesis', synthesis);
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
              seatsPresent: `${participatingAgents.length} / ${participatingAgents.length}`,
              directedMode: participatingAgents.length === 2 && body.isCrossExam ? 'cross_exam' : (participatingAgents.length < 9 ? 'directed' : 'full_bench'),
              directedSeats: participatingAgents.map(a => a.seat),
              votes,
              verdict,
              transcript,
            });
          } catch (dbErr) {
            console.warn('[Session DB Save Warning]:', dbErr);
          }

          emit('done', { sessionId, completed: true, savedToDb: true, verdictId: verdict.id, outcome: verdict.outcome });
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
