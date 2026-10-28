import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod";
import { randomInt } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db, usersTable, passwordResetCodesTable } from "@workspace/db";
import { hashPassword, comparePassword } from "../lib/auth";
import { sendPasswordResetEmail } from "../lib/email";

const router: IRouter = Router();

const CODE_TTL_MS = 15 * 60 * 1000;
const COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const GENERIC = { ok: true, message: "If that email has an account, a code has been sent." };

const requestSchema = z.object({ email: z.string().email().max(200) });

router.post("/request", async (req: Request, res: Response) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid email address." });
    return;
  }
  const email = parsed.data.email.trim().toLowerCase();

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(sql`lower(${usersTable.email}) = ${email}`)
      .limit(1);

    if (!user) {
      res.json(GENERIC);
      return;
    }

    const [existing] = await db
      .select()
      .from(passwordResetCodesTable)
      .where(sql`lower(${passwordResetCodesTable.email}) = ${email}`)
      .limit(1);
    if (existing && Date.now() - new Date(existing.createdAt).getTime() < COOLDOWN_MS) {
      res.json(GENERIC);
      return;
    }

    const code = String(randomInt(100000, 1000000));
    const codeHash = await hashPassword(code);

    await db.delete(passwordResetCodesTable).where(sql`lower(${passwordResetCodesTable.email}) = ${email}`);
    await db.insert(passwordResetCodesTable).values({
      email: user.email,
      codeHash,
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    });

    sendPasswordResetEmail(user.email, code).catch((err) => {
      console.error("Failed to send password reset email:", err);
    });

    res.json(GENERIC);
  } catch (err) {
    console.error("Password reset request failed:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

const confirmSchema = z.object({
  email: z.string().email().max(200),
  code: z.string().regex(/^\d{6}$/),
  newPassword: z.string().min(8).max(100),
});

router.post("/confirm", async (req: Request, res: Response) => {
  const parsed = confirmSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter the 6-digit code and a new password of at least 8 characters." });
    return;
  }
  const email = parsed.data.email.trim().toLowerCase();
  const { code, newPassword } = parsed.data;
  const invalid = { error: "Invalid or expired code." };

  try {
    const [row] = await db
      .select()
      .from(passwordResetCodesTable)
      .where(sql`lower(${passwordResetCodesTable.email}) = ${email}`)
      .limit(1);

    if (!row || new Date(row.expiresAt).getTime() < Date.now()) {
      if (row) await db.delete(passwordResetCodesTable).where(eq(passwordResetCodesTable.id, row.id));
      res.status(400).json(invalid);
      return;
    }
    if (row.attempts >= MAX_ATTEMPTS) {
      await db.delete(passwordResetCodesTable).where(eq(passwordResetCodesTable.id, row.id));
      res.status(400).json({ error: "Too many wrong attempts. Request a new code." });
      return;
    }

    const ok = await comparePassword(code, row.codeHash);
    if (!ok) {
      await db
        .update(passwordResetCodesTable)
        .set({ attempts: row.attempts + 1 })
        .where(eq(passwordResetCodesTable.id, row.id));
      res.status(400).json(invalid);
      return;
    }

    const newHash = await hashPassword(newPassword);
    await db
      .update(usersTable)
      .set({ passwordHash: newHash })
      .where(sql`lower(${usersTable.email}) = ${email}`);
    await db.delete(passwordResetCodesTable).where(eq(passwordResetCodesTable.id, row.id));

    res.json({ ok: true });
  } catch (err) {
    console.error("Password reset confirm failed:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

export default router;
