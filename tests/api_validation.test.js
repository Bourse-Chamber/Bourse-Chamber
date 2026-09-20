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
