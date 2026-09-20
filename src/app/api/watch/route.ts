import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { redis } from '../../../lib/redis';
import { WatchRecord } from '../../../types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  const { allowed, resetAt } = await redis.checkRateLimit(`watch:${clientIp}`, 15, 60);

  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded for watcher registrations. Please wait.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.max(1, resetAt - Math.floor(Date.now() / 1000))),
        },
      }
    );
  }

  try {
    const body = await req.json();
    const { sessionId, asset, email, triggerCondition, drawdownThreshold } = body || {};

    const cleanEmail = String(email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required.' }, { status: 400 });
    }

    const cleanAsset = String(asset || 'ASSET').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 12);
    const threshold = Math.min(90, Math.max(5, Number(drawdownThreshold) || 30.0));

    const watch: WatchRecord = {
      id: `WATCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sessionId: String(sessionId).trim().slice(0, 32),
      asset: cleanAsset,
      triggerCondition: String(triggerCondition || 'Asset price suffers a cumulative drawdown exceeding 30–35%').slice(0, 200),
      drawdownThreshold: threshold,
      email: cleanEmail,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    await db.createWatch(watch);

    return NextResponse.json(
      {
        success: true,
        watchId: watch.id,
        sessionId: watch.sessionId,
        asset: watch.asset,
        email: watch.email,
        threshold: `${watch.drawdownThreshold}%`,
        message: `Watcher activated for ${watch.asset}. Daily cron evaluates ${threshold}% drawdown conditions.`,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to register watch trigger.', details: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');

  try {
    let watches: WatchRecord[];
    if (sessionId) {
      watches = await db.getWatchesBySession(sessionId.slice(0, 32));
    } else {
      watches = await db.getActiveWatches();
    }
    return NextResponse.json({ watches, total: watches.length });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to query watches.', details: err.message }, { status: 500 });
  }
}
