import { type Content } from "@google/genai";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../utils/firebaseAdmin";
import {
  MODEL_CANDIDATES,
  buildFunctionResponseParts,
  formatModelError,
  sendWithRetry,
  shouldTryNextModel,
} from "./geminiClient";
import { buildToolTrace, executeTool } from "./tools";
import { getChatSession, type ChatSession } from "./llmClient";
import type { AgentChatResponse, ChatMessage, ToolCallRecord, UiPayload } from "../types";

const MAX_TOOL_ROUNDS = 8;
const SESSIONS = "chatSessions";

function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return key;
}

async function loadHistory(sessionId: string, userId: string): Promise<Content[]> {
  const sessionDoc = await db.collection(SESSIONS).doc(sessionId).get();
  if (!sessionDoc.exists || sessionDoc.data()?.userId !== userId) {
    throw new Error("Chat session not found");
  }

  const messagesSnap = await db
    .collection(SESSIONS)
    .doc(sessionId)
    .collection("messages")
    .orderBy("createdAt", "asc")
    .limit(40)
    .get();

  return messagesSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      role: data.role === "assistant" ? "model" : "user",
      parts: [{ text: String(data.content) }],
    } as Content;
  });
}

async function saveMessage(
  sessionId: string,
  message: ChatMessage & { createdAt?: string },
): Promise<void> {
  await db
    .collection(SESSIONS)
    .doc(sessionId)
    .collection("messages")
    .add({
      role: message.role,
      content: message.content,
      uiPayload: message.uiPayload ?? null,
      toolCalls: message.toolCalls ?? null,
      createdAt: message.createdAt ?? new Date().toISOString(),
    });

  await db.collection(SESSIONS).doc(sessionId).update({
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function createChatSession(userId: string, title?: string): Promise<string> {
  const ref = await db.collection(SESSIONS).add({
    userId,
    title: title ?? "New conversation",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function listChatSessions(userId: string) {
  const snapshot = await db
    .collection(SESSIONS)
    .where("userId", "==", userId)
    .orderBy("updatedAt", "desc")
    .limit(20)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

async function runWithModelFallback<T>(
  apiKey: string,
  operation: (modelName: string) => Promise<T>,
): Promise<T> {
  let lastError: unknown;

  for (const modelName of MODEL_CANDIDATES) {
    try {
      return await sendWithRetry(() => operation(modelName));
    } catch (error) {
      lastError = error;
      if (!shouldTryNextModel(error)) {
        throw error;
      }
    }
  }

  throw new Error(formatModelError(lastError));
}

export async function runAgentChat(params: {
  userId: string;
  sessionId: string;
  message: string;
}): Promise<AgentChatResponse> {
  const provider = process.env.MODEL_PROVIDER || "gemini";
  const history = await loadHistory(params.sessionId, params.userId);
  const today = new Date().toISOString().slice(0, 10);
  const userText = `[Today: ${today}]\n${params.message}`;

  await saveMessage(params.sessionId, {
    role: "user",
    content: params.message,
  });

  const runSession = async (chatSession: ChatSession, apiKey: string) => {
    let response = await chatSession.sendMessage({ message: userText });
    const toolTrace: ToolCallRecord[] = [];
    let uiPayload: UiPayload | undefined;
    let rounds = 0;

    while (rounds < MAX_TOOL_ROUNDS) {
      const functionCalls = response.functionCalls;
      if (!functionCalls?.length) {
        break;
      }

      const results: unknown[] = [];
      for (const call of functionCalls) {
        const args = (call.args ?? {}) as Record<string, unknown>;
        const execution = await executeTool(String(call.name ?? ""), args, {
          userId: params.userId,
          geminiApiKey: apiKey,
        });
        toolTrace.push(buildToolTrace(String(call.name ?? ""), args, execution.result));
        if (execution.uiPayload) {
          uiPayload = execution.uiPayload;
        }
        results.push(execution.result);
      }

      response = await chatSession.sendMessage({
        message: buildFunctionResponseParts(functionCalls, results),
      });
      rounds += 1;
    }

    const reply = response.text || "I couldn't generate a response. Please try again.";

    await saveMessage(params.sessionId, {
      role: "assistant",
      content: reply,
      uiPayload,
      toolCalls: toolTrace.length ? toolTrace : undefined,
    });

    return {
      reply,
      sessionId: params.sessionId,
      uiPayload,
      toolTrace: toolTrace.length ? toolTrace : undefined,
    };
  };

  if (provider === "openai") {
    const apiKey = process.env.GEMINI_API_KEY || "";
    const chatSession = getChatSession({
      userId: params.userId,
      history,
      geminiApiKey: apiKey,
      modelName: "",
    });
    return await runSession(chatSession, apiKey);
  } else {
    const apiKey = getGeminiApiKey();
    try {
      return await runWithModelFallback(apiKey, async (modelName) => {
        const chatSession = getChatSession({
          userId: params.userId,
          history,
          geminiApiKey: apiKey,
          modelName,
        });
        return await runSession(chatSession, apiKey);
      });
    } catch (geminiError) {
      const errorMsg = String(geminiError).toLowerCase();
      const isQuotaError = errorMsg.includes("quota") || errorMsg.includes("rate limit") || errorMsg.includes("429");
      if (isQuotaError) {
        console.warn("Gemini API quota exceeded. Attempting automatic fallback to open-source LLM client...");
        try {
          process.env.MODEL_PROVIDER = "openai";
          const chatSession = getChatSession({
            userId: params.userId,
            history,
            geminiApiKey: apiKey,
            modelName: "",
          });
          const result = await runSession(chatSession, apiKey);
          process.env.MODEL_PROVIDER = "gemini";
          return result;
        } catch (fallbackError) {
          console.warn("Open-source model fallback also failed. Using local rule-based mock engine to ensure chat is responsive...");
          try {
            process.env.MODEL_PROVIDER = "mock";
            const mockSession = getChatSession({
              userId: params.userId,
              history,
              geminiApiKey: apiKey,
              modelName: "",
            });
            const result = await runSession(mockSession, apiKey);
            process.env.MODEL_PROVIDER = "gemini";
            return result;
          } catch (mockError) {
            process.env.MODEL_PROVIDER = "gemini";
            throw geminiError;
          }
        }
      }
      throw geminiError;
    }
  }
}
