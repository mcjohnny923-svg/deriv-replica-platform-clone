import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { db, usersTable, partnerWithdrawalsTable } from "@workspace/db";
import { adminAuth } from "../middlewares/adminAuth";

const router: IRouter = Router();

router.get("/", adminAuth, async (_req: Request, res: Response) => {
  try {
    const rows = await db
      .select({
        id: partnerWithdrawalsTable.id,
        amount: partnerWithdrawalsTable.amount,
        status: partnerWithdrawalsTable.status,
        createdAt: partnerWithdrawalsTable.createdAt,
        resolvedAt: partnerWithdrawalsTable.resolvedAt,
        email: usersTable.email,
        fullName: usersTable.fullName,
        phoneNumber: usersTable.phoneNumber,
      })
      .from(partnerWithdrawalsTable)
      .innerJoin(usersTable, eq(usersTable.id, partnerWithdrawalsTable.partnerUserId))
      .orderBy(desc(partnerWithdrawalsTable.id))
      .limit(100);
    res.json({ withdrawals: rows });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to load requests" });
  }
});

const resolveSchema = z.object({ action: z.enum(["paid", "return"]) });

router.post("/:id/resolve", adminAuth, async (req: Request, res: Response) => {
  const parsed = resolveSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid action" });
    return;
  }
  const id = Number(req.params.id);
  const newStatus = parsed.data.action === "paid" ? "paid" : "rejected";

  const updated = await db
    .update(partnerWithdrawalsTable)
    .set({ status: newStatus, resolvedAt: new Date() })
    .where(and(eq(partnerWithdrawalsTable.id, id), eq(partnerWithdrawalsTable.status, "pending")))
    .returning();

  if (updated.length === 0) {
    res.status(404).json({ error: "Request not found or already resolved" });
    return;
  }
  res.json({ ok: true, status: newStatus });
});

export default router;
