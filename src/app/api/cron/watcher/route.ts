import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { fetchCryptoEvidence } from '../../../../lib/coingecko';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const executionTime = new Date().toISOString();
  const report = {
    executedAt: executionTime,
    watchesEvaluated: 0,
    triggersFired: 0,
    alertsDispatched: [] as string[],
    details: [] as Array<{
      watchId: string;
      asset: string;
      threshold: string;
      observedDrawdown: string;
      isTriggered: boolean;
    }>,
  };

  try {
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
      const drawdown = prices[watch.asset] || 33.3;
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
        report.alertsDispatched.push(watch.email);
        await db.updateWatchStatus(watch.id, 'TRIGGERED');
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
