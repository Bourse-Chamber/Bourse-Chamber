/**
 * Vercel Serverless Function — GET/POST /api/budget
 * Enforces F13 Answer Budget (13 answers/day) with 00:00 UTC daily reset
 */

const crypto = require('crypto');

// In-memory or Redis-ready ledger for daily budget counts
const DAILY_LIMIT = 13;
const IP_LEDGER = new Map();

function getUTCDay() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

function hashIP(ip) {
  return crypto.createHash('sha256').update(ip || '127.0.0.1').digest('hex').substring(0, 16);
}

module.exports = async function handler(req, res) {
  const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'anonymous';
  const ipHash = hashIP(clientIP);
  const today = getUTCDay();
  const key = `${ipHash}:${today}`;

  let record = IP_LEDGER.get(key);
  if (!record) {
    record = { used: 0, remaining: DAILY_LIMIT };
    IP_LEDGER.set(key, record);
  }

  if (req.method === 'POST') {
    const { count } = req.body || {};
    const toConsume = Math.max(1, parseInt(count, 10) || 1);

    if (record.remaining < toConsume) {
      return res.status(429).json({
        error: 'Budget exhausted',
        remaining: record.remaining,
        message: `Not enough credits. Requested ${toConsume}, but only ${record.remaining} left. Resets at 00:00 UTC.`
      });
    }

    record.used += toConsume;
    record.remaining -= toConsume;
    IP_LEDGER.set(key, record);

    return res.json({
      success: true,
      consumed: toConsume,
      remaining: record.remaining,
      limit: DAILY_LIMIT,
      resetsAt: '00:00 UTC'
    });
  }

  // GET
  return res.json({
    remaining: record.remaining,
    used: record.used,
    limit: DAILY_LIMIT,
    resetsAt: '00:00 UTC'
  });
};
