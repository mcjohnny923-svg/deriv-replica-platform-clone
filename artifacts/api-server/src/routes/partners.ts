import { Router, type IRouter, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, referralEarningsTable } from "@workspace/db";
import { authenticate, type AuthedRequest } from "../middlewares/authenticate";

const router: IRouter = Router();
router.use(authenticate);

router.get("/summary", async (req: AuthedRequest, res: Response) => {
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, req.userId!),
  });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  let referralCode = user.referralCode;
  if (!referralCode) {
    // Extremely rare fallback path; normally backfilled at login
    return res.status(500).json({ error: "Referral code missing, please log in again" });
  }

  const referredUsers = await db.query.usersTable.findMany({
    where: eq(usersTable.referredByUserId, user.id),
  });

  const earningsRows = await db.query.referralEarningsTable.findMany({
    where: eq(referralEarningsTable.referrerUserId, user.id),
  });

  const totalEarnings = earningsRows.reduce((sum, row) => sum + Number(row.amount), 0);

  const now = new Date();
  const thisMonthEarnings = earningsRows
    .filter((row) => {
      const created = new Date(row.createdAt);
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    })
    .reduce((sum, row) => sum + Number(row.amount), 0);

  res.json({
    referralCode,
    signupsCount: referredUsers.length,
    totalEarnings: totalEarnings.toFixed(2),
    thisMonthEarnings: thisMonthEarnings.toFixed(2),
    tradesCommissioned: earningsRows.length,
  });
});

export default router;
