import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { verifyToken } from "../lib/auth";

export interface AuthedRequest extends Request {
  userId?: number;
}

export async function authenticate(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }
  const token = header.slice("Bearer ".length);
  try {
    const payload = verifyToken(token);
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, payload.userId),
    });
    if (!user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    if (user.isSuspended) {
      return res.status(403).json({ error: "This account has been suspended. Contact support." });
    }
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
