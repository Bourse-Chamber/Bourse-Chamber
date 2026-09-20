import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { WatchRecord } from '../../../types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, asset, email, triggerCondition, drawdownThreshold } = body || {};

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required.' }, { status: 400 });
    }
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required.' }, { status: 400 });
    }

    const watch: WatchRecord = {
      id: `WATCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sessionId,
      asset: String(asset || 'ASSET').toUpperCase(),
      triggerCondition: String(triggerCondition || 'Asset price suffers a cumulative drawdown exceeding 30–35%'),
      drawdownThreshold: Number(drawdownThreshold) || 30.0,
      email: email.trim().toLowerCase(),
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
        message: `Watcher activated for ${watch.asset}. Daily cron evaluates 30% drawdown conditions.`,
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ error: 'Failed to register watch trigger.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');

  try {
    let watches: WatchRecord[];
    if (sessionId) {
      watches = await db.getWatchesBySession(sessionId);
    } else {
      watches = await db.getActiveWatches();
    }
    return NextResponse.json({ watches, total: watches.length });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to query watches.' }, { status: 500 });
  }
}
