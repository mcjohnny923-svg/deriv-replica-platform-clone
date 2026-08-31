import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, accountsTable, transactionsTable, usersTable } from "@workspace/db";
import { authenticate, type AuthedRequest } from "../middlewares/authenticate";
import {
  initiateNovtrupDeposit,
  initiateNovtrupPaystackDeposit,
  initiateNovtrupCardDeposit,
  verifyNovtrupSignature,
  type NovtrupWebhookPayload,
} from "../lib/novtrup";
import { kesToUsd, getKesPerUsdRate } from "../lib/forex";

const router: IRouter = Router();

const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY ?? "";

const depositSchema = z.object({
  accountId: z.number(),
  amountKes: z.number().positive(),
  provider: z.enum(["mpesa", "paystack", "card"]).default("mpesa"),
});

router.post("/deposit", authenticate, async (req: AuthedRequest, res: Response) => {
  const parsed = depositSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { accountId, amountKes, provider } = parsed.data;

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, req.userId!),
  });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Card deposits don't need a phone number — mobile money ones do.
  if (provider !== "card" && !user.phoneNumber) {
    return res.status(400).json({
      error: "No M-Pesa number on file. Please set your phone number first.",
    });
  }

  const account = await db.query.accountsTable.findFirst({
    where: eq(accountsTable.id, accountId),
  });
  if (!account || account.userId !== req.userId) {
    return res.status(403).json({ error: "Account not found or not owned by you" });
  }

  const usdAmount = kesToUsd(amountKes);
  const accountReference = `TRD-${accountId}-${Date.now()}`;

  if (provider === "card") {
    if (!PAYSTACK_PUBLIC_KEY) {
      return res.status(502).json({ error: "Card payments are not configured yet." });
    }

    const result = await initiateNovtrupCardDeposit({
      amount: amountKes,
      email: user.email,
      accountReference,
    });

    if (!result.ok || !result.reference) {
      return res.status(502).json({ error: result.error ?? "Deposit initiation failed" });
    }

    await db.insert(transactionsTable).values({
      accountId,
      type: "deposit",
      amount: usdAmount.toFixed(2),
      status: "pending",
      provider: "novtrup_paystack_card",
      providerReference: result.reference,
    });

    return res.status(202).json({
      status: "pending",
      message: "Complete your payment in the card popup.",
      checkoutRequestId: result.reference,
      amountKes,
      estimatedUsd: usdAmount.toFixed(2),
      rate: getKesPerUsdRate(),
      publicKey: PAYSTACK_PUBLIC_KEY,
      email: user.email,
    });
  }

  if (provider === "paystack") {
    const result = await initiateNovtrupPaystackDeposit({
      amount: amountKes,
      email: user.email,
      phoneNumber: user.phoneNumber!,
      accountReference,
    });

    if (!result.ok || !result.reference) {
      return res.status(502).json({ error: result.error ?? "Deposit initiation failed" });
    }

    await db.insert(transactionsTable).values({
      accountId,
      type: "deposit",
      amount: usdAmount.toFixed(2),
      status: "pending",
      provider: "novtrup_paystack",
      providerReference: result.reference,
    });

    return res.status(202).json({
      status: "pending",
      message: result.message ?? "Check your phone to approve the payment.",
      checkoutRequestId: result.reference,
      amountKes,
      estimatedUsd: usdAmount.toFixed(2),
      rate: getKesPerUsdRate(),
    });
  }

  const result = await initiateNovtrupDeposit({
    amount: amountKes,
    phoneNumber: user.phoneNumber!,
    accountReference,
    transactionDesc: "Deriv trading account deposit",
  });

  if (!result.ok || !result.checkoutRequestId) {
    return res.status(502).json({ error: result.error ?? "Deposit initiation failed" });
  }

  await db.insert(transactionsTable).values({
    accountId,
    type: "deposit",
    amount: usdAmount.toFixed(2),
    status: "pending",
    provider: "novtrup_mpesa",
    providerReference: result.checkoutRequestId,
  });

  res.status(202).json({
    status: "pending",
    message: "Check your phone to approve the M-Pesa payment.",
    checkoutRequestId: result.checkoutRequestId,
    amountKes,
    estimatedUsd: usdAmount.toFixed(2),
    rate: getKesPerUsdRate(),
  });
});

router.get("/status", authenticate, async (req: AuthedRequest, res: Response) => {
  const reference = req.query.reference as string | undefined;
  if (!reference) {
    return res.status(400).json({ error: "reference query param required" });
  }

  const transaction = await db.query.transactionsTable.findFirst({
    where: eq(transactionsTable.providerReference, reference),
  });
  if (!transaction) {
    return res.status(404).json({ error: "Transaction not found" });
  }

  const account = await db.query.accountsTable.findFirst({
    where: eq(accountsTable.id, transaction.accountId),
  });
  if (!account || account.userId !== req.userId) {
    return res.status(403).json({ error: "Not your transaction" });
  }

  res.json({
    status: transaction.status,
    amount: transaction.amount,
    newBalance: transaction.status === "completed" ? account.balance : undefined,
  });
});

router.post("/webhook/novtrup", async (req: Request, res: Response) => {
  const signature = req.headers["x-webhook-signature"] as string | undefined;
  const rawBody = req.rawBody ?? "";

  if (!verifyNovtrupSignature(rawBody, signature)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const payload = req.body as NovtrupWebhookPayload;
  if (!payload?.checkout_request_id) {
    return res.status(400).json({ error: "Missing checkout_request_id" });
  }

  const transaction = await db.query.transactionsTable.findFirst({
    where: eq(transactionsTable.providerReference, payload.checkout_request_id),
  });

  if (!transaction) {
    return res.status(200).json({ ok: true, note: "No matching transaction" });
  }

  if (transaction.status !== "pending") {
    return res.status(200).json({ ok: true, note: "Already processed" });
  }

  if (payload.status === "SUCCESS") {
    const account = await db.query.accountsTable.findFirst({
      where: eq(accountsTable.id, transaction.accountId),
    });
    if (account) {
      const newBalance = Number(account.balance) + Number(transaction.amount);
      await db
        .update(accountsTable)
        .set({ balance: newBalance.toFixed(2) })
        .where(eq(accountsTable.id, account.id));
    }
    await db
      .update(transactionsTable)
      .set({ status: "completed" })
      .where(eq(transactionsTable.id, transaction.id));
  } else {
    await db
      .update(transactionsTable)
      .set({ status: "failed" })
      .where(eq(transactionsTable.id, transaction.id));
  }

  res.status(200).json({ ok: true });
});

export default router;
