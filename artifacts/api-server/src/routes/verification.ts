import { Router, type IRouter, type Response } from "express";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { db, verificationDocumentsTable } from "@workspace/db";
import { authenticate, type AuthedRequest } from "../middlewares/authenticate";

const router: IRouter = Router();
router.use(authenticate);

const MAX_BYTES = 5 * 1024 * 1024;

function detectMime(buf: Buffer): string | null {
  if (buf.length > 4 && buf.subarray(0, 4).toString("latin1") === "%PDF") return "application/pdf";
  if (buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47)
    return "image/png";
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  return null;
}

router.get("/status", async (req: AuthedRequest, res: Response) => {
  const rows = await db
    .select({
      id: verificationDocumentsTable.id,
      docType: verificationDocumentsTable.docType,
      fileName: verificationDocumentsTable.fileName,
      status: verificationDocumentsTable.status,
      rejectReason: verificationDocumentsTable.rejectReason,
      createdAt: verificationDocumentsTable.createdAt,
    })
    .from(verificationDocumentsTable)
    .where(eq(verificationDocumentsTable.userId, req.userId!))
    .orderBy(desc(verificationDocumentsTable.id));

  const latest = (type: string) => rows.find((r) => r.docType === type) ?? null;
  res.json({ identity: latest("identity"), address: latest("address") });
});

const uploadSchema = z.object({
  docType: z.enum(["identity", "address"]),
  fileName: z.string().min(1).max(200),
  data: z.string().min(1),
});

router.post("/upload", async (req: AuthedRequest, res: Response) => {
  const parsed = uploadSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid upload" });
    return;
  }
  const { docType, fileName, data } = parsed.data;

  const buf = Buffer.from(data, "base64");
  if (buf.length === 0 || buf.length > MAX_BYTES) {
    res.status(400).json({ error: "File must be under 5 MB." });
    return;
  }
  const mime = detectMime(buf);
  if (!mime) {
    res.status(400).json({ error: "Only JPG, PNG or PDF files are accepted." });
    return;
  }

  const safeName = fileName.replace(/[^\w.\- ]/g, "_").slice(0, 120);
  const inserted = await db
    .insert(verificationDocumentsTable)
    .values({
      userId: req.userId!,
      docType,
      fileName: safeName,
      mimeType: mime,
      fileData: buf.toString("base64"),
    })
    .onConflictDoNothing()
    .returning({ id: verificationDocumentsTable.id });

  if (inserted.length === 0) {
    res.status(400).json({ error: "You already have a pending or approved document of this type." });
    return;
  }
  res.status(201).json({ ok: true });
});

export default router;
