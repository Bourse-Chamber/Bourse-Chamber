import { NextRequest } from 'next/server';
import { db } from '../../../lib/db';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = (searchParams.get('id') || 'BC-0411').toUpperCase();

  let asset = searchParams.get('asset')?.toUpperCase();
  let verdict = searchParams.get('verdict')?.toUpperCase();
  let ratio = searchParams.get('ratio');
  let sizeBand = searchParams.get('size');

  if (id && (!asset || !verdict)) {
    const session = await db.getSession(id);
    if (session && session.verdict) {
      asset = session.ticker;
      verdict = session.verdict.outcome;
      ratio = session.verdict.majorityRatio;
      sizeBand = session.verdict.positionSizeBand;
    }
  }

  asset = asset || 'SOL';
  verdict = verdict || 'REDUCE';
  ratio = ratio || '5 / 9';
  sizeBand = sizeBand || '1.0 – 2.0%';

  const isAdd = verdict === 'ADD';
  const badgeBg = isAdd ? '#FFFFFF' : '#1A1A1A';
  const badgeColor = isAdd ? '#000000' : '#FFFFFF';

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="gridDots" width="30" height="30" patternUnits="userSpaceOnUse">
      <circle cx="15" cy="15" r="1.2" fill="rgba(255, 255, 255, 0.08)" />
    </pattern>
    <style>
      .mono { font-family: 'JetBrains Mono', 'Courier New', monospace; }
      .sans { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
    </style>
  </defs>

  <rect width="1200" height="630" fill="#050505" />
  <rect width="1200" height="630" fill="url(#gridDots)" />
  <rect x="24" y="24" width="1152" height="582" fill="none" stroke="#242424" stroke-width="2" />

  <g transform="translate(60, 70)">
    <rect x="0" y="0" width="16" height="16" fill="#FFFFFF" />
    <text x="28" y="14" fill="#FFFFFF" class="mono" font-size="20" font-weight="600" letter-spacing="2">BOURSE CHAMBER</text>
    <text x="28" y="32" fill="#6E6E6E" class="mono" font-size="12" letter-spacing="1">AI INVESTMENT DISCUSSION CHAMBER</text>
  </g>

  <g transform="translate(940, 70)">
    <rect x="0" y="0" width="200" height="36" fill="#0A0A0A" stroke="#242424" stroke-width="1" />
    <text x="100" y="23" fill="#FFFFFF" class="mono" font-size="14" font-weight="600" text-anchor="middle">SESSION ${id}</text>
  </g>

  <line x1="60" y1="130" x2="1140" y2="130" stroke="#242424" stroke-width="1" />

  <g transform="translate(60, 190)">
    <text x="0" y="0" fill="#9A9A9A" class="mono" font-size="14" letter-spacing="2">EVALUATED ASSET</text>
    <text x="0" y="55" fill="#FFFFFF" class="sans" font-size="56" font-weight="700" letter-spacing="-1">${asset}</text>
  </g>

  <g transform="translate(60, 310)">
    <text x="0" y="0" fill="#9A9A9A" class="mono" font-size="14" letter-spacing="2">COUNCIL VERDICT</text>
    <rect x="0" y="18" width="260" height="84" fill="${badgeBg}" stroke="#FFFFFF" stroke-width="2" />
    <text x="130" y="74" fill="${badgeColor}" class="mono" font-size="44" font-weight="700" letter-spacing="2" text-anchor="middle">${verdict}</text>
  </g>

  <g transform="translate(420, 310)">
    <text x="0" y="0" fill="#9A9A9A" class="mono" font-size="14" letter-spacing="2">MAJORITY RATIO</text>
    <text x="0" y="68" fill="#FFFFFF" class="mono" font-size="52" font-weight="700">${ratio}</text>
    <text x="0" y="98" fill="#6E6E6E" class="mono" font-size="14">9 Independent Seats</text>
  </g>

  <g transform="translate(760, 310)">
    <text x="0" y="0" fill="#9A9A9A" class="mono" font-size="14" letter-spacing="2">TALEB POSITION SIZE</text>
    <text x="0" y="68" fill="#FFFFFF" class="mono" font-size="52" font-weight="700">${sizeBand}</text>
    <text x="0" y="98" fill="#6E6E6E" class="mono" font-size="14">Strict Downside Floor</text>
  </g>

  <line x1="60" y1="470" x2="1140" y2="470" stroke="#242424" stroke-width="1" />

  <g transform="translate(60, 520)">
    <text x="0" y="0" fill="#9A9A9A" class="mono" font-size="14">Permanent Unalterable Verdict Record · Nine Crypto Architects · One Market</text>
    <text x="0" y="24" fill="#6E6E6E" class="mono" font-size="12">bourse-chamber.vercel.app/verdict.html?id=${id}</text>
  </g>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  });
}
