import { Router, type IRouter } from "express";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db, usersTable, accountsTable } from "@workspace/db";
import { hashPassword, comparePassword, signToken } from "../lib/auth";

const router: IRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().optional(),
  accountType: z.enum(["demo", "real"]).default("demo"),
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email, password, fullName, accountType } = parsed.data;

  const existingUser = await db.query.usersTable.findFirst({
    where: eq(usersTable.email, email),
  });

  let user;

  if (existingUser) {
    // Email already belongs to a user — verify it's really them before adding an account
    const passwordMatches = await comparePassword(password, existingUser.passwordHash);
    if (!passwordMatches) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const existingAccountOfType = await db.query.accountsTable.findFirst({
      where: and(
        eq(accountsTable.userId, existingUser.id),
        eq(accountsTable.type, accountType),
      ),
    });
    if (existingAccountOfType) {
      return res.status(409).json({
        error: `You already have a ${accountType} account. Please log in instead.`,
      });
    }

    user = existingUser;
  } else {
    const passwordHash = await hashPassword(password);
    const [newUser] = await db
      .insert(usersTable)
      .values({ email, passwordHash, fullName })
      .returning();
    user = newUser;
  }

  const startingBalance = accountType === "demo" ? "10000" : "0";
  const [account] = await db
    .insert(accountsTable)
    .values({
      userId: user.id,
      type: accountType,
      currency: "USD",
      balance: startingBalance,
    })
    .returning();

  const token = signToken({ userId: user.id, email: user.email });

  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, fullName: user.fullName },
    account,
  });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.email, email),
  });
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const accounts = await db.query.accountsTable.findMany({
    where: eq(accountsTable.userId, user.id),
  });

  const token = signToken({ userId: user.id, email: user.email });

  res.json({
    token,
    user: { id: user.id, email: user.email, fullName: user.fullName },
    accounts,
  });
});

export default router;
