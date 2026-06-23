import { logger } from "firebase-functions";

export function logInfo(message: string, data?: Record<string, unknown>) {
  logger.info(message, data);
}

export function logError(message: string, error: unknown, data?: Record<string, unknown>) {
  logger.error(message, {
    ...data,
    error: error instanceof Error ? error.message : String(error),
  });
}
