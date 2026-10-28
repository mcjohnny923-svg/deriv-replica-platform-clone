import { and, eq, ne, lt } from "drizzle-orm";
import { db, verificationDocumentsTable } from "@workspace/db";

const RETENTION_DAYS = 30;
let started = false;

// Wipes the file of approved documents older than RETENTION_DAYS (the approval record stays).
export async function wipeExpiredVerificationDocs(): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    await db
      .update(verificationDocumentsTable)
      .set({ fileData: "", fileName: "deleted" })
      .where(
        and(
          eq(verificationDocumentsTable.status, "approved"),
          ne(verificationDocumentsTable.fileData, ""),
          lt(verificationDocumentsTable.reviewedAt, cutoff),
        ),
      );
  } catch (err) {
    console.error("Verification cleanup failed:", err);
  }
}

export function startVerificationCleanup(): void {
  if (started) return;
  started = true;
  void wipeExpiredVerificationDocs();
  setInterval(() => void wipeExpiredVerificationDocs(), 6 * 60 * 60 * 1000);
}
