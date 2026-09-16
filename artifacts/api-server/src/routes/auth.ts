import { Router, type IRouter } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, usersTable, accountsTable, pendingRegistrationsTable } from "@workspace/db";
import { hashPassword, comparePassword, signToken } from "../lib/auth";
import { generateReferralCode } from "../lib/referral";
import { authenticate, type AuthedRequest } from "../middlewares/authenticate";
import { sendWelcomeEmail, sendVerificationEmail } from "../lib/email";

const router: IRouter = Router();

const PENDING_REGISTRATION_TTL_MS = 10 * 60 * 1000; // 10 minutes

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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

async function createVerifiedUser(input: {
  email: string;
  passwordHash: string;
  fullName?: string;
  referralCode?: string;
  phoneNumber?: string;
  country?: string;
}) {
  let referredByUserId: number | null = null;
  if (input.referralCode) {
    const referrer = await db.query.usersTable.findFirst({
      where: eq(usersTable.referralCode, input.referralCode.toUpperCase()),
    });
    if (referrer) referredByUserId = referrer.id;
  }

  const ownReferralCode = await generateUniqueReferralCode();

  const [user] = await db
    .insert(usersTable)
    .values({
      email: input.email,
      passwordHash: input.passwordHash,
      fullName: input.fullName,
      referralCode: ownReferralCode,
      referredByUserId,
      phoneNumber: input.phoneNumber,
      country: input.country,
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

  sendWelcomeEmail(user.email, user.fullName ?? undefined).catch((err) => {
    console.error("Failed to send welcome email:", err);
  });

  return { user, demoAccount, realAccount, token };
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().optional(),
  referralCode: z.string().optional(),
  phoneNumber: z.string().regex(/^254\d{9}$/, "Phone must be in 2547XXXXXXXX format").optional(),
  country: z.string().optional(),
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email, password, fullName, referralCode, phoneNumber, country } = parsed.data;

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

  if (process.env.SKIP_EMAIL_VERIFICATION === "true") {
    const passwordHash = await hashPassword(password);
    const { user, demoAccount, realAccount, token } = await createVerifiedUser({
      email,
      passwordHash,
      fullName,
      referralCode,
      phoneNumber,
      country,
    });

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        createdAt: user.createdAt,
        referralCode: user.referralCode,
        phoneNumber: user.phoneNumber,
        country: user.country,
      },
      accounts: [demoAccount, realAccount],
    });
  }

  // Drop any stale pending registration for this email (expired, abandoned,
  // or a retry after a typo) so only one pending row per email ever exists.
  await db
    .delete(pendingRegistrationsTable)
    .where(eq(pendingRegistrationsTable.email, email));

  const passwordHash = await hashPassword(password);
  const verificationCode = generateVerificationCode();
  const expiresAt = new Date(Date.now() + PENDING_REGISTRATION_TTL_MS);

  await db.insert(pendingRegistrationsTable).values({
    email,
    passwordHash,
    fullName,
    referralCode,
    phoneNumber,
    country,
    verificationCode,
    expiresAt,
  });

  try {
    await sendVerificationEmail(email, verificationCode, fullName);
  } catch (err) {
    console.error("Failed to send verification email:", err);
    return res.status(502).json({ error: "Failed to send verification email. Please try again." });
  }

  res.status(200).json({
    message: "Verification code sent. Check your email to complete registration.",
    email,
  });
});

const confirmRegistrationSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

