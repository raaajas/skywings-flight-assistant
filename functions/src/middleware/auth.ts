import type { Request, Response, NextFunction } from "express";
import { getAuth } from "firebase-admin/auth";

export interface AuthenticatedRequest extends Request {
  user?: { uid: string; email?: string };
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing authorization token" });
      return;
    }

    const token = header.slice("Bearer ".length);
    const decoded = await getAuth().verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email };
    next();
  } catch {
    res.status(401).json({ error: "Invalid authorization token" });
  }
}
