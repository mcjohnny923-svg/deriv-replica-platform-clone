import { and, eq, lt } from "drizzle-orm";
import { db, accountsTable, transactionsTable } from "@workspace/db";
import { logger } from "./logger";

const HOLD_MINUTES = 20;
const SWEEP_INTERVAL_MS = 60_000;

// Refunds any withdrawal that's been sitting "pending" for longer than the
// hold window. This only ever applies to withdrawals created while a
// user's autoWithdraw was OFF — the ON path completes immediately and
// never reaches "pending", so the sweep never touches those.
export async function sweepExpiredWithdrawals(): Promise<void> {
  const cutoff = new Date(Date.now() - HOLD_MINUTES * 60_000);

  const expired = await db.query.transactionsTable.findMany({
    where: and(
      eq(transactionsTable.type, "withdrawal"),
      eq(transactionsTable.status, "pending"),
      lt(transactionsTable.createdAt, cutoff),
    ),
  });

  for (const transaction of expired) {
    const account = await db.query.accountsTable.findFirst({
      where: eq(accountsTable.id, transaction.accountId),
    });
    if (account) {
      const refundedBalance = Number(account.balance) + Number(transaction.amount);
      await db
        .update(accountsTable)
        .set({ balance: refundedBalance.toFixed(2) })
        .where(eq(accountsTable.id, account.id));
    }

    await db
      .update(transactionsTable)
      .set({ status: "failed" })
      .where(eq(transactionsTable.id, transaction.id));

    logger.info(
      { transactionId: transaction.id, accountId: transaction.accountId },
      "Auto-refunded expired withdrawal hold",
    );
  }
}

export function startWithdrawalSweep(): void {
  setInterval(() => {
    sweepExpiredWithdrawals().catch((err) => {
      logger.error({ err }, "Withdrawal sweep failed");
    });
  }, SWEEP_INTERVAL_MS);
  logger.info({ intervalMs: SWEEP_INTERVAL_MS }, "Withdrawal sweep started");
}
