import { Router, type IRouter, type Response } from "express";
import { z } from "zod";
import { eq, and, lte, ne } from "drizzle-orm";
import { db, accountsTable, marketsTable, tradesTable } from "@workspace/db";
import { authenticate, type AuthedRequest } from "../middlewares/authenticate";
import {
  getPayoutMultiplier,
  getWinProbability,
  durationToSeconds,
} from "../lib/trade-config";

const router: IRouter = Router();
router.use(authenticate);

async function getOwnedAccount(accountId: number, userId: number) {
  const account = await db.query.accountsTable.findFirst({
    where: eq(accountsTable.id, accountId),
  });
  if (!account || account.userId !== userId) return null;
  return account;
}

async function getOrCreateMarket(symbol: string, displayName: string, category: string) {
  const existing = await db.query.marketsTable.findFirst({
    where: eq(marketsTable.symbol, symbol),
  });
  if (existing) return existing;
  const [created] = await db
    .insert(marketsTable)
    .values({ symbol, displayName, category })
    .returning();
  return created;
}

// Settle any of this account's open trades whose settlesAt has passed
async function settleDueTrades(accountId: number) {
  const now = new Date();
  const dueTrades = await db.query.tradesTable.findMany({
    where: and(
      eq(tradesTable.accountId, accountId),
      eq(tradesTable.status, "open"),
      lte(tradesTable.settlesAt, now),
    ),
  });

  for (const trade of dueTrades) {
    const winProbability = getWinProbability(trade.tradeType);
    const won = Math.random() < winProbability;
    const stakeNum = Number(trade.stake);
    const multiplier = Number(trade.payoutMultiplier);
    const payout = won ? stakeNum * multiplier : 0;
    const priceDrift = (Math.random() - 0.5) * 40;
    const exitPrice = Number(trade.entryPrice) + priceDrift;

    await db
      .update(tradesTable)
      .set({
        status: won ? "won" : "lost",
        exitPrice: exitPrice.toFixed(5),
        payout: payout.toFixed(2),
        closedAt: now,
      })
      .where(eq(tradesTable.id, trade.id));

    if (won) {
      const account = await db.query.accountsTable.findFirst({
        where: eq(accountsTable.id, accountId),
      });
      if (account) {
        const newBalance = Number(account.balance) + payout;
        await db
          .update(accountsTable)
          .set({ balance: newBalance.toFixed(2) })
          .where(eq(accountsTable.id, accountId));
      }
    }
  }
}

const buySchema = z.object({
  accountId: z.number(),
  marketSymbol: z.string(),
  marketDisplayName: z.string(),
  marketCategory: z.string(),
  tradeType: z.string(),
  direction: z.string(),
  digit: z.number().min(0).max(9).optional(),
  stake: z.number().positive(),
  durationValue: z.number().positive(),
  durationUnit: z.enum(["t", "s", "m"]),
});

router.post("/buy", async (req: AuthedRequest, res: Response) => {
  const parsed = buySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const data = parsed.data;

  const account = await getOwnedAccount(data.accountId, req.userId!);
  if (!account) {
    return res.status(403).json({ error: "Account not found or not owned by you" });
  }

  if (Number(account.balance) < data.stake) {
    return res.status(400).json({ error: "Insufficient balance" });
  }

  const market = await getOrCreateMarket(
    data.marketSymbol,
    data.marketDisplayName,
    data.marketCategory,
  );

  const multiplier = getPayoutMultiplier(data.tradeType);
  const durationSeconds = durationToSeconds(data.durationValue, data.durationUnit);
  const now = new Date();
  const settlesAt = new Date(now.getTime() + durationSeconds * 1000);
  const entryPrice = 10000 + Math.random() * 5000;

  const newBalance = Number(account.balance) - data.stake;
  await db
    .update(accountsTable)
    .set({ balance: newBalance.toFixed(2) })
    .where(eq(accountsTable.id, account.id));

  const [trade] = await db
    .insert(tradesTable)
    .values({
      accountId: account.id,
      marketId: market.id,
      tradeType: data.tradeType,
      direction: data.direction,
      digit: data.digit,
      stake: data.stake.toFixed(2),
      payoutMultiplier: multiplier.toFixed(3),
      entryPrice: entryPrice.toFixed(5),
      settlesAt,
    })
    .returning();

  res.status(201).json({ trade, newBalance: newBalance.toFixed(2) });
});

router.get("/open", async (req: AuthedRequest, res: Response) => {
  const accountId = Number(req.query.accountId);
  if (!accountId) {
    return res.status(400).json({ error: "accountId query param required" });
  }
  const account = await getOwnedAccount(accountId, req.userId!);
  if (!account) {
    return res.status(403).json({ error: "Account not found or not owned by you" });
  }

  await settleDueTrades(accountId);

  const openTrades = await db.query.tradesTable.findMany({
    where: and(eq(tradesTable.accountId, accountId), eq(tradesTable.status, "open")),
    with: { market: true },
  });

  const refreshedAccount = await db.query.accountsTable.findFirst({
    where: eq(accountsTable.id, accountId),
  });

  res.json({ openTrades, balance: refreshedAccount?.balance });
});

router.get("/history", async (req: AuthedRequest, res: Response) => {
  const accountId = Number(req.query.accountId);
  if (!accountId) {
    return res.status(400).json({ error: "accountId query param required" });
  }
  const account = await getOwnedAccount(accountId, req.userId!);
  if (!account) {
    return res.status(403).json({ error: "Account not found or not owned by you" });
  }

  await settleDueTrades(accountId);

  const closedTrades = await db.query.tradesTable.findMany({
    where: and(
      eq(tradesTable.accountId, accountId),
      ne(tradesTable.status, "open"),
    ),
    with: { market: true },
  });

  res.json({ closedTrades });
});

export default router;
