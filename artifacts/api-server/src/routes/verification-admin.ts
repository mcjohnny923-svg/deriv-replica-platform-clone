import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { db, usersTable, verificationDocumentsTable } from "@workspace/db";
import { adminAuth } from "../middlewares/adminAuth";
import { wipeExpiredVerificationDocs, startVerificationCleanup } from "../lib/verification-cleanup";

const router: IRouter = Router();

startVerificationCleanup();

router.get("/", adminAuth, async (_req: Request, res: Response) => {
  try {
    await wipeExpiredVerificationDocs();
    const rows = await db
      .select({
        id: verificationDocumentsTable.id,
        docType: verificationDocumentsTable.docType,
        fileName: verificationDocumentsTable.fileName,
        mimeType: verificationDocumentsTable.mimeType,
        status: verificationDocumentsTable.status,
        rejectReason: verificationDocumentsTable.rejectReason,
        createdAt: verificationDocumentsTable.createdAt,
        reviewedAt: verificationDocumentsTable.reviewedAt,
        email: usersTable.email,
        fullName: usersTable.fullName,
        phoneNumber: usersTable.phoneNumber,
      })
      .from(verificationDocumentsTable)
      .innerJoin(usersTable, eq(usersTable.id, verificationDocumentsTable.userId))
      .orderBy(desc(verificationDocumentsTable.id))
      .limit(200);
    res.json({ documents: rows });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to load documents" });
  }
});

router.get("/:id/file", adminAuth, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const [row] = await db
    .select({
      data: verificationDocumentsTable.fileData,
      mimeType: verificationDocumentsTable.mimeType,
    })
    .from(verificationDocumentsTable)
    .where(eq(verificationDocumentsTable.id, id));
  if (!row) {
    res.status(404).json({ error: "Document not found" });
    return;
  }
  if (!row.data) {
    res.status(410).json({ error: "This file has been deleted." });
    return;
  }
  res.json(row);
});

const reviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().max(300).optional(),
});

router.post("/:id/review", adminAuth, async (req: Request, res: Response) => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const { action, reason } = parsed.data;
  if (action === "reject" && !reason?.trim()) {
    res.status(400).json({ error: "Please give a reason for rejecting." });
    return;
  }
  const id = Number(req.params.id);

  const updated = await db
    .update(verificationDocumentsTable)
    .set({
      status: action === "approve" ? "approved" : "rejected",
      rejectReason: action === "reject" ? reason!.trim() : null,
      reviewedAt: new Date(),
      ...(action === "reject" ? { fileData: "", fileName: "deleted" } : {}),
    })
    .where(and(eq(verificationDocumentsTable.id, id), eq(verificationDocumentsTable.status, "pending")))
    .returning({ id: verificationDocumentsTable.id });

  if (updated.length === 0) {
    res.status(404).json({ error: "Document not found or already reviewed" });
    return;
  }
  res.json({ ok: true });
});

export default router;
