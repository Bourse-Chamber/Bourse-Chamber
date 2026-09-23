const test = require('node:test');
const assert = require('node:assert/strict');
const marketHandler = require('../api/market');
const ogHandler = require('../api/og');
const watchHandler = require('../api/watch');
const cronHandler = require('../api/cron-watcher');
const sessionHandler = require('../api/session');

function createMockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(key, val) { this.headers[key] = val; },
    status(code) { this.statusCode = code; return this; },
    json(obj) { this.body = obj; return this; },
    send(str) { this.body = str; return this; },
    write(chunk) { this.body = (this.body || '') + chunk; },
    end(str) { if (str) this.body = (this.body || '') + str; return this; }
  };
}

test('E2E Flow 1: Live CoinGecko Market Evidence Pack', async () => {
  const req = { method: 'GET', query: { ticker: 'SOL' } };
  const res = createMockRes();

  await marketHandler(req, res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.ticker, 'SOL');
  assert.ok(typeof res.body.price === 'number' && res.body.price > 0);
  assert.ok(Array.isArray(res.body.sparkline));
  assert.ok(Array.isArray(res.body.dataGaps));
});

test('E2E Flow 2: Dynamic Open Graph 1200x630 Brutalist Image', async () => {
  const req = { method: 'GET', query: { id: 'BC-0411' } };
  const res = createMockRes();

  await ogHandler(req, res);
  assert.strictEqual(res.headers['Content-Type'], 'image/svg+xml; charset=utf-8');
  assert.ok(res.body.includes('viewBox="0 0 1200 630"'));
  assert.ok(res.body.includes('BC-0411'));
  assert.ok(res.body.includes('REDUCE'));
});

test('E2E Flow 3: Watcher Registration & Idempotency', async () => {
  const req = {
    method: 'POST',
    body: {
      sessionId: 'BC-0411',
      asset: 'SOL',
      email: 'analyst@bourse-chamber.internal',
      triggerCondition: 'Cumulative drawdown exceeding 30–35%',
      drawdownThreshold: 30.0
    }
  };
  const res = createMockRes();

  await watchHandler(req, res);
  assert.strictEqual(res.statusCode, 201);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.asset, 'SOL');
});

test('E2E Flow 4: CRON_SECRET Enforcement & Daily Trigger Evaluation', async () => {
  process.env.CRON_SECRET = 'e2e-secret-key-123';

  // 1. Rejected without secret
  const unauthReq = { method: 'GET', headers: { host: 'localhost:3000' } };
  const unauthRes = createMockRes();
  await cronHandler(unauthReq, unauthRes);
  assert.strictEqual(unauthRes.statusCode, 401);

  // 2. Accepted with valid secret
  const authReq = {
    method: 'GET',
    headers: {
      host: 'localhost:3000',
      authorization: 'Bearer e2e-secret-key-123'
    }
  };
  const authRes = createMockRes();
  await cronHandler(authReq, authRes);
  assert.strictEqual(authRes.statusCode, 200);
  assert.strictEqual(authRes.body.success, true);
  assert.ok(authRes.body.report.watchesEvaluated >= 1);

  delete process.env.CRON_SECRET;
});

test('E2E Flow 5: Session Deliberation Motion Event Emission', async () => {
  const req = {
    method: 'POST',
    body: {
      input: 'BTC Is digital gold superior to sovereign fiat?',
      selectedSeats: [1, 2, 3, 4, 5, 6, 7, 8, 9]
    }
  };
  const res = createMockRes();

  await sessionHandler(req, res);
  assert.ok(res.headers['Content-Type'].includes('text/event-stream'));
  assert.ok(res.body.includes('event: motion'));
  assert.ok(res.body.includes('event: evidence'));
  assert.ok(res.body.includes('event: verdict'));
});
