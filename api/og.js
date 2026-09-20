/**
 * Vercel Serverless Function — GET /api/og
 * F8: Dynamic Open Graph (OG) Social Card Generator (1200x630 SVG)
 * Strict Monochrome Brutalist Architecture for Twitter/X & Telegram Previews
 */

const db = require('../db/init');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');

  const id = String(req.query.id || 'BC-0411').toUpperCase();
  let asset = String(req.query.asset || '').toUpperCase();
  let verdict = String(req.query.verdict || '').toUpperCase();
  let ratio = String(req.query.ratio || '');
  let sizeBand = String(req.query.size || '');

  // If session ID is provided, query database for exact verdict record
  if (id && (!asset || !verdict)) {
    try {
      const session = db.prepare("SELECT * FROM sessions WHERE id = ?").get(id);
      if (session) {
        asset = session.asset;
        verdict = session.verdict;
        ratio = `${session.majority} / 9`;
        sizeBand = session.size_band || '1.0 – 2.0%';
      }
    } catch (e) {
      // fallback to query params or defaults
    }
  }

  // Defaults if still empty
  asset = asset || 'SOL';
  verdict = verdict || 'REDUCE';
  ratio = ratio || '5 / 9';
  sizeBand = sizeBand || '0.5 – 1.0%';

  const isAdd = verdict === 'ADD';
  const badgeBg = isAdd ? '#FFFFFF' : (verdict === 'REDUCE' ? '#1F1F1F' : '#0A0A0A');
  const badgeColor = isAdd ? '#000000' : '#FFFFFF';
  const badgeBorder = '#FFFFFF';

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

  <!-- Background Canvas -->
  <rect width="1200" height="630" fill="#050505" />
  <rect width="1200" height="630" fill="url(#gridDots)" />

  <!-- Outer Frame -->
  <rect x="36" y="36" width="1128" height="558" rx="8" fill="none" stroke="#262626" stroke-width="1.5" />
  <rect x="42" y="42" width="1116" height="546" rx="6" fill="none" stroke="rgba(255, 255, 255, 0.06)" stroke-dasharray="4 4" />

  <!-- Header Section -->
  <g transform="translate(70, 85)">
    <!-- 8-Bit Pixel Logo -->
    <g fill="#FFFFFF">
      <rect x="0" y="0" width="6" height="6" />
      <rect x="12" y="0" width="6" height="6" />
      <rect x="6" y="6" width="6" height="6" />
      <rect x="18" y="6" width="6" height="6" />
      <rect x="0" y="12" width="6" height="6" />
      <rect x="12" y="12" width="6" height="6" />
      <rect x="6" y="18" width="6" height="6" />
      <rect x="18" y="18" width="6" height="6" />
    </g>
    <text x="36" y="18" fill="#FFFFFF" font-size="16" font-weight="600" letter-spacing="2" class="mono">BOURSE CHAMBER</text>
    <text x="230" y="18" fill="#6E6E6E" font-size="14" class="mono">// OFFICIAL VERDICT RECORD ${id}</text>
  </g>

  <!-- Divider Line -->
  <line x1="70" y1="125" x2="1130" y2="125" stroke="#222222" stroke-width="1" />

  <!-- Main Body Content -->
  <g transform="translate(70, 190)">
    <!-- Asset Label & Ticker -->
    <text x="0" y="0" fill="#888888" font-size="14" letter-spacing="1.5" class="mono">EVALUATED ASSET</text>
    <text x="0" y="58" fill="#FFFFFF" font-size="62" font-weight="700" letter-spacing="-1" class="sans">${asset}</text>
    <text x="0" y="98" fill="#9A9A9A" font-size="18" class="mono">Nine economists. One market that refuses to behave.</text>

    <!-- Details Box -->
    <g transform="translate(0, 145)">
      <rect x="0" y="0" width="580" height="130" fill="#0A0A0A" stroke="#262626" rx="4" />
      
      <text x="24" y="36" fill="#6E6E6E" font-size="12" letter-spacing="1" class="mono">BENCH ROLL-CALL MAJORITY</text>
      <text x="24" y="64" fill="#FFFFFF" font-size="22" font-weight="600" class="mono">${ratio} CARRIED</text>
      
      <line x1="300" y1="20" x2="300" y2="110" stroke="#1F1F1F" stroke-width="1" />

      <text x="324" y="36" fill="#6E6E6E" font-size="12" letter-spacing="1" class="mono">TALEB SIZING BAND</text>
      <text x="324" y="64" fill="#FFFFFF" font-size="22" font-weight="600" class="mono">${sizeBand}</text>

      <text x="24" y="105" fill="#888888" font-size="12" class="mono">Automatic review trigger active on 30% drawdown barrier.</text>
    </g>
  </g>

  <!-- Right Column: Big Verdict Stamp Card -->
  <g transform="translate(730, 165)">
    <rect x="0" y="0" width="390" height="300" fill="#0A0A0A" stroke="#333333" stroke-width="2" rx="4" />
    <rect x="12" y="12" width="366" height="276" fill="none" stroke="#222222" stroke-dasharray="3 3" />

    <text x="195" y="60" text-anchor="middle" fill="#888888" font-size="14" letter-spacing="2" class="mono">CHAMBER VERDICT</text>
    
    <!-- Big Verdict Badge -->
    <rect x="45" y="85" width="300" height="95" rx="4" fill="${badgeBg}" stroke="${badgeBorder}" stroke-width="2" />
    <text x="195" y="152" text-anchor="middle" fill="${badgeColor}" font-size="52" font-weight="800" letter-spacing="4" class="sans">${verdict}</text>

    <!-- Subtext -->
    <text x="195" y="225" text-anchor="middle" fill="#FFFFFF" font-size="14" font-weight="500" class="mono">RECORDED ON PERMANENT LEDGER</text>
    <text x="195" y="255" text-anchor="middle" fill="#666666" font-size="12" class="mono">NON-FINANCIAL ADVICE SIMULATION</text>
  </g>

  <!-- Footer Watermark Bar -->
  <line x1="70" y1="520" x2="1130" y2="520" stroke="#222222" stroke-width="1" />
  <g transform="translate(70, 552)">
    <text x="0" y="0" fill="#6E6E6E" font-size="13" class="mono">BOURSE-CHAMBER.VERCEL.APP // VERDICT ARCHIVE</text>
    <text x="1060" y="0" text-anchor="end" fill="#FFFFFF" font-size="13" font-weight="500" class="mono">UNALTERABLE LOGGED LEDGER →</text>
  </g>
</svg>`;

  if (typeof res.send === 'function') {
    res.send(svg);
  } else {
    res.end(svg);
  }
};
