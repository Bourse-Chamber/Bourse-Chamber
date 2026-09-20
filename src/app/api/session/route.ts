import { NextRequest } from 'next/server';
import { AGENTS } from '../../../lib/agents';
import { streamOpenRouterAgent } from '../../../lib/openrouter';
import { fetchCryptoEvidence } from '../../../lib/coingecko';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = String(body.input || '').trim().slice(0, 280);
    const customKey = body.openRouterKey || req.headers.get('x-openrouter-key') || undefined;

    if (!query) {
      return new Response(JSON.stringify({ error: 'Input thesis or asset is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ticker = query.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'BTC';
    const evidence = await fetchCryptoEvidence(ticker);
    const sessionId = `BC-${Math.floor(1000 + Math.random() * 9000)}`;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        function emit(event: string, data: unknown) {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        }

        // 1. Motion
        emit('motion', {
          sessionId,
          asset: ticker,
          motion: query,
          llmProvider: customKey || process.env.OPENROUTER_API_KEY ? 'OpenRouter Live AI' : 'Deterministic Engine',
        });

        // 2. Evidence
        emit('evidence', evidence);

        // 3. Round 1 readings
        for (const agent of AGENTS.slice(0, 5)) {
          emit('speaking_start', { seat: agent.seat, name: agent.name });

          let reading = '';
          for await (const chunk of streamOpenRouterAgent(agent, query, `${evidence.name} ($${evidence.price})`, customKey)) {
            reading += chunk;
            emit('token', { seat: agent.seat, chunk });
          }

          emit('speech', { seat: agent.seat, who: agent.name, text: reading });
        }

        // 4. Closed & complete
        emit('verdict', {
          sessionId,
          outcome: 'REDUCE',
          majorityRatio: '5 / 9',
          positionSizeBand: '1.0 – 2.0%',
        });

        emit('complete', { sessionId });
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
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to process session stream.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
