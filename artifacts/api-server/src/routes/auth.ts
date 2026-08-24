import { Router, type IRouter } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, usersTable, accountsTable } from "@workspace/db";
import { hashPassword, comparePassword, signToken } from "../lib/auth";
import { generateReferralCode } from "../lib/referral";
import { authenticate, type AuthedRequest } from "../middlewares/authenticate";

const router: IRouter = Router();

async function generateUniqueReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateReferralCode();
    const existing = await db.query.usersTable.findFirst({
      where: eq(usersTable.referralCode, code),
    });
    if (!existing) return code;
  }
  throw new Error("Failed to generate a unique referral code");
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().optional(),
  referralCode: z.string().optional(),
  phoneNumber: z.string().regex(/^254\d{9}$/, "Phone must be in 2547XXXXXXXX format").optional(),
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email, password, fullName, referralCode, phoneNumber } = parsed.data;

  const existing = await db.query.usersTable.findFirst({
    where: eq(usersTable.email, email),
  });
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }

  if (phoneNumber) {
    const phoneTaken = await db.query.usersTable.findFirst({
      where: eq(usersTable.phoneNumber, phoneNumber),
    });
    if (phoneTaken) {
      return res.status(409).json({ error: "This phone number is already linked to another account" });
    }
  }

  let referredByUserId: number | null = null;
  if (referralCode) {
    const referrer = await db.query.usersTable.findFirst({
      where: eq(usersTable.referralCode, referralCode.toUpperCase()),
    });
    if (referrer) {
      referredByUserId = referrer.id;
    }
  }

  const passwordHash = await hashPassword(password);
  const ownReferralCode = await generateUniqueReferralCode();

  const [user] = await db
    .insert(usersTable)
    .values({
      email,
      passwordHash,
      fullName,
      referralCode: ownReferralCode,
      referredByUserId,
      phoneNumber,
    })
    .returning();

  const [demoAccount] = await db
    .insert(accountsTable)
    .values({ userId: user.id, type: "demo", currency: "USD", balance: "10000" })
    .returning();
  const [realAccount] = await db
    .insert(accountsTable)
    .values({ userId: user.id, type: "real", currency: "USD", balance: "0" })
    .returning();

  const token = signToken({ userId: user.id, email: user.email });

  res.status(201).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      createdAt: user.createdAt,
      referralCode: user.referralCode,
      phoneNumber: user.phoneNumber,
    },
    accounts: [demoAccount, realAccount],
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

  let referralCode = user.referralCode;
  if (!referralCode) {
    referralCode = await generateUniqueReferralCode();
    await db
      .update(usersTable)
      .set({ referralCode })
      .where(eq(usersTable.id, user.id));
  }

  const accounts = await db.query.accountsTable.findMany({
    where: eq(accountsTable.userId, user.id),
  });

  const token = signToken({ userId: user.id, email: user.email });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      createdAt: user.createdAt,
      referralCode,
      phoneNumber: user.phoneNumber,
    },
    accounts,
  });
});

const phoneSchema = z.object({
  phoneNumber: z.string().regex(/^254\d{9}$/, "Phone must be in 2547XXXXXXXX format"),
});

router.patch("/phone", authenticate, async (req: AuthedRequest, res) => {
  const parsed = phoneSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { phoneNumber } = parsed.data;

  const existing = await db.query.usersTable.findFirst({
    where: eq(usersTable.phoneNumber, phoneNumber),
  });
  if (existing && existing.id !== req.userId) {
    return res.status(409).json({ error: "This phone number is already linked to another account" });
  }

  await db
    .update(usersTable)
    .set({ phoneNumber })
    .where(eq(usersTable.id, req.userId!));

  res.json({ phoneNumber });
});

export default router;
