const test = require('node:test');
const assert = require('node:assert/strict');
const sessionHandler = require('../api/session');
const watchHandler = require('../api/watch');
const { getRedisClient } = require('../db/redis');

function createMockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(key, val) { this.headers[key] = val; },
    status(code) { this.statusCode = code; return this; },
    json(obj) { this.body = obj; return this; },
    send(str) { this.body = str; return this; },
    end(str) { if (str) this.body = str; return this; }
  };
}

test('API Validation — Rejection of Empty Thesis', async () => {
  const req = {
    method: 'POST',
    body: { input: '   ' } // empty or whitespace only
  };
  const res = createMockRes();

  await sessionHandler(req, res);
  assert.strictEqual(res.statusCode, 400, 'Empty input must return 400 Bad Request');
  assert.ok(res.body.error.includes('required'), 'Must specify that input is required');
});

test('API Validation — Email Validation on Watch Creation', async () => {
  const req = {
    method: 'POST',
    body: {
      sessionId: 'BC-0411',
      asset: 'BTC',
      email: 'invalid-email-address-without-at'
    }
  };
  const res = createMockRes();

  await watchHandler(req, res);
  assert.strictEqual(res.statusCode, 400, 'Invalid email must return 400 Bad Request');
  assert.ok(res.body.error.includes('email'), 'Must report invalid email address');
});

test('Redis Sliding Window Rate Limiting', async () => {
  const redis = getRedisClient();
  const testId = `test-ip-${Date.now()}`;

  // Allow up to 3 requests in 10 seconds
  const r1 = await redis.checkRateLimit(testId, 3, 10);
  const r2 = await redis.checkRateLimit(testId, 3, 10);
  const r3 = await redis.checkRateLimit(testId, 3, 10);
  const r4 = await redis.checkRateLimit(testId, 3, 10);

  assert.strictEqual(r1.allowed, true, 'Request 1 must be allowed');
  assert.strictEqual(r2.allowed, true, 'Request 2 must be allowed');
  assert.strictEqual(r3.allowed, true, 'Request 3 must be allowed');
  assert.strictEqual(r4.allowed, false, 'Request 4 exceeding limit must be blocked (allowed: false)');
});

test('API GET — Session Query & Bench Aggregation', async () => {
  // Test listing sessions
  const reqList = { method: 'GET', query: { limit: '10' } };
  const resList = createMockRes();
  await sessionHandler(reqList, resList);
  assert.strictEqual(resList.statusCode, 200, 'GET /api/session must return 200');
  assert.ok(Array.isArray(resList.body), 'GET /api/session should return array of sessions');
  assert.ok(resList.body.length > 0, 'Should have seeded sessions available');

  // Test bench aggregation
  const reqBench = { method: 'GET', query: { aggregate: 'bench' } };
  const resBench = createMockRes();
  await sessionHandler(reqBench, resBench);
  assert.strictEqual(resBench.statusCode, 200, 'GET /api/session?aggregate=bench must return 200');
  assert.ok(resBench.body.agents, 'Response must include agents aggregate list');
  assert.strictEqual(resBench.body.agents.length, 9, 'Must aggregate exactly 9 canonical personas');
  assert.ok(typeof resBench.body.totalSessions === 'number', 'Must include total sessions count');

  // Check that persona records are dynamically calculated
  const graham = resBench.body.agents.find(a => a.seat === 1);
  assert.ok(graham, 'Graham must be present in bench aggregation');
  assert.ok(graham.record.sessions > 0, 'Graham must have participated sessions');
  assert.ok(typeof graham.record.votedFor === 'number', 'Graham must have votedFor count');
  assert.ok(typeof graham.record.dissents === 'number', 'Graham must have dissents count');
});
