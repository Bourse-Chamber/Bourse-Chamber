import { NextRequest, NextResponse } from 'next/server';
import { fetchCryptoEvidence } from '../../../lib/coingecko';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get('ticker') || searchParams.get('asset') || 'BTC';

  try {
    const evidence = await fetchCryptoEvidence(ticker);
    return NextResponse.json(evidence, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to retrieve crypto market data.' },
      { status: 500 }
    );
  }
}
