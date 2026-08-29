import type { Request, Response, NextFunction } from "express";

// Simple shared-secret gate for admin-only routes. Not user-JWT based —
// checks a fixed key against ADMIN_KEY, set as a Render env var.
export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const providedKey = req.headers["x-admin-key"];
  const expectedKey = process.env.ADMIN_KEY;

  if (!expectedKey || providedKey !== expectedKey) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
