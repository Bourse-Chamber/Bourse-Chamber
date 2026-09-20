const test = require('node:test');
const assert = require('node:assert/strict');
const { db } = require('../src/lib/db');

test('Database Session & Verdict Persistence', async () => {
  const testSession = {
    id: 'TEST-SESS-99',
    question: 'Can decentralized stablecoins survive banking liquidity stress?',
    ticker: 'USDC',
    assetName: 'USD Coin',
    createdAt: new Date().toISOString(),
    closedAt: new Date().toISOString(),
    evidence: {
      ticker: 'USDC',
      name: 'USD Coin',
      price: 1.0,
      priceFormatted: '$1.00',
      change24h: 0.01,
      marketCap: 35000000000,
      marketCapFormatted: '$35.00B',
      volume24h: 4500000000,
      volume24hFormatted: '$4.50B',
      ath: 1.01,
      drawdownFromAthPct: '0.0',
      sparkline: [1, 1, 1, 1],
      networkActivity: 'High velocity',
      supply: '35B',
      macroContext: 'Treasury reserve backed',
      retrievalDate: '2026-09-21',
      isDemoData: false
    },
    speakingTurns: 9,
    seatsPresent: '9 / 9',
    directedMode: 'full_bench',
    directedSeats: [],
    votes: [
      { seat: 1, persona: 'Graham', shortName: 'Graham', vote: 'PASS', weight: 1, rationale: 'Cash equivalent' }
    ],
    verdict: {
      id: 'VR-TEST-SESS-99',
      sessionId: 'TEST-SESS-99',
      ticker: 'USDC',
      assetName: 'USD Coin',
      question: 'Can decentralized stablecoins survive banking liquidity stress?',
      outcome: 'PASS',
      majorityRatio: '9 / 9',
      dissentBreakdown: '0 REDUCE, 0 ADD',
      positionSizeBand: '0.0%',
      keyAgreement: 'Backed by short dated treasuries',
      keyDisagreement: 'Counterparty custody hazard',
      unresolvedQuestion: 'Circle banking partner solvency',
      reviewTriggers: ['Depeg below $0.98 for >12 hours'],
      votes: [],
      timestamp: new Date().toISOString()
    },
    transcript: [
      { type: 'chair', who: 'CHAIR', time: '09:00', text: 'Floor is open.' }
    ]
  };

  // 1. Save session
  await db.saveSession(testSession);

  // 2. Retrieve session directly by ID
  const retrieved = await db.getSession('TEST-SESS-99');
  assert.ok(retrieved !== null, 'Session must be retrieved from database');
  assert.strictEqual(retrieved.id, 'TEST-SESS-99', 'Retrieved session ID must match');
  assert.strictEqual(retrieved.verdict.outcome, 'PASS', 'Retrieved verdict outcome must match');
  assert.strictEqual(retrieved.evidence.price, 1.0, 'Retrieved evidence price must match');

  // 3. Verify session appears in listing
  const list = await db.listSessions(10);
  assert.ok(list.some(s => s.id === 'TEST-SESS-99'), 'Session must appear in listSessions');
});

test('Database Watch Creation & Querying', async () => {
  const testWatch = {
    id: 'WATCH-TEST-888',
    sessionId: 'TEST-SESS-99',
    asset: 'USDC',
    triggerCondition: 'Depeg below $0.98',
    drawdownThreshold: 2.0,
    email: 'risk@bourse-chamber.internal',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  await db.createWatch(testWatch);

  const watches = await db.getWatchesBySession('TEST-SESS-99');
  assert.ok(watches.length > 0, 'Must retrieve watch by session ID');
  assert.strictEqual(watches[0].id, 'WATCH-TEST-888', 'Retrieved watch ID must match');
  assert.strictEqual(watches[0].status, 'ACTIVE', 'Watch must be active');
});
