const SMS_WEBHOOK_URL = process.env.SMS_WEBHOOK_URL;
const SMS_WEBHOOK_API_KEY = process.env.SMS_WEBHOOK_API_KEY;

export interface WithdrawalSmsNotifyInput {
  email: string;
  amountKes: number;
}

// Fire-and-forget notification to the separate SMS app so it can text the
// client that their withdrawal request was received. This never blocks or
// fails the withdrawal itself — if the SMS app is down, the withdrawal
// still goes through and funds stay held; we just log the failure.
export async function notifyWithdrawalRequest(
  input: WithdrawalSmsNotifyInput,
): Promise<{ ok: boolean; error?: string }> {
  if (!SMS_WEBHOOK_URL) {
    console.warn("SMS_WEBHOOK_URL not configured; skipping SMS notification");
    return { ok: false, error: "SMS_WEBHOOK_URL not configured" };
  }

  try {
    const res = await fetch(SMS_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(SMS_WEBHOOK_API_KEY ? { "x-webhook-secret": SMS_WEBHOOK_API_KEY } : {}),
      },
      body: JSON.stringify({
        email: input.email,
        amount: input.amountKes,
        direction: "received",
        thread_key: "mpesa",
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`SMS webhook returned ${res.status}: ${text}`);
      return { ok: false, error: `SMS webhook returned ${res.status}` };
    }

    return { ok: true };
  } catch (err) {
    console.error("SMS webhook request failed:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "SMS webhook request failed",
    };
  }
}
