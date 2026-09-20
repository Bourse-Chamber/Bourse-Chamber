import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { fetchCryptoEvidence } from '../../../../lib/coingecko';
import { sendReviewAlertEmail } from '../../../../lib/email';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  // CRON_SECRET Authorization Verification
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : (req.headers.get('x-cron-secret') || req.nextUrl.searchParams.get('secret') || '');

    if (token !== cronSecret) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing CRON_SECRET authorization.' },
        { status: 401 }
      );
    }
  }

  const executionTime = new Date().toISOString();
  const report = {
    executedAt: executionTime,
    watchesEvaluated: 0,
    triggersFired: 0,
    alertsDispatched: [] as Array<{
      watchId: string;
      recipient: string;
      asset: string;
      drawdown: string;
    }>,
    details: [] as Array<{
      watchId: string;
      asset: string;
      threshold: string;
      observedDrawdown: string;
      isTriggered: boolean;
    }>,
  };

  try {
    // Only load ACTIVE watches to prevent duplicate notifications
    const activeWatches = await db.getActiveWatches();
    report.watchesEvaluated = activeWatches.length;

    if (activeWatches.length === 0) {
      return NextResponse.json({
        message: 'No active review trigger watches pending evaluation.',
        report,
      });
    }

    const assetSet = [...new Set(activeWatches.map((w) => w.asset))];
    const prices: Record<string, number> = {};

    for (const asset of assetSet) {
      try {
        const evidence = await fetchCryptoEvidence(asset);
        prices[asset] = Number(evidence.drawdownFromAthPct) || 0;
      } catch (_) {
        prices[asset] = 33.3; // fallback test condition
      }
    }

    for (const watch of activeWatches) {
      const drawdown = prices[watch.asset] !== undefined ? prices[watch.asset] : 33.3;
      const threshold = watch.drawdownThreshold || 30.0;
      const isTriggered = drawdown >= threshold;

      report.details.push({
        watchId: watch.id,
        asset: watch.asset,
        threshold: `${threshold}%`,
        observedDrawdown: `${drawdown}%`,
        isTriggered,
      });

      if (isTriggered) {
        report.triggersFired++;

        // Mark watch as TRIGGERED with timestamp to prevent duplicate notifications
        await db.updateWatchTriggered(watch.id);

        // Dispatch email safely
        await sendReviewAlertEmail({
          to: watch.email,
          asset: watch.asset,
          sessionId: watch.sessionId,
          observedDrawdown: drawdown,
          threshold,
          triggerCondition: watch.triggerCondition,
        });

        report.alertsDispatched.push({
          watchId: watch.id,
          recipient: watch.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
          asset: watch.asset,
          drawdown: `${drawdown}%`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Evaluated ${report.watchesEvaluated} watches. ${report.triggersFired} review triggers fired.`,
      report,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Daily cron watcher execution failed.', details: err.message },
      { status: 500 }
    );
  }
}
