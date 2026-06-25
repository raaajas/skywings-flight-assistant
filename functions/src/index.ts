import cors from "cors";
import express from "express";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { createChatSession, listChatSessions, runAgentChat } from "./agent/orchestrator";
import { formatModelError } from "./agent/geminiClient";
import { getUserBookings } from "./booking/bookingService";
import { requireAuth, type AuthenticatedRequest } from "./middleware/auth";
import { rateLimit } from "./middleware/rateLimit";
import { isDatabaseSeeded, seedDatabase } from "./seed/seedHandler";
import { logError, logInfo } from "./utils/logger";

const geminiApiKey = defineSecret("GEMINI_API_KEY");
const seedSecret = defineSecret("SEED_SECRET");
const openaiApiKey = defineSecret("OPENAI_API_KEY");

export const app = express();
app.use(
  cors({
    origin: true,
    allowedHeaders: ["Content-Type", "Authorization", "Bypass-Tunnel-Reminder"],
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(rateLimit);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "flight-assistant-api" });
});

app.post("/agent/chat", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { sessionId, message } = req.body as { sessionId?: string; message?: string };
    if (!sessionId || !message?.trim()) {
      res.status(400).json({ error: "sessionId and message are required" });
      return;
    }

    process.env.GEMINI_API_KEY = geminiApiKey.value();
    process.env.OPENAI_API_KEY = openaiApiKey.value();
    logInfo("agent.chat.request", { userId: req.user!.uid, sessionId });
    const response = await runAgentChat({
      userId: req.user!.uid,
      sessionId,
      message: message.trim().slice(0, 4000),
    });
    res.json(response);
  } catch (error) {
    logError("agent.chat.failed", error, { userId: req.user?.uid });
    const message = formatModelError(error);
    const status = isRetryableStatus(error) ? 503 : 500;
    res.status(status).json({ error: message });
  }
});

function isRetryableStatus(error: unknown): boolean {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return message.includes("503") || message.includes("high demand") || message.includes("unavailable");
}

app.post("/agent/sessions", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { action, title } = req.body as { action?: string; title?: string };

    if (action === "list") {
      const sessions = await listChatSessions(req.user!.uid);
      res.json({ sessions });
      return;
    }

    const sessionId = await createChatSession(req.user!.uid, title);
    res.json({ sessionId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Session request failed";
    res.status(500).json({ error: message });
  }
});

app.get("/bookings", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const bookings = await getUserBookings(req.user!.uid);
    res.json({ bookings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load bookings";
    res.status(500).json({ error: message });
  }
});

app.post("/seed", async (req, res) => {
  try {
    const providedSecret = req.headers["x-seed-secret"]?.toString();
    if (providedSecret !== seedSecret.value()) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    if (await isDatabaseSeeded()) {
      res.json({ message: "Database already seeded", seeded: true });
      return;
    }

    process.env.GEMINI_API_KEY = geminiApiKey.value();
    const result = await seedDatabase(geminiApiKey.value());
    logInfo("seed.completed", result);
    res.json({ message: "Database seeded", ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Seed failed";
    res.status(500).json({ error: message });
  }
});

export const api = onRequest(
  {
    secrets: [geminiApiKey, seedSecret, openaiApiKey],
    timeoutSeconds: 120,
    memory: "512MiB",
    cors: true,
  },
  app,
);

// Support running as a standalone Express server (e.g. on Render, Koyeb, etc.)
if (process.env.PORT || process.env.STANDALONE === "true") {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`Standalone API server listening on port ${PORT}`);
  });
}
