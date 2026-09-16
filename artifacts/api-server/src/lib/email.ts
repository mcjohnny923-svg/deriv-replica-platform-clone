import nodemailer from "nodemailer";

// SMTP credentials come from environment variables (set as Replit secrets),
// never hardcoded here or committed to the repo.
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

const transporter = nodemailer.createTransport({
  host: "mail.spacemail.com",
  port: 465,
  secure: true, // SSL, matches the 465 port
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export async function sendWelcomeEmail(to: string, name: string | undefined): Promise<void> {
  if (!SMTP_USER || !SMTP_PASS) {
    // Not configured yet - log and skip rather than throw, so registration
    // never fails because of missing email credentials.
    console.warn("SMTP_USER/SMTP_PASS not set - skipping welcome email");
    return;
  }

  const greetingName = name?.trim() || "there";

  await transporter.sendMail({
    from: `"NovBinary" <${SMTP_USER}>`,
    to,
    subject: "Welcome to NovBinary",
    text: `Hi ${greetingName},\n\nWelcome to NovBinary! Your account has been created successfully.\n\nYou now have a Demo account with USD 10,000 virtual balance to practice with, and a Real account ready whenever you're ready to trade with real funds.\n\nIf you have any questions, just reply to this email.\n\n- The NovBinary Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
        <h2 style="color: #dc2626;">Welcome to NovBinary</h2>
        <p>Hi ${greetingName},</p>
        <p>Your account has been created successfully.</p>
        <p>You now have a <strong>Demo account</strong> with <strong>USD 10,000</strong> virtual balance to practice with, and a <strong>Real account</strong> ready whenever you're ready to trade with real funds.</p>
        <p>If you have any questions, just reply to this email.</p>
        <p style="margin-top: 24px; color: #666;">- The NovBinary Team</p>
      </div>
    `,
  });
}

export async function sendVerificationEmail(to: string, code: string, name: string | undefined): Promise<void> {
  if (!SMTP_USER || !SMTP_PASS) {
    // Not configured yet - log and skip rather than throw. The route that
    // calls this treats a thrown error as a hard failure, so this only
    // silently no-ops in dev-style setups where that's expected.
    console.warn("SMTP_USER/SMTP_PASS not set - skipping verification email");
    return;
  }

  const greetingName = name?.trim() || "there";

  await transporter.sendMail({
    from: `"NovBinary" <${SMTP_USER}>`,
    to,
    subject: "Your NovBinary verification code",
    text: `Hi ${greetingName},\n\nYour verification code is: ${code}\n\nThis code expires in 10 minutes. If you didn't request this, you can safely ignore this email.\n\n- The NovBinary Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
        <h2 style="color: #dc2626;">Verify your email</h2>
        <p>Hi ${greetingName},</p>
        <p>Your verification code is:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px; text-align: center; padding: 16px; background: #f4f4f5; border-radius: 8px;">${code}</p>
        <p>This code expires in <strong>10 minutes</strong>.</p>
        <p style="color: #666;">If you didn't request this, you can safely ignore this email.</p>
        <p style="margin-top: 24px; color: #666;">- The NovBinary Team</p>
      </div>
    `,
  });
}
