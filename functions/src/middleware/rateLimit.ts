import type { Request, Response, NextFunction } from "express";

const buckets = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

export function rateLimit(req: Request, res: Response, next: NextFunction): void {
  const key = req.ip ?? req.headers["x-forwarded-for"]?.toString() ?? "unknown";
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    next();
    return;
  }

  if (bucket.count >= MAX_REQUESTS) {
    res.status(429).json({ error: "Too many requests. Please try again shortly." });
    return;
  }

  bucket.count += 1;
  next();
}
