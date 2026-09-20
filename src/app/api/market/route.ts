import { NextRequest, NextResponse } from 'next/server';
import { fetchCryptoEvidence } from '../../../lib/coingecko';
import { redis } from '../../../lib/redis';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  const { allowed, resetAt } = await redis.checkRateLimit(`market:${clientIp}`, 60, 60);

  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded for market data. Please slow down.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.max(1, resetAt - Math.floor(Date.now() / 1000))),
        },
      }
    );
  }

  const { searchParams } = new URL(req.url);
  const rawTicker = searchParams.get('ticker') || searchParams.get('asset') || 'BTC';
  const ticker = rawTicker.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 12) || 'BTC';

  try {
    const evidence = await fetchCryptoEvidence(ticker);
    return NextResponse.json(evidence, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve crypto market data.', details: err.message },
      { status: 500 }
    );
  }
}
