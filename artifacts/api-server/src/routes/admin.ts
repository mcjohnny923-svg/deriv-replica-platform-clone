import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
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
      accounts: u.accounts.map((a) => ({
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

export default router;
