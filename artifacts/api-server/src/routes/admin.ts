import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod";
import { eq, and, inArray, isNotNull } from "drizzle-orm";
import {
  db,
  usersTable,
  accountsTable,
  transactionsTable,
  referralEarningsTable,
} from "@workspace/db";
import { adminAuth } from "../middlewares/adminAuth";

const router: IRouter = Router();

router.get("/users", adminAuth, async (_req: Request, res: Response) => {
  try {
    const users = await db.query.usersTable.findMany({
      with: { accounts: true },
      orderBy: (u, { desc }) => [desc(u.createdAt)],
    });
    const shaped = users.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      phoneNumber: u.phoneNumber,
      createdAt: u.createdAt,
      isSuspended: u.isSuspended,
      autoWithdraw: u.autoWithdraw,
      accounts: u.accounts.map((a) => ({
        id: a.id,
        type: a.type,
        currency: a.currency,
        balance: a.balance,
      })),
    }));
    res.json({ users: shaped });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to load users" });
  }
});

const adjustBalanceSchema = z.object({
  accountId: z.number(),
  amount: z.number().refine((n) => n !== 0, "Amount cannot be zero"),
  note: z.string().optional(),
});

router.post("/users/:id/balance", adminAuth, async (req: Request, res: Response) => {
  const parsed = adjustBalanceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const userId = Number(req.params.id);
  const { accountId, amount, note } = parsed.data;

  const account = await db.query.accountsTable.findFirst({
    where: eq(accountsTable.id, accountId),
  });
  if (!account || account.userId !== userId) {
    return res.status(404).json({ error: "Account not found for this user" });
  }

  const newBalance = Number(account.balance) + amount;
  if (newBalance < 0) {
    return res.status(400).json({ error: "Adjustment would make balance negative" });
  }

  await db
    .update(accountsTable)
    .set({ balance: newBalance.toFixed(2) })
    .where(eq(accountsTable.id, accountId));

  await db.insert(transactionsTable).values({
    accountId,
    type: amount >= 0 ? "deposit" : "withdrawal",
    amount: Math.abs(amount).toFixed(2),
    status: "completed",
    provider: note ? `admin_manual: ${note}` : "admin_manual",
  });

  res.json({ ok: true, newBalance: newBalance.toFixed(2) });
});

const suspendSchema = z.object({
  suspended: z.boolean(),
});

router.post("/users/:id/suspend", adminAuth, async (req: Request, res: Response) => {
  const parsed = suspendSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const userId = Number(req.params.id);

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
  });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  await db
    .update(usersTable)
    .set({ isSuspended: parsed.data.suspended })
    .where(eq(usersTable.id, userId));

  res.json({ ok: true, suspended: parsed.data.suspended });
});

router.get("/partners", adminAuth, async (_req: Request, res: Response) => {
  try {
    const partners = await db.query.usersTable.findMany({
      where: isNotNull(usersTable.referralCode),
    });

    const withDetails = await Promise.all(
      partners.map(async (partner) => {
        const referred = await db.query.usersTable.findMany({
          where: eq(usersTable.referredByUserId, partner.id),
          with: { accounts: true },
        });

        if (referred.length === 0) return null;

        const referredWithDeposits = await Promise.all(
          referred.map(async (u) => {
            const accountIds = u.accounts.map((a) => a.id);
            let totalDeposited = 0;
            if (accountIds.length > 0) {
              const deposits = await db.query.transactionsTable.findMany({
                where: and(
                  inArray(transactionsTable.accountId, accountIds),
                  eq(transactionsTable.type, "deposit"),
                  eq(transactionsTable.status, "completed"),
                ),
              });
              totalDeposited = deposits.reduce((sum, d) => sum + Number(d.amount), 0);
            }
            return {
              id: u.id,
              email: u.email,
              fullName: u.fullName,
              createdAt: u.createdAt,
              totalDeposited: totalDeposited.toFixed(2),
            };
          }),
        );

        const earnings = await db.query.referralEarningsTable.findMany({
          where: eq(referralEarningsTable.referrerUserId, partner.id),
        });
        const totalCommission = earnings.reduce((sum, e) => sum + Number(e.amount), 0);

        return {
          id: partner.id,
          email: partner.email,
          fullName: partner.fullName,
          referralCode: partner.referralCode,
          signupsCount: referred.length,
          totalCommission: totalCommission.toFixed(2),
          referredUsers: referredWithDeposits,
        };
      }),
    );

    res.json({ partners: withDetails.filter(Boolean) });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to load partners" });
  }
});

const autoWithdrawSchema = z.object({
  autoWithdraw: z.boolean(),
});

router.post("/users/:id/auto-withdraw", adminAuth, async (req: Request, res: Response) => {
  const parsed = autoWithdrawSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const userId = Number(req.params.id);

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
  });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  await db
    .update(usersTable)
    .set({ autoWithdraw: parsed.data.autoWithdraw })
    .where(eq(usersTable.id, userId));

  res.json({ ok: true, autoWithdraw: parsed.data.autoWithdraw });
});

export default router;
