/**
 * Vercel Serverless Function — /api/watch
 * F9: Review Trigger Watcher Registration & Query API
 */

const db = require('../db/init');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { sessionId, asset, email, triggerCondition, drawdownThreshold } = req.body || {};

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required to register a review trigger watcher.' });
    }
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required.' });
    }

    const id = `WATCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const targetAsset = String(asset || 'ASSET').toUpperCase();
    const condition = String(triggerCondition || 'Asset price suffers a cumulative drawdown exceeding 30–35%').trim();
    const threshold = Number(drawdownThreshold) || 30.0;

    try {
      db.prepare(`
        INSERT INTO watches (id, session_id, asset, trigger_condition, drawdown_threshold, email, status)
        VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')
      `).run(id, sessionId, targetAsset, condition, threshold, email.trim().toLowerCase());

      return res.status(201).json({
        success: true,
        watchId: id,
        sessionId,
        asset: targetAsset,
        email: email.trim(),
        threshold: `${threshold}%`,
        message: `Watcher activated for ${targetAsset}. You will be alerted if price drops by ≥${threshold}%.`
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to save review trigger watcher.', details: err.message });
    }
  }

  if (req.method === 'GET') {
    const sessionId = (req.query.sessionId || '').toUpperCase();
    try {
      let watches = [];
      if (sessionId) {
        watches = db.prepare("SELECT * FROM watches WHERE session_id = ?").all(sessionId);
      } else {
        watches = db.prepare("SELECT * FROM watches WHERE status = ?").all('ACTIVE');
      }

      // Sanitize emails in response (e.g. j***@example.com)
      const sanitized = watches.map(w => ({
        id: w.id,
        sessionId: w.session_id,
        asset: w.asset,
        triggerCondition: w.trigger_condition,
        drawdownThreshold: w.drawdown_threshold,
        status: w.status,
        createdAt: w.created_at,
        emailMasked: w.email ? w.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : '***'
      }));

      return res.json({ watches: sanitized, count: sanitized.length });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to retrieve watches.', details: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed.' });
};
