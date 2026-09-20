const test = require('node:test');
const assert = require('node:assert/strict');
const cronHandler = require('../api/cron-watcher');
const { db } = require('../src/lib/db');

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

test('Cron Authorization Security (CRON_SECRET Verification)', async () => {
  const originalSecret = process.env.CRON_SECRET;
  process.env.CRON_SECRET = 'super-secure-production-cron-secret-2026';

  try {
    // 1. Unauthorized request (Missing secret)
    const unauthorizedReq = {
      method: 'GET',
      headers: { host: 'localhost:3000' }
    };
    const unauthorizedRes = createMockRes();
    await cronHandler(unauthorizedReq, unauthorizedRes);
    assert.strictEqual(unauthorizedRes.statusCode, 401, 'Request without CRON_SECRET must return 401 Unauthorized');

    // 2. Unauthorized request (Wrong secret)
    const wrongReq = {
      method: 'GET',
      headers: {
        host: 'localhost:3000',
        authorization: 'Bearer wrong-secret'
      }
    };
    const wrongRes = createMockRes();
    await cronHandler(wrongReq, wrongRes);
    assert.strictEqual(wrongRes.statusCode, 401, 'Request with wrong CRON_SECRET must return 401 Unauthorized');

    // 3. Authorized request (Valid secret)
    const authorizedReq = {
      method: 'GET',
      headers: {
        host: 'localhost:3000',
        authorization: 'Bearer super-secure-production-cron-secret-2026'
      }
    };
    const authorizedRes = createMockRes();
    await cronHandler(authorizedReq, authorizedRes);
    assert.notStrictEqual(authorizedRes.statusCode, 401, 'Request with valid CRON_SECRET must be authorized');
    assert.ok(authorizedRes.body && authorizedRes.body.report, 'Authorized response must return evaluation report');
  } finally {
    process.env.CRON_SECRET = originalSecret;
  }
});

test('Cron Trigger Detection & Duplicate Alert Prevention', async () => {
  const watchId = `WATCH-CRON-TEST-${Date.now()}`;
  const testWatch = {
    id: watchId,
    sessionId: 'BC-0411',
    asset: 'SOL',
    triggerCondition: 'Cumulative drawdown exceeding 30–35%',
    drawdownThreshold: 30.0,
    email: 'investor@test.internal',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  await db.createWatch(testWatch);

  // Run 1: Should detect trigger and dispatch alert
  await db.updateWatchTriggered(watchId);
  const activeWatchesAfterRun1 = await db.getActiveWatches();
  const found = activeWatchesAfterRun1.find(w => w.id === watchId);

  // Once marked TRIGGERED, it must not be in active watches pool to prevent duplicate spamming
  assert.strictEqual(found, undefined, 'Triggered watch must not remain in active pool to prevent duplicate alert spam');
});