router.post("/register/confirm", async (req, res) => {
  const parsed = confirmRegistrationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email, code } = parsed.data;

  const pending = await db.query.pendingRegistrationsTable.findFirst({
    where: eq(pendingRegistrationsTable.email, email),
  });

  if (!pending) {
    return res.status(400).json({ error: "No pending registration found for this email. Please register again." });
  }

  if (pending.expiresAt.getTime() < Date.now()) {
    await db
      .delete(pendingRegistrationsTable)
      .where(eq(pendingRegistrationsTable.id, pending.id));
    return res.status(400).json({ error: "Verification code expired. Please register again." });
  }

  if (pending.verificationCode !== code) {
    return res.status(400).json({ error: "Incorrect verification code" });
  }

  // Re-check uniqueness in case someone else grabbed the email/phone while
  // this registration was pending.
  const existing = await db.query.usersTable.findFirst({
    where: eq(usersTable.email, pending.email),
  });
  if (existing) {
    await db
      .delete(pendingRegistrationsTable)
      .where(eq(pendingRegistrationsTable.id, pending.id));
    return res.status(409).json({ error: "Email already registered" });
  }

  if (pending.phoneNumber) {
    const phoneTaken = await db.query.usersTable.findFirst({
      where: eq(usersTable.phoneNumber, pending.phoneNumber),
    });
    if (phoneTaken) {
      return res.status(409).json({ error: "This phone number is already linked to another account" });
    }
  }

  let referredByUserId: number | null = null;
  if (pending.referralCode) {
    const referrer = await db.query.usersTable.findFirst({
      where: eq(usersTable.referralCode, pending.referralCode.toUpperCase()),
    });
    if (referrer) {
      referredByUserId = referrer.id;
    }
  }

  const ownReferralCode = await generateUniqueReferralCode();

  const [user] = await db
    .insert(usersTable)
    .values({
      email: pending.email,
      passwordHash: pending.passwordHash,
      fullName: pending.fullName,
      referralCode: ownReferralCode,
      referredByUserId,
      phoneNumber: pending.phoneNumber,
      country: pending.country,
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

  await db
    .delete(pendingRegistrationsTable)
    .where(eq(pendingRegistrationsTable.id, pending.id));

  const token = signToken({ userId: user.id, email: user.email });

  // Fire-and-forget: a welcome email failing (bad credentials, SMTP down,
  // etc.) should never block or fail registration itself.
  sendWelcomeEmail(user.email, user.fullName ?? undefined).catch((err) => {
    console.error("Failed to send welcome email:", err);
  });

  res.status(201).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      createdAt: user.createdAt,
      referralCode: user.referralCode,
      phoneNumber: user.phoneNumber,
      country: user.country,
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
  if (user.isSuspended) {
    return res.status(403).json({ error: "This account has been suspended. Contact support." });
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
      country: user.country,
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

const profileUpdateSchema = z.object({
  fullName: z.string().min(1).optional(),
  country: z.string().optional(),
  phoneNumber: z.string().regex(/^254\d{9}$/, "Phone must be in 2547XXXXXXXX format").optional(),
});

router.patch("/profile", authenticate, async (req: AuthedRequest, res) => {
  const parsed = profileUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { fullName, country, phoneNumber } = parsed.data;

  if (phoneNumber) {
    const existing = await db.query.usersTable.findFirst({
      where: eq(usersTable.phoneNumber, phoneNumber),
    });
    if (existing && existing.id !== req.userId) {
      return res.status(409).json({ error: "This phone number is already linked to another account" });
    }
  }

  const updates: Partial<{ fullName: string; country: string; phoneNumber: string }> = {};
  if (fullName !== undefined) updates.fullName = fullName;
  if (country !== undefined) updates.country = country;
  if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, req.userId!))
    .returning();

  res.json({
    fullName: updated.fullName,
    country: updated.country,
    phoneNumber: updated.phoneNumber,
  });
});

router.get("/accounts", authenticate, async (req: AuthedRequest, res) => {
  const accounts = await db.query.accountsTable.findMany({
    where: eq(accountsTable.userId, req.userId!),
  });
  res.json({ accounts });
});

router.post("/accounts/:id/reset-demo", authenticate, async (req: AuthedRequest, res) => {
  const accountId = Number(req.params.id);
  const account = await db.query.accountsTable.findFirst({
    where: eq(accountsTable.id, accountId),
  });
  if (!account || account.userId !== req.userId) {
    return res.status(403).json({ error: "Account not found or not owned by you" });
  }
  if (account.type !== "demo") {
    return res.status(400).json({ error: "Only demo accounts can be reset" });
  }
  await db
    .update(accountsTable)
    .set({ balance: "10000.00" })
    .where(eq(accountsTable.id, accountId));
  res.json({ ok: true, newBalance: "10000.00" });
});

export default router;
