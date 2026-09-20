/**
 * Transactional Email Client (Resend / Universal REST Mailer)
 * Used by review trigger cron to dispatch alerts when drawdowns hit 30–35%
 */

export interface SendAlertParams {
  to: string;
  asset: string;
  sessionId: string;
  observedDrawdown: string | number;
  threshold: string | number;
  triggerCondition: string;
}

export async function sendReviewAlertEmail(params: SendAlertParams): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.EMAIL_API_KEY;
  const fromAddress = process.env.EMAIL_FROM || 'Bourse Chamber <alerts@bourse-chamber.vercel.app>';

  if (!apiKey) {
    // Gracefully report that email key is unconfigured without breaking the cron
    return {
      success: false,
      error: 'EMAIL_API_KEY not configured in environment. Alert logged to audit record only.',
    };
  }

  const subject = `[BOURSE CHAMBER] Review Trigger Fired: ${params.asset} (Session ${params.sessionId})`;
  const textContent = `BOURSE CHAMBER — UNALTERABLE LEDGER ALERT

The permanent review trigger condition for Session ${params.sessionId} has fired:
Asset: ${params.asset}
Trigger Condition: ${params.triggerCondition}
Observed Drawdown: ${params.observedDrawdown}%
Threshold: ${params.threshold}%

The floor may now be formally reconvened by presenting updated evidence at:
https://bourse-chamber.vercel.app/chamber.html?q=${encodeURIComponent(params.asset)}

Timestamp: ${new Date().toISOString()}
© 2026 Bourse Chamber — Nine Economists. One Market That Refuses to Behave.`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [params.to],
        subject,
        text: textContent,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return {
        success: false,
        error: `Email provider responded with HTTP ${res.status}: ${errText.slice(0, 100)}`,
      };
    }

    return { success: true };
  } catch (err: any) {
    // Safe error logging: never expose apiKey or internal network topology
    return {
      success: false,
      error: `Network error dispatching email to ${params.to.replace(/(.{2})(.*)(@.*)/, '$1***$3')}: ${err.message}`,
    };
  }
}
