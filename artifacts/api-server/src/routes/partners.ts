import { Router, type IRouter, type Response } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  usersTable,
  referralEarningsTable,
  partnerWithdrawalsTable,
} from "@workspace/db";
import { authenticate, type AuthedRequest } from "../middlewares/authenticate";

const router: IRouter = Router();
router.use(authenticate);

const MIN_WITHDRAWAL_USD = 5;

const toCents = (v: string | number) => Math.round(Number(v) * 100);
const fromCents = (c: number) => (c / 100).toFixed(2);

async function getBalances(userId: number) {
  const earnings = await db
    .select()
    .from(referralEarningsTable)
    .where(eq(referralEarningsTable.referrerUserId, userId));
  const withdrawals = await db
    .select()
    .from(partnerWithdrawalsTable)
    .where(eq(partnerWithdrawalsTable.partnerUserId, userId));

  const totalCents = earnings.reduce((s, e) => s + toCents(e.amount), 0);
  const paidCents = withdrawals
    .filter((w) => w.status === "paid")
    .reduce((s, w) => s + toCents(w.amount), 0);
  const pendingCents = withdrawals
    .filter((w) => w.status === "pending")
    .reduce((s, w) => s + toCents(w.amount), 0);
  const availableCents = Math.max(0, totalCents - paidCents - pendingCents);

  return { earnings, totalCents, paidCents, pendingCents, availableCents };
}

router.get("/summary", async (req: AuthedRequest, res: Response) => {
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, req.userId!),
  });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const referralCode = user.referralCode;
  if (!referralCode) {
    return res.status(500).json({ error: "Referral code missing, please log in again" });
  }

  const referredUsers = await db.query.usersTable.findMany({
    where: eq(usersTable.referredByUserId, user.id),
  });

  const b = await getBalances(user.id);

  const now = new Date();
  const thisMonthCents = b.earnings
    .filter((row) => {
      const created = new Date(row.createdAt);
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    })
    .reduce((sum, row) => sum + toCents(row.amount), 0);

  res.json({
    referralCode,
    signupsCount: referredUsers.length,
    totalEarnings: fromCents(b.totalCents),
    thisMonthEarnings: fromCents(thisMonthCents),
    tradesCommissioned: b.earnings.length,
    availableBalance: fromCents(b.availableCents),
    pendingWithdrawal: fromCents(b.pendingCents),
    paidOut: fromCents(b.paidCents),
    minWithdrawal: MIN_WITHDRAWAL_USD,
  });
});

router.post("/withdraw", async (req: AuthedRequest, res: Response) => {
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, req.userId!),
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  if (!user.phoneNumber) {
    res.status(400).json({ error: "Please add your M-Pesa phone number to your profile first." });
    return;
  }

  const b = await getBalances(user.id);
  if (b.pendingCents > 0) {
    res.status(400).json({ error: "You already have a pending withdrawal request." });
    return;
  }
  if (b.availableCents < MIN_WITHDRAWAL_USD * 100) {
    res.status(400).json({ error: "Minimum withdrawal is $" + MIN_WITHDRAWAL_USD + "." });
    return;
  }

  const inserted = await db
    .insert(partnerWithdrawalsTable)
    .values({ partnerUserId: user.id, amount: fromCents(b.availableCents) })
    .onConflictDoNothing()
    .returning();

  if (inserted.length === 0) {
    res.status(400).json({ error: "You already have a pending withdrawal request." });
    return;
  }

  res.status(201).json({ ok: true, amount: fromCents(b.availableCents) });
});

export default router;
