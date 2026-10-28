import { Router, type IRouter, type Response } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { authenticate, type AuthedRequest } from "../middlewares/authenticate";
import { hashPassword, comparePassword } from "../lib/auth";

const router: IRouter = Router();
router.use(authenticate);

// Simple in-memory limit: 5 wrong current-password attempts per 15 minutes per user
const MAX_FAILS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const fails = new Map<number, { count: number; first: number }>();

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

router.post("/change-password", async (req: AuthedRequest, res: Response) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "New password must be at least 8 characters." });
    return;
  }
  const { currentPassword, newPassword } = parsed.data;
  const userId = req.userId!;

  const rec = fails.get(userId);
  if (rec && Date.now() - rec.first > WINDOW_MS) fails.delete(userId);
  const active = fails.get(userId);
  if (active && active.count >= MAX_FAILS) {
    res.status(429).json({ error: "Too many wrong attempts. Try again in 15 minutes." });
    return;
  }

  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const ok = await comparePassword(currentPassword, user.passwordHash);
  if (!ok) {
    const cur = fails.get(userId);
    fails.set(userId, { count: (cur?.count ?? 0) + 1, first: cur?.first ?? Date.now() });
    res.status(400).json({ error: "Current password is incorrect." });
    return;
  }
  if (currentPassword === newPassword) {
    res.status(400).json({ error: "New password must be different from the current one." });
    return;
  }

  const newHash = await hashPassword(newPassword);
  await db.update(usersTable).set({ passwordHash: newHash }).where(eq(usersTable.id, userId));
  fails.delete(userId);
  res.json({ ok: true });
});

export default router;
