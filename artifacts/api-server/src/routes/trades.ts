import { Router, type IRouter, type Response } from "express";
import { z } from "zod";
import { eq, and, lte, ne } from "drizzle-orm";
import {
  db,
  accountsTable,
  marketsTable,
  tradesTable,
  usersTable,
  referralEarningsTable,
} from "@workspace/db";
import { authenticate, type AuthedRequest } from "../middlewares/authenticate";
import {
  getPayoutMultiplier,
  getWinProbability,
  durationToSeconds,
  isDigitContract,
} from "../lib/trade-config";
import { getLivePrice } from "../lib/live-price";
import { REFERRAL_COMMISSION_RATE } from "../lib/referral";

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

async function creditReferralCommission(accountId: number, tradeId: number, stake: number) {
  const account = await db.query.accountsTable.findFirst({
    where: eq(accountsTable.id, accountId),
  });
  if (!account) return;

  const trader = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, account.userId),
  });
  if (!trader?.referredByUserId) return;

  const commission = stake * REFERRAL_COMMISSION_RATE;

  await db.insert(referralEarningsTable).values({
    referrerUserId: trader.referredByUserId,
    referredUserId: trader.id,
    tradeId,
    amount: commission.toFixed(2),
  });
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
    with: { market: true },
  });

  for (const trade of dueTrades) {
    const stakeNum = Number(trade.stake);
    const multiplier = Number(trade.payoutMultiplier);

    let won: boolean;
    let exitPrice: number;

    if (isDigitContract(trade.tradeType)) {
      // Use the same live price the frontend is displaying for this
      // market, so the outcome digit the user watched ticking on screen
      // is exactly what determines win/loss - no separate random roll.
      const live = getLivePrice(trade.market?.symbol ?? String(trade.marketId));
      const outcomeDigit = live.digit;
      exitPrice = live.price;

      const stakedDigit = trade.digit ?? 0;
      if (trade.direction === "over") {
        won = outcomeDigit > stakedDigit;
      } else if (trade.direction === "under") {
        won = outcomeDigit < stakedDigit;
      } else if (trade.direction === "even") {
        won = outcomeDigit % 2 === 0;
      } else if (trade.direction === "odd") {
        won = outcomeDigit % 2 === 1;
      } else if (trade.direction === "matches") {
        won = outcomeDigit === stakedDigit;
      } else if (trade.direction === "differs") {
        won = outcomeDigit !== stakedDigit;
      } else {
        won = false;
      }
    } else if (trade.tradeType === "rise_fall" || trade.tradeType === "higher_lower") {
      // Higher/Lower is treated identically to Rise/Fall here - both are a
      // plain entry-vs-exit comparison on the real live price, no separate
      // barrier concept. Uses the same live price source as digit
      // contracts so the chart the user watches is what decides the trade.
      const live = getLivePrice(trade.market?.symbol ?? String(trade.marketId));
      exitPrice = live.price;
      const entryPriceNum = Number(trade.entryPrice);

      if (trade.direction === "rise" || trade.direction === "higher") {
        won = exitPrice > entryPriceNum;
      } else if (trade.direction === "fall" || trade.direction === "lower") {
        won = exitPrice < entryPriceNum;
      } else {
        won = false;
      }
    } else {
      // Touch/No Touch and In/Out are not yet on real-price logic - they
      // need barrier-during-duration tracking, which is a separate,
      // larger change. Left as a probability roll for now.
      const winProbability = getWinProbability(trade.tradeType);
      won = Math.random() < winProbability;
      const priceDrift = (Math.random() - 0.5) * 40;
      exitPrice = Number(trade.entryPrice) + priceDrift;
    }

    const payout = won ? stakeNum * multiplier : 0;

    await db
      .update(tradesTable)
      .set({
        status: won ? "won" : "lost",
        exitPrice: isDigitContract(trade.tradeType) ? exitPrice.toFixed(2) : exitPrice.toFixed(5),
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

    // 5% referral commission on stake, win or lose
    await creditReferralCommission(accountId, trade.id, stakeNum);
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

  let multiplier: number;
  try {
    multiplier = getPayoutMultiplier(data.tradeType, data.direction, data.digit);
  } catch (err) {
    return res.status(400).json({
      error: err instanceof Error ? err.message : "Invalid trade selection",
    });
  }
  const durationSeconds = durationToSeconds(data.durationValue, data.durationUnit);
  const now = new Date();
  const settlesAt = new Date(now.getTime() + durationSeconds * 1000);
  // Real entry price from the same live feed used for settlement and for
  // digit contracts, so Rise/Fall and Higher/Lower are decided by the
  // actual price the user was watching, not an unrelated random number.
  const entryPrice = getLivePrice(market.symbol).price;

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
