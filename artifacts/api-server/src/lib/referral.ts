export function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars (0/O, 1/I)
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export const REFERRAL_COMMISSION_RATE = 0.20;
// Extra commission paid to a partner's master on that partner's referred users' deposits (on top of the 20%).
export const MASTER_COMMISSION_RATE = 0.05;
