import { createHmac, timingSafeEqual } from "node:crypto";

const NOVTRUP_BASE_URL = process.env.NOVTRUP_BASE_URL;
const NOVTRUP_API_KEY = process.env.NOVTRUP_API_KEY;
const NOVTRUP_WEBHOOK_SECRET = process.env.NOVTRUP_WEBHOOK_SECRET;

export interface NovtrupDepositResult {
  ok: boolean;
  merchantRequestId?: string;
  checkoutRequestId?: string;
  error?: string;
}

export async function initiateNovtrupDeposit(input: {
  amount: number;
  phoneNumber: string;
  accountReference: string;
  transactionDesc?: string;
}): Promise<NovtrupDepositResult> {
  if (!NOVTRUP_BASE_URL || !NOVTRUP_API_KEY) {
    return { ok: false, error: "NOVTRUP integration not configured" };
  }

  try {
    const res = await fetch(`${NOVTRUP_BASE_URL}/api/deposit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": NOVTRUP_API_KEY,
      },
      body: JSON.stringify({
        amount: input.amount,
        phone_number: input.phoneNumber,
        account_reference: input.accountReference,
        transaction_desc: input.transactionDesc,
      }),
    });

    const data: any = await res.json();

    if (!res.ok) {
      return { ok: false, error: data.error ?? `NOVTRUP returned ${res.status}` };
    }

    return {
      ok: true,
      merchantRequestId: data.merchant_request_id,
      checkoutRequestId: data.checkout_request_id,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Request to NOVTRUP failed" };
  }
}

export interface NovtrupPaystackDepositResult {
  ok: boolean;
  reference?: string;
  message?: string;
  error?: string;
}

// Same NOVTRUP broker, different rail: mobile money via Paystack's Charge
// API instead of Daraja direct. Requires an email in addition to the
// phone number (Paystack uses it for receipts/fraud checks).
export async function initiateNovtrupPaystackDeposit(input: {
  amount: number;
  email: string;
  phoneNumber: string;
  accountReference: string;
}): Promise<NovtrupPaystackDepositResult> {
  if (!NOVTRUP_BASE_URL || !NOVTRUP_API_KEY) {
    return { ok: false, error: "NOVTRUP integration not configured" };
  }

  try {
    const res = await fetch(`${NOVTRUP_BASE_URL}/api/paystack/deposit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": NOVTRUP_API_KEY,
      },
      body: JSON.stringify({
        amount: input.amount,
        email: input.email,
        phone_number: input.phoneNumber,
        account_reference: input.accountReference,
      }),
    });

    const data: any = await res.json();

    if (!res.ok) {
      return { ok: false, error: data.error ?? `NOVTRUP returned ${res.status}` };
    }

    return {
      ok: true,
      reference: data.reference,
      message: data.message,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Request to NOVTRUP failed" };
  }
}

export function verifyNovtrupSignature(rawBody: string, signature: string | undefined): boolean {
  if (!NOVTRUP_WEBHOOK_SECRET || !signature) return false;
  const expected = createHmac("sha256", NOVTRUP_WEBHOOK_SECRET).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export interface NovtrupWebhookPayload {
  event: "payment.success" | "payment.failed";
  payment_id: string;
  merchant_request_id?: string;
  checkout_request_id: string;
  receipt?: string;
  amount?: number;
  currency?: string;
  phone?: string;
  status: "SUCCESS" | "FAILED";
  result_code?: number;
  result_desc?: string;
  account_reference?: string;
  timestamp: string;
}

export interface NovtrupCardInitResult {
  ok: boolean;
  reference?: string;
  error?: string;
}

// Card deposits happen client-side via Paystack's Inline JS (Popup),
// using a public key — this just pre-registers a reference on NOVTRUP
// so its webhook pipeline has a payment_requests row to match against
// once the charge completes.
export async function initiateNovtrupCardDeposit(input: {
  amount: number;
  email: string;
  accountReference: string;
}): Promise<NovtrupCardInitResult> {
  if (!NOVTRUP_BASE_URL || !NOVTRUP_API_KEY) {
    return { ok: false, error: "NOVTRUP integration not configured" };
  }

  try {
    const res = await fetch(`${NOVTRUP_BASE_URL}/api/paystack/card-init`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": NOVTRUP_API_KEY,
      },
      body: JSON.stringify({
        amount: input.amount,
        email: input.email,
        account_reference: input.accountReference,
      }),
    });

    const data: any = await res.json();

    if (!res.ok) {
      return { ok: false, error: data.error ?? `NOVTRUP returned ${res.status}` };
    }

    return { ok: true, reference: data.reference };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Request to NOVTRUP failed" };
  }
}
