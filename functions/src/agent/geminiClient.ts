import {
  FunctionCallingConfigMode,
  GoogleGenAI,
  Type,
  type FunctionDeclaration,
  type Part,
} from "@google/genai";
import { SYSTEM_PROMPT } from "./prompt";
import { toolDeclarations } from "./tools";

// Only models currently available on the Gemini API (1.5 series is retired).
export const MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
].filter((model): model is string => Boolean(model));

export function createGenAiClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({ apiKey });
}

function toFunctionDeclarations(): FunctionDeclaration[] {
  return toolDeclarations.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters as FunctionDeclaration["parameters"],
  }));
}

export function buildChatConfig() {
  return {
    systemInstruction: SYSTEM_PROMPT,
    tools: [{ functionDeclarations: toFunctionDeclarations() }],
    toolConfig: {
      functionCallingConfig: {
        mode: FunctionCallingConfigMode.AUTO,
      },
    },
  };
}

function errorText(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).toLowerCase();
}

export function isModelNotFoundError(error: unknown): boolean {
  const message = errorText(error);
  return message.includes("404") || message.includes("not found") || message.includes("not_found");
}

export function shouldTryNextModel(error: unknown): boolean {
  return isRetryableModelError(error) || isModelNotFoundError(error);
}

export function isRetryableModelError(error: unknown): boolean {
  const message = errorText(error);
  return (
    message.includes("429")
    || message.includes("503")
    || message.includes("quota")
    || message.includes("rate limit")
    || message.includes("high demand")
    || message.includes("unavailable")
    || message.includes("overloaded")
    || message.includes("try again")
  );
}

export function formatModelError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (normalized.includes("503") || normalized.includes("high demand") || normalized.includes("unavailable")) {
    return "The AI model is temporarily busy. Please wait a few seconds and try again.";
  }

  if (normalized.includes("429") || normalized.includes("quota") || normalized.includes("rate limit")) {
    return "Gemini API quota exceeded. Wait a minute and retry, or check usage at https://ai.dev/rate-limit.";
  }

  return message;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendWithRetry<T>(operation: () => Promise<T>, maxAttempts = 4): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isRetryableModelError(error) || isModelNotFoundError(error) || attempt === maxAttempts) {
        throw error;
      }
      await sleep(3000 * attempt);
    }
  }

  throw lastError;
}

export function buildFunctionResponseParts(
  calls: Array<{ name?: string; id?: string; args?: Record<string, unknown> }>,
  results: unknown[],
): Part[] {
  return calls.map((call, index) => ({
    functionResponse: {
      id: call.id,
      name: call.name,
      response: results[index] as Record<string, unknown>,
    },
  }));
}

// Kept for compatibility if referenced elsewhere.
export const TypeEnum = Type;
